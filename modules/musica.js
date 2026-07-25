console.log('📦 música');

let audio = null;
let config = null;

export function initMusica(cfg) {
  config = cfg;
  audio = new Audio(config.audioFile);
  audio.loop = true;
  audio.volume = 0.8;
  audio.load();
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
  } else {
    audio.pause();
    document.getElementById('music-toggle').style.opacity = '0.5';
  }
}
