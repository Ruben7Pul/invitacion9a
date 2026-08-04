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
  // 🌀 PARALLAX EN LA REJA (solo en el wrapper de la reja)
  // ============================================================
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const hasGyro = typeof DeviceOrientationEvent !== 'undefined';

  // Función que aplica la traslación suave
  function applyParallax(x, y) {
    // Limitar movimiento máximo a ±8px para que sea sutil
    const maxOffset = 8;
    const offsetX = Math.min(Math.max(x, -maxOffset), maxOffset);
    const offsetY = Math.min(Math.max(y, -maxOffset), maxOffset);
    gateWrapper.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  }

  // Variable para suavizar la transición (evita movimientos bruscos)
  let currentX = 0, currentY = 0;
  let targetX = 0, targetY = 0;

  function smoothParallax() {
    // Interpolación lineal para suavizar
    currentX += (targetX - currentX) * 0.12;
    currentY += (targetY - currentY) * 0.12;
    if (Math.abs(currentX - targetX) > 0.01 || Math.abs(currentY - targetY) > 0.01) {
      applyParallax(currentX, currentY);
      requestAnimationFrame(smoothParallax);
    } else {
      applyParallax(targetX, targetY);
    }
  }

  // --- Movimiento con mouse (escritorio) ---
  document.addEventListener('mousemove', (e) => {
    // Solo si la reja está visible (no oculta)
    if (portal.classList.contains('hide')) return;
    const x = (e.clientX / window.innerWidth - 0.5) * 16; // -8..8
    const y = (e.clientY / window.innerHeight - 0.5) * 16;
    targetX = x;
    targetY = y;
    if (Math.abs(currentX - targetX) > 0.1 || Math.abs(currentY - targetY) > 0.1) {
      requestAnimationFrame(smoothParallax);
    }
  });

  // --- Movimiento con giroscopio (móvil) ---
  if (isMobile && hasGyro) {
    // Solicitar permiso en iOS 13+
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(state => {
          if (state === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        })
        .catch(() => {});
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }
  }

  function handleOrientation(e) {
    if (portal.classList.contains('hide')) return;
    const gamma = e.gamma || 0; // -90..90
    const beta = e.beta || 0;   // -180..180
    // Normalizar a -8..8
    const x = Math.min(Math.max(gamma / 10, -8), 8);
    const y = Math.min(Math.max((beta - 45) / 10, -8), 8);
    targetX = x;
    targetY = y;
    if (Math.abs(currentX - targetX) > 0.1 || Math.abs(currentY - targetY) > 0.1) {
      requestAnimationFrame(smoothParallax);
    }
  }

  // Fallback: si no hay mouse ni giroscopio, no hacemos nada (la reja se queda quieta)

  // También activar el parallax cuando la reja se abre (por si se oculta)
  // No es necesario, porque el evento se dispara mientras la reja está visible.

  // Nota: al cerrar la reja (portal oculto), no movemos, pero el evento sigue.
  // Podríamos detenerlo, pero no afecta rendimiento.
});
