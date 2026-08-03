// ============================================================
// 🌹 INVITACIÓN XV – SCRIPT PRINCIPAL
// ============================================================

import { initCountdown } from './modules/contador.js';
import { initGame } from './modules/juego.js';
import { initModal } from './modules/modal.js';
import { initMusic, playSound } from './modules/musica.js';
import { initParticles } from './modules/particulas.js';
import { initSounds } from './modules/sonidos.js';

// ============================================================
// CONFIGURACIÓN DE DATOS
// ============================================================

const CONFIG = {
  FECHA_FIESTA: new Date('2026-10-10T20:00:00').getTime(),
  PAPAS: {
    padre1: 'Papa 1',
    padre2: 'Papa 2',
  },
  PADRINOS: {
    padrino1: 'Padrino 1',
    padrino2: 'Padrino 2',
  },
  LUGARES: {
    ceremonia: {
      hora: '18:00',
      lugar: 'Iglesia de San Francisco',
      coords: '19.6844,-99.4186'
    },
    fiesta: {
      hora: '20:00',
      lugar: 'Salón de Fiestas "El Palacio"',
      coords: '19.6844,-99.4186'
    }
  }
};

// ============================================================
// ELEMENTOS DEL DOM
// ============================================================

const elements = {
  portal: document.getElementById('portal'),
  gateWrapper: document.getElementById('gate-wrapper'),
  mainContent: document.getElementById('main-content'),
  modalOverlays: document.querySelectorAll('.modal-overlay'),
  pergaminoHeaders: document.querySelectorAll('.pergamino-header'),
  pergaminoCards: document.querySelectorAll('.pergamino-card'),
  btnJuego: document.getElementById('btn-juego'),
  btnMusica: document.getElementById('btn-musica'),
  gameOverlay: document.getElementById('game-overlay'),
  
  // Datos familia
  padre1: document.getElementById('padre1'),
  padre2: document.getElementById('padre2'),
  padre1Modal: document.getElementById('padre1-modal'),
  padre2Modal: document.getElementById('padre2-modal'),
  padrino1: document.getElementById('padrino1'),
  padrino2: document.getElementById('padrino2'),
  padrino1Modal: document.getElementById('padrino1-modal'),
  padrino2Modal: document.getElementById('padrino2-modal'),
  
  // Lugares
  horaCeremonia: document.getElementById('hora-ceremonia'),
  lugarCeremonia: document.getElementById('lugar-ceremonia'),
  horaCeremoniaModal: document.getElementById('hora-ceremonia-modal'),
  lugarCeremoniaModal: document.getElementById('lugar-ceremonia-modal'),
  horaFiesta: document.getElementById('hora-fiesta'),
  lugarFiesta: document.getElementById('lugar-fiesta'),
  horaFiestaModal: document.getElementById('hora-fiesta-modal'),
  lugarFiestaModal: document.getElementById('lugar-fiesta-modal'),
  mapaFiesta: document.getElementById('mapa-fiesta'),
  mapaFiestaModal: document.getElementById('mapa-fiesta-modal'),
  
  // Countdown
  dias: document.getElementById('dias'),
  horas: document.getElementById('horas'),
  minutos: document.getElementById('minutos'),
  segundos: document.getElementById('segundos'),
  modalDias: document.getElementById('modal-dias'),
  modalHoras: document.getElementById('modal-horas'),
  modalMinutos: document.getElementById('modal-minutos'),
  modalSegundos: document.getElementById('modal-segundos'),
};

// ============================================================
// INICIALIZACIÓN PRINCIPAL
// ============================================================

function init() {
  // 1. Inicializar sistemas de sonido y música
  initSounds();
  initMusic();
  
  // 2. Cargar datos
  loadData();
  
  // 3. Inicializar efectos
  initParticles();
  
  // 4. Configurar eventos del portal
  setupPortalEvents();
  
  // 5. Configurar modales y pergaminos
  setupModalsAndPergaminos();
  
  // 6. Configurar botones de acción
  setupActionButtons();
  
  // 7. Inicializar contador
  initCountdown(updateCountdown);
  
  // 8. Inicializar juego
  initGame();
  
  // 9. Mostrar portal
  setTimeout(() => {
    elements.portal.style.opacity = '1';
  }, 100);
}

// ============================================================
// CARGA DE DATOS
// ============================================================

function loadData() {
  // Papás
  elements.padre1.textContent = CONFIG.PAPAS.padre1;
  elements.padre2.textContent = CONFIG.PAPAS.padre2;
  elements.padre1Modal.textContent = CONFIG.PAPAS.padre1;
  elements.padre2Modal.textContent = CONFIG.PAPAS.padre2;
  
  // Padrinos
  elements.padrino1.textContent = CONFIG.PADRINOS.padrino1;
  elements.padrino2.textContent = CONFIG.PADRINOS.padrino2;
  elements.padrino1Modal.textContent = CONFIG.PADRINOS.padrino1;
  elements.padrino2Modal.textContent = CONFIG.PADRINOS.padrino2;
  
  // Lugares
  elements.horaCeremonia.textContent = CONFIG.LUGARES.ceremonia.hora;
  elements.lugarCeremonia.textContent = CONFIG.LUGARES.ceremonia.lugar;
  elements.horaCeremoniaModal.textContent = CONFIG.LUGARES.ceremonia.hora;
  elements.lugarCeremoniaModal.textContent = CONFIG.LUGARES.ceremonia.lugar;
  
  elements.horaFiesta.textContent = CONFIG.LUGARES.fiesta.hora;
  elements.lugarFiesta.textContent = CONFIG.LUGARES.fiesta.lugar;
  elements.horaFiestaModal.textContent = CONFIG.LUGARES.fiesta.hora;
  elements.lugarFiestaModal.textContent = CONFIG.LUGARES.fiesta.lugar;
  
  // URLs mapas
  const urlMapa = `https://www.google.com/maps/search/${encodeURIComponent(CONFIG.LUGARES.fiesta.lugar)}`;
  elements.mapaFiesta.href = urlMapa;
  elements.mapaFiestaModal.href = urlMapa;
}

// ============================================================
// PORTAL – ABRIR PUERTA
// ============================================================

function setupPortalEvents() {
  elements.gateWrapper.addEventListener('click', openPortal);
  elements.gateWrapper.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPortal();
    }
  });
}

function openPortal() {
  playSound('open');
  
  // Animar puerta
  elements.gateWrapper.classList.add('open');
  
  // Esperar a que termine la animación
  setTimeout(() => {
    elements.portal.classList.add('hide');
    elements.mainContent.classList.remove('content-hidden');
    elements.mainContent.classList.add('content-visible');
  }, 600);
}

// ============================================================
// MODALES
// ============================================================

function setupModalsAndPergaminos() {
  // Configurar cierre de modales
  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', closeAllModals);
  });
  
  // Cerrar modales al hacer clic afuera
  elements.modalOverlays.forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeAllModals();
      }
    });
  });
  
  // Configurar pergaminos
  elements.pergaminoHeaders.forEach((header) => {
    header.addEventListener('click', (e) => {
      const card = header.closest('.pergamino-card');
      if (!card) return;
      
      // Toggle expandir
      card.classList.toggle('expanded');
      playSound('page-turn');
    });
    
    header.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.target.click();
      }
    });
  });
  
  // Configurar modales desde pergaminos
  document.querySelectorAll('[data-modal]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const modalId = el.getAttribute('data-modal');
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('open');
        playSound('modal-open');
      }
    });
  });
}

function closeAllModals() {
  elements.modalOverlays.forEach((modal) => {
    modal.classList.remove('open');
  });
  playSound('modal-close');
}

// ============================================================
// BOTONES DE ACCIÓN
// ============================================================

function setupActionButtons() {
  // Botón Juego
  elements.btnJuego.addEventListener('click', () => {
    elements.gameOverlay.classList.add('open');
    playSound('game-start');
  });
  
  // Botón Música
  elements.btnMusica.addEventListener('click', toggleMusic);
}

function toggleMusic() {
  const isPlaying = elements.btnMusica.dataset.playing === 'true';
  
  if (isPlaying) {
    // Pausar música
    document.getElementById('background-music')?.pause?.();
    elements.btnMusica.dataset.playing = 'false';
    elements.btnMusica.style.opacity = '0.6';
  } else {
    // Reproducir música
    playSound('music-start');
    elements.btnMusica.dataset.playing = 'true';
    elements.btnMusica.style.opacity = '1';
  }
}

// ============================================================
// ACTUALIZAR COUNTDOWN
// ============================================================

function updateCountdown(dias, horas, minutos, segundos) {
  elements.dias.textContent = String(dias).padStart(2, '0');
  elements.horas.textContent = String(horas).padStart(2, '0');
  elements.minutos.textContent = String(minutos).padStart(2, '0');
  elements.segundos.textContent = String(segundos).padStart(2, '0');
  
  // Modal countdown
  elements.modalDias.textContent = String(dias).padStart(2, '0');
  elements.modalHoras.textContent = String(horas).padStart(2, '0');
  elements.modalMinutos.textContent = String(minutos).padStart(2, '0');
  elements.modalSegundos.textContent = String(segundos).padStart(2, '0');
}

// ============================================================
// INICIAR
// ============================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Exportar para módulos
window.playSound = playSound;
window.closeAllModals = closeAllModals;
window.CONFIG = CONFIG;

