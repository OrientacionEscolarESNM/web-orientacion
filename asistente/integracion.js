// ====================================================
// INTEGRACIÓN CON GEMINI IA (CON LOGS ACTIVADOS)
// ====================================================

function generarContenidoManualIA(aspecto) {
  console.log("Iniciando generación IA para aspecto: " + aspecto);
  try {
    console.log("Leyendo Google Doc: " + MANUAL_DOC_ID);
    const doc = DocumentApp.openById(MANUAL_DOC_ID);
    const textoManual = doc.getBody().getText();
    console.log("Texto del manual leído correctamente. Longitud: " + textoManual.length);
    
            const prompt = `
      Eres un Editor Pedagógico experto en Convivencia Escolar para la Escuela Normal Superior.
      Tu misión es transformar el texto técnico del Manual de Convivencia sobre "${aspecto}" en un contenido educativo, asertivo, ameno y fácil de entender.

      INSTRUCCIONES DE ESTILO:
      - NO te limites a copiar y pegar. Redacta de forma explicativa y pedagógica.
      - Usa un lenguaje que empodere a los padres y estudiantes.
      - Mantén la fidelidad absoluta a las normas del manual, pero hazlas "amigables".

      REGLAS DE BLOQUES (Usa variedad para un contenido dinámico):
      - "intro": (Obligatorio) Un párrafo inicial cálido que explique la importancia del tema.
      - "lista": Para deberes, derechos o prohibiciones de forma clara.
      - "alerta": Para resaltar lo que NO se debe olvidar o consecuencias críticas.
      - "pasos": Para explicar CÓMO hacer algo (rutas, procesos, trámites).
      - "cita": Para una frase poderosa del manual que inspire convivencia.
      - "faq": Para resolver una duda común que un padre o alumno tendría sobre este tema.
      - "recurso": Para guiar al usuario a profundizar en el PDF oficial o anexos.

      Responde ÚNICAMENTE con un JSON con esta estructura:
      {
        "tema": {
          "titulo": "Título atractivo y claro",
          "resumen": "Breve invitación pedagógica al tema",
          "categoria": "convivencia"
        },
        "bloques": [
          {
            "tipo": "intro|lista|alerta|pasos|cita|faq|recurso",
            "titulo": "Subtítulo sugerente",
            "contenido": "Contenido redactado con estilo pedagógico y ameno"
          }
        ]
      }

      TEXTO DEL MANUAL:
      ${textoManual}
    `;

    console.log("Enviando petición a Gemini...");
    const respuestaIA = consultarGemini(prompt);
    console.log("Respuesta recibida de Gemini.");

        console.log("Respuesta recibida de Gemini.");

    // EXTRACCIÓN ROBUSTA DE JSON
    var jsonMatch = respuestaIA.match(/\{.*\}/s);
    if (!jsonMatch) {
      console.error("No se encontró un JSON válido en la respuesta: " + respuestaIA);
      throw new Error("La IA no devolvió un formato válido.");
    }
    const jsonLimpio = jsonMatch[0];
    console.log("JSON extraído: " + jsonLimpio);
    
    return JSON.parse(jsonLimpio);
    
  } catch (e) {
    console.error("ERROR en generarContenidoManualIA: " + e.message);
    throw new Error("Error en IA: " + e.message);
  }
}

function consultarGemini(prompt) {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" + GEMINI_API_KEY;
  
  const payload = {
    "contents": [{
      "parts": [{
        "text": prompt
      }]
    }],
    "generationConfig": {
      "temperature": 0.1,
      "maxOutputTokens": 4096,
    }
  };

  const options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();
  
  console.log("Gemini API Status Code: " + responseCode);
  
  if (responseCode !== 200) {
    console.error("Error API Gemini: " + responseText);
    throw new Error("Error de API Gemini (Status " + responseCode + "): " + responseText);
  }

  const result = JSON.parse(responseText);
  if (result.candidates && result.candidates[0].content.parts[0].text) {
    return result.candidates[0].content.parts[0].text;
  } else {
    throw new Error("La IA no devolvió contenido válido.");
  }
}

function guardarTodoIA(data) {
  console.log("Iniciando guardado de Tema y Bloques IA...");
  try {
    const resTema = guardarTema(data.tema);
    if (!resTema.ok) throw new Error(resTema.msg);
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const shTemas = ss.getSheetByName('temas_manual');
    const lastTemaId = shTemas.getRange(shTemas.getLastRow(), 1).getValue();
    console.log("Tema guardado con ID: " + lastTemaId);

    const shBloques = ss.getSheetByName('bloques_manual');
    data.bloques.forEach((bloque, index) => {
      const idBloque = "BL-" + Date.now() + "-" + index;
      shBloques.appendRow([
        idBloque,
        lastTemaId,
        bloque.tipo,
        bloque.titulo,
        bloque.contenido,
        index + 1,
        "si"
      ]);
    });
    console.log("Bloques guardados correctamente.");
    return { ok: true, msg: "Tema y " + data.bloques.length + " bloques guardados con éxito." };
  } catch (e) {
    console.error("Error al guardar todo IA: " + e.message);
    return { ok: false, msg: e.message };
  }
}

function responderConsultaIA(pregunta) {
  console.log("Iniciando consulta rápida IA: " + pregunta);
  try {
    const doc = DocumentApp.openById(MANUAL_DOC_ID);
    const textoManual = doc.getBody().getText();
    
    const prompt = `
      Eres un consultor experto en el Manual de Convivencia de la Escuela Normal Superior.
      Un usuario te hace la siguiente pregunta: "${pregunta}"
      
      Tu misión es responder de forma directa, clara y basada estrictamente en el manual que te proporcionaré abajo.
      Si la información no está en el manual, indícalo amablemente.
      Usa un tono profesional y servicial.
      
      TEXTO DEL MANUAL:
      ${textoManual}
    `;

    return consultarGemini(prompt);
  } catch (e) {
    console.error("Error en consulta IA: " + e.message);
    throw new Error("No pude procesar tu consulta: " + e.message);
  }
}