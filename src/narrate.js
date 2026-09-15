// src/narrate.js
//
// Genera un archivo de audio .mp3 por escena a partir de scene.narration,
// usando edge-tts (gratis, sin API key, sin cuenta) — el servicio de voces
// neuronales de Microsoft Edge.
//
// Requisito único: tener Python 3 y el paquete edge-tts instalado:
//   pip install edge-tts
//
// Uso:
//   npm run narrate
//   VOICE=es-AR-TomasNeural npm run narrate     (para cambiar de voz)
//
// Voces argentinas disponibles en edge-tts (si Microsoft las provee en tu
// región/versión): es-AR-ElenaNeural (mujer), es-AR-TomasNeural (hombre).
// Si por algún motivo no están disponibles, el script cae automáticamente
// a es-419-... (español latino neutro).

const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { scenes } = require("../config/scenes");

const AUDIO_DIR = path.join(__dirname, "..", "audio");
const PRIMARY_VOICE = process.env.VOICE || "es-AR-ElenaNeural";
const FALLBACK_VOICE = "es-419-PalomaNeural"; // español latino neutro, por si la voz AR no está disponible
const RATE = process.env.TTS_RATE || "+0%";

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `${cmd} salió con código ${code}`));
    });
    proc.on("error", reject);
  });
}

async function synthesize(text, outPath, voice) {
  // edge-tts CLI: edge-tts --voice <voice> --rate <rate> --text "<...>" --write-media <out.mp3>
  const args = ["--voice", voice, "--rate", RATE, "--text", text, "--write-media", outPath];
  await run("edge-tts", args);
}

async function narrateScene(scene) {
  if (!scene.narration || !scene.narration.trim()) {
    console.warn(`[narrate] "${scene.id}" no tiene texto de narración, se omite.`);
    return;
  }
  const outPath = path.join(AUDIO_DIR, `${scene.id}.mp3`);
  console.log(`[narrate] Generando audio para "${scene.id}" con voz ${PRIMARY_VOICE} ...`);
  try {
    await synthesize(scene.narration, outPath, PRIMARY_VOICE);
  } catch (err) {
    console.warn(`[narrate] Falló la voz "${PRIMARY_VOICE}" (${err.message}). Reintentando con "${FALLBACK_VOICE}"...`);
    await synthesize(scene.narration, outPath, FALLBACK_VOICE);
  }
  console.log(`[narrate] OK -> audio/${scene.id}.mp3`);
}

async function main() {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });

  // Chequeo rápido de que edge-tts esté instalado antes de arrancar.
  try {
    await run("edge-tts", ["--help"]);
  } catch (err) {
    console.error(
      "No se encontró el comando 'edge-tts'. Instalalo con:\n\n    pip install edge-tts\n\n" +
        "(requiere Python 3; si tenés varias versiones probá 'pip3 install edge-tts')."
    );
    process.exit(1);
  }

  for (const scene of scenes) {
    await narrateScene(scene);
  }
  console.log("[narrate] Listo.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
