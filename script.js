console.log('🚀 script.js');

let CONFIG = {};

async function cargarConfig() {
  try {
    const res = await fetch(`config.json?t=${Date.now()}`);
    CONFIG = await res.json();
    return CONFIG;
  } catch (e) {
    console.warn('⚠️ Fallback config');
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

function rellenarDatos(config) {
  document.getElementById('nombre-hero').textContent = config.nombre;
  document.getElementById('fecha-fija').textContent = config.fechaTexto;
  document.getElementById('frase-texto').textContent = config.frase;
  document.getElementById('hora-misa').textContent = config.horaMisa;
  document.getElementById('lugar-misa').textContent = config.ubicacionMisa;
  document.getElementById('mapa-misa').href = config.mapaMisa;
  document.getElementById('hora-fiesta').textContent = config.horaFiesta;
  document.getElementById('lugar-fiesta').textContent = config.ubicacionFiesta;
  document.getElementById('mapa-fiesta').href = config.mapaFiesta;
  document.getElementById('padre1').textContent = config.padre;
  document.getElementById('padre2').textContent = config.madre;
  document.getElementById('padrino1').textContent = config.padrino;
  document.getElementById('padrino2').textContent = config.madrina;
  document.title = `Mis XV años · ${config.nombre}`;
}

document.addEventListener('DOMContentLoaded', async () => {
  const config = await cargarConfig();
  window.CONFIG = config;
  rellenarDatos(config);

  // Cargar módulos
  try {
    const { initContador } = await import('./modules/contador.js');
    initContador(config);
  } catch (e) { console.error('❌ Contador:', e); }

  try {
    const { initSonidos } = await import('./modules/sonidos.js');
    initSonidos();
  } catch (e) { console.error('❌ Sonidos:', e); }

  try {
    const { initParticulas } = await import('./modules/particulas.js');
    initParticulas();
  } catch (e) { console.error('❌ Partículas:', e); }

  try {
    const { initModal } = await import('./modules/modal.js');
    initModal();
  } catch (e) { console.error('❌ Modal:', e); }

  try {
    const { initMusica, playMusic, toggleMusic } = await import('./modules/musica.js');
    initMusica(config);
    window.playMusic = playMusic;
    window.toggleMusic = toggleMusic;
  } catch (e) { console.error('❌ Música:', e); }

  try {
    const { initJuego } = await import('./modules/juego.js');
    initJuego(config);
  } catch (e) { console.error('❌ Juego:', e); }

  // ---------- ELEMENTOS ----------
  const roseBtn = document.getElementById('rose-btn');
  const portal = document.getElementById('portal');
  const app = document.getElementById('app');

  // ---------- ROSA ----------
  if (roseBtn && portal && app) {
    roseBtn.addEventListener('click', function(e) {
      e.preventDefault();
      portal.classList.add('hide');
      app.classList.add('show');
      if (window.playMusic) window.playMusic();
    });
  }

  // ---------- BOTÓN MUTE ----------
  const muteBtn = document.getElementById('music-toggle');
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      if (window.toggleMusic) window.toggleMusic();
    });
  }

  // ---------- BOTÓN VOLVER (regresa al portal) ----------
  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      // Solo regresa al portal, sin tocar el juego
      app.classList.remove('show');
      portal.classList.remove('hide');
      console.log('↩️ Volviendo al portal');
    });
  }
});
