/**
 * ruleta.js - Motor de la Ruleta (Edición Orientación Escolar)
 */

class Ruleta {
    constructor() {
        this.canvas = document.getElementById('wheelCanvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.btn = document.getElementById('spin-btn');
        this.container = document.getElementById('wheel-container');
        
        this.videoIdle = document.getElementById('video-idle');
        this.videoActive = document.getElementById('video-active');
        
        this.resultOverlay = document.getElementById('result-overlay');
        this.resultContent = document.getElementById('result-content');
        this.resultText = document.getElementById('result-text');
        this.retoText = document.getElementById('reto-text');
        this.closeBtn = document.getElementById('close-result');
        this.exitBtn = document.getElementById('exit-result');
        
        // Modal Email Controls
        this.emailModal = document.getElementById('email-modal');
        this.cancelEmailBtn = document.getElementById('cancel-email');
        this.confirmEmailBtn = document.getElementById('confirm-email');
        this.emailInput = document.getElementById('parent-email');
        this.modalMsg = document.getElementById('modal-msg');
        this.modalSpinner = document.getElementById('modal-spinner');

        this.propositos = [];
        this.loadedImages = {};
        this.angle = 0;
        this.isSpinning = false;
        
        this.colors = [
            '#1a4d4a', '#2d6b67', '#e8792f', '#4ea59f', 
            '#f5a623', '#5db9b1', '#8abfb9', '#a8d5ba'
        ];
        
        this.init();
    }
    
    async init() {
        console.log("🎡 [Ruleta] Iniciando motor...");
        
        // Carga inicial (Placeholder)
        this.propositos = [{texto: 'Cargando...', tema: 'Conexión'}];
        this.resize();
        this.draw();

        if (this.btn) {
            this.btn.onclick = () => this.spin();
            this.btn.disabled = false;
        }
        
        if (this.closeBtn) {
            this.closeBtn.onclick = () => this.showEmailModal();
        }

        if (this.exitBtn) {
            this.exitBtn.onclick = () => this.hideResult();
        }

        if (this.cancelEmailBtn) {
            this.cancelEmailBtn.onclick = () => this.hideEmailModal();
        }

        if (this.confirmEmailBtn) {
            this.confirmEmailBtn.onclick = () => this.handleConfirmEmail();
        }

        try {
            const data = await getPropositos();
            if (data && data.length > 0) {
                this.propositos = data;
            } else {
                this.propositos = [{texto: 'Sincronizando...', tema: 'Espera'}];
            }

            // Precargar imágenes
            this.propositos.forEach((prop, i) => {
                if (prop.imagen) {
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.src = prop.imagen.replace(/["']/g, '').trim();
                    img.onload = () => this.draw();
                    this.loadedImages[i] = img;
                }
            });
        } catch (e) {
            console.error("🎡 [Ruleta] Error en carga:", e);
        }

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.draw();
        setTimeout(() => this.draw(), 1500); // Redibujo de seguridad
    }

    showEmailModal() {
        this.hideResult();
        if (this.emailModal) {
            this.emailModal.style.display = 'flex';
            this.modalMsg.style.display = 'none';
            this.emailInput.value = '';
            this.confirmEmailBtn.disabled = false;
        }
    }

    hideEmailModal() {
        if (this.emailModal) this.emailModal.style.display = 'none';
    }

    async handleConfirmEmail() {
        const email = this.emailInput.value.trim();
        if (!email || !email.includes('@')) {
            this.showModalMsg('❌ Ingresa un correo válido.', '#d32f2f');
            return;
        }

        const winIndex = this.getWinningIndex();
        const retoActual = this.propositos[winIndex];

        this.confirmEmailBtn.disabled = true;
        this.modalSpinner.style.display = 'block';
        this.showModalMsg('Registrando desafío...', '#1e3a5f');

        const datos = {
            email: email,
            id_proposito: retoActual.id,
            titulo_reto: retoActual.reto || retoActual.proposito || retoActual.texto,
            programa_nombre: retoActual.id_programa || 'Orientación Escolar',
            id_programa: retoActual.id_programa
        };

        if (typeof google !== 'undefined') {
            google.script.run
                .withSuccessHandler((r) => {
                    this.modalSpinner.style.display = 'none';
                    if (r.ok) {
                        this.showModalMsg('✅ ' + r.msg, '#2e7d32');
                        setTimeout(() => this.hideEmailModal(), 3000);
                    } else {
                        this.showModalMsg('❌ ' + r.msg, '#d32f2f');
                        this.confirmEmailBtn.disabled = false;
                    }
                })
                .withFailureHandler((e) => {
                    this.modalSpinner.style.display = 'none';
                    this.showModalMsg('❌ Error: ' + e.message, '#d32f2f');
                    this.confirmEmailBtn.disabled = false;
                })
                .registrarRetoAceptado(datos);
        } else {
            // ENVÍO REMOTO (GitHub Pages -> Google Apps Script)
            if (!APP_CONFIG.scriptUrl) {
                this.showModalMsg('⚠️ Error: Falta configurar la URL del servidor.', '#d32f2f');
                this.modalSpinner.style.display = 'none';
                return;
            }

            fetch(APP_CONFIG.scriptUrl, {
                method: 'POST',
                mode: 'no-cors', // Importante para Google Script
                body: JSON.stringify({ action: 'registrarRetoAceptado', data: datos })
            })
            .then(() => {
                // Como usamos no-cors, no podemos leer la respuesta, pero si llega aquí es que se envió
                this.modalSpinner.style.display = 'none';
                this.showModalMsg('✅ ¡Reto registrado! Revisa tu correo.', '#2e7d32');
                setTimeout(() => this.hideEmailModal(), 3000);
            })
            .catch(e => {
                this.modalSpinner.style.display = 'none';
                this.showModalMsg('❌ Error al conectar con el servidor.', '#d32f2f');
            });
        }
    }

    showModalMsg(txt, color) {
        if (this.modalMsg) {
            this.modalMsg.textContent = txt;
            this.modalMsg.style.color = color;
            this.modalMsg.style.display = 'block';
        }
    }

    getWinningIndex() {
        const total = this.propositos.length;
        const arc = 2 * Math.PI / total;
        let winningIndex = Math.floor((1.5 * Math.PI - this.angle) / arc) % total;
        if (winningIndex < 0) winningIndex += total;
        return winningIndex;
    }

    restartGif(el) {
        if (!el) return;
        const currentSrc = el.src.split('?')[0];
        el.src = currentSrc + '?t=' + new Date().getTime();
    }

    spin() {
        if (this.isSpinning) return;
        this.isSpinning = true;
        
        // 1. Activar GIF de movimiento (GIF2)
        if (this.videoActive) {
            this.restartGif(this.videoActive);
            this.videoActive.style.display = 'block';
            
            // Micro-delay para evitar frame en blanco sin que se note la superposición
            setTimeout(() => {
                if (this.videoIdle) this.videoIdle.style.display = 'none';
            }, 40);
        }
        
        console.log("🎡 [Ruleta] GIF2 iniciado. Esperando 5 segundos para girar...");

        // 2. Esperar 5 segundos antes de que la ruleta gire físicamente
        setTimeout(() => {
            const extraSpins = 5 + Math.random() * 5;
            const duration = 4000;
            const startAngle = this.angle;
            const targetAngle = startAngle + extraSpins * Math.PI * 2;
            const startTime = performance.now();

            const animate = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeOut = 1 - Math.pow(1 - progress, 3);
                
                this.angle = startAngle + (targetAngle - startAngle) * easeOut;
                this.draw();

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // 3. La ruleta se detuvo
                    console.log("🎡 [Ruleta] Detenida. Restaurando GIF1...");
                    
                    // Pequeña pausa extra para que el GIF2 "termine" su ciclo visual
                    setTimeout(() => {
                        this.isSpinning = false;
                        if (this.videoIdle) {
                            // El idle no necesita reiniciarse (puede empezar donde sea)
                            this.videoIdle.style.display = 'block';
                            setTimeout(() => {
                                if (this.videoActive) this.videoActive.style.display = 'none';
                            }, 40);
                        }
                        this.showResult();
                    }, 800);
                }
            };
            requestAnimationFrame(animate);
        }, 5500);
    }

    showResult() {
        const winIndex = this.getWinningIndex();
        const p = this.propositos[winIndex];
        
        this.resultText.textContent = p.proposito || p.texto;
        this.retoText.textContent = p.reto || 'Completa este reto y sube tu evidencia.';
        
        this.resultOverlay.style.display = 'flex';
        this.resultContent.style.opacity = '1';
    }

    hideResult() {
        this.resultOverlay.style.display = 'none';
    }

    resize() {
        const parent = this.canvas.parentElement;
        if (!parent) return;
        const size = Math.min(parent.offsetWidth, 850);
        this.canvas.width = size;
        this.canvas.height = size * 0.7;
        this.draw();
    }
    
    draw() {
        if (!this.propositos || this.propositos.length === 0) return;
        const size = this.canvas.width;
        if (size < 10) return;

        const centerX = size * 0.62;
        const centerY = this.canvas.height / 2;
        const radius = size * 0.222;
        const total = this.propositos.length;
        const arc = 2 * Math.PI / total;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Marco
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius + 15, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#050d0c';
        this.ctx.fill();
        this.ctx.strokeStyle = '#4ea59f';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();

        // Rebanadas
        this.propositos.forEach((prop, i) => {
            const startAngle = this.angle + i * arc;
            const endAngle = startAngle + arc;
            
            this.ctx.beginPath();
            this.ctx.fillStyle = this.colors[i % this.colors.length];
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.ctx.fill();
            
            // Texto/Icono (Mejorado para textos largos)
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(startAngle + arc / 2);
            this.ctx.translate(radius * 0.75, 0);
            this.ctx.rotate(Math.PI / 2);
            this.ctx.textAlign = "center";
            this.ctx.fillStyle = "white";
            
            // a) Icono
            if (this.loadedImages[i] && this.loadedImages[i].complete) {
                this.ctx.drawImage(this.loadedImages[i], -15, -45, 30, 30);
            }
            
            // b) Texto Adaptativo (Equilibrado)
            const fullText = (prop.tema || prop.texto || "").toUpperCase();
            const words = fullText.split(' ');
            let lines = [];
            
            if (words.length <= 2) {
                lines = words; // Cada palabra en su línea (máx 2)
            } else if (words.length === 3) {
                // Balancear: 2 palabras arriba, 1 abajo (o viceversa según longitud)
                if ((words[0] + words[1]).length < 12) {
                    lines = [words[0] + " " + words[1], words[2]];
                } else {
                    lines = [words[0], words[1] + " " + words[2]];
                }
            } else {
                // 4 o más palabras: Repartir en 3 líneas
                const mid = Math.ceil(words.length / 3);
                lines = [
                    words.slice(0, mid).join(' '),
                    words.slice(mid, mid * 2).join(' '),
                    words.slice(mid * 2).join(' ')
                ].filter(l => l.trim() !== "");
            }
            
            // Configuración de fuente y dibujado
            const fontSize = lines.length > 2 ? 8 : 10;
            this.ctx.font = `bold ${fontSize}px sans-serif`;
            const lineHeight = fontSize + 2;
            
            const totalHeight = lines.length * lineHeight;
            let currentY = -(totalHeight / 2) + 5;
            
            lines.forEach(line => {
                this.ctx.fillText(line, 0, currentY);
                currentY += lineHeight;
            });
            
            this.ctx.restore();
        });
        
        // Dibujar el puntero (flecha) en la parte superior
        this.ctx.beginPath();
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.moveTo(centerX - 15, centerY - radius - 20);
        this.ctx.lineTo(centerX + 15, centerY - radius - 20);
        this.ctx.lineTo(centerX, centerY - radius + 5);
        this.ctx.fill();
        
        // Borde del puntero para que resalte
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.stroke();
        this.ctx.closePath();
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.ruletaApp = new Ruleta();
});
