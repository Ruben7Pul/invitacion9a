// musica.js - Control de música de YouTube
let ytPlayer = null;
let ytReady = false;
let musicMuted = true;
let config = null;

export function initMusica(cfg) {
  config = cfg;
  // El reproductor se crea desde el script de YouTube (onYouTubeIframeAPIReady)
  window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('yt-audio', {
      height: '1',
      width: '1',
      videoId: config.youtubeId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        loop: 1,
        playlist: config.youtubeId,
        playsinline: 1
      },
      events: {
        onReady: () => { ytReady = true; },
        onError: () => console.warn('YouTube error')
      }
    });
  };
  // Si la API ya se cargó, llamarla directamente
  if (typeof YT !== 'undefined' && YT.loaded) {
    window.onYouTubeIframeAPIReady();
  }
}

export function playMusic() {
  if (ytReady && ytPlayer) {
    try {
      ytPlayer.playVideo();
      musicMuted = false;
      document.getElementById('music-toggle').classList.remove('pulse');
    } catch (e) {}
  } else {
    setTimeout(playMusic, 300);
  }
}

export function toggleMusic() {
  if (!ytPlayer) return;
  musicMuted = !musicMuted;
  if (musicMuted) {
    ytPlayer.mute();
    document.getElementById('music-toggle').style.opacity = '0.5';
    document.getElementById('music-toggle').classList.remove('pulse');
  } else {
    ytPlayer.unMute();
    ytPlayer.playVideo();
    document.getElementById('music-toggle').style.opacity = '1';
    document.getElementById('music-toggle').classList.add('pulse');
  }
}
