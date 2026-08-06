console.log('🎵 goga música 24 (autoplay muteado + desmute en primer gesto)');

let audio = null;
let fadeInterval = null;
let isMuted = false;
let sonidoActivado = false; // true en cuanto el usuario ya desmuteó una vez
let gestureListenerAdded = false;
let healthCheckInterval = null;

const VOLUMEN_OBJETIVO = 0.6;
const DEFAULT_AUDIO_SRC = '../archivos/cancion.mp3';
let audioSrc = DEFAULT_AUDIO_SRC;

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

function createAudio(src) {
  const el = new Audio(src);
  el.loop = true;
  el.volume = VOLUMEN_OBJETIVO;
  el.muted = true; // el autoplay MUTEADO siempre está permitido por el navegador
  el.preload = 'auto';
  return el;
}

// Intenta que el audio quede sonando (aunque sea muteado) desde ya, para que
// en cuanto haya un gesto del usuario solo haya que quitar el mute (instantáneo,
// sin esperar a una promesa de play() que puede fallar).
function intentarAutoplayMuteado() {
  if (!audio) return;
  audio.muted = true;
  const p = audio.play();
  if (p && p.catch) p.catch(() => {});
}

// Se llama SIEMPRE dentro de un handler de gesto real del usuario (click,
// touchstart, keydown...), que es la única forma en que el navegador permite
// que el sonido se escuche de verdad.
function activarSonidoReal() {
  if (!audio) return false;
  sonidoActivado = true;
  audio.muted = false;
  if (audio.paused) {
    const p = audio.play();
    if (p && p.catch) p.catch(() => {});
  }
  if (!isMuted) {
    fadeVolume(VOLUMEN_OBJETIVO, 800);
  }
  startHealthCheck();
  return true;
}

function setupGestureListener() {
  if (gestureListenerAdded) return;
  gestureListenerAdded = true;

  const handler = () => {
    if (sonidoActivado) return; // ya no hace falta seguir escuchando
    if (!isMuted) {
      activarSonidoReal();
      updateIcon(true);
      console.log('🎵 Música activada por gesto del usuario');
    } else {
      // El usuario había mutado antes de interactuar: solo dejamos listo
      // el audio (ya está sonando muteado) para cuando la active.
      sonidoActivado = true;
    }
  };

  document.addEventListener('click', handler);
  document.addEventListener('touchstart', handler, { passive: true });
  document.addEventListener('keydown', handler);
  console.log('🔊 Escuchando el primer gesto del usuario para activar el sonido');
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
    if (audio.paused || audio.muted) return;

    const now = performance.now();
    const timeSinceLastCheck = (now - lastCheckTime) / 1000;
    const currentTime = audio.currentTime || 0;
    const timeDiff = currentTime - lastCurrentTime;

    if (timeSinceLastCheck > 2 && timeDiff < 0.01) {
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
    const mutedAntes = audio.muted;
    const volumenAntes = audio.volume;
    if (fadeInterval) {
      clearInterval(fadeInterval);
      fadeInterval = null;
    }
    audio.pause();
    audio.currentTime = 0;
    audio.muted = true;
    audio.load();
    const p = audio.play();
    const finalizar = () => {
      audio.muted = mutedAntes;
      audio.volume = volumenAntes;
      console.log('🎵 Audio reiniciado exitosamente');
      if (!audio.muted) startHealthCheck();
    };
    if (p && p.then) p.then(finalizar).catch(finalizar);
    else finalizar();
  } catch (e) {
    console.error('❌ Error al reiniciar audio:', e);
  }
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
    audio.src = audioSrc;
    audio.load();
    audio.loop = true;
    audio.volume = VOLUMEN_OBJETIVO;
    audio.muted = true;
  }

  audio.addEventListener('error', (e) => {
    console.warn('⚠️ Error en audio:', e);
    setTimeout(() => {
      if (audio) {
        audio.load();
        intentarAutoplayMuteado();
      }
    }, 1000);
  });

  audio.addEventListener('ended', () => {
    if (audio && audio.loop) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  });

  isMuted = false;
  sonidoActivado = false;
  updateIcon(true);
  stopHealthCheck();

  // Arranca ya mismo, muteado (siempre permitido), listo para desmutear
  // en cuanto haya el primer click/touch/tecla del usuario.
  intentarAutoplayMuteado();
  setupGestureListener();
}

export function playMusic() {
  console.log('🎵 playMusic() llamado');
  if (!audio) {
    console.warn('⚠️ audio no disponible');
    return;
  }
  intentarAutoplayMuteado();
  setupGestureListener();
}

export function resetMusic() {
  if (!audio) return;
  fadeVolume(0, 600);
  stopHealthCheck();
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
    if (isMuted) {
      // Reactivar
      isMuted = false;
      if (sonidoActivado) {
        audio.muted = false;
        if (audio.paused) {
          const p = audio.play();
          if (p && p.catch) p.catch(() => {});
        }
        fadeVolume(VOLUMEN_OBJETIVO, 600);
        startHealthCheck();
      }
      updateIcon(true);
      return;
    }

    // Silenciar
    isMuted = true;
    if (sonidoActivado) {
      fadeVolume(0, 600);
      setTimeout(() => { if (audio && isMuted) audio.muted = true; }, 650);
      stopHealthCheck();
    }
    updateIcon(false);
  } catch (e) {
    console.error('❌ Error en toggleMusic:', e);
  }
}

export function isMusicMuted() {
  return isMuted;
}

export function setMusicMute(muted) {
  if (muted === isMuted) return;
  toggleMusic();
}
