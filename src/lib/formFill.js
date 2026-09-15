// src/lib/formFill.js
//
// Los campos de tipo "lista" en Google Forms NO son un <select> HTML nativo:
// son widgets custom (role="listbox" / role="radio"). Por eso acá NO usamos
// page.selectOption(), sino selectores por texto visible (getByRole / getByText),
// como pide el prompt original.
//
// Cada "field" del config tiene: { kind, label, value, optional, dryRun }
//   kind: 'text' | 'longtext' | 'date' | 'dropdown' | 'radio' | 'clickText'

const TYPE_DELAY_MS = 25; // tipeo "humano", ayuda a que la grabación no se vea instantánea/robótica

async function findQuestionContainer(page, label) {
  // Google Forms envuelve cada pregunta en un div con role="listitem".
  // Buscamos el listitem cuyo texto de encabezado contiene el label.
  const container = page
    .locator('div[role="listitem"]')
    .filter({ hasText: label })
    .first();
  await container.waitFor({ state: "visible", timeout: 8000 });
  return container;
}

async function fillText(page, { label, value }) {
  const container = await findQuestionContainer(page, label);
  const input = container.locator('input[type="text"], input:not([type])').first();
  await input.click();
  await input.pressSequentially(value, { delay: TYPE_DELAY_MS });
}

async function fillLongText(page, { label, value }) {
  const container = await findQuestionContainer(page, label);
  const textarea = container.locator("textarea").first();
  await textarea.click();
  await textarea.pressSequentially(value, { delay: TYPE_DELAY_MS });
}

async function fillDate(page, { label, value }) {
  // value en formato YYYY-MM-DD
  const container = await findQuestionContainer(page, label);
  const [year, month, day] = value.split("-");
  const yearInput = container.locator('input[type="date"], input[aria-label*="Año" i]').first();
  if ((await yearInput.count()) > 0 && (await yearInput.getAttribute("type")) === "date") {
    await yearInput.fill(value);
    return;
  }
  // Fallback: Google Forms a veces separa Día/Mes/Año en inputs individuales
  const dayInput = container.locator('input[aria-label*="Día" i], input[aria-label*="Day" i]').first();
  const monthInput = container.locator('input[aria-label*="Mes" i], input[aria-label*="Month" i]').first();
  const yearInput2 = container.locator('input[aria-label*="Año" i], input[aria-label*="Year" i]').first();
  if ((await dayInput.count()) > 0) {
    await dayInput.fill(day);
    await monthInput.fill(month);
    await yearInput2.fill(year);
  }
}

async function fillDropdown(page, { label, value }) {
  const container = await findQuestionContainer(page, label);
  // El "select" custom de Forms es un div role="listbox" que abre un menú al clickear.
  const trigger = container.locator('div[role="listbox"]').first();
  await trigger.click();
  // El menú de opciones se abre a nivel de página (no dentro del container)
  const option = page.locator('div[role="option"]').filter({ hasText: value }).first();
  await option.waitFor({ state: "visible", timeout: 5000 });
  await option.click();
}

async function fillRadio(page, { label, value }) {
  const container = await findQuestionContainer(page, label);
  const option = container.getByRole("radio", { name: value }).first();
  if ((await option.count()) === 0) {
    // Fallback por texto visible cuando el accessible name no matchea exacto
    await container.locator(`text="${value}"`).first().click();
    return;
  }
  await option.click();
}

async function clickText(page, { label }) {
  await page.getByText(label, { exact: false }).first().click();
}

async function fillField(page, field) {
  try {
    switch (field.kind) {
      case "text":
        return await fillText(page, field);
      case "longtext":
        return await fillLongText(page, field);
      case "date":
        return await fillDate(page, field);
      case "dropdown":
        return await fillDropdown(page, field);
      case "radio":
        return await fillRadio(page, field);
      case "clickText":
        if (field.dryRun) return; // no clickear botones de envío real
        return await clickText(page, field);
      default:
        console.warn(`[formFill] tipo de campo desconocido: ${field.kind}`);
    }
  } catch (err) {
    if (field.optional) {
      console.warn(`[formFill] campo opcional "${field.label}" no encontrado/falló, se omite. (${err.message})`);
      return;
    }
    console.error(`[formFill] ERROR completando "${field.label}": ${err.message}`);
    console.error(
      "  -> Los selectores por texto son un punto de partida; si el portal (Apps Script) o un form " +
        "puntual cambió su estructura, ajustá el selector en src/lib/formFill.js o en config/scenes.js."
    );
  }
}

async function fillAllFields(page, fields = []) {
  for (const field of fields) {
    await fillField(page, field);
    await page.waitForTimeout(300); // pequeña pausa entre campos, se ve mejor en el video
  }
}

module.exports = { fillAllFields, fillField, findQuestionContainer };
