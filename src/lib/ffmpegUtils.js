// src/lib/ffmpegUtils.js
const { spawn } = require("child_process");

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr || `${cmd} salió con código ${code}`));
    });
    proc.on("error", reject);
  });
}

async function getDurationSeconds(filePath) {
  const out = await run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ]);
  const seconds = parseFloat(out.trim());
  if (Number.isNaN(seconds)) throw new Error(`No se pudo leer la duración de ${filePath}`);
  return seconds;
}

function formatSrtTime(totalSeconds) {
  const ms = Math.round((totalSeconds % 1) * 1000);
  const totalWhole = Math.floor(totalSeconds);
  const h = Math.floor(totalWhole / 3600);
  const m = Math.floor((totalWhole % 3600) / 60);
  const s = totalWhole % 60;
  const pad = (n, len = 2) => String(n).padStart(len, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

// Parte un texto largo en líneas de subtítulo de ~90 caracteres, cortando en espacios.
function chunkText(text, maxLen = 90) {
  const words = text.split(/\s+/);
  const chunks = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxLen) {
      chunks.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

module.exports = { run, getDurationSeconds, formatSrtTime, chunkText };
