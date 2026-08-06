console.log('🎵 goga música 23 (con autoplay persistente y reinicio)');

let audio = null;
let fadeInterval = null;
let isMuted = false;
let autoplayPending = false;
let autoplayListenerAdded = false;
let healthCheckInterval = null;
let retryTimeout = null;
let retryCount = 0;

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
  const btn = document.getElementById('mute-btn');
  if (btn) return btn;
  const btn2 = document.getElementById('music-toggle');
  if (btn2) return btn2;
  return document.querySelector('.pause-mute-btn');
}

export function updateIcon(soundOn) {
  const btn = getMuteBtn();
  if (!btn) return;
  if (soundOn) {
    btn.innerHTML = '🔊';
    btn.title = 'Silenciar música';
  } else {
    btn.innerHTML = '🔇';
    btn.title = 'Activar música';
  }
}
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

function setupPersistentAutoplayListener() {
  if (autoplayListenerAdded) return;
  autoplayListenerAdded = true;

  const handler = () => {
    if (audio && audio.paused && !isMuted) {
      const ok = tryPlay();
      if (ok) {
        fadeVolume(0.6, 800);
        isMuted = false;
        updateIcon(true);
        autoplayPending = false;
        console.log('🎵 Música activada por interacción del usuario (persistente)');
        startHealthCheck();
      }
    }
  };

  document.addEventListener('click', handler);
  document.addEventListener('touchstart', handler);
  console.log('🔊 Listener de autoplay persistente configurado');
}

function createAudio(src) {
  const el = new Audio(src);
  el.loop = true;
  el.volume = 0;
  el.preload = 'auto';
  return el;
}

// ========== MONITOR DE SALUD ==========
let lastCheckTime = 0;
let lastCurrentTime = 0;
let consecutiveFailures = 0;

function startHealthCheck() {
  if (healthCheckInterval) clearInterval(healthCheckInterval);
  if (!audio) return;
  lastCheckTime = performance.now();
  lastCurrentTime = audio.currentTime || 0;
  consecutiveFailures = 0;

  healthCheckInterval = setInterval(() => {
    if (!audio) return;
    if (audio.paused && !autoplayPending) return;

    const now = performance.now();
    const timeSinceLastCheck = (now - lastCheckTime) / 1000;
    const currentTime = audio.currentTime || 0;
    const timeDiff = currentTime - lastCurrentTime;

    if (!audio.paused && timeSinceLastCheck > 2 && timeDiff < 0.01) {
      consecutiveFailures++;
      console.warn(`⚠️ Audio estancado (${consecutiveFailures})`);
      if (consecutiveFailures >= 2) {
        console.log('🔄 Reiniciando audio por corte');
        restartAudio();
        consecutiveFailures = 0;
      }
    } else {
      consecutiveFailures = 0;
    }

    lastCheckTime = now;
    lastCurrentTime = currentTime;
  }, 3000);
}

function stopHealthCheck() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
}

function restartAudio() {
  if (!audio) return;
  try {
    const wasMuted = isMuted || audio.volume === 0;
    if (fadeInterval) {
      clearInterval(fadeInterval);
      fadeInterval = null;
    }
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 0;
    audio.load();
    const ok = tryPlay();
    if (ok) {
      if (!wasMuted) {
        fadeVolume(0.6, 800);
        isMuted = false;
        updateIcon(true);
      } else {
        audio.volume = 0;
        isMuted = true;
        updateIcon(false);
      }
      console.log('🎵 Audio reiniciado exitosamente');
      startHealthCheck();
    } else {
      autoplayPending = true;
      setupPersistentAutoplayListener();
      console.log('⏳ Reinicio fallido, en espera de interacción');
    }
  } catch (e) {
    console.error('❌ Error al reiniciar audio:', e);
  }
}

function scheduleRetry() {
  if (retryTimeout) clearTimeout(retryTimeout);
  if (retryCount >= 5) {
    console.log('⚠️ Demasiados reintentos, activando listener persistente');
    setupPersistentAutoplayListener();
    return;
  }
  retryCount++;
  const delay = retryCount * 1000;
  console.log(`⏳ Reintento ${retryCount} en ${delay}ms...`);
  retryTimeout = setTimeout(() => {
    if (audio && audio.paused && !isMuted) {
      const ok = tryPlay();
      if (ok) {
        fadeVolume(0.6, 800);
        isMuted = false;
        updateIcon(true);
        autoplayPending = false;
        console.log('🎵 Música iniciada en reintento');
        startHealthCheck();
        retryCount = 0;
      } else {
        scheduleRetry();
      }
    }
  }, delay);
}

// ========== EXPORTADAS ==========
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

  audio.addEventListener('error', (e) => {
    console.warn('⚠️ Error en audio:', e);
    setTimeout(() => {
      if (audio) {
        audio.load();
        const ok = tryPlay();
        if (ok) {
          fadeVolume(0.6, 800);
          isMuted = false;
          updateIcon(true);
          startHealthCheck();
        }
      }
    }, 1000);
  });

  audio.addEventListener('ended', () => {
    if (audio && audio.loop) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  });

  audio.volume = 0;
  isMuted = false;
  updateIcon(true);
  stopHealthCheck();
  retryCount = 0;
}

export function playMusic() {
  console.log('🎵 playMusic() llamado');
  if (!audio) {
    console.warn('⚠️ audio no disponible');
    return;
  }
  if (!audio.paused) {
    console.log('🎵 El audio ya está sonando');
    startHealthCheck();
    return;
  }

  const ok = tryPlay();
  if (ok) {
    fadeVolume(0.6, 800);
    isMuted = false;
    updateIcon(true);
    autoplayPending = false;
    console.log('🎵 Música iniciada correctamente');
    startHealthCheck();
    retryCount = 0;
  } else {
    console.log('⏳ Autoplay bloqueado, activando listener persistente y reintentos');
    autoplayPending = true;
    setupPersistentAutoplayListener();
    scheduleRetry();
  }
}

export function resetMusic() {
  if (!audio) return;
  fadeVolume(0, 600);
  stopHealthCheck();
  if (retryTimeout) clearTimeout(retryTimeout);
  setTimeout(() => {
    audio.pause();
    audio.currentTime = 0;
  }, 700);
  isMuted = false;
  updateIcon(true);
  retryCount = 0;
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
        startHealthCheck();
      } else {
        autoplayPending = true;
        setupPersistentAutoplayListener();
        scheduleRetry();
      }
      return;
    }

    if (!isMuted && audio.volume > 0) {
      fadeVolume(0, 600);
      isMuted = true;
      updateIcon(false);
      stopHealthCheck();
      return;
    }

    if (isMuted || audio.volume === 0) {
      const ok = tryPlay();
      if (ok) {
        fadeVolume(0.6, 600);
        isMuted = false;
        updateIcon(true);
        startHealthCheck();
      } else {
        autoplayPending = true;
        setupPersistentAutoplayListener();
        scheduleRetry();
      }
      return;
    }

    isMuted = !isMuted;
    const targetVol = isMuted ? 0 : 0.6;
    fadeVolume(targetVol, 600);
    updateIcon(!isMuted);
    if (isMuted) stopHealthCheck();
    else startHealthCheck();
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
