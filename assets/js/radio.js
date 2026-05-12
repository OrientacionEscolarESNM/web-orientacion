/**
 * radio.js - Reproductor Sonaría (Edición Orientación Escolar)
 * Adaptado con estética de Faro / Guía.
 */

class SonariaRadioOrientacion {
    constructor() {
        this.streamUrl = 'https://radio.sonariaradio.online/radio.mp3';
        this.isPlaying = false;
        this.userWantsPlay = false;
        this.audio = null;
        
        // Reconexión
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 50;
        this.reconnectTimer = null;
        this.watchdogTimer = null;
        this.lastDataTime = 0;
        this.connectionStartTime = 0;
        
        // Audios de emergencia alternados
        this.emergencyAudio = null;
        this.emergencyUrls = [
            'assets/audio/emergencia1.mp3',
            'assets/audio/emergencia2.mp3'
        ];
        this.currentEmergencyIndex = 0;

        this.createPlayerUI();
        this.initListeners();
    }

    createPlayerUI() {
        const playerHtml = `
            <div id="sonaria-player" class="sonaria-player-orientacion">
                <div class="radio-visualizer" id="radio-beacon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                    </svg>
                </div>
                
                <div class="radio-info">
                    <span class="radio-label">En Sintonía</span>
                    <span class="radio-name">Sonaría Radio</span>
                </div>

                <button id="radio-play-btn" class="radio-ctrl">
                    <span id="radio-icon">▶</span>
                </button>

                <div id="radio-status" class="radio-status-tag">Conectando...</div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', playerHtml);
    }

    createAudio() {
        if (this.audio) {
            this.audio.pause();
            this.audio.removeAttribute('src');
            this.audio.load();
        }
        this.audio = new Audio();
        this.audio.preload = "none";

        this.audio.addEventListener('playing', () => {
            this.reconnectAttempts = 0;
            this.lastDataTime = Date.now();
            this.isPlaying = true;
            document.getElementById('radio-icon').textContent = "||";
            document.getElementById('radio-beacon').classList.add('spinning');
            this.showStatus('Sintonizado ✓');
            this.startWatchdog();
            this.stopEmergency();
        });

        this.audio.addEventListener('waiting', () => {
            if (this.userWantsPlay) this.showStatus('Cargando...');
        });

        this.audio.addEventListener('error', () => {
            if (this.userWantsPlay) this.scheduleReconnect("Error de señal");
        });

        this.audio.addEventListener('timeupdate', () => { this.lastDataTime = Date.now(); });
    }

    initListeners() {
        document.getElementById('radio-play-btn').addEventListener('click', () => {
            if (this.userWantsPlay) this.stop();
            else this.start();
        });

        if (sessionStorage.getItem('sonariaPlaying') === 'true') {
            this.start();
        }
    }

    start() {
        this.userWantsPlay = true;
        sessionStorage.setItem('sonariaPlaying', 'true');
        this.connectStream();
    }

    connectStream() {
        this.createAudio();
        this.showStatus('Buscando señal...');
        this.connectionStartTime = Date.now();
        this.startWatchdog();
        this.audio.src = this.streamUrl + '?nocache=' + Date.now();
        this.audio.play().catch(() => {
            if (this.userWantsPlay) this.scheduleReconnect("Reintentando");
        });
    }

    stop() {
        this.userWantsPlay = false;
        sessionStorage.setItem('sonariaPlaying', 'false');
        this.isPlaying = false;
        this.stopWatchdog();
        if (this.audio) {
            this.audio.pause();
            this.audio.removeAttribute('src');
            this.audio.load();
        }
        document.getElementById('radio-icon').textContent = "▶";
        document.getElementById('radio-beacon').classList.remove('spinning');
        this.showStatus('Pausado');
        this.stopEmergency();
    }

    scheduleReconnect(reason) {
        if (!this.userWantsPlay || this.reconnectTimer) return;
        this.reconnectAttempts++;
        const delay = Math.min(3000 + (this.reconnectAttempts * 2000), 10000);
        this.showStatus(`Reconectando...`);
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (this.userWantsPlay) this.connectStream();
        }, delay);
        this.startEmergency();
    }

    startEmergency() {
        if (!this.userWantsPlay) return;
        if (!this.emergencyAudio) {
            this.emergencyAudio = new Audio();
            // Al terminar uno, pasar al siguiente
            this.emergencyAudio.addEventListener('ended', () => {
                this.currentEmergencyIndex = (this.currentEmergencyIndex + 1) % this.emergencyUrls.length;
                this.emergencyAudio.src = this.emergencyUrls[this.currentEmergencyIndex];
                this.emergencyAudio.play().catch(() => {});
            });
        }
        
        if (this.emergencyAudio.paused) {
            this.emergencyAudio.src = this.emergencyUrls[this.currentEmergencyIndex];
            this.emergencyAudio.play().catch(() => {});
        }
    }

    stopEmergency() {
        if (this.emergencyAudio) {
            this.emergencyAudio.pause();
            this.emergencyAudio.currentTime = 0;
        }
    }

    startWatchdog() {
        this.stopWatchdog();
        this.watchdogTimer = setInterval(() => {
            const now = Date.now();
            // Caso 1: Estaba sonando y se cortó el flujo de datos (> 15s)
            if (this.userWantsPlay && this.isPlaying && now - this.lastDataTime > 15000) {
                this.scheduleReconnect("Señal perdida");
            }
            // Caso 2: Estamos intentando conectar pero no inicia (> 2s)
            if (this.userWantsPlay && !this.isPlaying && now - this.connectionStartTime > 2000) {
                this.scheduleReconnect("Fallo de conexión");
            }
        }, 5000);
    }

    stopWatchdog() {
        if (this.watchdogTimer) clearInterval(this.watchdogTimer);
    }

    showStatus(text) {
        const status = document.getElementById('radio-status');
        if (!status) return;
        status.textContent = text;
        status.classList.add('active');
        setTimeout(() => status.classList.remove('active'), 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SonariaRadioOrientacion();
});
