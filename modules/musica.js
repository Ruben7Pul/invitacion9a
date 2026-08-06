console.log('📦 música (con fade y mute corregido)');

let audio = null;
let fadeInterval = null;
let isMuted = false;

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

function getMuteBtn() {
  const btn = document.getElementById('music-toggle');
  if (btn) return btn;
  return document.querySelector('.pause-mute-btn');
}

function fadeVolume(targetVolume, duration = 800) {
  if (!audio) return;
  if (fadeInterval) clearInterval(fadeInterval);
  const startVolume = audio.volume;
  const startTime = performance.now();
  const diff = targetVolume - startVolume;

  fadeInterval = setInterval(() => {
    const elapsed = (performance.now() - startTime) / duration;
    const progress = Math.min(elapsed, 1);
    const eased = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    audio.volume = startVolume + diff * eased;
    if (progress >= 1) {
      clearInterval(fadeInterval);
      fadeInterval = null;
      audio.volume = targetVolume;
    }
  }, 16);
}

export function initMusica(cfg) {
  audio = document.getElementById('bg-music');
  if (!audio) {
    audio = new Audio(cfg.audioFile || '../archivos/cancion1.mp3');
    audio.loop = true;
    document.body.appendChild(audio);
  }
  audio.volume = 0;
  audio.addEventListener('error', (e) => {
    console.warn('⚠️ Error audio:', e);
  });
  // Solo se prepara/precarga aquí. NO se reproduce todavía:
  // reproducirlo desde el inicio hacía que a veces sonara al mismo
  // tiempo que el audio del video de transición. playMusic() es quien
  // lo arranca, y ya se llama justo cuando el video termina.
  audio.load();
  const btn = getMuteBtn();
  if (btn) {
    btn.innerHTML = iconSound;
    btn.title = 'Silenciar música';
  }
}

export function playMusic() {
  if (!audio) return;
  if (audio.paused) {
    audio.play().catch(() => {});
    fadeVolume(0.6, 800);
  }
  const btn = getMuteBtn();
  if (btn) {
    btn.innerHTML = iconSound;
    btn.title = 'Silenciar música';
  }
  isMuted = false;
}

export function resetMusic() {
  if (!audio) return;
  fadeVolume(0, 600);
  setTimeout(() => {
    audio.pause();
    audio.currentTime = 0;
  }, 700);
  const btn = getMuteBtn();
  if (btn) {
    btn.innerHTML = iconSound;
    btn.title = 'Silenciar música';
  }
  isMuted = false;
}

export function toggleMusic() {
  if (!audio) return;
  const btn = getMuteBtn();
  
  // Si está silenciado o con volumen 0, lo activamos
  if (isMuted || audio.volume === 0) {
    // Desmutear
    if (audio.paused) audio.play().catch(() => {});
    fadeVolume(0.6, 600);
    isMuted = false;
    if (btn) {
      btn.innerHTML = iconSound;
      btn.title = 'Silenciar música';
    }
  } else {
    // Silenciar
    fadeVolume(0, 600);
    isMuted = true;
    if (btn) {
      btn.innerHTML = iconMute;
      btn.title = 'Activar música';
    }
  }
}

export function isMusicMuted() {
  return isMuted || (audio && audio.volume === 0);
}

export function setMusicMute(muted) {
  if (muted === isMuted) return;
  toggleMusic();
}
