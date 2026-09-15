// src/record.js
//
// Recorre config/scenes.js con Playwright y graba UN clip de video por escena
// usando la grabación nativa del contexto del navegador (recordVideo), sin
// herramientas externas de captura de pantalla.
//
// Uso:
//   npm run record                 -> graba todas las escenas automatizables
//   npm run record:one -- 04-informe-arbitral   -> graba solo esa escena
//
// Notas:
//   - Las escenas type:"manual" se saltean acá (hay que grabarlas a mano y
//     guardarlas como clips/<id>.webm, ver README).
//   - Por defecto NO se manda ("Enviar") ningún formulario real, para no
//     ensuciar la base de datos de producción. Ver el campo `submit` en cada
//     escena y la explicación en el README.

const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");
const { scenes } = require("../config/scenes");
const { fillAllFields } = require("./lib/formFill");

const CLIPS_DIR = path.join(__dirname, "..", "clips");
const VIEWPORT = { width: 1600, height: 900 };

async function recordScene(browser, scene) {
  if (scene.type === "manual") {
    console.log(`[record] "${scene.id}" es manual, se omite (grabar a mano en clips/${scene.id}.webm).`);
    return;
  }
  if (!scene.url) {
    console.warn(`[record] "${scene.id}" no tiene url, se omite.`);
    return;
  }

  console.log(`[record] Grabando escena "${scene.id}" (${scene.type}) ...`);

  const tmpDir = path.join(CLIPS_DIR, `.tmp-${scene.id}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: tmpDir, size: VIEWPORT },
  });
  const page = await context.newPage();

  try {
    await page.goto(scene.url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1200);

    if (scene.type === "form") {
      await fillAllFields(page, scene.fields || []);
      await page.waitForTimeout(1000);
      // Por defecto NO hacemos submit real (scene.submit default false).
      // Si en algún momento querés mandar de verdad un formulario de prueba,
      // poné submit:true en esa escena Y agregá un field {kind:'clickText', label:'Enviar'}
      // sin dryRun.
    } else if (scene.type === "search") {
      await fillAllFields(page, scene.fields || []);
      await page.waitForTimeout(1000);
    } else if (scene.type === "navigate") {
      const waitMs = scene.actions?.waitMs ?? 3000;
      if (scene.actions?.scroll) {
        await page.mouse.wheel(0, 400);
        await page.waitForTimeout(500);
        await page.mouse.wheel(0, 400);
      }
      await page.waitForTimeout(waitMs);
    }
  } catch (err) {
    console.error(`[record] Error en escena "${scene.id}": ${err.message}`);
  } finally {
    await page.close();
    await context.close(); // el archivo de video se escribe recién al cerrar el context
  }

  // Playwright guarda el .webm con un nombre autogenerado dentro de tmpDir; lo renombramos.
  const files = fs.readdirSync(tmpDir).filter((f) => f.endsWith(".webm"));
  if (files.length === 0) {
    console.error(`[record] No se generó video para "${scene.id}".`);
    return;
  }
  const finalPath = path.join(CLIPS_DIR, `${scene.id}.webm`);
  fs.renameSync(path.join(tmpDir, files[0]), finalPath);
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log(`[record] OK -> clips/${scene.id}.webm`);
}

async function main() {
  fs.mkdirSync(CLIPS_DIR, { recursive: true });

  const onlyId = process.argv.includes("--scene") ? process.argv[process.argv.indexOf("--scene") + 1] : null;

  const browser = await chromium.launch({ headless: true });
  try {
    const target = onlyId ? scenes.filter((s) => s.id === onlyId) : scenes;
    if (onlyId && target.length === 0) {
      console.error(`No existe una escena con id "${onlyId}"`);
      process.exit(1);
    }
    for (const scene of target) {
      await recordScene(browser, scene);
    }
  } finally {
    await browser.close();
  }

  console.log("[record] Listo.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
