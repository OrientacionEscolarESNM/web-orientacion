/**
 * Orientación Escolar ENSM - Data Layer
 * Maneja la integración con Google Sheets (CSV) y el procesamiento de colecciones.
 */

const APP_CONFIG = {
    // Reemplazar con el ID real de la hoja cuando se cree
    spreadsheetId: '1p2_v5QyS4v1_...', 
    tabs: {
        config: 'config',
        actividades: 'actividades',
        campanas: 'campañas',
        comunicados: 'comunicados',
        recursos: 'recursos',
        rutas: 'rutas'
    }
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
 * Parser simple de CSV a Array de Objetos
 */
function parseCSV(csvText) {
    const lines = csvText.split(/\r?\n/);
    if (lines.length < 2) return [];

    // Limpiar comillas de CSV
    const clean = (str) => str.replace(/^"|"$/g, '').trim();

    const headers = lines[0].split(',').map(clean);
    
    return lines.slice(1).map(line => {
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(clean);
        let obj = {};
        headers.forEach((header, i) => {
            obj[header.toLowerCase()] = values[i] || '';
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
            { titulo: 'Taller de Emociones', fecha: '15 de Mayo', publico: 'Estudiantes', destacado: 'si', estado: 'próxima' },
            { titulo: 'Escuela de Familias', fecha: '22 de Mayo', publico: 'Padres', destacado: 'si', estado: 'próxima' }
        ],
        recursos: [
            { titulo: 'Guía de Convivencia', tipo: 'Documento', audiencia: 'Docentes', destacado: 'si' },
            { titulo: 'Video: Salud Mental', tipo: 'Video', audiencia: 'Estudiantes', destacado: 'no' }
        ],
        rutas: [
            { titulo: 'Convivencia Escolar', descripcion: 'Protocolos para la resolución de conflictos y mediación entre pares.' },
            { titulo: 'Bienestar Emocional', descripcion: 'Ruta de apoyo primario para estudiantes con necesidades socioemocionales.' },
            { titulo: 'Vulneración de Derechos', descripcion: 'Activación de protocolos externos y articulación con entidades municipales.' }
        ],
        normatividad: [
            { norma: 'Ley 115 de 1994', resumen: 'Define la orientación educativa como un componente esencial del proceso formativo.' },
            { norma: 'Ley 1620 de 2013', resumen: 'Sistema Nacional de Convivencia Escolar y rutas de atención integral.' },
            { norma: 'Resolución 3842 de 2022', resumen: 'Establece las funciones específicas del orientador escolar en Colombia.' }
        ]
    };
    return mocks[tabName] || [];
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
