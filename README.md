# APB - GeVi — Video tutorial automático

Pipeline 100% gratis y open source para generar el video tutorial completo del
portal APB - GeVi: graba pantalla (Playwright), narra con voz sintética
(edge-tts) y arma el video final (ffmpeg).

## 1. Instalación

```bash
# Node deps + navegador de Playwright
npm install
npx playwright install chromium

# Motor de texto-a-voz (gratis, sin API key ni cuenta)
pip install edge-tts

# ffmpeg (si no lo tenés):
#   macOS:   brew install ffmpeg
#   Ubuntu:  sudo apt install ffmpeg
#   Windows: choco install ffmpeg   (o descargar de ffmpeg.org)
```

Verificá que esté todo instalado:

```bash
npm run check:tools
```

## 2. Completar los datos reales

Antes de grabar, revisá `config/scenes.js`:

- Las URLs del portal y de los 11 formularios **ya están cargadas** (se
  tomaron de `URLs.txt`).
- Los valores de ejemplo (`Juan Pérez`, `EXP-2026-0001`, el link de Drive de
  ejemplo, etc.) son datos ficticios de prueba — cambialos si querés que se
  vean más realistas en el video.
- **Importante:** el portal APB - GeVi es una app de Apps Script (HtmlService),
  no un Google Form. La escena `01-registro` trae selectores de arranque
  razonables (por texto visible), pero es la escena con más chances de
  necesitar un ajuste manual una vez que la veas correr contra el portal real
  — el HTML de una app de Apps Script no sigue una estructura tan predecible
  como la de Google Forms. Los 11 formularios (Informe Arbitral, Descargo,
  etc.) sí son Google Forms "de verdad", así que esos selectores deberían
  andar sin tocar nada.

## 3. Correr el pipeline

```bash
npm run record      # 1. graba un clip .webm por escena con Playwright
npm run narrate      # 2. genera un audio .mp3 por escena con edge-tts
npm run subtitles    # 3. arma subtitles/final.srt sincronizado con los audios
npm run build         # 4. ajusta duración de cada clip a su audio y arma el .mp4 final

# o los cuatro pasos juntos:
npm run all
```

El resultado queda en `output/APB-GeVi-Tutorial.mp4`, con su `.srt` al lado.
Si querés los subtítulos **incrustados** en el video en vez de un archivo
aparte:

```bash
BURN_SUBTITLES=1 npm run build
```

Para regrabar una sola escena (útil cuando cambia un formulario puntual):

```bash
npm run record:one -- 04-informe-arbitral
npm run build
```

## 4. Escenas "manuales" (no automatizables)

Cuatro escenas del guion muestran cosas que Playwright no puede grabar
directamente porque dependen de tu bandeja de mail o de la hoja de cálculo:

- `02-aprobacion-tribunal`
- `05a-mail-ampliacion-arbitro`
- `11a-mail-aclaracion-club`
- `13-aprobar-usuarios`

Para esas, `npm run narrate` y `npm run subtitles` funcionan igual (generan
audio y subtítulo), pero **el video hay que grabarlo a mano** (por ejemplo con
la grabación de pantalla nativa de tu SO) y guardarlo como
`clips/<id>.webm` (o `.mp4`) con el mismo nombre de la escena, antes de correr
`npm run build`. Si el clip no está, `build.js` te avisa cuál falta y sigue
con el resto.

## 5. Por qué el pipeline NO manda ("Enviar") los formularios de verdad

Por defecto, `src/record.js` completa todos los campos de cada formulario
pero **no hace click en "Enviar"** (ver `submit: false` y `dryRun: true` en
`config/scenes.js`). Así el video queda igual de claro — se ve el formulario
completo, listo para enviar — sin crear expedientes de prueba, mandar mails
reales al Tribunal y a los clubes, ni ensuciar la planilla de producción cada
vez que se regrabe el video.

Si en algún momento SÍ querés grabar el envío real de un formulario de
prueba (por ejemplo contra un entorno de staging), en esa escena de
`config/scenes.js` poné `submit: true` y agregá al final de `fields` un paso
`{ kind: "clickText", label: "Enviar" }` sin `dryRun`.

## 6. Estructura del proyecto

```
config/scenes.js       # lista de escenas: url, campos a completar, narración
src/lib/formFill.js     # completa campos de Google Forms por texto visible
src/lib/ffmpegUtils.js  # duración de archivos (ffprobe) y helpers de .srt
src/record.js            # Playwright: graba un clip por escena
src/narrate.js            # edge-tts: genera un audio por escena
src/subtitles.js           # arma subtitles/final.srt sincronizado
src/build.js                 # ffmpeg: sincroniza, concatena y exporta el .mp4
src/checkTools.js             # chequea que ffmpeg/ffprobe/edge-tts estén instalados
clips/       # clips .webm grabados (automáticos + manuales)
audio/       # narración generada por escena
subtitles/   # final.srt
output/      # video final
```

## 7. Voces disponibles

Por defecto se usa `es-AR-ElenaNeural`. Para cambiarla:

```bash
VOICE=es-AR-TomasNeural npm run narrate
```

Si esa voz no está disponible en tu edge-tts, el script cae automáticamente a
`es-419-PalomaNeural` (español latino neutro). Podés listar todas las voces
en español disponibles con:

```bash
edge-tts --list-voices | grep es-
```
