console.log('🎵 goga música 23 (con fade, mute y rutas personalizadas)');

let audio = null;
let fadeInterval = null;
let isMuted = false;
let autoplayPending = false;
let autoplayListenerAdded = false;

const DEFAULT_AUDIO_SRC = '../archivos/cancion.mp3';
let audioSrc = DEFAULT_AUDIO_SRC;

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

export function updateIcon(soundOn) {
  const btn = getMuteBtn();
  if (!btn) return;
  if (soundOn) {
    btn.innerHTML = iconSound;
    btn.title = 'Silenciar música';
  } else {
    btn.innerHTML = iconMute;
    btn.title = 'Activar música';
  }
}

// Exponer updateIcon globalmente para que otros módulos lo usen
window.updateIcon = updateIcon;

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

function tryPlay() {
  if (!audio) return false;
  if (!audio.paused) return true;
  return audio.play().then(() => true).catch(() => false);
}

function setupAutoplayListener() {
  if (autoplayListenerAdded) return;
  autoplayListenerAdded = true;

  const handler = () => {
    if (autoplayPending) {
      const ok = tryPlay();
      if (ok) {
        fadeVolume(0.6, 800);
        isMuted = false;
        updateIcon(true);
        autoplayPending = false;
        document.removeEventListener('click', handler);
        document.removeEventListener('touchstart', handler);
        console.log('🎵 Música activada por interacción del usuario');
      }
    }
  };

  document.addEventListener('click', handler);
  document.addEventListener('touchstart', handler);
  console.log('🔊 Listener de autoplay configurado');
}

function createAudio(src) {
  const el = new Audio(src);
  el.loop = true;
  el.volume = 0;
  el.preload = 'auto';
  return el;
}

export function initMusica(src) {
  if (src) audioSrc = src;
  console.log('🎵 Iniciando música con ruta:', audioSrc);

  audio = document.getElementById('bg-music');
  if (!audio) {
    audio = createAudio(audioSrc);
    document.body.appendChild(audio);
  } else {
    console.log('🎵 Elemento <audio> encontrado. Forzando actualización a:', audioSrc);
    audio.src = audioSrc;
    audio.load();
    audio.loop = true;
  }

  audio.volume = 0;
  isMuted = false;
  updateIcon(true);
}

export function playMusic() {
  console.log('🎵 playMusic() llamado');
  if (!audio) {
    console.warn('⚠️ audio no disponible');
    return;
  }
  if (!audio.paused) {
    console.log('🎵 El audio ya está sonando');
    return;
  }

  const ok = tryPlay();
  if (ok) {
    fadeVolume(0.6, 800);
    isMuted = false;
    updateIcon(true);
    autoplayPending = false;
    console.log('🎵 Música iniciada correctamente');
  } else {
    console.log('⏳ Autoplay bloqueado, esperando interacción del usuario');
    autoplayPending = true;
    setupAutoplayListener();
  }
}

export function resetMusic() {
  if (!audio) return;
  fadeVolume(0, 600);
  setTimeout(() => {
    audio.pause();
    audio.currentTime = 0;
  }, 700);
  isMuted = false;
  updateIcon(true);
}

export function toggleMusic() {
  if (!audio) return;
  try {
    if (audio.paused) {
      const ok = tryPlay();
      if (ok) {
        fadeVolume(0.6, 600);
        isMuted = false;
        updateIcon(true);
      } else {
        autoplayPending = true;
        setupAutoplayListener();
      }
      return;
    }

    if (!isMuted && audio.volume > 0) {
      fadeVolume(0, 600);
      isMuted = true;
      updateIcon(false);
      return;
    }

    if (isMuted || audio.volume === 0) {
      const ok = tryPlay();
      if (ok) {
        fadeVolume(0.6, 600);
        isMuted = false;
        updateIcon(true);
      } else {
        autoplayPending = true;
        setupAutoplayListener();
      }
      return;
    }

    isMuted = !isMuted;
    const targetVol = isMuted ? 0 : 0.6;
    fadeVolume(targetVol, 600);
    updateIcon(!isMuted);
  } catch (e) {
    console.error('❌ Error en toggleMusic:', e);
  }
}

export function isMusicMuted() {
  return isMuted || (audio && audio.volume === 0);
}

export function setMusicMute(muted) {
  if (muted === isMuted) return;
  toggleMusic();
}
