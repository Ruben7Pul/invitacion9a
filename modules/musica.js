console.log('📦 música (con fade)');

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
  // Buscar en el header y en el modal de pausa
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
    // easing suave (cubic)
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
    audio = new Audio(cfg.audioFile);
    audio.loop = true;
    document.body.appendChild(audio);
  }
  audio.volume = 0; // iniciar en silencio para hacer fade in
  audio.addEventListener('error', (e) => {
    console.warn('⚠️ Error audio:', e);
  });
  audio.load();
  // Reproducir automáticamente (el navegador puede bloquearlo, se intenta)
  audio.play().catch(() => {});
  // Fade in al cargar (después de 200ms para que el navegador lo procese)
  setTimeout(() => {
    if (audio.paused) audio.play().catch(() => {});
    fadeVolume(0.8, 1000);
  }, 300);
  // Actualizar icono del botón de mute
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
    fadeVolume(0.8, 800);
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
  if (audio.paused) {
    audio.play().catch(() => {});
    fadeVolume(0.8, 800);
    if (btn) {
      btn.innerHTML = iconSound;
      btn.title = 'Silenciar música';
    }
    isMuted = false;
  } else {
    if (audio.volume > 0.1) {
      // Si está sonando, silenciar con fade out
      fadeVolume(0, 600);
      if (btn) {
        btn.innerHTML = iconMute;
        btn.title = 'Activar música';
      }
      isMuted = true;
      // No pausamos, solo bajamos el volumen para que reanude rápido
    } else {
      // Si ya estaba silenciado, reanudar
      fadeVolume(0.8, 800);
      if (btn) {
        btn.innerHTML = iconSound;
        btn.title = 'Silenciar música';
      }
      isMuted = false;
    }
  }
}

export function isMusicMuted() {
  return isMuted || audio?.volume === 0;
}

export function setMusicMute(muted) {
  if (muted === isMuted) return;
  toggleMusic();
}
