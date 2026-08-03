console.log('🚀 script.js (invitación sin juego)');

const isMobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

let configGlobal = null;

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
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.content = `Invitación a los XV años de ${config.nombre}`;
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.content = `Te invitamos a celebrar los 15 años de ${config.nombre}. ¡No faltes!`;
}

// ========== CARGA PEREZOSA DE MÓDULOS ==========
let sonidosCargados = false;
let musicaCargada = false;
let contadorCargado = false;
let modalCargado = false;

async function cargarSonidos() {
  if (sonidosCargados) return;
  sonidosCargados = true;
  try {
    const { initSonidos } = await import('./modules/sonidos.js');
    initSonidos();
    console.log('🔊 Sonidos cargados');
  } catch (e) { console.error('❌ Sonidos:', e); }
}

async function cargarMusica() {
  if (musicaCargada) return;
  musicaCargada = true;
  try {
    const { initMusica, playMusic, toggleMusic, resetMusic } = await import('./modules/musica.js');
    initMusica(configGlobal);
    window.playMusic = playMusic;
    window.toggleMusic = toggleMusic;
    window.resetMusic = resetMusic;
    console.log('🎵 Música cargada');
    const muteBtn = document.getElementById('music-toggle');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        if (window.toggleMusic) window.toggleMusic();
      });
    }
  } catch (e) { console.error('❌ Música:', e); }
}

async function cargarContador() {
  if (contadorCargado) return;
  contadorCargado = true;
  try {
    const { initContador } = await import('./modules/contador.js');
    initContador(configGlobal);
    console.log('⏳ Contador cargado');
  } catch (e) { console.error('❌ Contador:', e); }
}

async function cargarModal() {
  if (modalCargado) return;
  modalCargado = true;
  try {
    const { initModal } = await import('./modules/modal.js');
    initModal();
    console.log('📋 Modales cargados');
  } catch (e) { console.error('❌ Modal:', e); }
}

document.addEventListener('DOMContentLoaded', async () => {
  const config = await cargarConfig();
  configGlobal = config;
  rellenarDatos(config);

  // REJA
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
    cargarMusica();
    cargarSonidos();
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

  // Carga perezosa de contador y modales
  document.querySelector('[data-modal="modal-contador"]')?.addEventListener('click', () => {
    cargarContador();
    cargarModal();
  });
  document.querySelector('[data-modal="modal-detalles"]')?.addEventListener('click', cargarModal);
  document.querySelector('[data-modal="modal-familia"]')?.addEventListener('click', cargarModal);

  // ABRIR JUEGO EN NUEVA PESTAÑA
  const nombreEl = document.getElementById('nombre-hero');
  nombreEl.addEventListener('click', () => {
    const win = window.open('juegos1.html', '_blank', 'width=500,height=700,menubar=no,toolbar=no,location=no,status=no');
    if (!win || win.closed) {
      window.location.href = 'juegos1.html';
    }
  });
});
