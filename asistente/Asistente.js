// ==========================================
// CONFIGURACIÓN CLOUDINARY
// ==========================================
const CLOUDINARY_CLOUD_NAME = 'denrgxzvw';
const CLOUDINARY_API_KEY = '468775378889177';
const CLOUDINARY_UPLOAD_PRESET = 'consejo-padres';

const GEMINI_API_KEY = 'AIzaSyBLGUIZdluipxQHj1mpW7Jqcpzt_5g1dTc';
const MANUAL_DOC_ID = '1p6DqZ_VGtrMrsrA8nNBDxF_OhVYeNklS8cHEjIBQflM';
const SPREADSHEET_ID = '1U_GpAaSerpVvIEVI1JZ35JbFAipZaO8XU4PtKg1rI4s'; // Google Sheets Orientación Escolar

/**
 * Receptor de peticiones POST desde la web externa (GitHub Pages)
 */
function doPost(e) {
  try {
    var params = {};
    if (e && e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      // Fallback para datos enviados como form-urlencoded
      params = e.parameter;
      if (typeof params.data === 'string') {
        try { params.data = JSON.parse(params.data); } catch(err){}
      }
    }

    var action = params.action;
    var payload = params.data || params;
    var result = { ok: false, msg: "Acción no reconocida." };

    if (action === 'registrarRetoAceptado') {
      result = registrarRetoAceptado(payload);
    } else if (action === 'verificarTokenReto') {
      result = verificarTokenReto(payload.token);
    } else if (action === 'guardarEvidenciaReto') {
      result = guardarEvidenciaReto(payload);
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, msg: "Error en servidor: " + err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// MENÚ PRINCIPAL
// ==========================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🧭 Asistente Web')
    .addItem('📅 Agregar Actividad', 'abrirFormActividad')
    .addItem('📢 Agregar Comunicado', 'abrirFormComunicado')
    .addItem('🚩 Agregar Programa', 'abrirFormPrograma')
    .addSeparator()
    .addItem('📂 Agregar Recurso (Multim./Juegos/Doc)', 'abrirFormRecurso')
    .addSeparator()
    .addItem('🤖 Asistente IA (Manual)', 'abrirFormManualIA')
    .addItem('📖 Agregar Tema del Manual', 'abrirFormTema')
    .addItem('🧱 Agregar Bloque de Contenido', 'abrirFormBloque')
    .addSeparator()
    .addItem('🏠 Abrir Asistente', 'abrirAsistenteHome')
    .addToUi();
  abrirAsistenteHome()
}
// ==========================================
// FUNCIONES ABRIR SIDEBAR
// ==========================================
function abrirAsistenteHome() {
  var html = HtmlService.createHtmlOutputFromFile('AsistenteHome')
    .setTitle('🧭 Asistente Web')
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}

function abrirFormActividad() {
  var html = HtmlService.createHtmlOutputFromFile('FormActividad')
    .setTitle('📅 Nueva Actividad')
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}

function abrirFormComunicado() {
  var html = HtmlService.createHtmlOutputFromFile('FormComunicado')
    .setTitle('📣 Agregar Comunicado')
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}

function abrirFormRecurso() {
  var html = HtmlService.createHtmlOutputFromFile('FormRecurso')
    .setTitle('📂 Agregar Recurso')
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}

function abrirFormVideo() {
  var html = HtmlService.createHtmlOutputFromFile('FormVideo')
    .setTitle('🎬 Agregar Video')
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}

function abrirFormJuego() {
  var html = HtmlService.createHtmlOutputFromFile('FormJuego')
    .setTitle('🎮 Agregar Juego')
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}

function abrirFormTema() {
  var html = HtmlService.createHtmlOutputFromFile('FormTema')
    .setTitle('📖 Agregar Tema')
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}

function abrirFormBloque() {
  var html = HtmlService.createHtmlOutputFromFile('FormBloque')
    .setTitle('🧱 Agregar Bloque')
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}

function abrirFormSubidaArchivo() {
  var html = HtmlService.createHtmlOutputFromFile('FormSubidaArchivo')
    .setTitle('📤 Subir Archivo')
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}

// ==========================================
// FUNCIONES PARA GUARDAR EN SHEETS
// ==========================================
function guardarActividad(datos) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var hoja = ss.getSheetByName("actividades");

    // Si viene un ID del formulario (slug), lo usamos. Si no, generamos uno.
    var id = datos.id || generarId("ACT");

    hoja.appendRow([
      id,
      datos.titulo,
      datos.descripcion || '',
      "'" + (datos.fecha || new Date().toISOString().split('T')[0]),
      datos.publico || 'Todos',
      datos.destacado || 'no',
      datos.estado || 'próxima',
      datos.visible || 'si',
      datos.carrusel || 'no',
      datos.programa_id || '',
      datos.imagen_carrusel || ''
    ]);

    return { success: true, msg: "Actividad guardada correctamente con ID: " + id };
  } catch (e) {
    return { success: false, msg: e.message };
  }
}

function guardarComunicado(datos) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const hoja = ss.getSheetByName('comunicados');
    if (!hoja) return { ok: false, msg: 'No se encontró la pestaña comunicados' };

    const id = generarId('com', hoja);
    // id | fecha | titulo | descripcion | link | imagen_portada | destacado | visible
    hoja.appendRow([
      id,
      "'" + (datos.fecha || new Date().toISOString().split('T')[0]),
      datos.titulo,
      datos.descripcion || datos.resumen || '',
      datos.link || '',
      datos.imagen_portada || datos.miniatura_url || '',
      datos.destacado || 'no',
      datos.visible || 'si'
    ]);
    return { ok: true, msg: `Comunicado guardado con ID: ${id}` };
  } catch (e) {
    return { ok: false, msg: e.message };
  }
}

function guardarRecurso(datos) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var hoja = ss.getSheetByName("recursos");
    if (!hoja) return { success: false, msg: "No se encontró la pestaña recursos" };

    var id = generarId("REC", hoja);

    // Columnas: id | titulo | tipo | audiencia | link | id_actividad | visible | destacado | carrusel | imagen_carrusel
    hoja.appendRow([
      id,
      datos.titulo,
      datos.tipo || 'Documento',
      datos.audiencia || 'Todos',
      datos.link || '',
      datos.id_actividad || '',
      datos.visible || 'si',
      datos.destacado || 'no',
      datos.carrusel || 'no',
      datos.imagen_carrusel ? convertirEnlaceDrive(datos.imagen_carrusel) : ''
    ]);

    return { success: true, msg: "Recurso guardado correctamente con ID: " + id };
  } catch (e) {
    return { success: false, msg: e.message };
  }
}

function guardarVideo(datos) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const hoja = ss.getSheetByName('videos');
    if (!hoja) return { ok: false, msg: 'No se encontró la pestaña videos' };

    const id = generarId('vid', hoja);
    const orden = hoja.getLastRow();
    hoja.appendRow([
      id,
      "'" + datos.fecha, // Forzamos formato texto
      datos.titulo,
      datos.descripcion,
      datos.miniatura_url,
      datos.video_url,
      datos.campana,
      datos.visible,
      orden
    ]);
    return { ok: true, msg: `Video guardado con ID: ${id}` };
  } catch (e) {
    return { ok: false, msg: e.message };
  }
}

function guardarJuego(datos) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const hoja = ss.getSheetByName('juegos');
    if (!hoja) return { ok: false, msg: 'No se encontró la pestaña juegos' };

    const id = generarId('jue', hoja);
    const orden = hoja.getLastRow();
    hoja.appendRow([
      id,
      datos.titulo,
      datos.descripcion,
      datos.juego_url,
      datos.campana,
      datos.visible,
      orden
    ]);
    return { ok: true, msg: `Juego guardado con ID: ${id}` };
  } catch (e) {
    return { ok: false, msg: e.message };
  }
}

function guardarTema(datos) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const hoja = ss.getSheetByName('temas_manual');
    if (!hoja) return { ok: false, msg: 'No se encontró la pestaña temas_manual' };

    const id = generarId('tm', hoja);
    const slug = generarSlug(datos.titulo);
    const orden = hoja.getLastRow();
    hoja.appendRow([
      id,
      slug,
      datos.titulo,
      datos.resumen,
      datos.categoria,
      datos.visible,
      orden,
      datos.imagen_url,
      datos.recurso_principal
    ]);
    return { ok: true, msg: `Tema guardado con ID: ${id} y slug: ${slug}` };
  } catch (e) {
    return { ok: false, msg: e.message };
  }
}

function guardarBloque(datos) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const hoja = ss.getSheetByName('bloques_manual');
    if (!hoja) return { ok: false, msg: 'No se encontró la pestaña bloques_manual' };

    const id = generarId('bl', hoja);
    hoja.appendRow([
      id,
      datos.tema_id,
      datos.tipo_bloque,
      datos.titulo_bloque,
      datos.contenido,
      datos.orden,
      datos.visible
    ]);
    return { ok: true, msg: `Bloque guardado con ID: ${id}` };
  } catch (e) {
    return { ok: false, msg: e.message };
  }
}


// Sube el PDF a la misma carpeta donde está el Spreadsheet
function subirPdfADriveGS(obj) {
  var ss = SpreadsheetApp.getActive();
  var ssFile = DriveApp.getFileById(ss.getId());
  var carpeta = ssFile.getParents().hasNext()
    ? ssFile.getParents().next()
    : DriveApp.getRootFolder();

  var contenido = Utilities.base64Decode(obj.base64);
  var blob = Utilities.newBlob(contenido, obj.type || 'application/pdf', obj.name || 'archivo.pdf');

  var file = carpeta.createFile(blob);
  // Opcional: hacer el archivo compartible por enlace
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return file.getUrl(); // esta será la URL que llega a guardarEnSheets(urlFinal)
}


// ==========================================
// UTILIDADES
// ==========================================
function generarId(prefijo, hoja) {
  try {
    const lastRow = hoja.getLastRow();
    if (lastRow <= 1) return prefijo.toLowerCase() + "-001";

    // Leer el ID de la última fila, columna A
    const lastId = hoja.getRange(lastRow, 1).getValue();
    const regex = new RegExp(prefijo + "-(\\d+)", "i");
    const match = String(lastId).match(regex);

    if (match) {
      const num = parseInt(match[1]) + 1;
      return prefijo.toLowerCase() + "-" + num.toString().padStart(3, '0');
    }
    // Fallback: si no hay match claro, usa el número de fila
    return prefijo.toLowerCase() + "-" + (lastRow).toString().padStart(3, '0');
  } catch (e) {
    return prefijo.toLowerCase() + "-" + Math.floor(Math.random() * 1000);
  }
}

function generarSlug(texto) {
  return texto.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function obtenerListaProgramas() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const hoja = ss.getSheetByName('programas');
    if (!hoja) return [];
    const data = hoja.getDataRange().getValues();
    const lista = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][1]) {
        lista.push({ id: data[i][0], nombre: data[i][1] });
      }
    }
    return lista;
  } catch (e) {
    return [];
  }
}

function obtenerListaActividades() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const hoja = ss.getSheetByName('actividades');
    if (!hoja) return [];
    const data = hoja.getDataRange().getValues();
    const lista = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][1]) {
        lista.push({ id: data[i][0], titulo: data[i][1] });
      }
    }
    return lista;
  } catch (e) {
    return [];
  }
}

function doGet(e) {
  return HtmlService.createHtmlOutput('<h1>Asistente Web activo</h1>');
}

function abrirFormPrograma() {
  var html = HtmlService.createHtmlOutputFromFile('FormPrograma')
    .setTitle('🚩 Nuevo Programa')
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}

function guardarPrograma(datos) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const hoja = ss.getSheetByName('programas');
    if (!hoja) return { ok: false, msg: 'No se encontró la pestaña programas' };

    const id = datos.id || "prog-" + Math.random().toString(36).substr(2, 5);
    const imgUrl = datos.imagen_portada || datos.imagen_url || '';
    
    console.log("Guardando programa:", datos);

    // Estructura esperada: id | nombre | subtitulo | descripcion | imagen_portada
    hoja.appendRow([
      id,
      datos.nombre,
      datos.subtitulo || '',
      datos.descripcion || '',
      imgUrl
    ]);
    return { ok: true, msg: "Programa guardado con éxito." };
  } catch (e) {
    console.error("Error guardando programa:", e);
    return { ok: false, msg: "Error fatal: " + e.message };
  }
}

function obtenerProximoIdPrograma() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const hoja = ss.getSheetByName('programas');
    return generarId('prog', hoja);
  } catch (e) {
    return "prog-err";
  }
}

function abrirFormManualIA() {
  var html = HtmlService.createHtmlOutputFromFile('FormManualIA')
    .setTitle('🤖 Asistente IA - Manual')
    .setWidth(450);
  SpreadsheetApp.getUi().showSidebar(html);
}


function abrirAsistenteChat() {
  var html = HtmlService.createHtmlOutputFromFile('AsistenteChat')
    .setTitle('💬 Chat Administrador')
    .setWidth(450);
  SpreadsheetApp.getUi().showSidebar(html);
}

function uploadToDrive(base64, name, type) {
  try {
    const folder = DriveApp.getRootFolder(); // O una carpeta específica si prefieres
    const contenido = Utilities.base64Decode(base64);
    const blob = Utilities.newBlob(contenido, type, name);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return { url: file.getUrl(), id: file.getId() };
  } catch (e) {
    throw new Error("Error en Drive: " + e.message);
  }
}

function uploadToCloudinary(base64, name) {
  try {
    const url = "https://api.cloudinary.com/v1_1/" + CLOUDINARY_CLOUD_NAME + "/image/upload";
    const payload = {
      file: "data:image/png;base64," + base64,
      upload_preset: CLOUDINARY_UPLOAD_PRESET,
      folder: "consejo-padres/chat"
    };

    const options = {
      method: "post",
      payload: payload,
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const resJson = JSON.parse(response.getContentText());

    if (resJson.secure_url) {
      return resJson.secure_url;
    } else {
      throw new Error(resJson.error ? resJson.error.message : "Error desconocido en Cloudinary");
    }
  } catch (e) {
    throw new Error("Error en Cloudinary: " + e.message);
  }
}

function protegerEncabezados() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const hojas = ss.getSheets();

    hojas.forEach(hoja => {
      // 1. Inmovilizar la primera fila
      if (hoja.getFrozenRows() < 1) {
        hoja.setFrozenRows(1);
      }

      // 2. Proteger la primera fila contra ediciones accidentales (con advertencia)
      const lastCol = Math.max(hoja.getLastColumn(), 10);
      const range = hoja.getRange(1, 1, 1, lastCol);
      const protections = hoja.getProtections(SpreadsheetApp.ProtectionType.RANGE);

      let yaProtegido = protections.some(p => p.getDescription() === 'Protección de Encabezados');

      if (!yaProtegido) {
        const protection = range.protect().setDescription('Protección de Encabezados');
        protection.setWarningOnly(true);
      }
    });
    return { ok: true, msg: "✅ Todas las pestañas han sido protegidas: Fila 1 inmovilizada y con advertencia de edición." };
  } catch (e) {
    return { ok: false, msg: "Error al proteger: " + e.message };
  }
}

function desprotegerEncabezados() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const hojas = ss.getSheets();

    hojas.forEach(hoja => {
      // 1. Quitar inmovilización (volver a movilizar)
      hoja.setFrozenRows(0);

      // 2. Buscar y quitar las protecciones de la fila 1
      const protections = hoja.getProtections(SpreadsheetApp.ProtectionType.RANGE);
      protections.forEach(p => {
        if (p.getDescription() === 'Protección de Encabezados') {
          p.remove();
        }
      });
    });
    return { ok: true, msg: "🔓 Encabezados movilizados y desprotegidos en todas las pestañas." };
  } catch (e) {
    return { ok: false, msg: "Error al desproteger: " + e.message };
  }
}

// Convierte enlaces de Drive a enlaces directos para imágenes
function convertirEnlaceDrive(url) {
  if (!url) return '';
  if (url.indexOf('drive.google.com') > -1) {
    var id = '';
    if (url.indexOf('id=') > -1) {
      id = url.split('id=')[1].split('&')[0];
    } else if (url.indexOf('/d/') > -1) {
      id = url.split('/d/')[1].split('/')[0];
    }
    if (id) return 'https://drive.google.com/uc?id=' + id;
  }
  return url;
}

// ==========================================
// SISTEMA DE RETOS Y PROPÓSITOS (RUELTA)
// ==========================================

/**
 * Registra cuando un padre acepta un reto y le envía el correo mágico
 */
function registrarRetoAceptado(datos) {
  try {
    // Validación de seguridad para el email
    const emailDestino = datos.email || datos.correo || datos.mail || "";
    
    if (!emailDestino || emailDestino.indexOf('@') === -1) {
      return { ok: false, msg: "No se recibió un correo válido (" + emailDestino + ")" };
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let hojaSeguimiento = ss.getSheetByName('seguimiento_retos');
    
    // Crear pestaña si no existe
    if (!hojaSeguimiento) {
      hojaSeguimiento = ss.insertSheet('seguimiento_retos');
      hojaSeguimiento.appendRow(['token', 'email', 'id_proposito', 'fecha', 'estado', 'id_programa']);
    }

    const token = Utilities.getUuid();
    const fecha = new Date();
    
    hojaSeguimiento.appendRow([
      token,
      emailDestino,
      datos.id_proposito,
      fecha,
      'Pendiente',
      datos.id_programa || ''
    ]);

    // Enviar el correo
    enviarEmailReto(emailDestino, token, datos.titulo_reto, datos.programa_nombre);

    return { ok: true, msg: "¡Reto registrado! Revisa tu correo para las instrucciones.", token: token };
  } catch (e) {
    return { ok: false, msg: "Error al registrar reto: " + e.message };
  }
}

/**
 * Envía el correo electrónico con el link de subida
 */
function enviarEmailReto(email, token, tituloReto, nombrePrograma) {
  const urlSubida = `https://orientacionescolaresnm.github.io/web-orientacion/evidencia.html?t=${token}`;
  
  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
      <div style="background: #1e3a5f; padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">✨ ¡Reto Aceptado!</h1>
        <p style="opacity: 0.8; margin-top: 10px;">Orientación Escolar - ENSM</p>
      </div>
      <div style="padding: 30px; color: #333; line-height: 1.6;">
        <p>¡Hola!</p>
        <p>Has aceptado el reto <strong>"${tituloReto}"</strong> del programa <strong>${nombrePrograma}</strong>. Estamos muy emocionados de que dediques este tiempo de calidad con tus hijos.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #ff6b6b; margin: 25px 0;">
          <p style="margin: 0; font-weight: bold; color: #1e3a5f;">Tu Siguiente Paso:</p>
          <p style="margin: 10px 0 0;">Cuando cumplas el reto y tengas tu foto, video o audio listo, haz clic en el siguiente botón para subirlo a nuestro muro de evidencias:</p>
        </div>

        <div style="text-align: center; margin: 35px 0;">
          <a href="${urlSubida}" style="background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);">
            SUBIR MI EVIDENCIA AQUÍ
          </a>
        </div>

        <p style="font-size: 12px; color: #999; text-align: center;">Este link es único y personal. No lo compartas con nadie más.</p>
      </div>
      <div style="background: #f1f3f4; padding: 20px; text-align: center; font-size: 12px; color: #666;">
        &copy; 2026 Escuela Normal Superior de Monterrey <br>
        Área de Orientación Escolar
      </div>
    </div>
  `;

  GmailApp.sendEmail(email, `🎨 Instrucciones: Tu reto de Orientación está listo`, "", {
    htmlBody: htmlBody,
    name: "Orientación Escolar ENSM"
  });
}

/**
 * Función auxiliar para forzar la ventana de autorización de Google
 * Ejecutar esta función una vez desde el editor si los correos no se envían.
 */
function autorizarPermisos() {
  GmailApp.getAliases();
  SpreadsheetApp.getActiveSpreadsheet();
  console.log("¡Permisos concedidos correctamente!");
}

/**
 * Verifica si un token es válido y devuelve los datos del reto
 */
function verificarTokenReto(token) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const hojaSeguimiento = ss.getSheetByName('seguimiento_retos');
    if (!hojaSeguimiento) return { ok: false, msg: "Sistema de retos no inicializado." };

    const data = hojaSeguimiento.getDataRange().getValues();
    const indexToken = 0; // Columna A
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][indexToken] === token) {
        if (data[i][4] === 'Completado') {
          return { ok: false, msg: "Este reto ya ha sido completado y subido anteriormente." };
        }
        
        // Obtener datos del propósito
        const idProposito = data[i][2];
        const propositos = ss.getSheetByName('propositos').getDataRange().getValues();
        let retoData = {};
        
        for (let j = 1; j < propositos.length; j++) {
          if (propositos[j][0].toString() === idProposito.toString()) {
            retoData = {
              tema: propositos[j][1],
              proposito: propositos[j][2],
              reto: propositos[j][3],
              programa: data[i][5]
            };
            break;
          }
        }

        return { ok: true, email: data[i][1], reto: retoData };
      }
    }
    return { ok: false, msg: "Link inválido o expirado." };
  } catch (e) {
    return { ok: false, msg: "Error al verificar: " + e.message };
  }
}

/**
 * Guarda la evidencia final y marca el reto como completado
 */
function guardarEvidenciaReto(datos) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // 1. Registrar en la pestaña 'evidencias'
    let hojaEvidencias = ss.getSheetByName('evidencias');
    if (!hojaEvidencias) {
      hojaEvidencias = ss.insertSheet('evidencias');
      hojaEvidencias.appendRow(['id', 'id_programa', 'id_proposito', 'nombre_padre', 'grado', 'url', 'mensaje', 'fecha', 'visible']);
    }

    const id = "ev-" + Utilities.getUuid().substr(0, 8);
    const fecha = new Date();

    hojaEvidencias.appendRow([
      id,
      datos.id_programa,
      datos.id_proposito,
      datos.nombre,
      datos.grado || '',
      datos.url_evidencia,
      datos.mensaje || '',
      fecha,
      'N' // No visible por defecto hasta aprobación
    ]);

    // 2. Marcar como completado en seguimiento
    const hojaSeguimiento = ss.getSheetByName('seguimiento_retos');
    const data = hojaSeguimiento.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === datos.token) {
        hojaSeguimiento.getRange(i + 1, 5).setValue('Completado');
        break;
      }
    }

    return { ok: true, msg: "¡Evidencia recibida con éxito! Gracias por participar." };
  } catch (e) {
    return { ok: false, msg: "Error al guardar evidencia: " + e.message };
  }
}
