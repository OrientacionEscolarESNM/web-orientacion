// ==================================================
// MOTOR DE TAREAS INTEGRAL - CHATBOT ADMINISTRADOR
// ==================================================

const CHAT_STATES = {
  IDLE: 'IDLE',
  ASKING: 'ASKING',
  CONFIRM: 'CONFIRM'
};

const ENTIDADES = {
  comunicado: {
    nombre: '📢 Comunicado',
    preguntas: [
      { key: 'titulo', q: '¿Cuál es el **Título** del comunicado?' },
      { key: 'resumen', q: 'Escribe un **Resumen breve** para la tarjeta.' },
      { key: 'contenido_corto', q: 'Escribe el **Contenido principal** (texto corto).' },
      { key: 'imagen_url', q: '¿Deseas adjuntar una **Imagen**? 📸', upload: 'image' },
      { key: 'pdf_url', q: '¿Deseas adjuntar un **Documento PDF**? 📄', upload: 'pdf' },
      { key: 'destacado', q: '¿Es un comunicado **Destacado**? ⭐ (Sí/No)' },
      { key: 'visible', q: '¿Debe estar **Visible** ahora? 👁️ (Sí/No)' }
    ],
    saveFunc: 'guardarComunicado'
  },
  actividad: {
    nombre: '🗓️ Actividad / Gestión',
    preguntas: [
      { key: 'titulo', q: '¿Cómo se llama la **Actividad**?' },
      { key: 'fecha', q: '¿Qué **Fecha** tuvo?', inputType: 'date' },
      { key: 'descripcion', q: 'Dame una breve **Descripción**.' },
      { key: 'grados', q: '¿Para qué **Grados** fue? (Ej: Todos, o 1,2,3)' },
      { key: 'responsables', q: '¿Quiénes fueron los **Responsables**?' },
      { key: 'estado', q: '¿Cuál es su **Estado**? (activa, programada, finalizada)' },
      { key: 'categoria', q: '¿En qué **Categoría** entra? (gestion, cultural, deportiva)' },
      { key: 'destacado', q: '¿Es una actividad **Destacada**? ⭐ (Sí/No)' },
      { key: 'enlace', q: '¿Hay algún **Enlace** relacionado? 🔗 (URL o No)' }
    ],
    saveFunc: 'guardarActividad'
  },
  campana: {
    nombre: '🚩 Campaña',
    preguntas: [
      { key: 'nombre', q: '¿Nombre de la **Campaña**?' },
      { key: 'subtitulo', q: '¿Cuál es el **Subtítulo** o frase corta?' },
      { key: 'descripcion', q: 'Escribe la **Descripción** completa.' },
      { key: 'estado', q: '¿Cuál es el **Estado**? (activa, inactiva)' },
      { key: 'imagen_url', q: 'Sube la **Imagen de portada** 📸', upload: 'image' },
      { key: 'visible', q: '¿Debe estar **Visible**? 👁️ (Sí/No)' }
    ],
    saveFunc: 'guardarCampana'
  },
    multimedia: {
    nombre: '🎥 Multimedia (Video/Foto)',
    preguntas: [
      { key: 'titulo', q: '¿Título del recurso **Multimedia**?' },
      { key: 'descripcion', q: 'Breve **Descripción**.' },
      { key: 'campana', q: '¿A qué **Campaña** pertenece?', inputType: 'select' },
      { key: 'fecha', q: '¿Qué **Fecha** tiene?', inputType: 'date' },
      { key: 'video_url', q: 'Pega la **URL de YouTube** o sube una **Imagen/Video** 📸', upload: 'image' },
      { key: 'miniatura_url', q: 'Si pegaste un video, pega la **URL de miniatura**. Si subiste imagen, escribe No.' },
      { key: 'visible', q: '¿Debe estar **Visible**? 👁️ (Sí/No)' }
    ],
    saveFunc: 'guardarVideo'
  },
  juego: {
    nombre: '🎮 Juego / Actividad Interactiva',
    preguntas: [
      { key: 'titulo', q: '¿Título del **Juego**?' },
      { key: 'descripcion', q: 'Breve **Descripción**.' },
      { key: 'juego_url', q: 'Pega la **URL del Juego** (Educaplay, Wordwall, etc.).' },
      { key: 'campana', q: '¿A qué **Campaña** pertenece?', inputType: 'select' },
      { key: 'visible', q: '¿Debe estar **Visible**? 👁️ (Sí/No)' }
    ],
    saveFunc: 'guardarJuego'
  },
  recurso: {
    nombre: '📂 Recurso / Descargable',
    preguntas: [
      { key: 'titulo', q: '¿Título del **Recurso**?' },
      { key: 'tipo', q: '¿Qué **Tipo** de recurso es? (pdf, enlace, imagen)' },
      { key: 'descripcion', q: 'Breve **Descripción**.' },
      { key: 'url', q: 'Sube el **Archivo** 📄 o pega la **URL**.', upload: 'pdf' },
      { key: 'categoria', q: '¿A qué **Campaña** pertenece?', inputType: 'select' },
      { key: 'visible', q: '¿Debe estar **Visible**? 👁️ (Sí/No)' }
    ],
    saveFunc: 'guardarRecurso'
  },
  tema: {
    nombre: '📖 Tema del Manual',
    preguntas: [
      { key: 'titulo', q: '¿Título del **Tema** del manual?' },
      { key: 'resumen', q: 'Escribe un **Resumen** corto.' },
      { key: 'categoria', q: '¿En qué **Categoría** va? (convivencia, deberes, etc.)' },
      { key: 'imagen_url', q: 'Sube la **Imagen de cabecera** 📸', upload: 'image' },
      { key: 'recurso_principal', q: '¿ID del **Recurso** asociado? (Ej: rec-001 o No)' },
      { key: 'visible', q: '¿Debe estar **Visible**? 👁️ (Sí/No)' }
    ],
    saveFunc: 'guardarTema'
  },
  bloque: {
    nombre: '🧱 Bloque de Contenido',
    preguntas: [
      { key: 'tema_id', q: '¿A qué **ID de Tema** pertenece? (Ej: tm-001)' },
      { key: 'tipo_bloque', q: '¿Qué **Tipo de bloque** es? (texto, video, imagen, recurso, actividad)' },
      { key: 'titulo_bloque', q: '¿Qué **Título** lleva el bloque? (Opcional)' },
      { key: 'contenido', q: 'Escribe el **Contenido** del bloque.' },
      { key: 'orden', q: '¿Qué número de **Orden** tiene?' },
      { key: 'visible', q: '¿Debe estar **Visible**? 👁️ (Sí/No)' }
    ],
    saveFunc: 'guardarBloque'
  }
};

function procesarMensajeChat(mensaje, context) {
  const state = context.state || CHAT_STATES.IDLE;
  if (!context.data) context.data = {};

  // Comando cancelar
  if (mensaje.toLowerCase().includes('cancelar') || mensaje.toLowerCase() === 'inicio') {
    return { respuesta: "Proceso cancelado. ¿Qué deseas gestionar ahora? Escribe: **Comunicado, Actividad, Campaña, Multimedia, Juego, Recurso, Tema o Bloque**.", state: CHAT_STATES.IDLE, data: {} };
  }

  // --- LÓGICA DE ESTADOS ---

  if (state === CHAT_STATES.IDLE) {
    const msgLower = mensaje.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (let key in ENTIDADES) {
      if (msgLower.includes(key)) {
        context.entidad = key;
        context.step = 0;
        const pregunta = ENTIDADES[key].preguntas[0];
        return {
          respuesta: "¡Entendido! Vamos a gestionar: **" + ENTIDADES[key].nombre + "**. \n\n" + pregunta.q,
          state: CHAT_STATES.ASKING,
          step: 0,
          entidad: key,
          data: {},
          showUpload: pregunta.upload || null,
          uploadKey: pregunta.key,
          inputType: pregunta.inputType || 'text'
        };
      }
    }
    return {
      respuesta: "Hola. ¿Qué deseas gestionar hoy? \n\nEscribe: **Comunicado, Actividad, Campaña, Multimedia, Juego, Recurso, Tema o Bloque**.",
      state: CHAT_STATES.IDLE
    };
  }

  if (state === CHAT_STATES.ASKING) {
    const entidad = ENTIDADES[context.entidad];
    const step = context.step;
    const preguntaActual = entidad.preguntas[step];

    // Guardar respuesta anterior (si no se saltó por upload previo)
    if (!context.data[preguntaActual.key]) {
      if (mensaje.toLowerCase() === 'no' || mensaje.toLowerCase() === 'n') {
        // Si es subida de archivo, enlace o miniatura opcional, guardamos vacío.
        // Si es una pregunta de Sí/No (como visible o destacado), guardamos la palabra "no".
        if (preguntaActual.upload || preguntaActual.key === 'enlace' || preguntaActual.key === 'miniatura_url') {
          context.data[preguntaActual.key] = "";
        } else {
          context.data[preguntaActual.key] = "no";
        }
      } else {
        context.data[preguntaActual.key] = mensaje;
      }
    }

    // Avanzar al siguiente paso
    context.step++;
    if (context.step < entidad.preguntas.length) {
      let siguientePregunta = entidad.preguntas[context.step];
      
      // AUTO-SKIP: Si es miniatura_url y ya tenemos video_url de Cloudinary, saltar.
      if (siguientePregunta.key === 'miniatura_url' && context.data.video_url && context.data.video_url.includes('cloudinary')) {
          context.data.miniatura_url = "no";
          context.step++;
          if (context.step < entidad.preguntas.length) {
            siguientePregunta = entidad.preguntas[context.step];
          } else {
            return finalizarTareaChat(context);
          }
      }

      let options = null;
      if (siguientePregunta.inputType === 'select') {
        if (siguientePregunta.key === 'campana' || siguientePregunta.key === 'categoria') {
          options = obtenerListaCampanas();
        }
      }

      return {
        respuesta: siguientePregunta.q,
        state: CHAT_STATES.ASKING,
        step: context.step,
        entidad: context.entidad,
        data: context.data,
        showUpload: siguientePregunta.upload || null,
        uploadKey: siguientePregunta.key,
        inputType: siguientePregunta.inputType || 'text',
        options: options
      };
    } else {
      // Hemos terminado todas las preguntas
      return finalizarTareaChat(context);
    }
  }

  if (state === CHAT_STATES.CONFIRM) {
    if (mensaje.toLowerCase().includes('si') || mensaje.toLowerCase() === 'ok') {
      const entidad = ENTIDADES[context.entidad];
      
            // Ajustes específicos antes de guardar
      if (context.entidad === 'actividad') {
        const d = new Date(context.data.fecha);
        const m = d.getMonth() + 1;
        let p = "Primer periodo";
        if (m >= 4 && m <= 6) p = "Segundo periodo";
        else if (m >= 7 && m <= 9) p = "Tercer periodo";
        else if (m >= 10) p = "Cuarto periodo";
        context.data.periodo = p;
      }
      if (context.entidad === 'comunicado') {
        context.data.fecha = new Date().toISOString().split('T')[0];
        if (context.data.imagen_url) {
          context.data.miniatura_url = context.data.imagen_url.replace('/upload/', '/upload/w_400,c_fill/');
        } else if (context.data.pdf_url) {
          context.data.miniatura_url = 'https://res.cloudinary.com/denrgxzvw/image/upload/v1776666137/miniaturapdf_sjseyp.jpg';
        }
      }
      if (context.entidad === 'multimedia') {
        // Si la miniatura es automática (marcada como "no" por el skip logic)
        if (!context.data.miniatura_url || context.data.miniatura_url.toLowerCase() === 'no') {
          if (context.data.video_url && context.data.video_url.includes('cloudinary')) {
            // Si es Cloudinary, generamos la miniatura transformando la URL
            // Cambiamos /upload/ por transformaciones y nos aseguramos de que termine en .jpg
            let baseUrl = context.data.video_url.split('?')[0]; // Limpiar query params si los hay
            let thumb = baseUrl.replace('/upload/', '/upload/w_600,c_fill,g_auto,f_jpg/');
            
            // Si era un video (mp4, mov, etc), cambiamos la extensión a .jpg para que Cloudinary devuelva un frame
            if (thumb.match(/\.(mp4|mov|avi|wmv|flv|webm)$/i)) {
              thumb = thumb.replace(/\.[^.]+$/, '.jpg');
            }
            context.data.miniatura_url = thumb;
          } else {
            context.data.miniatura_url = "";
          }
        }
      }
      // La lógica de ID y enlace para Campaña ahora se maneja en el servidor (guardarCampana)
      // para evitar errores de referencia y asegurar unicidad.

      const fn = entidad.saveFunc;
      let resGuardar = { msg: '' };
      try {
        if (fn === 'guardarComunicado') resGuardar = guardarComunicado(context.data);
        else if (fn === 'guardarActividad') resGuardar = guardarActividad(context.data);
        else if (fn === 'guardarCampana') resGuardar = guardarCampana(context.data);
        else if (fn === 'guardarVideo') resGuardar = guardarVideo(context.data);
        else if (fn === 'guardarJuego') resGuardar = guardarJuego(context.data);
        else if (fn === 'guardarRecurso') resGuardar = guardarRecurso(context.data);
        else if (fn === 'guardarTema') resGuardar = guardarTema(context.data);
        else if (fn === 'guardarBloque') resGuardar = guardarBloque(context.data);
      } catch (e) {
        return { respuesta: "❌ Error al guardar: " + e.message, state: CHAT_STATES.IDLE, data: {} };
      }

      return {
        respuesta: "✅ **¡Guardado con éxito!**\n" + (resGuardar.msg || '') + "\n\n¿Deseas gestionar algo más?",
        state: CHAT_STATES.IDLE,
        data: {}
      };
    }
    return { respuesta: "Guardado cancelado. ¿Qué sigue?", state: CHAT_STATES.IDLE, data: {} };
  }

  return { respuesta: "Lo siento, no entendí. Di 'Inicio' para volver al menú.", state: CHAT_STATES.IDLE };
}

function finalizarTareaChat(context) {
  const entidad = ENTIDADES[context.entidad];
  let resumen = "📋 **RESUMEN DE " + entidad.nombre.toUpperCase() + "**\n━━━━━━━━━━━━━━━━━━━━\n";
  
  for (let key in context.data) {
    let val = context.data[key];
    if (val && val.length > 50) val = val.substring(0, 47) + "...";
    resumen += "🔹 **" + key.toUpperCase() + "**: " + (val || '---') + "\n";
  }
  
  resumen += "━━━━━━━━━━━━━━━━━━━━\n¿Confirmas que los datos son correctos? (Responde **SÍ**)";
  
  return {
    respuesta: resumen,
    state: CHAT_STATES.CONFIRM,
    entidad: context.entidad,
    data: context.data
  };
}
