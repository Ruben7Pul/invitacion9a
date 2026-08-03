// ============================================================
// 🌹 INVITACIÓN XV – SCRIPT PRINCIPAL
// ============================================================
// NOTA IMPORTANTE:
// Los nombres importados aquí deben coincidir EXACTAMENTE con los
// "export function ..." de cada archivo en /modules. Antes había un
// desajuste (initCountdown/initGame/initMusic/initParticles vs los
// nombres reales initContador/initJuego/initMusica/initParticulas),
// lo que hacía fallar la carga de TODO el módulo script.js desde el
// primer import — por eso la reja tampoco abría: el listener del
// click nunca llegaba a registrarse.
// ============================================================

import { initJuego } from './modules/juego.js';
import { initParticulas } from './modules/particulas.js';
import { initSonidos, soundOpen, soundClose, soundTap } from './modules/sonidos.js';

// ============================================================
// CONFIGURACIÓN DE DATOS — se carga EXCLUSIVAMENTE desde config.json
// ============================================================
// config.json va en la raíz del proyecto (junto a index.html), y NO
// se sube al repo (va en .gitignore) por privacidad. Usa
// config.example.json como plantilla para crear el tuyo local/servidor.

let CONFIG = null;
let musicAudio = null;

async function cargarConfig() {
  const res = await fetch('./config.json', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`No se pudo leer config.json (HTTP ${res.status})`);
  }
  const data = await res.json();
  return data;
}

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

  // Nombre / fecha / frase
  nombreHero: document.getElementById('nombre-hero'),
  fechaFija: document.getElementById('fecha-fija'),
  fraseInvitacion: document.getElementById('frase-invitacion'),

  // Lugares
  horaCeremonia: document.getElementById('hora-ceremonia'),
  lugarCeremonia: document.getElementById('lugar-ceremonia'),
  horaCeremoniaModal: document.getElementById('hora-ceremonia-modal'),
  lugarCeremoniaModal: document.getElementById('lugar-ceremonia-modal'),
  mapaCeremonia: document.getElementById('mapa-ceremonia'),
  mapaCeremoniaModal: document.getElementById('mapa-ceremonia-modal'),
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
// SONIDOS (usa las funciones reales de sonidos.js)
// ============================================================

const SOUND_MAP = {
  'open': soundOpen,
  'close': soundClose,
  'page-turn': soundTap,
  'modal-open': soundOpen,
  'modal-close': soundClose,
  'game-start': soundTap,
  'music-start': soundTap,
};

function playSound(key) {
  const fn = SOUND_MAP[key];
  if (typeof fn === 'function') fn();
}

// ============================================================
// INICIALIZACIÓN PRINCIPAL
// ============================================================

async function init() {
  // 1. Sonidos y partículas (no dependen de config.json)
  initSonidos();
  initParticulas();

  // 2. Portal / reja — se configura SIEMPRE primero, sin depender
  //    de que config.json cargue bien, para que la reja nunca quede
  //    "muerta" aunque falle la carga de datos.
  setupPortalEvents();

  // 3. Modales y pergaminos
  setupModalsAndPergaminos();

  // 4. Botones de acción (juego / música)
  setupActionButtons();

  // 5. Cargar datos desde config.json y pintar el contenido
  try {
    CONFIG = await cargarConfig();
    loadData();
    if (CONFIG.audioFile) {
      musicAudio = new Audio(CONFIG.audioFile);
      musicAudio.loop = true;
      musicAudio.volume = 0.8;
    }
    initCountdownLocal(CONFIG.fechaISO, updateCountdown);
  } catch (err) {
    console.error('❌ No se pudo cargar config.json:', err);
    mostrarErrorConfig();
  }

  // 6. Juego (no depende de config.json)
  initJuego();

  // 7. Mostrar portal
  setTimeout(() => {
    elements.portal.style.opacity = '1';
  }, 100);
}

function mostrarErrorConfig() {
  // Deja huella visible en vez de fallar en silencio: sin config.json
  // no hay nombres, fechas ni lugares reales que mostrar.
  if (elements.nombreHero) elements.nombreHero.textContent = '(falta config.json)';
  console.warn('⚠️ Crea un config.json en la raíz del proyecto (ver config.example.json) con tus datos reales. No se suben al repo por privacidad.');
}

// ============================================================
// CARGA DE DATOS (100% desde config.json, nada hardcodeado)
// ============================================================

function loadData() {
  // Nombre, fecha y frase
  if (elements.nombreHero && CONFIG.nombre) {
    elements.nombreHero.textContent = CONFIG.nombre;
  }
  if (elements.fechaFija && CONFIG.fechaTexto) {
    elements.fechaFija.textContent = CONFIG.fechaTexto;
  }
  if (elements.fraseInvitacion) {
    elements.fraseInvitacion.textContent = CONFIG.frase ?? '';
  }
  document.title = `Invitación XV - ${CONFIG.nombre ?? ''}`;

  // Papá / Madre
  elements.padre1.textContent = CONFIG.padre;
  elements.padre2.textContent = CONFIG.madre;
  elements.padre1Modal.textContent = CONFIG.padre;
  elements.padre2Modal.textContent = CONFIG.madre;

  // Padrino / Madrina
  elements.padrino1.textContent = CONFIG.padrino;
  elements.padrino2.textContent = CONFIG.madrina;
  elements.padrino1Modal.textContent = CONFIG.padrino;
  elements.padrino2Modal.textContent = CONFIG.madrina;

  // Ceremonia (misa)
  elements.horaCeremonia.textContent = CONFIG.horaMisa;
  elements.lugarCeremonia.textContent = CONFIG.ubicacionMisa;
  elements.horaCeremoniaModal.textContent = CONFIG.horaMisa;
  elements.lugarCeremoniaModal.textContent = CONFIG.ubicacionMisa;
  if (elements.mapaCeremonia) elements.mapaCeremonia.href = CONFIG.mapaMisa;
  if (elements.mapaCeremoniaModal) elements.mapaCeremoniaModal.href = CONFIG.mapaMisa;

  // Fiesta
  elements.horaFiesta.textContent = CONFIG.horaFiesta;
  elements.lugarFiesta.textContent = CONFIG.ubicacionFiesta;
  elements.horaFiestaModal.textContent = CONFIG.horaFiesta;
  elements.lugarFiestaModal.textContent = CONFIG.ubicacionFiesta;
  elements.mapaFiesta.href = CONFIG.mapaFiesta;
  elements.mapaFiestaModal.href = CONFIG.mapaFiesta;
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
    musicAudio?.pause();
    elements.btnMusica.dataset.playing = 'false';
    elements.btnMusica.style.opacity = '0.6';
  } else {
    playSound('music-start');
    musicAudio?.play().catch(() => {});
    elements.btnMusica.dataset.playing = 'true';
    elements.btnMusica.style.opacity = '1';
  }
}

// ============================================================
// COUNTDOWN (implementación local: contador.js real usa otros IDs
// #d/#h/#m/#s y no acepta callback, así que aquí manejamos nuestro
// propio timer compatible con el HTML actual)
// ============================================================

function initCountdownLocal(fechaISO, callback) {
  const target = new Date(fechaISO).getTime();
  if (isNaN(target)) {
    console.error('❌ fechaFiesta inválida en config.json:', fechaISO);
    return;
  }
  function tick() {
    const diff = Math.max(0, target - Date.now());
    const dias = Math.floor(diff / 86400000);
    const horas = Math.floor((diff % 86400000) / 3600000);
    const minutos = Math.floor((diff % 3600000) / 60000);
    const segundos = Math.floor((diff % 60000) / 1000);
    callback(dias, horas, minutos, segundos);
  }
  tick();
  setInterval(tick, 1000);
}

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
