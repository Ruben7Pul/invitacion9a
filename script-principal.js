console.log('🚀 script-principal.js');

// ================================================================
// 1. CONFIGURACIÓN DE ILUMINACIÓN DINÁMICA Y EVENTOS
// ================================================================

const INTERVALO_MINUTOS = 30; // Cambia cada 30 minutos
const INTERVALO_MS = INTERVALO_MINUTOS * 60 * 1000;

// Horarios (en horas, formato 0-23)
const HORA_AMANECER = 5;     // 5:00 am
const HORA_DIA_FIN = 18;     // 6:00 pm (fin del día)
const HORA_NOCHE_INICIO = 21; // 9:00 pm (noche profunda)
const HORA_NOCHE_FIN = 5;     // 5:00 am

// Estado de las luminarias
let luminariasActivas = true;
let eventoFalloActivo = false;
let timeoutFallo = null;

// Elementos que actúan como luminarias
const elementosLuminaria = [
  document.getElementById('nombre-hero'),
  document.querySelector('#app-top .eyebrow'),
  document.getElementById('back-link'),
  document.getElementById('music-toggle'),
  ...document.querySelectorAll('.nav-btn')
];

// Función de iluminación principal
function actualizarIluminacion() {
  const ahora = new Date();
  const horas = ahora.getHours() + ahora.getMinutes() / 60;

  // Determinar fase
  let fase = 'dia';
  let intensidadLuz = 1.0; // 0 = oscuro, 1 = máximo brillo día

  // Noche profunda (21:00 - 5:00)
  if (horas >= HORA_NOCHE_INICIO || horas < HORA_NOCHE_FIN) {
    fase = 'noche';
    intensidadLuz = 0.0;
  }
  // Ocaso (18:00 - 21:00)
  else if (horas >= HORA_DIA_FIN && horas < HORA_NOCHE_INICIO) {
    fase = 'ocaso';
    const t = (horas - HORA_DIA_FIN) / (HORA_NOCHE_INICIO - HORA_DIA_FIN);
    intensidadLuz = 1 - t;
  }
  // Día (5:00 - 18:00)
  else {
    fase = 'dia';
    const mitadDia = (HORA_DIA_FIN + HORA_AMANECER) / 2;
    const rango = (HORA_DIA_FIN - HORA_AMANECER) / 2;
    const distanciaAlMediodia = Math.abs(horas - mitadDia);
    intensidadLuz = 1 - (distanciaAlMediodia / rango);
    intensidadLuz = 0.2 + intensidadLuz * 0.8;
  }

  // Determinar si las luminarias deben estar al 100%
  // Están al 100% desde las 18:00 hasta las 8:00 del día siguiente
  const esHorarioLuminarias = (horas >= 18 || horas < 8);
  let brilloLuminarias = esHorarioLuminarias ? 1.0 : 0.0;
  
  // Si estamos en ocaso, hacemos transición de 0 a 1 entre 18:00 y 21:00
  if (fase === 'ocaso') {
    const t = (horas - HORA_DIA_FIN) / (HORA_NOCHE_INICIO - HORA_DIA_FIN);
    brilloLuminarias = t; // 0 a 1
  }
  // En noche profunda, ya está al 100%

  // ===== Aplicar variables CSS =====
  const root = document.documentElement;

  // Color de fondo
  const r = Math.round(interpolar(10, 245, intensidadLuz));
  const g = Math.round(interpolar(10, 240, intensidadLuz));
  const b = Math.round(interpolar(24, 232, intensidadLuz));
  const colorFondo = `rgb(${r}, ${g}, ${b})`;
  root.style.setProperty('--color-fondo', colorFondo);

  // Brillo del nombre (luminaria) - se aplica solo si no hay evento de fallo activo
  const brilloBase = 5 + brilloLuminarias * 30;
  const colorBrillo = `rgba(255, 215, 0, ${0.3 + brilloLuminarias * 0.7})`;
  let shadowNombre = `0 0 ${brilloBase}px ${colorBrillo}, 0 0 ${brilloBase * 2}px ${colorBrillo}`;
  
  // Si hay evento de fallo, reducimos el brillo
  if (eventoFalloActivo) {
    const atenuacion = 0.1 + Math.random() * 0.3; // entre 10% y 40% de brillo
    shadowNombre = `0 0 ${brilloBase * atenuacion}px ${colorBrillo}`;
  }
  root.style.setProperty('--brillo-nombre', shadowNombre);

  // Sombra de botones
  const brilloBoton = 0 + brilloLuminarias * 20;
  const shadowBoton = `0 0 ${brilloBoton}px rgba(212, 175, 55, ${0.2 + brilloLuminarias * 0.8})`;
  root.style.setProperty('--sombra-boton', shadowBoton);
  const borderColor = `rgba(212, 175, 55, ${0.3 + brilloLuminarias * 0.7})`;
  root.style.setProperty('--borde-boton', borderColor);

  // Temperatura de color para videos
  let tempColor = 0.5;
  if (fase === 'dia') {
    const horaNormalizada = (horas - HORA_AMANECER) / (HORA_DIA_FIN - HORA_AMANECER);
    tempColor = 0.5 + 0.5 * Math.sin((horaNormalizada - 0.5) * Math.PI);
  } else if (fase === 'ocaso') {
    const t = (horas - HORA_DIA_FIN) / (HORA_NOCHE_INICIO - HORA_DIA_FIN);
    tempColor = 0.5 + 0.5 * (1 - t);
  }
  const hueRotate = tempColor * 30 - 15;
  const saturate = 0.8 + intensidadLuz * 0.4;
  root.style.setProperty('--filtro-video', `hue-rotate(${hueRotate}deg) saturate(${saturate})`);

  // Overlay
  const overlayOpacity = 0.35 * (1 - intensidadLuz * 0.5);
  root.style.setProperty('--overlay-opacity', overlayOpacity);

  // Guardar estado para depuración
  root.dataset.fase = fase;
  root.dataset.intensidad = intensidadLuz.toFixed(2);
  root.dataset.brillo = brilloLuminarias.toFixed(2);
  root.dataset.eventoFallo = eventoFalloActivo ? 'activo' : 'inactivo';

  // Disparar eventos aleatorios de fallo (solo si las luminarias están activas y no hay ya uno)
  if (brilloLuminarias > 0.5 && !eventoFalloActivo && Math.random() < 0.15) {
    iniciarEventoFallo();
  }
}

// Función auxiliar para interpolar
function interpolar(min, max, t) {
  return min + (max - min) * t;
}

// ===== Eventos aleatorios de fallo/parpadeo =====
function iniciarEventoFallo() {
  if (eventoFalloActivo) return;
  eventoFalloActivo = true;
  console.log('💡 Evento de fallo en luminarias iniciado');

  // Duración aleatoria entre 2 y 10 segundos (para pruebas) o hasta 10 minutos
  // Para producción usar: 60 * 1000 * (2 + Math.random() * 8) // 2-10 minutos
  const duracionMs = 2000 + Math.random() * 8000; // 2-10 segundos (para pruebas)
  // const duracionMs = 60 * 1000 * (2 + Math.random() * 8); // 2-10 minutos (descomentar para producción)

  // Parpadeos aleatorios durante el evento
  let parpadeos = 0;
  const maxParpadeos = 3 + Math.floor(Math.random() * 5); // 3-7 parpadeos
  const intervalParpadeo = setInterval(() => {
    if (parpadeos >= maxParpadeos || !eventoFalloActivo) {
      clearInterval(intervalParpadeo);
      return;
    }
    // Apagar y encender rápidamente
    const root = document.documentElement;
    const brilloActual = root.style.getPropertyValue('--brillo-nombre');
    root.style.setProperty('--brillo-nombre', '0 0 0px rgba(255,215,0,0)');
    setTimeout(() => {
      root.style.setProperty('--brillo-nombre', brilloActual);
    }, 200 + Math.random() * 400);
    parpadeos++;
  }, 800 + Math.random() * 1200);

  // Finalizar evento después de la duración
  if (timeoutFallo) clearTimeout(timeoutFallo);
  timeoutFallo = setTimeout(() => {
    eventoFalloActivo = false;
    console.log('💡 Evento de fallo finalizado');
    clearInterval(intervalParpadeo);
    // Re-aplicar iluminación normal
    actualizarIluminacion();
  }, duracionMs);
}

// Ejecutar iluminación al cargar y luego cada intervalo
actualizarIluminacion();
setInterval(actualizarIluminacion, INTERVALO_MS);

// ================================================================
// 2. RESTO DEL CÓDIGO (config, reja, modales, parallax, etc.)
// ================================================================

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
  // 🌀 PARALLAX GLOBAL CON DETECCIÓN INTELIGENTE
  // ============================================================
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const hasGyro = typeof DeviceOrientationEvent !== 'undefined';
  let gyroWorking = false;

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

    // --- REJA ---
    if (!portal.classList.contains('hide') && portalInner) {
      portalInner.style.transform = `translate(${offsetX * 0.6}px, ${offsetY * 0.6}px)`;
    }

    // --- APP PRINCIPAL ---
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

    // ===== MODALES =====
    document.querySelectorAll('.modal-overlay.open .modal-card').forEach(card => {
      card.style.left = `${offsetX * 0.8}px`;
      card.style.top = `${offsetY * 0.8}px`;
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

  // --- Giroscopio (móvil) ---
  if (isMobile && hasGyro) {
    const gyroTest = (e) => {
      if (e.gamma !== null || e.beta !== null) {
        gyroWorking = true;
        console.log('✅ Giroscopio detectado y funcionando');
        window.removeEventListener('deviceorientation', gyroTest);
        window.addEventListener('deviceorientation', handleOrientation);
      }
    };
    window.addEventListener('deviceorientation', gyroTest);

    setTimeout(() => {
      if (!gyroWorking) {
        console.log('⚠️ Giroscopio no responde, se usará mouse como respaldo');
        window.removeEventListener('deviceorientation', gyroTest);
      }
    }, 3000);
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
});
