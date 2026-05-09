/**
 * Orientación Escolar ENSM - UI Engine
 * Maneja el renderizado dinámico, animaciones y navegación.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializar animaciones
    initAnimations();

    // 2. Cargar y renderizar datos
    await renderAll();

    // 3. Setup Navigation
    setupNav();
});

function initAnimations() {
    if (typeof ScrollReveal !== 'undefined') {
        const sr = ScrollReveal({
            origin: 'bottom',
            distance: '20px',
            duration: 800,
            delay: 200,
            easing: 'cubic-bezier(0.5, 0, 0, 1)',
            interval: 100
        });

        sr.reveal('.hero-content > *');
        sr.reveal('.hero-visual', { origin: 'right', distance: '40px' });
        sr.reveal('.card');
        sr.reveal('.section-header');
    }
}

async function renderAll() {
    try {
        // Cargar Configuración Global
        const config = await getConfig();
        if (config.site_title) document.getElementById('site-title').innerText = config.site_title;
        if (config.hero_title) document.getElementById('hero-title').innerHTML = config.hero_title;
        if (config.hero_subtitle) document.getElementById('hero-subtitle').innerText = config.hero_subtitle;
        if (config.orientadora_nombre) document.getElementById('orientadora-nombre').innerText = config.orientadora_nombre;

        // Renderizar Actividades
        const actividades = await getSheetData('actividades');
        renderCollection('actividades-container', actividades, createActivityCard);

        // Renderizar Recursos
        const recursos = await getSheetData('recursos');
        renderCollection('recursos-container', recursos, createResourceCard);

        // Renderizar Rutas
        const rutas = await getSheetData('rutas');
        renderCollection('rutas-container', rutas, createRutaCard);

        // Renderizar Normatividad
        const normatividad = await getSheetData('normatividad');
        renderCollection('normatividad-container', normatividad, createNormaCard);

    } catch (error) {
        console.error("Error renderizando la interfaz:", error);
    }
}

function renderCollection(containerId, items, cardCreator) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay elementos disponibles en este momento.</p>';
        return;
    }

    container.innerHTML = '';
    items.forEach(item => {
        container.appendChild(cardCreator(item));
    });
}

function createActivityCard(item) {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
        <div class="tag-row">
            <span class="tag" style="background: var(--clr-primary); color: white;">${item.estado || 'Agenda'}</span>
            <span class="tag">${item.publico || 'General'}</span>
        </div>
        <h4 style="font-family: var(--font-body); font-weight: 600; margin-bottom: 0.5rem;">${item.titulo}</h4>
        <p style="font-size: 0.85rem; color: var(--clr-text-muted);">📅 ${item.fecha || 'Próximamente'}</p>
        <a href="#" class="link-inline" style="margin-top: 1rem; font-size: 0.8rem;">Ver detalles &rarr;</a>
    `;
    return div;
}

function createResourceCard(item) {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
        <div class="card-icon">${item.tipo === 'Video' ? '🎬' : '📄'}</div>
        <h4 style="font-family: var(--font-body); font-weight: 600; margin-bottom: 0.5rem;">${item.titulo}</h4>
        <p style="font-size: 0.85rem; color: var(--clr-text-muted);">${item.audiencia || 'Comunidad'}</p>
        <a href="${item.link || '#'}" class="btn btn-secondary" style="margin-top: 1.5rem; width: 100%; font-size: 0.8rem; padding: 0.5rem;">Descargar</a>
    `;
    return div;
}

function createRutaCard(item) {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
        <div class="card-icon">🛣️</div>
        <h4 style="font-family: var(--font-body); font-weight: 600; margin-bottom: 0.5rem;">${item.titulo}</h4>
        <p style="font-size: 0.85rem; color: var(--clr-text-muted);">${item.descripcion}</p>
        <a href="#" class="link-inline" style="margin-top: 1rem; font-size: 0.8rem;">Ver pasos &rarr;</a>
    `;
    return div;
}

function createNormaCard(item) {
    const div = document.createElement('div');
    div.className = 'card';
    div.style.padding = '1.5rem';
    div.style.marginBottom = '1rem';
    div.innerHTML = `
        <h4 style="font-size: 1.2rem; font-family: var(--font-body); font-weight: 600; color: var(--clr-primary);">${item.norma}</h4>
        <p style="font-size: 0.9rem; color: var(--clr-text-muted); margin-top: 0.5rem;">${item.resumen}</p>
    `;
    return div;
}

function setupNav() {
    const header = document.querySelector('.site-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.padding = '0.5rem 0';
            header.style.boxShadow = 'var(--shadow-soft)';
        } else {
            header.style.padding = '1rem 0';
            header.style.boxShadow = 'none';
        }
    });
}
