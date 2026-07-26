console.log('🚀 script.js');

let CONFIG = {};

async function cargarConfig() {
  try {
    const res = await fetch(`config.json?t=${Date.now()}`);
    if (!res.ok) throw new Error('HTTP error ' + res.status);
    const data = await res.json();
    if (!data.nombre) throw new Error('Falta el campo "nombre"');
    return data;
  } catch (e) {
    console.warn('⚠️ Error al cargar config.json:', e);
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:rgba(0,0,0,0.8); color:#fff; padding:1rem 2rem; border-radius:12px; z-index:999; text-align:center; font-family:sans-serif;';
    errorDiv.innerHTML = `<p>⚠️ No se pudo cargar la configuración.</p><p style="font-size:0.8rem; opacity:0.7;">Usando valores de respaldo.</p>`;
    document.body.prepend(errorDiv);
    return {
      nombre: 'Dania',
      fechaTexto: '24 de octubre de 2026',
      fechaISO: '2026-10-24T13:00:00',
      frase: 'Con la bendición de Dios...',
      horaMisa: '3:00 pm',
      ubicacionMisa: 'Iglesia',
      direccionMisa: 'Calle Principal #123, Colonia Centro',
      mapaMisa: '#',
      horaFiesta: '1:00 pm',
      ubicacionFiesta: 'Salón',
      direccionFiesta: 'Camino a la Rosaleda #456, Fracc. Real',
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
  const dirMisa = document.getElementById('dir-misa');
  if (dirMisa) dirMisa.textContent = config.direccionMisa || 'Calle Principal #123, Colonia Centro';
  const mapaMisa = document.getElementById('mapa-misa');
  if (mapaMisa) mapaMisa.href = config.mapaMisa;
  const horaFiesta = document.getElementById('hora-fiesta');
  if (horaFiesta) horaFiesta.textContent = config.horaFiesta;
  const lugarFiesta = document.getElementById('lugar-fiesta');
  if (lugarFiesta) lugarFiesta.textContent = config.ubicacionFiesta;
  const dirFiesta = document.getElementById('dir-fiesta');
  if (dirFiesta) dirFiesta.textContent = config.direccionFiesta || 'Camino a la Rosaleda #456, Fracc. Real';
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
  window.CONFIG = config;
  rellenarDatos(config);

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

  let appIniciada = false;
  async function iniciarApp() {
    if (appIniciada) return;
    appIniciada = true;

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
  }

  const portal = document.getElementById('portal');
  const gateWrapper = document.getElementById('gate-wrapper');
  const app = document.getElementById('app');
  const backBtn = document.getElementById('back-link');

  function abrirReja() {
    console.log('🔄 Abriendo la reja');
    gateWrapper.classList.add('open');
    setTimeout(() => {
      portal.classList.add('hide');
      app.classList.add('show');
      iniciarApp();
      if (window.playMusic) window.playMusic();
    }, 650);
  }

  function cerrarReja() {
    console.log('↩️ Volviendo a la reja');
    app.classList.remove('show');
    portal.classList.remove('hide');
    portal.classList.add('closing');
    gateWrapper.classList.remove('open');
    if (window.resetMusic) window.resetMusic();
    setTimeout(() => {
      portal.classList.remove('closing');
    }, 600);
  }

  if (gateWrapper) {
    gateWrapper.addEventListener('click', (e) => {
      e.preventDefault();
      abrirReja();
    });
    gateWrapper.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        abrirReja();
      }
    });
  } else {
    console.error('❌ No se encontró #gate-wrapper');
  }

  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      cerrarReja();
    });
  }
});
