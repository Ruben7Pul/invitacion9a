console.log('📦 música');

let audio = null;
let config = null;
const muteBtn = document.getElementById('music-toggle');

const iconSound = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
  <path d="M4 9 L4 15 L8 15 L13 20 L13 4 L8 9 Z"/>
  <path d="M16.5 8.5 a6 6 0 0 1 0 7"/>
  <path d="M19 6 a10 10 0 0 1 0 12"/>
</svg>`;
const iconMute = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
  <path d="M4 9 L4 15 L8 15 L13 20 L13 4 L8 9 Z"/>
  <line x1="17" y1="7" x2="22" y2="12"/>
  <line x1="22" y1="7" x2="17" y2="12"/>
  <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" stroke-width="1.2"/>
</svg>`;

export function initMusica(cfg) {
  config = cfg;
  audio = new Audio(config.audioFile);
  audio.loop = true;
  audio.volume = 0.8;
  audio.addEventListener('error', (e) => {
    console.warn('⚠️ Error audio:', e);
    if (muteBtn) { muteBtn.style.opacity = '0.3'; muteBtn.title = 'Error'; }
  });
  audio.load();
  if (muteBtn) {
    muteBtn.style.opacity = '1';
    muteBtn.innerHTML = iconSound;
    muteBtn.title = 'Silenciar música';
    // Asegurar que el evento click esté correctamente asignado
    muteBtn.removeEventListener('click', toggleMusic); // evitar duplicados
    muteBtn.addEventListener('click', toggleMusic);
  }
}

export function playMusic() {
  if (!audio) return;
  if (!audio.paused) return;
  audio.play().catch(() => {});
  if (muteBtn) {
    muteBtn.innerHTML = iconSound;
    muteBtn.title = 'Silenciar música';
  }
}

export function resetMusic() {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  if (muteBtn) {
    muteBtn.innerHTML = iconSound;
    muteBtn.title = 'Silenciar música';
  }
}

export function toggleMusic() {
  if (!audio) return;
  if (audio.paused) {
    audio.play().catch(() => {});
    if (muteBtn) {
      muteBtn.innerHTML = iconSound;
      muteBtn.title = 'Silenciar música';
    }
  } else {
    audio.pause();
    if (muteBtn) {
      muteBtn.innerHTML = iconMute;
      muteBtn.title = 'Activar música';
    }
  }
}
