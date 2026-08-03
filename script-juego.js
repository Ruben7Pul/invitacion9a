console.log('🎮 script-juego.js (independiente)');

// Cargar configuración desde archivo
const config = await fetch('config.json')
  .then(r => r.json())
  .catch(() => {
    console.warn('⚠️ Usando configuración por defecto');
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
  });

// Importar e iniciar el juego
const { initJuego } = await import('./modules/juego.js');
const isMobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
initJuego(config, isMobile);
