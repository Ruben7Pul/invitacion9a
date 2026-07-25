console.log('📦 música (toggle corregido)');

let audio = null;
let config = null;

export function initMusica(cfg) {
  config = cfg;
  audio = new Audio(config.audioFile);
  audio.loop = true;
  audio.volume = 0.8;
  audio.load();
  console.log('🎵 Audio cargado:', config.audioFile);
}

export function playMusic() {
  if (!audio) return;
  if (!audio.paused) return;
  audio.play().catch(() => {});
}

export function toggleMusic() {
  if (!audio) return;
  if (audio.paused) {
    audio.play();
    document.getElementById('music-toggle').style.opacity = '1';
    console.log('🔊 Música activada');
  } else {
    audio.pause();
    document.getElementById('music-toggle').style.opacity = '0.5';
    console.log('🔇 Música pausada');
  }
}
