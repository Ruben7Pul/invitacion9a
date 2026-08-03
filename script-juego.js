// ============================================================
// script-juego.js – SCRIPT PRINCIPAL DEL JUEGO
// ============================================================
console.log('🎮 script-juego.js cargado');

// Detectar móvil
const isMobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// Cargar configuración
async function cargarConfig() {
  try {
    const res = await fetch('config.json');
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
      audioFile: 'archivos/cancion.mp3'
    };
  }
}

// Iniciar juego
(async function init() {
  const config = await cargarConfig();
  try {
    const { initJuego } = await import('./modules/juego.js');
    initJuego(config, isMobile);
    console.log('✅ Juego iniciado correctamente');
  } catch (e) {
    console.error('❌ Error al iniciar el juego:', e);
    document.body.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:center; height:100vh; background:#0e0a18; color:#ff6b6b; font-family:'Cinzel',serif; text-align:center; padding:2rem;">
        <div>
          <h2 style="color:#d4af37;">❌ Error al cargar el juego</h2>
          <p style="color:#fae3a0; margin-top:1rem;">Revisa la consola para más detalles.</p>
          <p style="color:#888; font-size:0.8rem; margin-top:0.5rem;">${e.message}</p>
        </div>
      </div>
    `;
  }
})();
