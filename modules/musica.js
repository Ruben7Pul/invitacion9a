// musica.js - Control de música con iframe directo (sin API)
let iframe = null;
let musicMuted = true;

export function initMusica(config) {
  // Crear iframe oculto
  iframe = document.createElement('iframe');
  iframe.id = 'yt-audio';
  iframe.src = `https://www.youtube.com/embed/${config.youtubeId}?autoplay=0&mute=1&loop=1&playlist=${config.youtubeId}&controls=0&disablekb=1`;
  iframe.style.cssText = 'position:fixed; width:1px; height:1px; opacity:0; pointer-events:none; bottom:0; left:0;';
  document.body.appendChild(iframe);
}

export function playMusic() {
  if (!iframe) return;
  // Forzar recarga del iframe con autoplay y unmute
  iframe.src = iframe.src.replace('autoplay=0&mute=1', 'autoplay=1&mute=0');
  musicMuted = false;
  document.getElementById('music-toggle').classList.remove('pulse');
}

export function toggleMusic() {
  if (!iframe) return;
  musicMuted = !musicMuted;
  if (musicMuted) {
    iframe.src = iframe.src.replace('autoplay=1&mute=0', 'autoplay=0&mute=1');
    document.getElementById('music-toggle').style.opacity = '0.5';
    document.getElementById('music-toggle').classList.remove('pulse');
  } else {
    iframe.src = iframe.src.replace('autoplay=0&mute=1', 'autoplay=1&mute=0');
    document.getElementById('music-toggle').style.opacity = '1';
    document.getElementById('music-toggle').classList.add('pulse');
  }
}
