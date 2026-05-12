/**
 * Orientación Escolar ENSM - Data Layer
 * Maneja la integración con Google Sheets (CSV) y el procesamiento de colecciones.
 */

const APP_CONFIG = {
    // ID de la nueva hoja exclusiva de Orientación
    spreadsheetId: '1U_GpAaSerpVvIEVI1JZ35JbFAipZaO8XU4PtKg1rI4s', 
    tabs: {
        config: 'config',
        actividades: 'actividades',
        campanas: 'campañas',
        comunicados: 'comunicados',
        recursos: 'recursos',
        rutas: 'rutas',
        evidencias: 'evidencias'
    },
    // URL de la Web App de Google Apps Script (Actualizado vía clasp deploy)
    scriptUrl: 'https://script.google.com/macros/s/AKfycbxioHtjmARaHmIKb6h3B3blBTsDreRqhSvU0Wb-Uq0XVvkKbto8fkMqBfxMwmSf9E_B/exec' 
};

/**
 * Obtiene datos de una pestaña específica de Google Sheets vía CSV
 */
async function getSheetData(tabName) {
    // Si no tenemos ID, devolvemos datos mock para desarrollo
    if (APP_CONFIG.spreadsheetId.includes('...')) {
        console.warn(`Usando datos MOCK para pestaña: ${tabName}`);
        return getMockData(tabName);
    }

    try {
        const url = `https://docs.google.com/spreadsheets/d/${APP_CONFIG.spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${tabName}`;
        const response = await fetch(url);
        const csvText = await response.text();
        return parseCSV(csvText);
    } catch (error) {
        console.error(`Error cargando pestaña ${tabName}:`, error);
        return getMockData(tabName);
    }
}

/**
 * Parser avanzado de CSV a Array de Objetos (Soporta saltos de línea internos en celdas)
 */
function parseCSV(csvText) {
    const lines = [];
    let currentLine = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];

        if (char === '"' && nextChar === '"') {
            // Escapar comillas dobles "" dentro del campo
            currentField += '"';
            i++; 
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            currentLine.push(currentField);
            currentField = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') i++; // Manejar CRLF
            currentLine.push(currentField);
            lines.push(currentLine);
            currentLine = [];
            currentField = '';
        } else {
            currentField += char;
        }
    }
    if (currentField !== '' || currentLine.length > 0) {
        currentLine.push(currentField);
        lines.push(currentLine);
    }

    if (lines.length < 2) return [];

    const headers = lines[0].map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());
    
    return lines.slice(1).map(row => {
        let obj = {};
        headers.forEach((header, i) => {
            if (header) {
                obj[header] = (row[i] || '').replace(/^"|"$/g, '').trim();
            }
        });
        return obj;
    });
}

/**
 * Datos Mock iniciales según el instructivo
 */
function getMockData(tabName) {
    const mocks = {
        config: [
            { key: 'site_title', value: 'Orientación Escolar' },
            { key: 'site_institution', value: 'Escuela Normal Superior de Monterrey' },
            { key: 'hero_title', value: 'Un sitio para <br> <em>acompañar</em> <br> <em>trayectorias</em>, <br> escuchar <br> procesos y abrir <br> caminos.' },
            { key: 'hero_subtitle', value: 'Un espacio institucional para fortalecer el bienestar, la convivencia y el proyecto de vida de nuestra comunidad educativa.' },
            { key: 'orientadora_nombre', value: 'Katherine Ponce' },
            { key: 'orientadora_cargo', value: 'Terapeuta Ocupacional, Magíster en Neuropsicología y Educación' }
        ],
        actividades: [
            { titulo: 'Taller de Emociones', fecha: '2026-02-15', publico: 'Estudiantes', destacado: 'si', estado: 'próxima', periodo: 'Periodo 1', descripcion: 'Espacio para reconocer y gestionar emociones básicas.' },
            { titulo: 'Escuela de Familias', fecha: '2026-03-22', publico: 'Padres', destacado: 'si', estado: 'próxima', periodo: 'Periodo 1', descripcion: 'Pautas de crianza positiva y límites con amor.' },
            { titulo: 'Día de la Convivencia', fecha: '2026-05-10', publico: 'General', destacado: 'no', estado: 'próxima', periodo: 'Periodo 2', descripcion: 'Jornada lúdica de integración escolar.' },
            { titulo: 'Feria Vocacional', fecha: '2026-08-15', publico: 'Grados 10 y 11', destacado: 'si', estado: 'próxima', periodo: 'Periodo 3', descripcion: 'Encuentro con universidades y opciones técnicas.' },
            { titulo: 'Evaluación Institucional', fecha: '2026-11-20', publico: 'Docentes', destacado: 'no', estado: 'próxima', periodo: 'Periodo 4', descripcion: 'Cierre del año académico y balances.' }
        ],
        recursos: [
            { titulo: 'Guía de Convivencia', tipo: 'Documento', audiencia: 'Docentes', destacado: 'si' },
            { titulo: 'Video: Salud Mental', tipo: 'Video', audiencia: 'Estudiantes', destacado: 'no' },
            { titulo: 'Pautas de Crianza', tipo: 'Enlace Web', audiencia: 'Familias', destacado: 'si' }
        ],
        rutas: [
            { 
                titulo: 'Convivencia Escolar', 
                descripcion: 'Protocolos para la resolución de conflictos, manejo de situaciones que afectan el clima escolar y promoción del buen trato, en coherencia con la Ruta de Atención Integral para la Convivencia Escolar.',
                pasos: '1. Detección y reporte: cualquier estudiante, docente o familia informa la situación de conflicto o afectación de la convivencia a un docente, directivo o al área de Orientación Escolar, dejando registro inicial según el Manual de Convivencia.\n2. Valoración pedagógica: Orientación Escolar y las directivas recogen información básica, clasifican la situación (tipo I u otra según el manual) y definen si se maneja como conflicto escolar, situación que afecta la convivencia o presunto caso de acoso escolar.\n3. Acciones de atención: se realizan medidas pedagógicas como mediación, diálogo restaurativo, acuerdos de aula, compromisos escritos y acompañamiento a los involucrados, de acuerdo con la Ruta de Atención Integral y los protocolos de convivencia.\n4. Participación del Comité de Convivencia: cuando el caso lo requiere, se analiza en el Comité Escolar de Convivencia, se deja acta y se fortalecen acciones colectivas en el grupo o grado.\n5. Seguimiento y cierre: Orientación Escolar y el Comité de Convivencia hacen seguimiento a los acuerdos, verifican cambios en la situación y registran el cierre cuando se ha mitigado el riesgo; si se identifica vulneración de derechos o acoso persistente, se activa la ruta correspondiente (acoso escolar o ruta externa).'
            },
            { titulo: 'Bienestar Emocional', descripcion: 'Ruta de apoyo primario para estudiantes con necesidades socioemocionales.' },
            { titulo: 'Vulneración de Derechos', descripcion: 'Activación de protocolos externos y articulación con entidades municipales.' }
        ],
        normatividad: [
            { norma: 'Ley 115 de 1994', resumen: 'Define la orientación educativa como un componente esencial del proceso formativo.' },
            { norma: 'Ley 1620 de 2013', resumen: 'Sistema Nacional de Convivencia Escolar y rutas de atención integral.' },
            { norma: 'Resolución 3842 de 2022', resumen: 'Establece las funciones específicas del orientador escolar en Colombia.' }
        ],
        propositos: [
            { texto: 'Expresar mis emociones de forma asertiva.', tema: 'Empatía', reto: 'Sube una foto donde estés compartiendo con alguien.' },
            { texto: 'Identificar mis fortalezas personales.', tema: 'Autoconocimiento', reto: 'Dibuja tu árbol de vida y tómale una foto.' },
            { texto: 'Establecer metas para mi proyecto de vida.', tema: 'Futuro', reto: 'Escribe tu meta #1 y compártela.' },
            { texto: 'Practicar la escucha activa con mis compañeros.', tema: 'Convivencia', reto: 'Una foto de un círculo de palabra.' },
            { texto: 'Cuidar mi salud mental y pedir ayuda si la necesito.', tema: 'Bienestar', reto: 'Foto de un momento de calma.' }
        ]
    };
    return mocks[tabName] || [];
}

/**
 * Busca un icono automáticamente en Iconify basado en el nombre del tema
 */
async function buscarIconoAutomatico(tema) {
    try {
        const palabraClave = encodeURIComponent(tema.split(' ')[0]); 
        const respuesta = await fetch(`https://api.iconify.design/search?query=${palabraClave}&limit=1`);
        const datos = await respuesta.json();
        
        if (datos && datos.icons && datos.icons.length > 0) {
            const parts = datos.icons[0].split(':');
            if(parts.length === 2) {
                return `https://api.iconify.design/${parts[0]}/${parts[1]}.svg`;
            }
        }
    } catch (error) {
        console.warn("⚠️ [Data] Fallo búsqueda automática de icono:", error);
    }
    return '';
}

/**
 * Obtiene el número de semana actual del año
 */
function getWeekNumber(d = new Date()) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

/**
 * Obtiene los propósitos para la ruleta con búsqueda automática de iconos
 */
async function getPropositos() {
    const data = await getSheetData('propositos');
    const currentWeek = getWeekNumber();
    
    // Si no hay datos, devolver los mock directamente
    if (!data || data.length === 0) {
        console.warn("⚠️ [Data] No se encontraron datos en pestaña 'propositos', usando mock.");
        return getMockData('propositos').map(p => ({ ...p, visible: true }));
    }

    const iconosFallback = {
        "Huella Digital": "https://cdn-icons-png.flaticon.com/512/977/977661.png",
        "Empatía Online": "https://cdn-icons-png.flaticon.com/512/19033/19033418.png",
        "Sueños a Futuro": "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
        "Filtro de Ayuda": "https://cdn-icons-png.flaticon.com/512/616/616490.png",
        "Talento Local": "https://cdn-icons-png.flaticon.com/512/2583/2583344.png",
        "Privacidad Total": "https://cdn-icons-png.flaticon.com/512/3064/3064197.png",
        "Resiliencia": "https://cdn-icons-png.flaticon.com/512/742/742751.png",
        "Desconexión": "https://cdn-icons-png.flaticon.com/512/483/483947.png",
        "Valores ENSM": "https://cdn-icons-png.flaticon.com/512/2436/2436874.png",
        "Mapa de Metas": "https://cdn-icons-png.flaticon.com/512/3022/3022256.png"
    };

    const promesas = data.map(async item => {
        // Soporte para múltiples variantes de nombres de columnas
        const texto = item.texto || item['propósito'] || item['proposito'] || item['propósito (para la ruleta)'] || '';
        const tema = item.tema || item.categoría || item.categoria || 'General';
        const reto = item.reto || item.desafío || item['reto fotográfico (muro de evidencias)'] || 'Tómale una foto a esta actividad.';
        let imagen = item.imagen || item.figura || item.icono || item['url figura'] || '';
        const semanaItem = parseInt(item.semana || item.Semana || 0);
        
        if (typeof imagen === 'string') imagen = imagen.replace(/["']/g, '').trim();

        if (!imagen && iconosFallback[tema]) {
            imagen = iconosFallback[tema];
        }

        return {
            id: item.id || item.ID || '',
            texto,
            tema,
            reto,
            imagen,
            id_programa: item.id_programa || '',
            semana: semanaItem,
            visible: (item.visible || 'si').toLowerCase() !== 'no'
        };
    });

    const resultados = await Promise.all(promesas);
    
    // FILTRADO LÓGICO:
    // 1. Debe estar marcado como visible (o vacío)
    // 2. Si tiene número de semana, debe coincidir con la actual
    // 3. Si no tiene número de semana (0), se muestra siempre
    let finales = resultados.filter(item => {
        const esVisible = item.visible && item.texto;
        const correspondeSemana = (item.semana === 0 || item.semana === currentWeek);
        return esVisible && correspondeSemana;
    });
    
    console.log(`🎡 [Data] Mostrando ${finales.length} temas para la semana ${currentWeek}`);

    return finales.length > 0 ? finales : getMockData('propositos').map(p => ({ ...p, visible: true }));
}

/**
 * Helper para obtener configuración clave-valor
 */
async function getConfig() {
    const data = await getSheetData('config');
    let config = {};
    data.forEach(item => {
        if (item.key) config[item.key] = item.value;
    });
    return config;
}

/**
 * Obtiene las evidencias públicas marcadas como visibles
 */
async function getEvidencias() {
    const data = await getSheetData(APP_CONFIG.tabs.evidencias);
    if (!data || data.length === 0) return [];
    
    return data.filter(item => {
        const v = (item.visible || '').trim().toLowerCase();
        const isVisible = (v === 'si' || v === 's' || v === 'y' || v === 'yes');
        return isVisible && item.url;
    });
}
