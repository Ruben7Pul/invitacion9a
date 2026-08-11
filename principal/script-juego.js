// ============================================================
// script-juego.js – SCRIPT DEL JUEGO (con control de versión y reseteo de puntuaciones)
// ============================================================
console.log('🎮 script-juego.js cargado');

// ===== VERSIÓN MANUAL: ¡CAMBIA ESTE NÚMERO CON CADA ACTUALIZACIÓN DEL JUEGO! =====
const VERSION = '1';  // Cambia a '2', '3', etc. para forzar actualización Y resetear puntuaciones

// ===== FUNCIÓN PARA RESETEAR PUNTUACIONES SI LA VERSIÓN CAMBIÓ =====
function checkAndResetScores() {
  try {
    const savedVersion = localStorage.getItem('gameVersion');
    if (savedVersion !== VERSION) {
      // La versión cambió: borramos las puntuaciones antiguas
      localStorage.removeItem('highscores');
      localStorage.setItem('gameVersion', VERSION);
      console.log(`🔄 Versión del juego actualizada a ${VERSION}. Puntuaciones reiniciadas.`);
    } else {
      console.log(`✅ Versión del juego ${VERSION} coincide. Puntuaciones intactas.`);
    }
  } catch (e) {
    console.warn('⚠️ No se pudo acceder a localStorage:', e);
  }
}

async function cargarConfig() {
  try {
    // config.json siempre se obtiene sin caché (timestamp)
    const res = await fetch(`../config.json?t=${Date.now()}`);
    if (!res.ok) throw new Error('HTTP error ' + res.status);
    const data = await res.json();
    if (!data.nombre) throw new Error('Falta "nombre"');
    return data;
  } catch (e) {
    console.warn('⚠️ Error cargando config.json:', e);
    return {
      nombre: 'Dania',
      fechaTexto: '24 de octubre de 2026',
      fechaISO: '2026-10-24T13:00:00',
      frase: 'Con la bendición de Dios...',
      horaMisa: '3:00 pm',
      ubicacionMisa: 'Iglesia',
      mapaMisa: '#',
      horaFiesta: '1:00 pm',
      ubicacionFiesta: 'Salón',
      mapaFiesta: '#',
      padre: 'Papá',
      madre: 'Mamá',
      padrino: 'Padrino',
      madrina: 'Madrina'
    };
  }
}

(async function init() {
  try {
    // 1. Verificar versión y resetear puntuaciones si es necesario
    checkAndResetScores();

    const config = await cargarConfig();
    
    // ===== IMPORTACIONES CON VERSIÓN (para romper caché) =====
    const { initMusica, playMusic, toggleMusic, isMusicMuted } = 
      await import(`./modules/musica.js?v=${VERSION}`);
    
    initMusica('../archivos/juegcan.mp3');
    window.toggleMusic = toggleMusic;
    window.isMusicMuted = isMusicMuted;

    // Intentar reproducir lo antes posible
    setTimeout(() => {
      if (playMusic) playMusic();
    }, 100);

    // Cargar juego
    const { initJuego } = await import(`./modules/juego.js?v=${VERSION}`);
    initJuego(config, false);
    console.log(`✅ Juego iniciado correctamente (versión ${VERSION})`);
  } catch (e) {
    console.error('❌ Error al iniciar el juego:', e);
    const body = document.body;
    body.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:center; height:100vh; background:#0e0a18; color:#ff6b6b; font-family:'Cinzel',serif; text-align:center; padding:2rem;">
        <div>
          <h2 style="color:#d4af37;">❌ Error al cargar el juego</h2>
          <p style="color:#fae3a0; margin-top:1rem;">Revisa la consola para más detalles.</p>
          <p style="color:#888; font-size:0.8rem; margin-top:0.5rem;">${e.message}</p>
          <button onclick="location.reload()" style="margin-top:1rem; padding:0.5rem 1.5rem; background:#d4af37; color:#0e0a18; border:none; border-radius:8px; font-family:'Cinzel',serif; cursor:pointer;">Recargar</button>
        </div>
      </div>
    `;
  }
})();
