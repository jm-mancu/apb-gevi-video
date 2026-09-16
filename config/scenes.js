// config/scenes.js
//
// Lista maestra de "escenas" del video tutorial APB - GeVi.
// Cada escena define:
//   - id:        identificador único (se usa para nombrar clips/audios/subs)
//   - type:      'navigate' | 'form' | 'search' | 'manual'
//                 navigate -> Playwright solo navega/hace scroll, no completa nada
//                 form     -> Playwright completa los campos listados en `fields`
//                 search   -> Playwright interactúa con el buscador/filtros del portal
//                 manual   -> No se puede automatizar (mail, hoja de cálculo). Se genera
//                             el audio y el subtítulo igual, pero el clip de video hay
//                             que grabarlo/insertarlo a mano en clips/<id>.webm
//   - url:       URL a abrir (si aplica)
//   - fields:    pasos de completado para escenas tipo 'form'
//   - narration: texto exacto que se usa para generar el audio TTS (sacado del guion)
//   - submit:    si es true, Playwright hace click en "Enviar" al final (por defecto false,
//                ver nota en README sobre por qué no se manda de verdad)
//
// Los valores de "value" en los campos son datos de EJEMPLO/prueba, se pueden editar libremente.

const PORTAL_URL = "https://script.google.com/macros/s/AKfycbzXJBhrpalbk4ZYlISoA96Kbduyof8GwNuJqzIYReBol8rxQ1XTG8hpPp3J2_5Y1yFRsQ/exec";

// Links personales (ya logueados) a la página principal del portal, uno por rol.
// Se usan en las escenas que muestran "así se ve tu home" para cada rol —
// a diferencia de PORTAL_URL (que muestra la pantalla de registro/login sin sesión).
const ROLE_HOME_URLS = {
  tribunal: "https://apb-historial-fallos.netlify.app/?u=e5e498aa76804362b6c5cd3f22a40187",
  comiteEjecutivo: "https://apb-historial-fallos.netlify.app/?u=78cd8fda1566430e9026635778a66b17",
  arbitro: "https://apb-historial-fallos.netlify.app/?u=707a73ae7b964e2d9b59015e7909f975",
  representanteClub: "https://apb-historial-fallos.netlify.app/?u=4e8c43531a924329900f2c42764c34da",
};

const CLUBES = [
  "Argentino",
  "Gimnasia y Esgrima",
  "Comunicaciones",
  "Sports Club Pergamino",
  "Juventud",
  "Sirio Libanés",
  "Ricardo Gutiérrez (Arrecifes)",
  "Sportivo Rojas (Rojas)",
  "Círculo Italiano (Colón)",
  "Alianza (Colón)",
  "Pampa (Salto)",
  "Italo Argentino (Wheelwright)",
];

const CATEGORIAS = [
  "Primera División",
  "Segunda División",
  "Mayores",
  "U21",
  "U19",
  "U17",
  "U15",
  "U13",
  "U11",
];

const FORM_URLS = {
  informeArbitral: "https://docs.google.com/forms/d/e/1FAIpQLSfeKDhbcOZGxZpzy1EDBC2AGT-BzxTyzM-xXK1-gU_NluO-yQ/viewform",
  respondeAclaraArbitro: "https://docs.google.com/forms/d/e/1FAIpQLSeSOCSJJJKnTNhUublX4rnnD1fdAzkRj-B7turr3ZCy-RNl6Q/viewform",
  descargo: "https://docs.google.com/forms/d/e/1FAIpQLSfRlur5LgavX0sMpjxGldxRJ0OjQWCI966dy-InxD2FcYBgBg/viewform",
  recursoReconsideracion: "https://docs.google.com/forms/d/e/1FAIpQLSfd1AZw4yFPmroXqxRqAYssL8FReAu6iDyEVJaLr2WfrrfSVw/viewform",
  reconsideracionApelacionSubsidio: "https://docs.google.com/forms/d/e/1FAIpQLSfhriAxVRSlUUFjak6uKq_40m35xYhyHDxvhA2Uw4vLq8ExLQ/viewform",
  apelacion: "https://docs.google.com/forms/d/e/1FAIpQLSfOC0dIRktIIOqHWnW2u3WpkE_k73QMQj1751JpyMqhQoH7hQ/viewform",
  respondeAclaraClub: "https://docs.google.com/forms/d/e/1FAIpQLSeBmk-pPd0mzp_zL-ImHgWdLEoH6vMLcRoktYbfUQIilT02_g/viewform",
  expedienteDeOficio: "https://docs.google.com/forms/d/e/1FAIpQLSe0Q-aorQnswuziOvp9iUcFExPZjsSJhUjytTYJpAccwdhDCw/viewform",
  solicitarAmpliacionInforme: "https://docs.google.com/forms/d/e/1FAIpQLSd4UayrDZ95K23OzHrQ8vl9R5T8h6gc2KQRwHXPAx-f2ceQRg/viewform",
  requerirAclaracionClubes: "https://docs.google.com/forms/d/e/1FAIpQLSdSu0zsY_ymxR0FNozO6-bFXjKphyOCYO3ZR3QwX2grnsVatA/viewform",
  cargarFallo: "https://docs.google.com/forms/d/e/1FAIpQLSdfI5YfCmZWxKq6RJ-OshMpYxlXW_4ae6q_ACi-8m7cf-OgLg/viewform",
};

const DRIVE_LINK_EJEMPLO = "https://drive.google.com/file/d/EJEMPLO-REEMPLAZAR-POR-UN-LINK-REAL/view?usp=sharing";

const scenes = [
  // ---------------------------------------------------------------------
  // 0. Introducción
  // ---------------------------------------------------------------------
  {
    id: "00-introduccion",
    type: "navigate",
    url: PORTAL_URL,
    actions: { waitMs: 4000 }, // solo mostrar la home antes de loguearse
    narration:
      "Hola. Este video es una guía completa del Portal APB - GeVi, Gestión Virtual de Expedientes — el sistema que vamos a usar de ahora en más para todo lo relacionado a expedientes disciplinarios: informes arbitrales, descargos, recursos, apelaciones, y las resoluciones del Tribunal. " +
      "Vamos a ver, en orden: cómo registrarse, cómo se aprueba un usuario nuevo, y después el circuito completo para cada rol — Árbitro, Representante de Club, y Tribunal. No hace falta que mires todo de una sola vez: andá directo a la parte que te interesa si ya sabés lo básico.",
  },

  // ---------------------------------------------------------------------
  // 1. Registro de usuario nuevo
  // ---------------------------------------------------------------------
  {
    id: "01-registro",
    type: "manual",
    // El portal de registro es una pantalla a medida (Apps Script), no un Google
    // Form — los selectores genéricos por texto no le pegan a su estructura real.
    // Se graba a mano: completar Nombre y apellido, Email, DNI, Rol (probando
    // "Representante de Club" para que se vea aparecer el campo Club), y tocar
    // "Solicitar acceso" SIN enviarlo de verdad (cortar la grabación ahí).
    narration:
      "Lo primero que tiene que hacer cualquier persona nueva — sea árbitro, representante de club, o miembro del Tribunal — es registrarse una sola vez. Entrás al portal y tocás 'Registrarme'. " +
      "Te va a pedir: tu nombre y apellido, tu email, tu DNI, y tu rol. Elegís tu rol de la lista — Árbitro, Representante de Club, o Tribunal. " +
      "Si elegís 'Representante de Club', se abre un campo más: tenés que elegir tu club de la lista desplegable. " +
      "Completás todo y tocás 'Solicitar acceso'. Con eso ya quedó registrado tu pedido.",
  },

  // ---------------------------------------------------------------------
  // 2. Aprobación del Tribunal (no automatizable: mail + Sheets)
  // ---------------------------------------------------------------------
  {
    id: "02-aprobacion-tribunal",
    type: "manual",
    narration:
      "Automáticamente le llega un mail a los integrantes del Tribunal avisando que hay un usuario nuevo esperando aprobación. " +
      "El Tribunal revisa el pedido en la hoja 'Registros' y cambia el Estado a 'Aprobado' cuando corresponda. " +
      "Apenas se aprueba, le llega un mail a la persona confirmando que su acceso fue aprobado, con un link personal para entrar al portal. Ese link es el que va a usar de ahora en más — no hace falta que se registre de nuevo.",
  },

  // ---------------------------------------------------------------------
  // 3. Recorrido del portal
  // ---------------------------------------------------------------------
  {
    id: "03-recorrido-portal",
    type: "navigate",
    url: ROLE_HOME_URLS.arbitro, // vista logueada; a continuación el guion entra al rol Árbitro
    redactSelectors: [".exp-block"],
    actions: { waitMs: 15000, scroll: true },
    narration:
      "Una vez adentro, arriba a la izquierda ves tu nombre y tu rol. Al lado, un menú con tres apartados: 'Descargas', donde vas a encontrar los modelos y plantillas para tus escritos; 'Tutoriales', con esta misma guía; y 'Expedientes en Drive', con el archivo completo de todos los expedientes. " +
      "Más abajo, según tu rol, vas a ver un cuadro oscuro con los botones de 'Presentaciones' — son los formularios que te corresponden a vos. Y debajo de todo, el buscador y el historial completo de fallos, con filtros por categoría, año, y tipo de sanción. " +
      "Un dato general antes de arrancar: en todos los formularios, los campos que no dicen 'opcional' son obligatorios. Si no los completás, el formulario no te va a dejar enviarlo.",
  },

  // ---------------------------------------------------------------------
  // 4. Rol Árbitro
  // ---------------------------------------------------------------------
  {
    id: "04-informe-arbitral",
    type: "form",
    url: FORM_URLS.informeArbitral,
    fields: [
      { kind: "text", label: "Nombre y apellido del árbitro", value: "Carlos Gómez" },
      { kind: "dropdown", label: "Club Local", value: CLUBES[0] },
      { kind: "dropdown", label: "Club Visitante", value: CLUBES[1] },
      { kind: "dropdown", label: "Categoría", value: CATEGORIAS[0] },
      { kind: "date", label: "Fecha del partido", value: "2026-09-05" },
      {
        kind: "longtext",
        label: "Descripción de los hechos",
        value:
          "Este es un texto de EJEMPLO para el video tutorial. Durante el segundo cuarto, el jugador N° 7 del equipo local increpó al árbitro tras un cobro, motivo por el cual fue expulsado según el reglamento vigente.",
      },
      { kind: "radio", label: "¿Es capitán de su equipo?", value: "No aplica" },
      {
        kind: "longtext",
        label: "Observaciones",
        value: "Sin observaciones adicionales (dato de ejemplo).",
        optional: true,
      },
      // El campo final de adjuntar archivo es ahora "Subir archivo" nativo en
      // los 11 formularios de GeVi — no se automatiza (evita el login forzado
      // de Google), solo se menciona en la narración que está disponible.
    ],
    submit: false,
    narration:
      "Este formulario se llama 'Informe Arbitral'. " +
      "Si sos árbitro, tu botón principal es 'Informe Arbitral' — es el que usás para dar inicio a un expediente disciplinario nuevo. " +
      "Te va a pedir: tu nombre y apellido, el Club Local y el Club Visitante, la Categoría, la fecha del partido, la descripción de los hechos, y si el acusado es capitán de su equipo — esto último solo si corresponde, si no, marcá 'No aplica'. " +
      "Al final, un campo de Observaciones que es opcional, para links de YouTube, fotos, o cualquier aclaración extra. También está habilitada la opción de adjuntar un archivo. " +
      "Enviás el formulario, y automáticamente el sistema abre el expediente: le asigna un número interno, crea la carpeta en Drive, guarda un PDF con todo lo que cargaste, y te manda una constancia por mail — además de avisarle a todo el Tribunal y a los representantes de ambos clubes que se abrió un expediente nuevo.",
  },
  {
    id: "05a-mail-ampliacion-arbitro",
    type: "manual",
    narration:
      "Si en algún momento el Tribunal te pide que amplíes o aclares tu informe, te va a llegar un mail así, con un botón de 'Responder ahora' que te lleva directo al formulario con el número de expediente ya completado.",
  },
  {
    id: "05b-responde-aclara-arbitro",
    type: "form",
    url: FORM_URLS.respondeAclaraArbitro,
    fields: [
      { kind: "text", label: "Nombre y apellido del árbitro", value: "Carlos Gómez" },
      { kind: "text", label: "N° de expediente", value: "EXP-2026-0001" },
      {
        kind: "longtext",
        label: "Respuesta / Aclaración",
        value: "Confirmo lo detallado en el informe original respecto a la secuencia de la jugada (texto de ejemplo).",
      },
      { kind: "longtext", label: "Observaciones", value: "Sin observaciones (dato de ejemplo).", optional: true },
      // Archivo adjunto -> "Subir archivo" nativo, no se automatiza (ver nota arriba).
    ],
    submit: false,
    narration:
      "Este formulario se llama 'Responde y Aclara'. " +
      "Completás tu respuesta. También está habilitada la opción de adjuntar un archivo. Al enviarlo, tu respuesta se guarda directo en la carpeta del expediente, y se avisa al Tribunal y a ambos clubes.",
  },

  // ---------------------------------------------------------------------
  // 5. Rol Representante de Club
  // ---------------------------------------------------------------------
  {
    id: "06-intro-club",
    type: "navigate",
    url: ROLE_HOME_URLS.representanteClub,
    redactSelectors: [".exp-block"],
    actions: { waitMs: 15000 },
    narration:
      "Si sos representante de un club, vas a ver hasta cinco botones: Descargo, Recurso de Reconsideración, Reconsideración con Apelación en subsidio, Apelación, y Responde y Aclara.",
  },
  {
    id: "07-descargo",
    type: "form",
    url: FORM_URLS.descargo,
    fields: [
      { kind: "text", label: "Nombre y apellido del representante", value: "María Fernández" },
      { kind: "dropdown", label: "Club", value: CLUBES[0] },
      { kind: "text", label: "N° de expediente", value: "EXP-2026-0001" },
      { kind: "longtext", label: "Observaciones", value: "Sin observaciones (dato de ejemplo).", optional: true },
      // Descargo (Word o PDF) -> "Subir archivo" nativo, no se automatiza (ver nota arriba).
    ],
    submit: false,
    narration:
      "Este formulario se llama 'Descargo'. " +
      "El Descargo se usa para responder a un expediente que ya está abierto. Te pide tu nombre, tu club — que ya viene completado automáticamente si entraste desde tu botón personal del portal —, el número de expediente al que corresponde, y tus observaciones. También está habilitada la opción de adjuntar un archivo con el descargo. " +
      "Si hay más de una persona acusada en el mismo expediente, se puede presentar un descargo por cada una.",
  },
  {
    id: "08-recurso-reconsideracion",
    type: "form",
    url: FORM_URLS.recursoReconsideracion,
    fields: [
      { kind: "text", label: "Nombre y apellido del representante", value: "María Fernández" },
      { kind: "dropdown", label: "Club", value: CLUBES[0] },
      { kind: "text", label: "N° de expediente", value: "EXP-2026-0001" },
      { kind: "longtext", label: "Observaciones", value: "Sin observaciones (dato de ejemplo).", optional: true },
      // Recurso de Reconsideración (Word o PDF) -> "Subir archivo" nativo, no se automatiza.
    ],
    submit: false,
    narration:
      "Este formulario se llama 'Recurso de Reconsideración'. " +
      "Este es para cuando ya hay un Fallo, y el club quiere pedir que el Tribunal lo reconsidere. Mismos campos que el Descargo: nombre, club, número de expediente, y observaciones. También está habilitada la opción de adjuntar el escrito.",
  },
  {
    id: "09-reconsideracion-apelacion-subsidio",
    type: "form",
    url: FORM_URLS.reconsideracionApelacionSubsidio,
    fields: [
      { kind: "text", label: "Nombre y apellido del representante", value: "María Fernández" },
      { kind: "dropdown", label: "Club", value: CLUBES[0] },
      { kind: "text", label: "N° de expediente", value: "EXP-2026-0001" },
      { kind: "longtext", label: "Observaciones", value: "Sin observaciones (dato de ejemplo).", optional: true },
      // Reconsideración con Apelación en subsidio (Word o PDF) -> "Subir archivo" nativo, no se automatiza.
    ],
    submit: false,
    narration:
      "Este formulario se llama 'Reconsideración con Apelación en subsidio'. " +
      "Esta opción combina las dos cosas en un solo escrito: pedís la reconsideración, y en subsidio — es decir, por si no prospera — también la apelación. Se completa igual que los anteriores, y también tiene habilitada la opción de adjuntar un archivo. " +
      "Recordá que toda apelación, sea directa o en subsidio, se presenta ante el Tribunal de la Federación Bonaerense de Básquetbol.",
  },
  {
    id: "10-apelacion",
    type: "form",
    url: FORM_URLS.apelacion,
    fields: [
      { kind: "text", label: "Nombre y apellido del representante", value: "María Fernández" },
      { kind: "dropdown", label: "Club", value: CLUBES[0] },
      { kind: "text", label: "N° de expediente", value: "EXP-2026-0001" },
      { kind: "longtext", label: "Observaciones", value: "Sin observaciones (dato de ejemplo).", optional: true },
      // Apelación (Word o PDF) -> "Subir archivo" nativo, no se automatiza.
    ],
    submit: false,
    narration:
      "Este formulario se llama 'Apelación'. " +
      "Y esta es para apelar directamente un fallo ya emitido, sin pasar por la reconsideración. Mismos campos de siempre, con la opción de adjuntar un archivo. " +
      "Recordá que toda apelación, sea directa o en subsidio, se presenta ante el Tribunal de la Federación Bonaerense de Básquetbol.",
  },
  {
    id: "11a-mail-aclaracion-club",
    type: "manual",
    narration:
      "Si el Tribunal les pide una aclaración a los clubes, les llega este mail a los representantes aprobados de ambos clubes del expediente, con el link directo al formulario de respuesta.",
  },
  {
    id: "11b-responde-aclara-club",
    type: "form",
    url: FORM_URLS.respondeAclaraClub,
    fields: [
      { kind: "text", label: "Nombre y apellido del representante", value: "María Fernández" },
      { kind: "dropdown", label: "Club", value: CLUBES[0] },
      { kind: "text", label: "N° de expediente", value: "EXP-2026-0001" },
      {
        kind: "longtext",
        label: "Respuesta / Aclaración",
        value: "Adjuntamos la aclaración solicitada por el Tribunal (texto de ejemplo).",
      },
      { kind: "longtext", label: "Observaciones", value: "Sin observaciones (dato de ejemplo).", optional: true },
      // Archivo adjunto -> "Subir archivo" nativo, no se automatiza.
    ],
    submit: false,
    narration:
      "Este formulario también se llama 'Responde y Aclara'. " +
      "Se completa igual que el del árbitro: respuesta, y también está habilitada la opción de adjuntar un archivo. Se guarda en la carpeta del expediente y se avisa a todos. " +
      "Un detalle importante: cada vez que se presenta algo sobre un expediente — de cualquiera de los dos lados — se les avisa por mail a los representantes de AMBOS clubes, no solo al que presentó. Así los dos quedan siempre al tanto de la actividad del caso.",
  },

  {
    id: "11c-denuncia",
    type: "form",
    url: "https://docs.google.com/forms/d/e/1FAIpQLSfNc5XwhXd0cGwc6Tc4NOFz2CHyiXSNnkYP1zXuJOXxQkBt8Q/viewform",
    // OJO: Juan cambió temporalmente el campo de archivo a "Respuesta corta"
    // para que podamos trabajar/probar con automatización. En algún momento
    // lo va a volver a poner en "Subir archivo" (nativo) — cuando eso pase,
    // hay que borrar la línea del campo "Denuncia (Word o PDF)" de más abajo,
    // igual que se hizo en los otros 11 formularios.
    fields: [
      { kind: "text", label: "Correo electrónico", value: "club.ejemplo@gmail.com" },
      { kind: "text", label: "Nombre y apellido de quien denuncia", value: "Roberto Sánchez" },
      { kind: "dropdown", label: "Club", value: CLUBES[0], optional: true },
      { kind: "date", label: "Fecha del hecho", value: "2026-09-10" },
      {
        kind: "longtext",
        label: "Descripción de los hechos / motivo de la denuncia",
        value:
          "Texto de EJEMPLO para el video tutorial: se denuncia una conducta antirreglamentaria ocurrida durante el desarrollo del partido, no contemplada en el informe arbitral.",
      },
      {
        kind: "longtext",
        label: "Observaciones",
        value: "Sin observaciones adicionales (dato de ejemplo).",
        optional: true,
      },
      { kind: "text", label: "Denuncia (Word o PDF)", value: DRIVE_LINK_EJEMPLO, optional: true },
    ],
    submit: false,
    narration:
      "Este formulario se llama 'Denuncia'. " +
      "Tanto los representantes de club como los integrantes del Comité Ejecutivo tienen disponible este formulario para presentar una denuncia y dar inicio a un expediente disciplinario, por cualquier hecho que consideren contrario a la normativa vigente. " +
      "Pide tu correo electrónico, tu nombre y apellido, el club — solo si sos representante de club —, la fecha del hecho, y la descripción de los hechos o motivo de la denuncia. Observaciones es opcional, y también está habilitada la opción de adjuntar un archivo con la denuncia.",
  },

  // ---------------------------------------------------------------------
  // 6. Rol Tribunal
  // ---------------------------------------------------------------------
  {
    id: "12-intro-tribunal",
    type: "navigate",
    url: ROLE_HOME_URLS.tribunal,
    redactSelectors: [".exp-block"],
    actions: { waitMs: 15000 },
    narration:
      "El Tribunal tiene, además de todo lo que ya vimos, cuatro formularios propios: Expediente de Oficio, Solicitar Ampliación de Informe Arbitral, Requerir Aclaración a Clubes, y Cargar Fallo. Estos cuatro son de uso exclusivo del Tribunal — si alguien que no está aprobado como Tribunal intenta completarlos, el sistema no procesa nada y avisa por mail.",
  },
  {
    id: "13-aprobar-usuarios",
    type: "manual",
    narration:
      "Como vimos antes, cada usuario nuevo aparece acá pendiente de aprobación. Cambiar el Estado a 'Aprobado' es lo único que hace falta para habilitarlo.",
  },
  {
    id: "14-buscar-expedientes",
    type: "search",
    url: ROLE_HOME_URLS.tribunal,
    // Búsqueda con un término inventado a propósito: como grabamos contra el
    // sistema real (no hay base de datos de prueba separada), buscar un club
    // real traería resultados reales (nombres, expedientes). Este término no
    // le pega a nada, así la búsqueda se ve funcionando sin exponer datos reales.
    redactSelectors: [".exp-block"],
    fields: [
      { kind: "text", label: "Buscar", value: "Club de Ejemplo Ficticio ZZZ" },
      { kind: "dropdown", label: "Categoría", value: CATEGORIAS[0], optional: true },
    ],
    narration:
      "Desde el portal, cualquier usuario — incluido el Tribunal — puede buscar por carátula, apellido, o club, y filtrar por categoría, año, o tipo de sanción, para consultar el historial completo de fallos.",
  },
  {
    id: "15-expediente-de-oficio",
    type: "form",
    url: FORM_URLS.expedienteDeOficio,
    fields: [
      { kind: "dropdown", label: "Club Local", value: CLUBES[2] },
      { kind: "dropdown", label: "Club Visitante", value: CLUBES[3] },
      { kind: "dropdown", label: "Categoría", value: CATEGORIAS[1] },
      { kind: "date", label: "Fecha del hecho", value: "2026-09-01" },
      {
        kind: "longtext",
        label: "Motivo / descripción de los hechos",
        value: "Expediente de oficio de ejemplo iniciado por el Tribunal a partir de un video difundido en redes sociales.",
      },
      { kind: "longtext", label: "Observaciones", value: "Sin observaciones (dato de ejemplo).", optional: true },
      // Archivo adjunto -> "Subir archivo" nativo, no se automatiza.
    ],
    submit: false,
    narration:
      "Este formulario se llama 'Expediente de Oficio'. " +
      "Cuando el Tribunal necesita abrir un expediente sin que haya un informe arbitral o una denuncia previa, usa este formulario: Club Local, Club Visitante, Categoría, fecha del hecho, y el motivo o descripción de los hechos. También está habilitada la opción de adjuntar un archivo, por si hay algo para agregar. " +
      "Al enviarlo, se crea el expediente exactamente igual que con un Informe Arbitral: número interno, carpeta en Drive, PDF con los datos, y aviso a ambos clubes y a todo el Tribunal.",
  },
  {
    id: "16-solicitar-ampliacion-informe",
    type: "form",
    url: FORM_URLS.solicitarAmpliacionInforme,
    fields: [
      { kind: "text", label: "N° de expediente", value: "EXP-2026-0001" },
      {
        kind: "longtext",
        label: "Motivo / pregunta para el árbitro",
        value: "Se solicita precisar la distancia entre el jugador y el árbitro al momento de la jugada (texto de ejemplo).",
      },
      { kind: "longtext", label: "Observaciones", value: "Sin observaciones (dato de ejemplo).", optional: true },
    ],
    submit: false,
    narration:
      "Este formulario se llama 'Solicitar Ampliación de Informe Arbitral'. " +
      "Para pedirle al árbitro que amplíe o aclare su informe sobre un expediente ya abierto: ponés el número de expediente, y el motivo o la pregunta. También está habilitada la opción de adjuntar un archivo. El sistema busca solo al árbitro que cargó el informe original de ese expediente, y le manda el pedido con un link ya precompletado.",
  },
  {
    id: "17-requerir-aclaracion-clubes",
    type: "form",
    url: FORM_URLS.requerirAclaracionClubes,
    fields: [
      { kind: "text", label: "N° de expediente", value: "EXP-2026-0001" },
      {
        kind: "longtext",
        label: "Motivo / pregunta para los clubes",
        value: "Se solicita a ambos clubes confirmar la nómina de jugadores presentes en el banco de suplentes (texto de ejemplo).",
      },
      { kind: "longtext", label: "Observaciones", value: "Sin observaciones (dato de ejemplo).", optional: true },
    ],
    submit: false,
    narration:
      "Este formulario se llama 'Requerir Aclaración a Clubes'. " +
      "Igual que el anterior, pero para pedirle aclaración a los clubes: número de expediente y motivo, con la opción de adjuntar un archivo. Le llega a los representantes aprobados de ambos clubes del caso.",
  },
  {
    id: "18-cargar-fallo",
    type: "form",
    url: FORM_URLS.cargarFallo,
    fields: [
      { kind: "dropdown", label: "Club Local", value: CLUBES[0] },
      { kind: "dropdown", label: "Club Visitante", value: CLUBES[1] },
      { kind: "text", label: "N° de expediente", value: "EXP-2026-0001" },
      // Cargar Fallo (adjuntar PDF) -> "Subir archivo" nativo, no se automatiza.
    ],
    submit: false,
    narration:
      "Este formulario se llama 'Cargar Fallo'. " +
      "Y por último, el paso que cierra un expediente: cargar el Fallo. Acá pedimos Club Local, Club Visitante, el número de expediente — para evitar confundir casos si hay más de uno entre los mismos clubes al mismo tiempo —, y tenés que adjuntar el archivo del Fallo en PDF. " +
      "Al enviarlo, el sistema guarda el Fallo en la carpeta del expediente, lee automáticamente el contenido para completar la sanción, el tipo de sanción, y los artículos aplicados, y le manda el Fallo por mail a los representantes de ambos clubes y a todo el Tribunal. " +
      "Si el Fallo sanciona a más de una persona, el sistema crea una fila por cada una, todas dentro del mismo expediente.",
  },

  // ---------------------------------------------------------------------
  // 7. Cierre
  // ---------------------------------------------------------------------
  {
    id: "19-cierre",
    type: "navigate",
    url: ROLE_HOME_URLS.tribunal,
    redactSelectors: [".exp-block"],
    actions: { waitMs: 15000 },
    narration:
      "Y con esto ya vimos el circuito completo: desde el registro, pasando por cada tipo de presentación, hasta la carga del Fallo. Cualquier duda que les quede, la sección 'Tutoriales' del portal tiene esta misma guía por escrito. Gracias por ver el video.",
  },
];

module.exports = { scenes, PORTAL_URL, ROLE_HOME_URLS, FORM_URLS, CLUBES, CATEGORIAS, DRIVE_LINK_EJEMPLO };
