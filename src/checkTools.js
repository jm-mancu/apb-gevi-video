// src/checkTools.js
// Chequeo rápido de que todas las herramientas externas gratuitas estén instaladas.
const { spawn } = require("child_process");

function check(cmd, args) {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { stdio: "ignore" });
    proc.on("close", (code) => resolve(code === 0));
    proc.on("error", () => resolve(false));
  });
}

async function main() {
  const results = {
    ffmpeg: await check("ffmpeg", ["-version"]),
    ffprobe: await check("ffprobe", ["-version"]),
    "edge-tts": await check("edge-tts", ["--help"]),
  };

  let ok = true;
  for (const [tool, present] of Object.entries(results)) {
    console.log(`${present ? "✅" : "❌"} ${tool}`);
    if (!present) ok = false;
  }

  if (!ok) {
    console.log("\nInstalá lo que falte:");
    if (!results.ffmpeg || !results.ffprobe) console.log("  - ffmpeg (incluye ffprobe): https://ffmpeg.org/download.html");
    if (!results["edge-tts"]) console.log("  - edge-tts: pip install edge-tts");
    process.exit(1);
  }
  console.log("\nTodo listo. Playwright se chequea/instala aparte con: npx playwright install chromium");
}

main();
