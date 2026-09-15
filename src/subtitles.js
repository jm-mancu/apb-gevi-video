// src/subtitles.js
//
// Genera subtitles/final.srt: recorre las escenas en orden, mide la duración
// real de cada audio de narración (audio/<id>.mp3) con ffprobe, y arma los
// bloques de subtítulos con offsets acumulados — así el .srt queda sincronizado
// con el video final armado por src/build.js (que ajusta cada clip a la
// duración de su audio).

const path = require("path");
const fs = require("fs");
const { scenes } = require("../config/scenes");
const { getDurationSeconds, formatSrtTime, chunkText } = require("./lib/ffmpegUtils");

const AUDIO_DIR = path.join(__dirname, "..", "audio");
const SUB_DIR = path.join(__dirname, "..", "subtitles");

async function main() {
  fs.mkdirSync(SUB_DIR, { recursive: true });

  let cursor = 0; // segundos acumulados
  let counter = 1;
  const lines = [];

  for (const scene of scenes) {
    const audioPath = path.join(AUDIO_DIR, `${scene.id}.mp3`);
    if (!fs.existsSync(audioPath)) {
      console.warn(`[subtitles] Falta audio/${scene.id}.mp3 (¿corriste "npm run narrate"?), se omite del .srt.`);
      continue;
    }
    const duration = await getDurationSeconds(audioPath);
    const textChunks = chunkText(scene.narration || "", 90);
    if (textChunks.length === 0) {
      cursor += duration;
      continue;
    }

    const perChunk = duration / textChunks.length;
    for (let i = 0; i < textChunks.length; i++) {
      const start = cursor + i * perChunk;
      const end = cursor + (i + 1) * perChunk;
      lines.push(String(counter));
      lines.push(`${formatSrtTime(start)} --> ${formatSrtTime(end)}`);
      lines.push(textChunks[i]);
      lines.push("");
      counter++;
    }
    cursor += duration;
  }

  const outPath = path.join(SUB_DIR, "final.srt");
  fs.writeFileSync(outPath, lines.join("\n"), "utf8");
  console.log(`[subtitles] OK -> subtitles/final.srt (duración total estimada: ${cursor.toFixed(1)}s)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
