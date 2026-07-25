console.log('🚀 script.js (con flash screen)');

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
  document.getElementById('nombre-hero').setAttribute('data-text', config.nombre);
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

  // Módulos
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
    const { initMusica, playMusic, toggleMusic, resetMusic } = await import('./modules/musica.js');
    initMusica(config);
    window.playMusic = playMusic;
    window.toggleMusic = toggleMusic;
    window.resetMusic = resetMusic;
  } catch (e) { console.error('❌ Música:', e); }

  try {
    const { initJuego } = await import('./modules/juego.js');
    initJuego(config);
  } catch (e) { console.error('❌ Juego:', e); }

  // Elementos
  const gateWrapper = document.getElementById('gate-wrapper');
  const portal = document.getElementById('portal');
  const app = document.getElementById('app');
  const flashScreen = document.getElementById('flash-screen');

  // ---------- ABRIR REJA ----------
  if (gateWrapper && portal && app && flashScreen) {
    const openGate = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      console.log('🔓 Abriendo reja...');
      
      // 1. Activar brillo de pantalla completa
      flashScreen.classList.add('active');

      // 2. Activar animación de la reja (abrir puertas)
      gateWrapper.classList.add('open');

      // 3. Música
      if (window.playMusic) {
        window.resetMusic();
        setTimeout(() => window.playMusic(), 100);
      }

      // 4. Después del flash (0.8s), ocultar portal y mostrar app
      setTimeout(() => {
        portal.classList.add('hide');
        app.classList.add('show');
        // Resetear reja (para futuros usos)
        gateWrapper.classList.remove('open');
        flashScreen.classList.remove('active');
      }, 800);
    };

    // Agregar listener tanto al wrapper como a los elementos SVG
    gateWrapper.addEventListener('click', openGate);
    
    // También capturar clicks en los gate-leaf directamente
    const gateLeaves = gateWrapper.querySelectorAll('.gate-leaf');
    gateLeaves.forEach(leaf => {
      leaf.style.cursor = 'pointer';
      leaf.addEventListener('click', openGate);
    });
    
    console.log('✅ Gate-wrapper configurado para clicks');
  }

  // ---------- BOTÓN MUTE ----------
  const muteBtn = document.getElementById('music-toggle');
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      if (window.toggleMusic) window.toggleMusic();
    });
  }

  // ---------- BOTÓN VOLVER ----------
  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      // Cerrar juego
      if (window.closeGame) window.closeGame();

      // 1. Activar brillo de pantalla completa
      flashScreen.classList.add('active');

      // 2. Apagar música
      if (window.resetMusic) window.resetMusic();

      // 3. Ocultar app y mostrar portal (con clase closing para animación de puertas)
      app.classList.remove('show');
      portal.classList.remove('hide');
      portal.classList.add('closing');

      // 4. Después del flash (0.6s), quitar brillo y clase closing
      setTimeout(() => {
        flashScreen.classList.remove('active');
        portal.classList.remove('closing');
        // Asegurar que la reja esté cerrada (resetear)
        gateWrapper.classList.remove('open');
      }, 600);

      console.log('↩️ Volviendo al portal (con flash)');
    });
  }
});
