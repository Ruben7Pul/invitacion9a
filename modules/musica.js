console.log('📦 música');

let audio = null;
let config = null;

export function initMusica(cfg) {
  config = cfg;
  audio = new Audio(config.audioFile);
  audio.loop = true;
  audio.volume = 0.8;
  audio.addEventListener('error', (e) => {
    console.warn('⚠️ Error al cargar el audio:', e);
    // Mostrar un mensaje visual (opcional)
    const toggle = document.getElementById('music-toggle');
    if (toggle) toggle.style.opacity = '0.3';
  });
  audio.load();
  const toggle = document.getElementById('music-toggle');
  if (toggle) toggle.style.opacity = '1';
  console.log('🎵 Audio cargado:', config.audioFile);
}

export function playMusic() {
  if (!audio) return;
  if (!audio.paused) return;
  audio.play().catch(() => {});
  document.getElementById('music-toggle').style.opacity = '1';
}

export function resetMusic() {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  document.getElementById('music-toggle').style.opacity = '1';
  console.log('⏹️ Música reiniciada y pausada');
}

export function toggleMusic() {
  if (!audio) return;
  if (audio.paused) {
    audio.play().catch(() => {});
    document.getElementById('music-toggle').style.opacity = '1';
  } else {
    audio.pause();
    document.getElementById('music-toggle').style.opacity = '0.5';
  }
}
