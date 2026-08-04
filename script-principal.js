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

  // ===== CARGAR MÓDULOS AL INICIO =====
  try {
    const { initSonidos } = await import('./modules/sonidos.js');
    initSonidos();
  } catch (e) { console.error('❌ Sonidos:', e); }

  try {
    const { initMusica, playMusic, toggleMusic, resetMusic } = await import('./modules/musica.js');
    initMusica(config);
    window.playMusic = playMusic;
    window.toggleMusic = toggleMusic;
    window.resetMusic = resetMusic;
  } catch (e) { console.error('❌ Música:', e); }

  try {
    const { initModal } = await import('./modules/modal.js');
    initModal();
    console.log('✅ Modales inicializados');
  } catch (e) { console.error('❌ Modal:', e); }

  // ===== CONTADOR (bajo demanda) =====
  let appIniciada = false;
  async function cargarContador() {
    if (appIniciada) return;
    appIniciada = true;
    try {
      const { initContador } = await import('./modules/contador.js');
      initContador(config);
    } catch (e) { console.error('❌ Contador:', e); }
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

  const params = new URLSearchParams(window.location.search);
  const volviendoDelJuego = params.get('volver') === '1';

  if (volviendoDelJuego) {
    portal.classList.add('hide');
    app.classList.add('show');
    gateWrapper.classList.add('active');
    gateWrapper.classList.add('open');
    caption.classList.add('show');
    cargarContador();
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
    cargarContador();
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
  // 🌀 PARALLAX GLOBAL CON DETECCIÓN MEJORADA
  // ============================================================
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const hasGyro = typeof DeviceOrientationEvent !== 'undefined';
  let gyroWorking = false;
  let gyroTestCount = 0;
  let gyroTestTimeout = null;

  // Elementos a mover
  const portalInner = document.querySelector('.portal-inner');
  const appMid = document.getElementById('app-mid');
  const nav = document.getElementById('nav');
  const backLink = document.getElementById('back-link');
  const musicToggle = document.getElementById('music-toggle');
  const eyebrow = document.querySelector('#app-top .eyebrow');

  function applyParallax(x, y) {
    const invertX = -x;
    const invertY = -y;
    const maxOffset = 18;
    const offsetX = Math.min(Math.max(invertX, -maxOffset), maxOffset);
    const offsetY = Math.min(Math.max(invertY, -maxOffset), maxOffset);

    // Reja
    if (!portal.classList.contains('hide') && portalInner) {
      portalInner.style.transform = `translate(${offsetX * 0.6}px, ${offsetY * 0.6}px)`;
    }

    // App principal
    if (app.classList.contains('show')) {
      if (appMid) {
        appMid.style.transform = `translate(${offsetX * 0.8}px, ${offsetY * 0.8}px)`;
      }
      if (nav) {
        nav.style.transform = `translate(${offsetX * 0.4}px, ${offsetY * 0.4}px)`;
      }
      const nombre = document.getElementById('nombre-hero');
      const frase = document.getElementById('frase-texto');
      if (nombre) nombre.style.transform = `translate(${offsetX * 0.3}px, ${offsetY * 0.3}px)`;
      if (frase) frase.style.transform = `translate(${offsetX * 0.2}px, ${offsetY * 0.2}px)`;

      if (backLink) backLink.style.transform = `translate(${offsetX * 0.5}px, ${offsetY * 0.5}px)`;
      if (musicToggle) musicToggle.style.transform = `translate(${offsetX * 0.5}px, ${offsetY * 0.5}px)`;
      if (eyebrow) eyebrow.style.transform = `translate(${offsetX * 0.3}px, ${offsetY * 0.3}px)`;
    }

    // ===== MODALES: factor aumentado a 1.2 para que se note más =====
    document.querySelectorAll('.modal-overlay.open .modal-card').forEach(card => {
      card.style.transform = `translate(${offsetX * 1.2}px, ${offsetY * 1.2}px)`;
    });
  }

  let currentX = 0, currentY = 0;
  let targetX = 0, targetY = 0;

  function smoothParallax() {
    currentX += (targetX - currentX) * 0.1;
    currentY += (targetY - currentY) * 0.1;
    if (Math.abs(currentX - targetX) > 0.05 || Math.abs(currentY - targetY) > 0.05) {
      applyParallax(currentX, currentY);
      requestAnimationFrame(smoothParallax);
    } else {
      applyParallax(targetX, targetY);
    }
  }

  // --- Mouse (solo si NO es móvil con giro activo) ---
  document.addEventListener('mousemove', (e) => {
    if (isMobile && gyroWorking) return;
    if (portal.classList.contains('hide') && !app.classList.contains('show')) return;
    const x = (e.clientX / window.innerWidth - 0.5) * 30;
    const y = (e.clientY / window.innerHeight - 0.5) * 30;
    targetX = x;
    targetY = y;
    if (Math.abs(currentX - targetX) > 0.1 || Math.abs(currentY - targetY) > 0.1) {
      requestAnimationFrame(smoothParallax);
    }
  });

  // --- Giroscopio (móvil) con detección mejorada ---
  if (isMobile && hasGyro) {
    // Listener de prueba para detectar si el giroscopio realmente envía datos
    const gyroTest = (e) => {
      if (e.gamma !== null && e.beta !== null && !isNaN(e.gamma) && !isNaN(e.beta)) {
        gyroTestCount++;
        if (gyroTestCount >= 3) {
          // Después de 3 eventos válidos, asumimos que funciona
          gyroWorking = true;
          console.log('✅ Giroscopio detectado y funcionando');
          window.removeEventListener('deviceorientation', gyroTest);
          if (gyroTestTimeout) clearTimeout(gyroTestTimeout);
          // Ahora el listener principal
          window.addEventListener('deviceorientation', handleOrientation);
        }
      }
    };

    window.addEventListener('deviceorientation', gyroTest);

    // Timeout: si en 1.5 segundos no llegan 3 eventos, asumimos que no funciona
    gyroTestTimeout = setTimeout(() => {
      if (!gyroWorking) {
        console.log('⚠️ Giroscopio no responde, se usará mouse como respaldo');
        window.removeEventListener('deviceorientation', gyroTest);
      }
    }, 1500);
  }

  function handleOrientation(e) {
    if (portal.classList.contains('hide') && !app.classList.contains('show')) return;
    const gamma = e.gamma || 0;
    const beta = e.beta || 0;
    const x = (gamma / 90) * 30;
    const y = ((beta - 45) / 90) * 30;
    targetX = x;
    targetY = y;
    if (Math.abs(currentX - targetX) > 0.1 || Math.abs(currentY - targetY) > 0.1) {
      requestAnimationFrame(smoothParallax);
    }
  }

  console.log('📱 isMobile:', isMobile, 'hasGyro:', hasGyro);
});
