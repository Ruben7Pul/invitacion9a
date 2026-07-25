// musica.js - Música con iframe directo (sin API)
console.log('📦 módulo musica.js cargado');

let iframe = null;
let config = null;

export function initMusica(cfg) {
  config = cfg;
  console.log('🎵 Inicializando música con iframe...');
  iframe = document.getElementById('yt-audio');
  if (!iframe) {
    console.warn('⚠️ No existe #yt-audio, creando uno...');
    iframe = document.createElement('iframe');
    iframe.id = 'yt-audio';
    iframe.style.cssText = 'position:fixed; width:1px; height:1px; opacity:0; pointer-events:none; bottom:0; left:0;';
    document.body.appendChild(iframe);
  }
  iframe.src = `https://www.youtube.com/embed/${config.youtubeId}?autoplay=0&mute=1&loop=1&playlist=${config.youtubeId}&controls=0&disablekb=1`;
  console.log('✅ Iframe configurado con src:', iframe.src);
}

export function playMusic() {
  console.log('▶️ playMusic() llamado');
  if (!iframe) {
    console.warn('⚠️ iframe no existe, reiniciando...');
    initMusica(config);
  }
  if (!iframe) return;
  iframe.src = `https://www.youtube.com/embed/${config.youtubeId}?autoplay=1&mute=0&loop=1&playlist=${config.youtubeId}&controls=0&disablekb=1`;
  document.getElementById('music-toggle').classList.remove('pulse');
  console.log('🎵 Música activada (autoplay=1, mute=0)');
}

export function toggleMusic() {
  console.log('🔊 toggleMusic() llamado');
  if (!iframe) return;
  const isMuted = iframe.src.includes('mute=1');
  if (isMuted) {
    iframe.src = iframe.src.replace('mute=1', 'mute=0').replace('autoplay=0', 'autoplay=1');
    document.getElementById('music-toggle').style.opacity = '1';
    document.getElementById('music-toggle').classList.add('pulse');
  } else {
    iframe.src = iframe.src.replace('mute=0', 'mute=1').replace('autoplay=1', 'autoplay=0');
    document.getElementById('music-toggle').style.opacity = '0.5';
    document.getElementById('music-toggle').classList.remove('pulse');
  }
}
