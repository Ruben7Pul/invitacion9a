console.log('🚀 script-principal.js');

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

  // Cargar sonidos
  try {
    const { initSonidos } = await import('./modules/sonidos.js');
    initSonidos();
  } catch (e) { console.error('❌ Sonidos:', e); }

  // Cargar música
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

    const muteBtn = document.getElementById('music-toggle');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        if (window.toggleMusic) window.toggleMusic();
      });
    }
  }

  // ========== IR AL JUEGO ==========
  const nombreEl = document.getElementById('nombre-hero');
  nombreEl.addEventListener('click', () => {
    window.location.href = 'juego1/';
  });

  // ========== REJA ==========
  const portal = document.getElementById('portal');
  const gateWrapper = document.getElementById('gate-wrapper');
  const app = document.getElementById('app');
  const backBtn = document.getElementById('back-link');
  const caption = document.querySelector('.portal-caption');

  // ¿Venimos de "Salir" en el juego?
  const params = new URLSearchParams(window.location.search);
  const volviendoDelJuego = params.get('volver') === '1';

  if (volviendoDelJuego) {
    portal.classList.add('hide');
    app.classList.add('show');
    gateWrapper.classList.add('active');
    gateWrapper.classList.add('open');
    caption.classList.add('show');
    iniciarApp();
    if (window.playMusic) window.playMusic();
    history.replaceState(null, '', window.location.pathname);
    document.documentElement.classList.remove('sin-reja');
  } else {
    gateWrapper.classList.remove('active');
    caption.classList.remove('show');
    setTimeout(() => {
      caption.classList.add('show');
      gateWrapper.classList.add('active');
    }, 2000);
  }

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
    console.log('🔒 Cerrando reja...');
    app.classList.remove('show');
    portal.classList.remove('hide');
    gateWrapper.classList.remove('open');
    if (window.resetMusic) window.resetMusic();
    caption.classList.remove('show');
    gateWrapper.classList.remove('active');
    void portal.offsetHeight;
    requestAnimationFrame(() => {
      portal.classList.add('closing');
      console.log('⏳ Animación de cierre iniciada');
    });
    setTimeout(() => {
      portal.classList.remove('closing');
      console.log('✅ Animación de cierre completada');
      setTimeout(() => {
        caption.classList.add('show');
        gateWrapper.classList.add('active');
        console.log('🔄 Reja reactivada');
      }, 2000);
    }, 700);
  }

  gateWrapper.addEventListener('click', abrirReja);
  gateWrapper.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirReja(e); }
  });
  backBtn.addEventListener('click', cerrarReja);

  // ============================================================
  // 🌀 PARALLAX DE CAPAS (con inversión de dirección)
  // ============================================================
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const hasGyro = typeof DeviceOrientationEvent !== 'undefined';

  // Elementos a los que aplicaremos parallax con distintas intensidades
  const layers = [
    { el: gateWrapper, factor: 1.2, invert: true },    // Reja: se mueve en dirección opuesta (invertida)
    { el: document.getElementById('app-mid'), factor: 0.6, invert: false }, // Contenido central (nombre, imagen, etc.) se mueve en la misma dirección
    { el: document.getElementById('nombre-hero'), factor: 0.8, invert: true }, // Nombre: movimiento opuesto y más pronunciado
    { el: document.querySelector('.frase-inline'), factor: 0.4, invert: false },
    { el: document.querySelector('.fecha-fija'), factor: 0.4, invert: false },
    { el: document.querySelector('.hint'), factor: 0.3, invert: false },
    { el: document.querySelector('#oval-wrap'), factor: 0.5, invert: true } // Imagen central: movimiento opuesto
  ];

  // Limpiar elementos nulos
  const validLayers = layers.filter(l => l.el);

  // Estado de cada capa
  const layerStates = validLayers.map(() => ({ currentX: 0, currentY: 0, targetX: 0, targetY: 0 }));

  // Función para actualizar una capa con suavizado
  function updateLayer(index, x, y) {
    const state = layerStates[index];
    const layer = validLayers[index];
    if (!layer) return;
    const maxOffset = 20; // máximo desplazamiento en px (se ajusta con factor)
    const offsetX = x * layer.factor * (layer.invert ? -1 : 1);
    const offsetY = y * layer.factor * (layer.invert ? -1 : 1);
    const clampedX = Math.min(Math.max(offsetX, -maxOffset), maxOffset);
    const clampedY = Math.min(Math.max(offsetY, -maxOffset), maxOffset);
    state.targetX = clampedX;
    state.targetY = clampedY;
  }

  // Bucle de suavizado para todas las capas
  function smoothAllLayers() {
    let anyMoving = false;
    for (let i = 0; i < validLayers.length; i++) {
      const state = layerStates[i];
      const layer = validLayers[i];
      if (!layer) continue;
      state.currentX += (state.targetX - state.currentX) * 0.12;
      state.currentY += (state.targetY - state.currentY) * 0.12;
      if (Math.abs(state.currentX - state.targetX) > 0.01 || Math.abs(state.currentY - state.targetY) > 0.01) {
        anyMoving = true;
      }
      layer.el.style.transform = `translate(${state.currentX}px, ${state.currentY}px)`;
    }
    if (anyMoving) {
      requestAnimationFrame(smoothAllLayers);
    }
  }

  // Variable para controlar que el bucle no se ejecute innecesariamente
  let parallaxRunning = false;

  function triggerParallax() {
    if (!parallaxRunning) {
      parallaxRunning = true;
      requestAnimationFrame(smoothAllLayers);
    }
  }

  // --- Movimiento con mouse ---
  document.addEventListener('mousemove', (e) => {
    if (portal.classList.contains('hide') && !app.classList.contains('show')) {
      // Si la reja está oculta y la app no está visible, no mover
      return;
    }
    const x = (e.clientX / window.innerWidth - 0.5) * 2; // valor entre -1 y 1
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    for (let i = 0; i < validLayers.length; i++) {
      updateLayer(i, x, y);
    }
    triggerParallax();
  });

  // --- Movimiento con giroscopio ---
  if (isMobile && hasGyro) {
    window.addEventListener('deviceorientation', handleOrientation);
  }

  function handleOrientation(e) {
    if (portal.classList.contains('hide') && !app.classList.contains('show')) return;
    const gamma = e.gamma || 0; // -90..90
    const beta = e.beta || 0;   // -180..180
    // Normalizar a -1..1 (gamma/90, beta/90)
    const x = gamma / 90;
    const y = (beta - 45) / 90;
    for (let i = 0; i < validLayers.length; i++) {
      updateLayer(i, x, y);
    }
    triggerParallax();
  }

  // Iniciar el bucle de suavizado una vez para que esté listo
  // (se ejecutará cuando haya cambios)
  // No es necesario iniciarlo ahora, se iniciará con triggerParallax.
});
