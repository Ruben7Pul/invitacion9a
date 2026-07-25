// musica.js - Reproducción de audio local (archivo .mp3)
console.log('📦 módulo musica.js cargado (versión local)');

let audio = null;
let config = null;
let musicMuted = false;

export function initMusica(cfg) {
  config = cfg;
  console.log('🎵 Inicializando audio local...');
  audio = new Audio(config.audioFile);
  audio.loop = true;
  audio.volume = 0.8;

  // Verificar si el archivo se carga correctamente
  audio.addEventListener('canplaythrough', () => {
    console.log('✅ Audio cargado y listo para reproducir');
  });

  audio.addEventListener('error', (e) => {
    console.error('❌ Error al cargar el audio:', e);
    console.warn('⚠️ Verifica que el archivo exista en:', config.audioFile);
  });

  // Precargar el audio
  audio.load();
  console.log('✅ Audio inicializado (ruta:', config.audioFile, ')');
}

export function playMusic() {
  console.log('▶️ playMusic() llamado (audio local)');
  if (!audio) {
    console.warn('⚠️ Audio no inicializado, reiniciando...');
    initMusica(config);
  }
  if (!audio) return;

  // Si ya está sonando, no hacer nada
  if (!audio.paused) {
    console.log('⏸️ El audio ya está sonando');
    return;
  }

  audio.play()
    .then(() => {
      console.log('🎵 Audio local reproduciéndose');
      document.getElementById('music-toggle').classList.remove('pulse');
      document.getElementById('music-toggle').style.opacity = '1';
    })
    .catch(err => {
      console.error('❌ Error al reproducir audio:', err);
      // Si falla, mostramos un mensaje en la consola
      console.warn('⚠️ Es posible que el navegador bloquee la reproducción automática. Haz clic en el botón de música.');
    });
}

export function toggleMusic() {
  console.log('🔊 toggleMusic() llamado (audio local)');
  if (!audio) return;

  if (audio.paused) {
    // Reproducir
    audio.play()
      .then(() => {
        document.getElementById('music-toggle').style.opacity = '1';
        document.getElementById('music-toggle').classList.add('pulse');
        console.log('▶️ Audio reanudado');
      })
      .catch(err => console.error('Error al reanudar:', err));
  } else {
    // Pausar
    audio.pause();
    document.getElementById('music-toggle').style.opacity = '0.5';
    document.getElementById('music-toggle').classList.remove('pulse');
    console.log('⏸️ Audio pausado');
  }
}

// Función para silenciar/desilenciar (opcional)
export function muteMusic() {
  if (!audio) return;
  audio.muted = !audio.muted;
  musicMuted = audio.muted;
  console.log(musicMuted ? '🔇 Audio silenciado' : '🔊 Audio desilenciado');
}
