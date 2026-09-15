// src/build.js
//
// Paso final con ffmpeg:
//   1. Por cada escena: ajusta la duración del clip de video a la duración de
//      su audio de narración (si el video quedó más corto, clona el último
//      frame con tpad; si quedó más largo, lo recorta) y mezcla audio+video.
//   2. Concatena todas las escenas, en orden, en un único .mp4.
//   3. Opcionalmente incrusta (burn-in) los subtítulos de subtitles/final.srt
//      si corrés con BURN_SUBTITLES=1.
//
// Requiere ffmpeg y ffprobe en el PATH. No usa librerías npm: llama a los
// binarios directamente vía child_process para tener control total de los
// filtros (ver notas del prompt sobre "ffmpeg por línea de comandos").
//
// Uso:
//   npm run build
//   BURN_SUBTITLES=1 npm run build

const path = require("path");
const fs = require("fs");
const os = require("os");
const { scenes } = require("../config/scenes");
const { run, getDurationSeconds } = require("./lib/ffmpegUtils");

const ROOT = path.join(__dirname, "..");
const CLIPS_DIR = path.join(ROOT, "clips");
const AUDIO_DIR = path.join(ROOT, "audio");
const SUB_DIR = path.join(ROOT, "subtitles");
const OUTPUT_DIR = path.join(ROOT, "output");
const WORK_DIR = path.join(ROOT, ".build-tmp");

const TARGET_W = 1600;
const TARGET_H = 900;
const TARGET_FPS = 30;
const BURN_SUBTITLES = process.env.BURN_SUBTITLES === "1";

function findClip(sceneId) {
  const webm = path.join(CLIPS_DIR, `${sceneId}.webm`);
  const mp4 = path.join(CLIPS_DIR, `${sceneId}.mp4`);
  if (fs.existsSync(webm)) return webm;
  if (fs.existsSync(mp4)) return mp4;
  return null;
}

async function buildSceneClip(scene) {
  const audioPath = path.join(AUDIO_DIR, `${scene.id}.mp3`);
  const clipPath = findClip(scene.id);
  const outPath = path.join(WORK_DIR, `${scene.id}.mp4`);

  if (!fs.existsSync(audioPath)) {
    console.warn(`[build] Falta audio/${scene.id}.mp3, se omite la escena "${scene.id}".`);
    return null;
  }
  if (!clipPath) {
    console.warn(
      `[build] Falta el clip de video para "${scene.id}" (clips/${scene.id}.webm). ` +
        (scene.type === "manual"
          ? "Es una escena manual: grabala e insertala ahí a mano."
          : "Corré 'npm run record' primero.") +
        " Se omite."
    );
    return null;
  }

  const audioDur = await getDurationSeconds(audioPath);
  const videoDur = await getDurationSeconds(clipPath);

  // Filtro de video: escala/recorta a resolución objetivo, fuerza fps constante,
  // y si el clip quedó más corto que el audio, clona el último frame (tpad)
  // hasta empatar la duración. Si quedó más largo, se recorta con -t más abajo.
  const padSeconds = Math.max(0, audioDur - videoDur);
  const vf =
    `scale=${TARGET_W}:${TARGET_H}:force_original_aspect_ratio=decrease,` +
    `pad=${TARGET_W}:${TARGET_H}:(ow-iw)/2:(oh-ih)/2,` +
    `fps=${TARGET_FPS}` +
    (padSeconds > 0.05 ? `,tpad=stop_mode=clone:stop_duration=${padSeconds.toFixed(2)}` : "");

  const args = [
    "-y",
    "-i",
    clipPath,
    "-i",
    audioPath,
    "-vf",
    vf,
    "-t",
    audioDur.toFixed(2), // fuerza que el clip final dure exactamente lo que dura el audio
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-shortest",
    outPath,
  ];

  console.log(`[build] Armando escena "${scene.id}" (audio ${audioDur.toFixed(1)}s, video original ${videoDur.toFixed(1)}s) ...`);
  await run("ffmpeg", args);
  return outPath;
}

async function concatClips(clipPaths, outPath) {
  const listFile = path.join(WORK_DIR, "concat-list.txt");
  const content = clipPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
  fs.writeFileSync(listFile, content, "utf8");

  const args = ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", outPath];
  console.log(`[build] Concatenando ${clipPaths.length} escenas ...`);
  await run("ffmpeg", args);
}

async function burnSubtitles(inPath, srtPath, outPath) {
  console.log("[build] Incrustando subtítulos ...");
  // ffmpeg necesita el path del .srt escapado para el filtro subtitles=
  const escaped = srtPath.replace(/\\/g, "/").replace(/:/g, "\\:");
  const args = ["-y", "-i", inPath, "-vf", `subtitles='${escaped}'`, "-c:a", "copy", outPath];
  await run("ffmpeg", args);
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.rmSync(WORK_DIR, { recursive: true, force: true });
  fs.mkdirSync(WORK_DIR, { recursive: true });

  const builtClips = [];
  for (const scene of scenes) {
    const clip = await buildSceneClip(scene);
    if (clip) builtClips.push(clip);
  }

  if (builtClips.length === 0) {
    console.error("[build] No se armó ningún clip. Corré 'npm run record' y 'npm run narrate' primero.");
    process.exit(1);
  }

  const concatOut = path.join(WORK_DIR, "concat.mp4");
  await concatClips(builtClips, concatOut);

  const finalOut = path.join(OUTPUT_DIR, "APB-GeVi-Tutorial.mp4");
  const srtPath = path.join(SUB_DIR, "final.srt");

  if (BURN_SUBTITLES && fs.existsSync(srtPath)) {
    await burnSubtitles(concatOut, srtPath, finalOut);
  } else {
    fs.copyFileSync(concatOut, finalOut);
    if (fs.existsSync(srtPath)) {
      fs.copyFileSync(srtPath, path.join(OUTPUT_DIR, "APB-GeVi-Tutorial.srt"));
      console.log("[build] Subtítulos copiados como archivo aparte (.srt). Para incrustarlos: BURN_SUBTITLES=1 npm run build");
    }
  }

  fs.rmSync(WORK_DIR, { recursive: true, force: true });
  console.log(`[build] Listo -> output/${path.basename(finalOut)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
