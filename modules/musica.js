console.log('🎵 música simplificada (sin health-check, sin reintentos)');

let audio = null;
let isMuted = false;
const DEFAULT_AUDIO_SRC = '../archivos/cancion.mp3';

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

function tryPlay() {
  if (!audio) return false;
  if (!audio.paused) return true;
  return audio.play().then(() => true).catch(() => false);
}

export function initMusica(src) {
  if (src) audio = new Audio(src);
  else audio = new Audio(DEFAULT_AUDIO_SRC);
  audio.loop = true;
  audio.volume = 0.6;
  audio.preload = 'auto';
  document.body.appendChild(audio);
  isMuted = false;
  updateIcon(true);
}

export function playMusic() {
  if (!audio) return;
  if (!audio.paused) return;
  tryPlay();
}

export function resetMusic() {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  isMuted = false;
  updateIcon(true);
}

export function toggleMusic() {
  if (!audio) return;
  if (audio.paused) {
    tryPlay();
    isMuted = false;
    updateIcon(true);
  } else {
    audio.pause();
    isMuted = true;
    updateIcon(false);
  }
}

export function isMusicMuted() {
  return isMuted || (audio && audio.paused);
}
