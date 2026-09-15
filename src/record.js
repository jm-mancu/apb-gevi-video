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

// Google muestra, la primera vez que se abre un formulario en un navegador/perfil
// "nuevo", un cartel de cookies ("Antes de continuar a Google Forms...") que tapa
// toda la página y bloquea (disabled) los campos hasta que se cierra. Como Playwright
// arranca un contexto limpio en cada escena, este cartel puede aparecer siempre.
// Esta función lo detecta y lo cierra si está presente; si no aparece, no hace nada.
async function dismissConsentIfPresent(page) {
  const consentButtonTexts = [
    "Aceptar todo",
    "Acepto",
    "Aceptar",
    "I agree",
    "Accept all",
    "Reject all",
    "Rechazar todo",
  ];
  for (const text of consentButtonTexts) {
    try {
      const btn = page.getByRole("button", { name: text, exact: false }).first();
      if (await btn.isVisible({ timeout: 1500 })) {
        await btn.click({ timeout: 3000 });
        await page.waitForTimeout(500);
        return true;
      }
    } catch (_) {
      // ese texto de botón no está presente, se prueba el siguiente
    }
  }
  return false;
}

// Espera a que desaparezca el cartel de carga ("Acceso reconocido. Cargando la
// plataforma...") en vez de confiar solo en un tiempo fijo — el sitio puede tardar
// bastante más que unos segundos en traer los datos reales.
async function waitForAppLoaded(page) {
  try {
    const loadingIndicator = page.getByText(/cargando/i).first();
    if (await loadingIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
      await loadingIndicator.waitFor({ state: "hidden", timeout: 30000 });
    }
  } catch (_) {
    // no había cartel de carga visible, o ya desapareció -> seguimos sin problema
  }
}
// Difumina (blur) elementos de la pantalla antes de que termine la grabación —
// pensado para tapar tablas con datos reales (expedientes, nombres) que puedan
// aparecer en pantallas que se graban contra el sistema en producción.
// scene.redactSelectors es un array de selectores CSS; por defecto vacío (no tapa nada).
async function applyRedactions(page, selectors = []) {
  for (const selector of selectors) {
    try {
      await page.evaluate((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          el.style.filter = "blur(10px)";
        });
      }, selector);
    } catch (_) {
      // selector no encontrado en esta página, se ignora
    }
  }
}
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
    await dismissConsentIfPresent(page);
    // Para sitios tipo SPA (como el portal en Netlify), esperamos a que termine
    // de traer datos de verdad, en vez de confiar en un tiempo fijo — si no,
    // la grabación puede cortar mientras todavía dice "Cargando la plataforma...".
    await page.waitForLoadState("networkidle", { timeout: 25000 }).catch(() => {});
    await waitForAppLoaded(page);
    await applyRedactions(page, scene.redactSelectors || []);

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
