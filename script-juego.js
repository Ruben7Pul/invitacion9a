// ============================================================
// script-juego.js – SCRIPT DEL JUEGO (independiente)
// ============================================================
console.log('🎮 script-juego 12.js cargado');

const isMobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// script-juego.js se ejecuta ahora desde /juego1/index.html, por lo que
// config.json y los archivos de audio viven un nivel arriba ("../").
async function cargarConfig() {
  try {
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
      madrina: 'Madrina',
      audioFile: '../archivos/cancion.mp3'
    };
  }
}

(async function init() {
  try {
    const config = await cargarConfig();
    const { initJuego } = await import('./modules/juego.js');
    initJuego(config, isMobile);
    console.log('✅ Juego iniciado correctamente');
  } catch (e) {
    console.error('❌ Error al iniciar el juego:', e);
    // Mostrar error en pantalla
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


//
