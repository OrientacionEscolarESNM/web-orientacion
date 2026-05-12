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
        // hero_title NO se carga desde Sheets — el título tiene formato HTML editorial
        // con <em>, <br> y colores que no pueden venir como texto plano.
        // Si quieres cambiarlo, edita directamente el index.html (línea ~62).
        if (config.hero_subtitle) document.getElementById('hero-subtitle').innerText = config.hero_subtitle;
        
        // Comprobamos que existen antes de modificar (el recuadro fue reemplazado por imagen)
        const nombreEl = document.getElementById('orientadora-nombre');
        const cargoEl = document.getElementById('orientadora-cargo');
        const bioEl = document.getElementById('orientadora-bio');
        if (nombreEl && config.orientadora_nombre) nombreEl.innerText = config.orientadora_nombre;
        if (cargoEl && config.orientadora_cargo) cargoEl.innerText = config.orientadora_cargo;
        if (bioEl && config.orientadora_bio) bioEl.innerText = config.orientadora_bio;

        // Renderizar Agenda (Timeline)
        const actividades = await getSheetData('actividades');
        renderTimeline(actividades, 'agenda-container');

        // Renderizar Recursos
        window.allRecursos = await getSheetData('recursos');
        renderCollection('recursos-container', window.allRecursos, createResourceCard);
        initRecursosFilters();

        // Renderizar Rutas
        const rutas = await getSheetData('rutas');
        renderCollection('rutas-container', rutas, createRutaCard);

        // Renderizar Normatividad
        const normatividad = await getSheetData('normatividad');
        renderCollection('normatividad-container', normatividad, createNormaCard);

        // Renderizar Muro de Evidencias (Preview: máx 6)
        const evidencias = await getEvidencias();
        renderEvidenciasGrid('evidencias-container', evidencias, 6);

        // Mostrar contador y botón "Ver todo" si hay más de 6
        const counterEl = document.getElementById('evidencias-counter');
        const ctaEl = document.getElementById('evidencias-cta');
        if (evidencias.length > 0 && counterEl) {
            counterEl.textContent = `🎉 ${evidencias.length} familia${evidencias.length > 1 ? 's han' : ' ha'} participado`;
            counterEl.style.display = 'block';
        }
        if (evidencias.length > 6 && ctaEl) {
            ctaEl.style.display = 'block';
        }

        // --- CARRUSEL GLOBAL (Highlights) ---
        // Se alimenta de Actividades, Recursos y Comunicados que tengan carrusel = SI
        const comunicados = await getSheetData('comunicados');
        
        const highlights = [
            ...(actividades || []).map(a => {
                const slug = (a.id || a.titulo || '').toString().trim().toLowerCase().replace(/\s+/g, '-');
                return { 
                    ...a, 
                    type: 'Actividad', 
                    link: a.programa_id ? `programa.html?id=${a.programa_id}#activity-${slug}` : '#agenda', 
                    imagen: a.imagen_portada || '' 
                };
            }),
            ...(window.allRecursos || []).map(r => ({ ...r, type: 'Recurso', link: r.link || '#recursos', imagen: r.imagen_carrusel || r.imagen || '' })),
            ...(comunicados || []).map(co => ({ ...co, type: 'Comunicado', link: co.link || '#', imagen: co.imagen_portada || co.imagen || '' }))
        ].filter(item => (item.carrusel || '').toLowerCase() === 'si' || (item.destacado || '').toLowerCase() === 'si');

        renderHighlights(highlights);

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

// Las actividades se renderizan ahora a través del sistema Timeline

window.allRecursos = [];

function getRecursoIcon(tipo) {
    const t = (tipo || '').toLowerCase();
    if (t.includes('video')) {
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
    } else if (t.includes('enlace') || t.includes('web')) {
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
    } else {
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
    }
}

function createResourceCard(item) {
    const div = document.createElement('div');
    div.className = 'card';
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.alignItems = 'flex-start';
    div.style.padding = '2rem';
    
    const isDestacado = (item.destacado || '').toLowerCase() === 'si';
    if (isDestacado) {
        div.style.borderTop = '4px solid var(--clr-accent)';
    }
    
    const icon = getRecursoIcon(item.tipo);
    const actionText = (item.tipo || '').toLowerCase().includes('video') ? 'Ver Video' : 'Acceder';
    const destacadoBadge = isDestacado ? `<span class="tag" style="background: var(--clr-highlight); color: var(--clr-accent); font-weight: 700; font-size: 0.75rem; margin-bottom: 0.8rem; display: inline-block; margin-left: 0.5rem;">★ Destacado</span>` : '';
    
    div.innerHTML = `
        <div style="background: var(--clr-highlight); color: var(--clr-primary); width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem;">
            ${icon}
        </div>
        <div style="margin-bottom: 1.5rem; flex-grow: 1; width: 100%;">
            <span class="tag" style="background: var(--clr-bg); color: var(--clr-text-muted); font-size: 0.75rem; margin-bottom: 0.8rem; display: inline-block;">${item.audiencia || 'Comunidad'}</span>
            ${destacadoBadge}
            <h4 style="font-family: var(--font-body); font-weight: 700; font-size: 1.15rem; line-height: 1.4; color: var(--clr-text);">${item.titulo}</h4>
        </div>
        <a href="${item.link || '#'}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="width: 100%; text-align: center; font-size: 0.85rem; padding: 0.6rem; border-radius: 8px;">${actionText}</a>
    `;
    return div;
}

function initRecursosFilters() {
    const buttons = document.querySelectorAll('.filter-recurso');
    if (buttons.length === 0) return;

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Actualizar UI de botones
            buttons.forEach(b => {
                b.classList.remove('btn-primary', 'active');
                b.classList.add('btn-secondary');
            });
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-primary', 'active');
            
            // Filtrar y renderizar
            const target = btn.dataset.target;
            const filtered = window.allRecursos.filter(item => {
                if (target === 'all') return true;
                return (item.audiencia || '').toLowerCase().includes(target);
            });
            renderCollection('recursos-container', filtered, createResourceCard);
        });
    });
}

function getFlaticonForRuta(titulo) {
    const t = (titulo || '').toLowerCase();
    // Diccionario de figuras premium (estilo 3D/Color)
    if (t.includes('convivencia')) return 'https://cdn-icons-png.flaticon.com/512/19033/19033418.png'; // Empatía/Grupo
    if (t.includes('bienestar') || t.includes('emocional')) return 'https://cdn-icons-png.flaticon.com/512/742/742751.png'; // Corazón/Cuidado
    if (t.includes('vulneración') || t.includes('derecho')) return 'https://cdn-icons-png.flaticon.com/512/616/616490.png'; // Escudo/Seguridad
    if (t.includes('académico') || t.includes('aprendizaje')) return 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'; // Mente/Crecimiento
    if (t.includes('familia') || t.includes('padres')) return 'https://cdn-icons-png.flaticon.com/512/2436/2436874.png'; // Familia/Valores
    // Default bonito
    return 'https://cdn-icons-png.flaticon.com/512/3022/3022256.png'; // Mapa/Ruta
}

function createRutaCard(item) {
    const div = document.createElement('div');
    div.className = 'card';
    div.style.padding = '1.8rem';
    div.style.border = '1px solid var(--clr-border)';
    div.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)';
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.height = '100%';
    div.style.transition = 'all 0.3s ease';
    
    // Efecto Hover suave
    div.addEventListener('mouseenter', () => {
        div.style.boxShadow = '0 10px 30px rgba(26, 77, 74, 0.08)';
        div.style.transform = 'translateY(-2px)';
    });
    div.addEventListener('mouseleave', () => {
        div.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)';
        div.style.transform = 'translateY(0)';
    });
    
    // Si en la BD hay un link directo a PNG lo usa, si dice 'mdi:' o está vacío, busca la figura automática
    let iconUrl = item.icono || '';
    if (!iconUrl || iconUrl.startsWith('mdi:')) {
        iconUrl = getFlaticonForRuta(item.titulo);
    }
    
    const iconHtml = `<img src="${iconUrl}" alt="${item.titulo}" style="width: 60px; height: 60px; object-fit: contain; margin-bottom: 1.2rem; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));">`;

    
    // Parsear Pasos
    let pasosHtml = '';
    let hasPasos = false;
    if (item.pasos && item.pasos.trim()) {
        hasPasos = true;
        const lineas = item.pasos.split(/\n/);
        pasosHtml = `<div class="steps-container" style="width: 100%; margin-top: 1rem;"><ul class="steps-list" style="padding-top: 1rem;">`;
        lineas.forEach(linea => {
            const txt = linea.replace(/^\s*\d+\.?\s*/, '').replace(/^[-*]\s*/, '').trim();
            if (txt) {
                pasosHtml += `<li><p style="font-size: 0.85rem; color: var(--clr-text-muted); line-height: 1.5; margin: 0;">${txt}</p></li>`;
            }
        });
        pasosHtml += `</ul></div>`;
    }
    
    const linkPasos = item.enlace || item.link || '';
    let actionHtml = '';
    
    if (hasPasos) {
        actionHtml = `<a href="#" class="link-inline toggle-pasos" style="font-size: 0.9rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.4rem;">Ver ruta <span class="arrow" style="transition: transform 0.3s; font-size: 1.1rem;">&rarr;</span></a>`;
    } else if (linkPasos) {
        actionHtml = `<a href="${linkPasos}" target="_blank" rel="noopener noreferrer" class="link-inline" style="font-size: 0.9rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.4rem;">Descargar PDF <span style="font-size: 1.1rem;">&darr;</span></span></a>`;
    } else {
        actionHtml = `<a href="#contacto" class="link-inline" style="font-size: 0.9rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.4rem;">Solicitar Apoyo <span style="font-size: 1.1rem;">&rarr;</span></a>`;
    }

    div.innerHTML = `
        ${iconHtml}
        <h4 style="font-family: var(--font-body); font-weight: 700; font-size: 1.15rem; color: var(--clr-text); line-height: 1.3; margin-bottom: 0.5rem;">${item.titulo}</h4>
        <p style="font-size: 0.85rem; color: var(--clr-text-muted); margin-bottom: 1.5rem; line-height: 1.5; flex-grow: 1;">${item.descripcion}</p>
        <div>
            ${actionHtml}
        </div>
        ${pasosHtml}
    `;
    
    if (hasPasos) {
        const btnToggle = div.querySelector('.toggle-pasos');
        const arrow = div.querySelector('.arrow');
        const stepsContainer = div.querySelector('.steps-container');
        
        btnToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const isOpen = stepsContainer.classList.contains('open');
            if (isOpen) {
                stepsContainer.classList.remove('open');
                arrow.style.transform = 'rotate(0deg)';
                // El texto se mantiene como 'Ver ruta' pero la flecha indica el estado
            } else {
                stepsContainer.classList.add('open');
                arrow.style.transform = 'rotate(90deg)';
            }
        });
    }

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
function renderHighlights(items) {
    const track = document.getElementById('carousel-track');
    if (!track) return;

    track.innerHTML = '';
    if (items.length === 0) {
        track.innerHTML = '<p style="text-align: center; width: 100%; color: var(--clr-text-muted);">No hay anuncios destacados en este momento.</p>';
        return;
    }

    // Para el efecto infinito, clonamos los items: [Final] + [Original] + [Inicio]
    const clonesCount = Math.min(items.length, 3);
    const headClones = items.slice(0, clonesCount);
    const tailClones = items.slice(-clonesCount);
    const infiniteItems = [...tailClones, ...items, ...headClones];

    infiniteItems.forEach((item, index) => {
        const card = document.createElement('a');
        card.href = item.link || '#';
        card.className = 'highlight-card';
        
        if (item.link && (item.link.startsWith('http') || item.link.startsWith('https'))) {
            card.target = '_blank';
            card.rel = 'noopener noreferrer';
        }

        if (index < clonesCount) card.dataset.clone = 'tail';
        if (index >= infiniteItems.length - clonesCount) card.dataset.clone = 'head';
        
        let img = item.imagen_carrusel || item.imagen_portada || item.imagen;
        
        if (img && img.includes('drive.google.com')) {
            const driveId = img.match(/[-\w]{25,}/);
            if (driveId) img = `https://drive.google.com/uc?id=${driveId[0]}`;
        }

        let visualHtml = '';
        if (img) {
            const imgL = img.toLowerCase();
            const isImageExt = imgL.endsWith('.jpg') || imgL.endsWith('.jpeg') || imgL.endsWith('.png') || imgL.endsWith('.webp') || imgL.endsWith('.gif');
            const isVideo = (imgL.endsWith('.mp4') || imgL.endsWith('.webm') || imgL.includes('/video/upload/')) && !isImageExt;
            
            if (isVideo) {
                visualHtml = `
                    <div class="card-visual">
                        <video src="${img}" autoplay muted loop playsinline 
                            style="width: 100%; height: 100%; object-fit: cover;"></video>
                    </div>`;
            } else {
                visualHtml = `<div class="card-visual"><img src="${img}" alt="${item.titulo}"></div>`;
            }
        } else {
            const typeFallbacks = {
                'Documento': 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=500&auto=format&fit=crop&q=60',
                'Video': 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500&auto=format&fit=crop&q=60',
                'Juego': 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=500&auto=format&fit=crop&q=60',
                'Audio': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60',
                'Comunicado': 'assets/img/sketch-comunicado.png',
                'Actividad': 'assets/img/sketch-actividad.png'
            };
            const fallbackImg = typeFallbacks[item.tipo] || typeFallbacks[item.type] || 'assets/img/sketch-actividad.png';
            visualHtml = `<div class="card-visual"><img src="${fallbackImg}" alt="${item.titulo}"></div>`;
        }

        const resumen = item.descripcion || item.subtitulo || item.resumen || '';
        const dateHtml = (item.type === 'Actividad' && item.fecha) 
            ? `<div class="card-date"><iconify-icon icon="mdi:calendar-clock"></iconify-icon> ${item.fecha}</div>`
            : '';

        card.innerHTML = `
            ${visualHtml}
            <div class="card-overlay">
                <div class="card-content">
                    <span class="card-badge">${item.type}</span>
                    <h4 class="card-title">${item.titulo}</h4>
                    <p class="card-desc">${resumen}</p>
                </div>
                ${dateHtml}
            </div>
        `;
        track.appendChild(card);
    });

    // Posicionamiento inicial en el primer elemento "real"
    const cardWidth = 380 + 32;
    setTimeout(() => {
        track.scrollLeft = cardWidth * clonesCount;
    }, 100);

    // --- AUTO-ROTATION LOGIC ---
    let isAutoScrolling = true;
    
    const autoScroll = () => {
        if (!isAutoScrolling) return;
        const step = 380 + 32;
        track.scrollBy({ left: step, behavior: 'smooth' });
    };

    let scrollInterval = setInterval(autoScroll, 5000);

    // --- FOCUS ZOOM & INFINITE JUMP LOGIC ---
    const updateFocus = () => {
        const cards = track.querySelectorAll('.highlight-card');
        const trackCenter = track.scrollLeft + (track.offsetWidth / 2);
        let closestCard = null;
        let minDistance = Infinity;

        cards.forEach(card => {
            const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
            const distance = Math.abs(trackCenter - cardCenter);
            if (distance < minDistance) {
                minDistance = distance;
                closestCard = card;
            }
        });

        cards.forEach(c => c.classList.remove('active-focus'));
        if (closestCard) closestCard.classList.add('active-focus');
    };

    const handleInfiniteJump = () => {
        const totalItems = items.length;
        const clonesCount = Math.min(totalItems, 3);
        const cardWidth = 380 + 32;
        const realStart = clonesCount * cardWidth;
        const realEnd = (totalItems + clonesCount) * cardWidth;

        if (track.scrollLeft < realStart - (cardWidth / 2)) {
            track.scrollLeft += totalItems * cardWidth;
        } else if (track.scrollLeft > realEnd - (cardWidth / 2)) {
            track.scrollLeft -= totalItems * cardWidth;
        }
    };

    track.addEventListener('scroll', () => {
        updateFocus();
        clearTimeout(track.jumpTimeout);
        track.jumpTimeout = setTimeout(handleInfiniteJump, 100);
    });
    setTimeout(updateFocus, 200);

    // --- NAVIGATION ARROWS LOGIC ---
    const btnPrev = document.getElementById('carousel-prev');
    const btnNext = document.getElementById('carousel-next');

    if (btnPrev && btnNext) {
        btnPrev.addEventListener('click', () => {
            track.scrollBy({ left: -(380 + 32), behavior: 'smooth' });
            isAutoScrolling = false;
        });

        btnNext.addEventListener('click', () => {
            track.scrollBy({ left: 380 + 32, behavior: 'smooth' });
            isAutoScrolling = false;
        });
    }

    // Pause on hover
    track.addEventListener('mouseenter', () => isAutoScrolling = false);
    track.addEventListener('mouseleave', () => isAutoScrolling = true);
    track.addEventListener('touchstart', () => isAutoScrolling = false);
}

function setupNav() {
    const header = document.querySelector('.site-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

/* ==================== TIMELINE ENGINE ==================== */
window.timelineActividades = [];

function parseSpanishDate(dateStr) {
    if (!dateStr) return new Date(0);
    let s = dateStr.toString().trim().toLowerCase();
    
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const d = new Date(s + 'T12:00:00');
        if (!isNaN(d.getTime())) return d;
    }

    const meses = {
        'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
        'julio': 6, 'agosto': 7, 'septiembre': 8, 'setiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
    };

    const match = s.match(/(\d+)\s*(?:de)?\s*([a-z]+)/i);
    if (match && meses[match[2]]) {
        // Asume el año actual
        return new Date(new Date().getFullYear(), meses[match[2]], parseInt(match[1], 10), 12, 0, 0);
    }

    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date(0) : d;
}

function renderTimeline(actividades, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Procesar y autocompletar el periodo basado en la fecha
    window.timelineActividades = (actividades || []).map(act => {
        // Normalizar fecha si viene como 'fecha / hora'
        const fechaReal = act.fecha || act['fecha / hora'];
        if (fechaReal && !act.fecha) act.fecha = fechaReal;

        if (!act.periodo && act.fecha) {
            act.periodo = 'Periodo ' + getPeriodForDate(act.fecha);
        }
        return act;
    });

    // Ordenar por fecha cronológicamente
    const sorted = [...window.timelineActividades].sort((a, b) => {
        return parseSpanishDate(a.fecha) - parseSpanishDate(b.fecha);
    });

    renderTimelineByPeriod(sorted, containerId);
    initTimelineFilters();
}

function renderTimelineByPeriod(actividades, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !actividades || actividades.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--clr-text-muted); padding: 2rem;">No hay actividades registradas para este periodo.</p>';
        return;
    }

    let html = '<div class="timeline">';
    actividades.forEach((act, index) => {
        const fecha = formatDate(act.fecha);
        const colorClass = getPeriodColor(act.periodo);
        const activitySlug = (act.id || act.titulo || '').toString().trim().toLowerCase().replace(/\s+/g, '-');
        const activityLink = act.programa_id ? `programa.html?id=${act.programa_id}#activity-${activitySlug}` : '#agenda';
        
        const titleHtml = `<a href="${activityLink}" class="timeline-title-link">${act.titulo} <iconify-icon icon="mdi:arrow-right-circle" style="font-size: 0.8em; vertical-align: middle; color: var(--clr-primary);"></iconify-icon></a>`;

        const desc = act.descripcion || act.resumen || '';
        const badgeClass = act.estado === 'próximo' ? 'badge-next' : (act.estado === 'en curso' ? 'badge-now' : 'badge-done');
        
        html += `
            <div class="timeline-item ${index % 2 === 0 ? 'left' : 'right'}">
                <div class="timeline-content">
                    <div class="timeline-date">${fecha}</div>
                    <div class="timeline-badge ${badgeClass}">${act.estado || ''}</div>
                    <h4 class="timeline-title">${titleHtml}</h4>
                    <p class="timeline-desc">${desc}</p>
                    <div class="timeline-footer">
                        <span><iconify-icon icon="mdi:account-group"></iconify-icon> ${act.publico || ''}</span>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
    observeTimelineItems(container);
}

function initTimelineFilters() {
    const buttons = document.querySelectorAll('.timeline-filter-btn');
    if(buttons.length === 0) return;

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterTimeline(btn.dataset.period);
        });
    });
}

function filterTimeline(period) {
    const filtered = window.timelineActividades.filter(act => {
        if (period === 'all') return true;
        
        const p = (act.periodo || '').toLowerCase().replace(/\s+/g, '');
        const numPatterns = [period, 'periodo' + period];
        if (period === '1') numPatterns.push('primero', 'periodoprimero', 'primer');
        if (period === '2') numPatterns.push('segundo', 'periodosegundo');
        if (period === '3') numPatterns.push('tercero', 'periodotercero', 'tercer');
        if (period === '4') numPatterns.push('cuarto', 'periodocuarto');
        
        return numPatterns.some(pattern => p.includes(pattern));
    });

    filtered.sort((a, b) => parseSpanishDate(a.fecha) - parseSpanishDate(b.fecha));
    renderTimelineByPeriod(filtered, 'agenda-container');
}

function getPeriodForDate(fecha) {
    const d = parseSpanishDate(fecha);
    if (d.getTime() === 0) return '1'; // Por defecto si no se puede parsear
    
    const month = d.getMonth() + 1;
    const day = d.getDate();

    if (month < 4 || (month === 4 && day <= 5)) return '1';
    if ((month === 4 && day > 5) || month === 5 || (month === 6 && day <= 15)) return '2';
    if ((month === 6 && day > 15) || month === 7 || month === 8 || (month === 9 && day <= 15)) return '3';
    return '4';
}

function getPeriodColor(periodo) {
    if (!periodo) return 'bg-primary';
    const p = periodo.toLowerCase();
    if (p.includes('1') || p.includes('primer')) return 'bg-primary';
    if (p.includes('2') || p.includes('segundo')) return 'bg-secondary';
    if (p.includes('3') || p.includes('tercer')) return 'bg-accent';
    if (p.includes('4') || p.includes('cuarto')) return 'bg-highlight';
    return 'bg-primary';
}

function formatDate(dateStr) {
    if (!dateStr || !dateStr.trim()) return '';
    // Si ya viene en formato de texto legible como "15 de Mayo", lo dejamos así
    if (/[a-z]/i.test(dateStr) && !/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        return dateStr;
    }

    try {
        const d = parseSpanishDate(dateStr);
        if (d.getTime() === 0) return dateStr;
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return d.toLocaleDateString('es-CO', options);
    } catch {
        return dateStr;
    }
}

function observeTimelineItems(container) {
    const items = container.querySelectorAll('.timeline-item');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    items.forEach(item => observer.observe(item));
}

/* ==================== MURO DE EVIDENCIAS ==================== */
function renderEvidenciasGrid(containerId, items, limit) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--clr-text-muted); width: 100%; padding: 3rem 0;">Aún no hay evidencias compartidas en el muro. ¡Gira la ruleta, completa tu reto y sé el primero en inspirar a la comunidad!</p>';
        return;
    }

    // Si hay límite, mostrar solo las más recientes
    const displayItems = limit ? items.slice(0, limit) : items;

    container.innerHTML = '';
    displayItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'evidencia-card';
        
        let mediaHtml = '';
        if (item.url) {
            // Cloudinary usa /video/upload/ para videos y audios. /image/upload/ para fotos.
            if (item.url.includes('/video/upload/') || item.url.endsWith('.mp4') || item.url.endsWith('.webm')) {
                mediaHtml = `<video src="${item.url}" controls preload="metadata" style="width: 100%; display: block; border-radius: var(--radius-sm); outline: none;"></video>`;
            } else {
                mediaHtml = `<img src="${item.url}" alt="Evidencia de la comunidad" loading="lazy" style="width: 100%; display: block; border-radius: var(--radius-sm);">`;
            }
        }

        const nombreStr = item.nombre || item.nombre_padre || 'Familia ENSM';
        const gradoStr = item.grado ? `<span class="evidencia-badge">${item.grado}</span>` : '';
        const mensajeStr = item.mensaje ? `<p class="evidencia-msg">"${item.mensaje}"</p>` : '';

        div.innerHTML = `
            ${mediaHtml}
            <div class="evidencia-info">
                <div class="evidencia-header">
                    <h5>${nombreStr}</h5>
                    ${gradoStr}
                </div>
                ${mensajeStr}
            </div>
        `;
        container.appendChild(div);
    });
}
