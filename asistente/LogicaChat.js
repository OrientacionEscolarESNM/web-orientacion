// ==================================================
// MOTOR DE TAREAS - CHATBOT ADMINISTRADOR
// Solo entidades funcionales: Actividad, Comunicado, Programa, Recurso
// ==================================================

const CHAT_STATES = {
  IDLE: 'IDLE',
  ASKING: 'ASKING',
  CONFIRM: 'CONFIRM'
};

const ENTIDADES = {
  actividad: {
    nombre: '🗓️ Actividad',
    preguntas: [
      { key: 'titulo', q: '¿Cómo se llama la **Actividad**?' },
      { key: 'descripcion', q: 'Dame una breve **Descripción**.' },
      { key: 'fecha', q: '¿Qué **Fecha** tiene?', inputType: 'date' },
      { key: 'publico', q: '¿Para qué **Público** va? (Ej: Todos, Padres, Estudiantes)' },
      { key: 'estado', q: '¿Cuál es su **Estado**? (próxima, activa, finalizada)' },
      { key: 'programa_id', q: '¿A qué **Programa** pertenece? (Selecciona o escribe "No")', inputType: 'select' },
      { key: 'imagen_carrusel', q: '¿Deseas adjuntar una **Imagen** para el carrusel? 📸 (Sube archivo o escribe "No")', upload: 'image' },
      { key: 'destacado', q: '¿Es una actividad **Destacada**? ⭐ (Sí/No)' },
      { key: 'visible', q: '¿Debe estar **Visible**? 👁️ (Sí/No)' }
    ],
    saveFunc: 'guardarActividad'
  },
  comunicado: {
    nombre: '📢 Comunicado',
    preguntas: [
      { key: 'titulo', q: '¿Cuál es el **Título** del comunicado?' },
      { key: 'descripcion', q: 'Escribe la **Descripción** o resumen del comunicado.' },
      { key: 'link', q: '¿Hay algún **Enlace** relacionado? 🔗 (Pega URL o escribe "No")' },
      { key: 'imagen_portada', q: '¿Deseas adjuntar una **Imagen de portada**? 📸 (Sube archivo o escribe "No")', upload: 'image' },
      { key: 'destacado', q: '¿Es un comunicado **Destacado**? ⭐ (Sí/No)' },
      { key: 'visible', q: '¿Debe estar **Visible** ahora? 👁️ (Sí/No)' }
    ],
    saveFunc: 'guardarComunicado'
  },
  programa: {
    nombre: '🚩 Programa',
    preguntas: [
      { key: 'nombre', q: '¿Cuál es el **Nombre** del programa?' },
      { key: 'subtitulo', q: '¿Cuál es el **Subtítulo** o frase corta? (o escribe "No")' },
      { key: 'descripcion', q: 'Escribe la **Descripción** completa del programa.' },
      { key: 'imagen_url', q: '¿Deseas adjuntar una **Imagen de portada**? 📸 (Sube archivo o escribe "No")', upload: 'image' }
    ],
    saveFunc: 'guardarPrograma'
  },
  recurso: {
    nombre: '📂 Recurso',
    preguntas: [
      { key: 'titulo', q: '¿Título del **Recurso**?' },
      { key: 'tipo', q: '¿Qué **Tipo** de recurso es? (Documento, Enlace, Imagen, Video)' },
      { key: 'audiencia', q: '¿Para qué **Audiencia** va? (Todos, Padres, Docentes, Estudiantes)' },
      { key: 'link', q: 'Sube el **Archivo** 📄 o pega la **URL del recurso**.', upload: 'pdf' },
      { key: 'id_actividad', q: '¿Está relacionado a alguna **Actividad**? (Selecciona o escribe "No")', inputType: 'select' },
      { key: 'destacado', q: '¿Es un recurso **Destacado**? ⭐ (Sí/No)' },
      { key: 'visible', q: '¿Debe estar **Visible**? 👁️ (Sí/No)' }
    ],
    saveFunc: 'guardarRecurso'
  }
};

function procesarMensajeChat(mensaje, context) {
  const state = context.state || CHAT_STATES.IDLE;
  if (!context.data) context.data = {};

  // Comando cancelar
  if (mensaje.toLowerCase().includes('cancelar') || mensaje.toLowerCase() === 'inicio') {
    return {
      respuesta: "Proceso cancelado. ¿Qué deseas gestionar ahora?\n\nEscribe: **Actividad, Comunicado, Programa o Recurso**.",
      state: CHAT_STATES.IDLE,
      data: {}
    };
  }

  // --- ESTADO IDLE: Detectar qué entidad quiere gestionar ---
  if (state === CHAT_STATES.IDLE) {
    const msgLower = mensaje.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (let key in ENTIDADES) {
      if (msgLower.includes(key)) {
        context.entidad = key;
        context.step = 0;
        const pregunta = ENTIDADES[key].preguntas[0];
        return {
          respuesta: "¡Entendido! Vamos a crear: **" + ENTIDADES[key].nombre + "**.\n\n" + pregunta.q,
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
      respuesta: "¡Hola! ¿Qué deseas gestionar hoy?\n\nEscribe: **Actividad, Comunicado, Programa o Recurso**.",
      state: CHAT_STATES.IDLE
    };
  }

  // --- ESTADO ASKING: Recopilar datos paso a paso ---
  if (state === CHAT_STATES.ASKING) {
    const entidad = ENTIDADES[context.entidad];
    const step = context.step;
    const preguntaActual = entidad.preguntas[step];

    // Guardar la respuesta del usuario
    if (!context.data[preguntaActual.key]) {
      if (mensaje.toLowerCase() === 'no' || mensaje.toLowerCase() === 'n') {
        // Para campos opcionales (uploads, enlaces), guardamos vacío
        if (preguntaActual.upload || preguntaActual.key === 'link' || preguntaActual.key === 'subtitulo') {
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

      // Cargar opciones dinámicas para selects
      let options = null;
      if (siguientePregunta.inputType === 'select') {
        if (siguientePregunta.key === 'programa_id') {
          options = obtenerListaProgramas();
        } else if (siguientePregunta.key === 'id_actividad') {
          options = obtenerListaActividades();
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
      // Todas las preguntas completadas → mostrar resumen
      return finalizarTareaChat(context);
    }
  }

  // --- ESTADO CONFIRM: Guardar o cancelar ---
  if (state === CHAT_STATES.CONFIRM) {
    if (mensaje.toLowerCase().includes('si') || mensaje.toLowerCase() === 'ok' || mensaje.toLowerCase() === 'sí') {
      const entidad = ENTIDADES[context.entidad];

      // Ajustes previos al guardado según entidad
      if (context.entidad === 'actividad') {
        // Normalizar campos para la función guardarActividad
        if (context.data.destacado && context.data.destacado.toLowerCase().includes('si')) {
          context.data.destacado = 'si';
        } else {
          context.data.destacado = 'no';
        }
        if (context.data.visible && context.data.visible.toLowerCase().includes('si')) {
          context.data.visible = 'si';
        } else {
          context.data.visible = 'no';
        }
        // Determinar si va al carrusel (si tiene imagen)
        context.data.carrusel = context.data.imagen_carrusel ? 'si' : 'no';
      }

      if (context.entidad === 'comunicado') {
        // Fecha automática
        context.data.fecha = new Date().toISOString().split('T')[0];
        // Normalizar sí/no
        context.data.destacado = (context.data.destacado || '').toLowerCase().includes('si') ? 'si' : 'no';
        context.data.visible = (context.data.visible || '').toLowerCase().includes('si') ? 'si' : 'no';
      }

      if (context.entidad === 'programa') {
        // Mapear imagen_url → imagen_portada para guardarPrograma
        context.data.imagen_portada = context.data.imagen_url || '';
      }

      if (context.entidad === 'recurso') {
        // Normalizar sí/no
        context.data.destacado = (context.data.destacado || '').toLowerCase().includes('si') ? 'si' : 'no';
        context.data.visible = (context.data.visible || '').toLowerCase().includes('si') ? 'si' : 'no';
        context.data.carrusel = 'no';
        context.data.imagen_carrusel = '';
      }

      // Ejecutar la función de guardado
      const fn = entidad.saveFunc;
      let resGuardar = { msg: '' };
      try {
        if (fn === 'guardarActividad') resGuardar = guardarActividad(context.data);
        else if (fn === 'guardarComunicado') resGuardar = guardarComunicado(context.data);
        else if (fn === 'guardarPrograma') resGuardar = guardarPrograma(context.data);
        else if (fn === 'guardarRecurso') resGuardar = guardarRecurso(context.data);
      } catch (e) {
        return { respuesta: "❌ Error al guardar: " + e.message, state: CHAT_STATES.IDLE, data: {} };
      }

      return {
        respuesta: "✅ **¡Guardado con éxito!**\n" + (resGuardar.msg || '') + "\n\n¿Deseas gestionar algo más? Escribe: **Actividad, Comunicado, Programa o Recurso**.",
        state: CHAT_STATES.IDLE,
        data: {}
      };
    }
    return {
      respuesta: "Guardado cancelado. ¿Qué deseas gestionar ahora?\n\nEscribe: **Actividad, Comunicado, Programa o Recurso**.",
      state: CHAT_STATES.IDLE,
      data: {}
    };
  }

  return { respuesta: "No entendí tu mensaje. Escribe 'Inicio' para volver al menú.", state: CHAT_STATES.IDLE };
}

function finalizarTareaChat(context) {
  const entidad = ENTIDADES[context.entidad];
  let resumen = "📋 **RESUMEN DE " + entidad.nombre.toUpperCase() + "**\n━━━━━━━━━━━━━━━━━━━━\n";
  
  for (let key in context.data) {
    let val = context.data[key];
    if (!val) continue; // No mostrar campos vacíos
    if (val.length > 60) val = val.substring(0, 57) + "...";
    
    // Nombres legibles para las claves
    let label = key.replace(/_/g, ' ').toUpperCase();
    resumen += "🔹 **" + label + "**: " + val + "\n";
  }
  
  resumen += "━━━━━━━━━━━━━━━━━━━━\n¿Los datos son correctos? (Responde **SÍ** para guardar o **No** para cancelar)";
  
  return {
    respuesta: resumen,
    state: CHAT_STATES.CONFIRM,
    entidad: context.entidad,
    data: context.data
  };
}
