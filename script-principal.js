console.log('🚀 script-principal.js (carga perezosa del juego en iframe)');

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;

async function cargarConfig() {
  try {
    const res = await fetch(`config.json?t=${Date.now()}`);
    if (!res.ok) throw new Error('HTTP error ' + res.status);
    const data = await res.json();
    if (!data.nombre) throw new Error('Falta "nombre"');
    return data;
  } catch (e) {
    console.warn('⚠️ Error config:', e);
    return {
      nombre: 'Melina',
      fechaTexto: '10 de octubre de 2026',
      fechaISO: '2026-10-10T13:00:00',
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
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.content = `Invitación a los XV años de ${config.nombre}`;
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.content = `Te invitamos a celebrar los 15 años de ${config.nombre}. ¡No faltes!`;
}

document.addEventListener('DOMContentLoaded', async () => {
  const config = await cargarConfig();
  rellenarDatos(config);

  // Cargar sonidos (ligero)
  try {
    const { initSonidos } = await import('./modules/sonidos.js');
    initSonidos();
  } catch (e) { console.error('❌ Sonidos:', e); }

  // Cargar música (ligero)
  try {
    const { initMusica, playMusic, toggleMusic, resetMusic } = await import('./modules/musica.js');
    initMusica(config);
    window.playMusic = playMusic;
    window.toggleMusic = toggleMusic;
    window.resetMusic = resetMusic;
  } catch (e) { console.error('❌ Música:', e); }

  // Cargar pétalos (optimizados)
  try {
    const { initParticulas } = await import('./modules/particulas.js');
    initParticulas(isMobile);
  } catch (e) { console.error('❌ Partículas:', e); }

  let appIniciada = false;
  async function iniciarApp() {
    if (appIniciada) return;
    appIniciada = true;

    // Cargar contador y modales (ligeros)
    try {
      const { initContador } = await import('./modules/contador.js');
      initContador(config);
    } catch (e) { console.error('❌ Contador:', e); }

    try {
      const { initModal } = await import('./modules/modal.js');
      initModal();
    } catch (e) { console.error('❌ Modal:', e); }

    const muteBtn = document.getElementById('music-toggle');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        if (window.toggleMusic) window.toggleMusic();
      });
    }
  }

  // ========== CARGA PEREZOSA DEL JUEGO EN IFRAME ==========
  let juegoCargado = false;
  const nombreEl = document.getElementById('nombre-hero');
  nombreEl.addEventListener('click', async () => {
    if (juegoCargado) return;
    juegoCargado = true;
    
    // Crear y mostrar iframe con el juego
    let gameIframe = document.getElementById('game-iframe');
    if (!gameIframe) {
      gameIframe = document.createElement('iframe');
      gameIframe.id = 'game-iframe';
      gameIframe.src = 'juegos1.html';
      gameIframe.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
        border: none;
        background: #0a0a0a;
      `;
      document.body.appendChild(gameIframe);
    }
  });

  // ========== REJA ==========
  const portal = document.getElementById('portal');
  const gateWrapper = document.getElementById('gate-wrapper');
  const app = document.getElementById('app');
  const backBtn = document.getElementById('back-link');
  const caption = document.querySelector('.portal-caption');

  gateWrapper.classList.remove('active');
  caption.classList.remove('show');

  setTimeout(() => {
    caption.classList.add('show');
    gateWrapper.classList.add('active');
  }, 2000);

  function abrirReja(e) {
    if (e) e.stopPropagation();
    gateWrapper.classList.add('open');
    portal.classList.add('hide');
    app.classList.add('show');
    iniciarApp();
    if (window.playMusic) window.playMusic();
  }

  function cerrarReja(e) {
    if (e) e.stopPropagation();
    app.classList.remove('show');
    portal.classList.remove('hide');
    portal.classList.add('closing');
    gateWrapper.classList.remove('open');
    if (window.resetMusic) window.resetMusic();
    setTimeout(() => {
      portal.classList.remove('closing');
    }, 700);
    caption.classList.remove('show');
    gateWrapper.classList.remove('active');
    setTimeout(() => {
      caption.classList.add('show');
      gateWrapper.classList.add('active');
    }, 2000);
  }

  gateWrapper.addEventListener('click', abrirReja);
  gateWrapper.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirReja(e); }
  });
  backBtn.addEventListener('click', cerrarReja);
});
