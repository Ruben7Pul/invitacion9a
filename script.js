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
  const nombreEl = document.getElementById('nombre-hero');
  if (nombreEl) {
    nombreEl.textContent = config.nombre;
    nombreEl.setAttribute('data-text', config.nombre);
  }
  const fechaEl = document.getElementById('fecha-fija');
  if (fechaEl) fechaEl.textContent = config.fechaTexto;
  const fraseEl = document.getElementById('frase-texto');
  if (fraseEl) fraseEl.textContent = config.frase;
  const horaMisa = document.getElementById('hora-misa');
  if (horaMisa) horaMisa.textContent = config.horaMisa;
  const lugarMisa = document.getElementById('lugar-misa');
  if (lugarMisa) lugarMisa.textContent = config.ubicacionMisa;
  const mapaMisa = document.getElementById('mapa-misa');
  if (mapaMisa) mapaMisa.href = config.mapaMisa;
  const horaFiesta = document.getElementById('hora-fiesta');
  if (horaFiesta) horaFiesta.textContent = config.horaFiesta;
  const lugarFiesta = document.getElementById('lugar-fiesta');
  if (lugarFiesta) lugarFiesta.textContent = config.ubicacionFiesta;
  const mapaFiesta = document.getElementById('mapa-fiesta');
  if (mapaFiesta) mapaFiesta.href = config.mapaFiesta;
  const padre1 = document.getElementById('padre1');
  if (padre1) padre1.textContent = config.padre;
  const padre2 = document.getElementById('padre2');
  if (padre2) padre2.textContent = config.madre;
  const padrino1 = document.getElementById('padrino1');
  if (padrino1) padrino1.textContent = config.padrino;
  const padrino2 = document.getElementById('padrino2');
  if (padrino2) padrino2.textContent = config.madrina;
  document.title = `Mis XV años · ${config.nombre}`;
}

document.addEventListener('DOMContentLoaded', async () => {
  const config = await cargarConfig();
  window.CONFIG = config;
  rellenarDatos(config);

  const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '';
  const isPrincipal = window.location.pathname.endsWith('principal.html');

  // Cargar módulos comunes
  try {
    const { initSonidos } = await import('./modules/sonidos.js');
    initSonidos();
  } catch (e) { console.error('❌ Sonidos:', e); }

  try {
    const { initParticulas } = await import('./modules/particulas.js');
    initParticulas();
  } catch (e) { console.error('❌ Partículas:', e); }

  try {
    const { initMusica, playMusic, toggleMusic, resetMusic } = await import('./modules/musica.js');
    initMusica(config);
    window.playMusic = playMusic;
    window.toggleMusic = toggleMusic;
    window.resetMusic = resetMusic;
  } catch (e) { console.error('❌ Música:', e); }

  if (isIndex) {
    // Página de inicio: reja
    console.log('📌 Página de inicio');
    const gateWrapper = document.getElementById('gate-wrapper');
    if (gateWrapper) {
      gateWrapper.addEventListener('click', () => {
        // Abrir la reja (animación)
        gateWrapper.classList.add('open');

        // Iniciar música (reiniciar desde 0)
        if (window.playMusic) {
          window.resetMusic();
          setTimeout(() => window.playMusic(), 100);
        }

        // Después de la animación (0.9s), redirigir con fade
        setTimeout(() => {
          // Añadir un pequeño fade antes de ir a principal
          document.body.style.transition = 'opacity 0.5s ease';
          document.body.style.opacity = '0';
          setTimeout(() => {
            window.location.href = 'principal.html';
          }, 500);
        }, 900);
      });
    }
  } else if (isPrincipal) {
    // Pantalla principal
    console.log('📌 Pantalla principal');
    // La app ya tiene clase "show" por defecto, pero aseguramos que se vea
    const app = document.getElementById('app');
    if (app) {
      app.classList.add('show');
      app.classList.remove('fade-out');
    }

    if (window.playMusic) {
      setTimeout(() => window.playMusic(), 200);
    }

    // Cargar módulos específicos
    try {
      const { initContador } = await import('./modules/contador.js');
      initContador(config);
    } catch (e) { console.error('❌ Contador:', e); }

    try {
      const { initModal } = await import('./modules/modal.js');
      initModal();
    } catch (e) { console.error('❌ Modal:', e); }

    try {
      const { initJuego } = await import('./modules/juego.js');
      initJuego(config);
    } catch (e) { console.error('❌ Juego:', e); }

    const muteBtn = document.getElementById('music-toggle');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        if (window.toggleMusic) window.toggleMusic();
      });
    }

    // Botón de volver (enlace a index.html) - manejar animación de salida
    const backLink = document.getElementById('back-link');
    if (backLink) {
      backLink.addEventListener('click', (e) => {
        e.preventDefault(); // Prevenir la navegación inmediata
        // 1. Fade out de la app
        const app = document.getElementById('app');
        if (app) {
          app.classList.remove('show');
          app.classList.add('fade-out');
        }
        // 2. Cerrar juego si está abierto
        if (window.closeGame) window.closeGame();
        // 3. Pausar y reiniciar música
        if (window.resetMusic) window.resetMusic();
        // 4. Después del fade (0.7s), ir a index.html
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 700);
      });
    }
  }
});
