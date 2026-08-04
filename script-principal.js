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

// Función de iluminación principal (CORREGIDA)
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
    intensidadLuz = 1 - t * 0.8; // de 1 a 0.2 (no llega a 0 para no apagar del todo)
  }
  // Día (5:00 - 18:00)
  else {
    fase = 'dia';
    const mitadDia = (HORA_DIA_FIN + HORA_AMANECER) / 2;
    const rango = (HORA_DIA_FIN - HORA_AMANECER) / 2;
    const distanciaAlMediodia = Math.abs(horas - mitadDia);
    intensidadLuz = 1 - (distanciaAlMediodia / rango);
    intensidadLuz = 0.4 + intensidadLuz * 0.6; // mínimo 0.4, máximo 1.0
  }

  // ===== BRILLO DE LUMINARIAS (CORREGIDO) =====
  let brilloLuminarias = 0;

  if (fase === 'dia') {
    // Durante el día, las luminarias tienen un brillo suave constante (no se apagan)
    brilloLuminarias = 0.15; // 15% de su capacidad
  } else if (fase === 'ocaso') {
    // En ocaso, el brillo aumenta de 0.15 a 1.0 de forma suave
    const t = (horas - HORA_DIA_FIN) / (HORA_NOCHE_INICIO - HORA_DIA_FIN);
    brilloLuminarias = 0.15 + t * 0.85; // de 0.15 a 1.0
  } else if (fase === 'noche') {
    brilloLuminarias = 1.0; // 100%
  }

  // ===== APLICAR VARIABLES CSS =====
  const root = document.documentElement;

  // 1. Color de fondo (simula luz ambiente)
  const r = Math.round(interpolar(20, 240, intensidadLuz));
  const g = Math.round(interpolar(20, 235, intensidadLuz));
  const b = Math.round(interpolar(30, 225, intensidadLuz));
  const colorFondo = `rgb(${r}, ${g}, ${b})`;
  root.style.setProperty('--color-fondo', colorFondo);

  // 2. Brillo del nombre (luminaria principal)
  // Usamos un factor menor para evitar saturación
  const brilloNombre = 2 + brilloLuminarias * 25; // 2 a 27
  const colorBrillo = `rgba(255, 215, 0, ${0.2 + brilloLuminarias * 0.6})`;
  let shadowNombre = `0 0 ${brilloNombre}px ${colorBrillo}, 0 0 ${brilloNombre * 1.5}px ${colorBrillo}`;
  
  // Si hay evento de fallo, reducimos el brillo drásticamente
  if (eventoFalloActivo) {
    const atenuacion = 0.05 + Math.random() * 0.2; // entre 5% y 25% de brillo
    shadowNombre = `0 0 ${brilloNombre * atenuacion}px ${colorBrillo}`;
  }
  root.style.setProperty('--brillo-nombre', shadowNombre);

  // 3. Brillo de botones (separado del nombre)
  const brilloBoton = 2 + brilloLuminarias * 15; // 2 a 17
  const shadowBoton = `0 0 ${brilloBoton}px rgba(212, 175, 55, ${0.15 + brilloLuminarias * 0.6})`;
  root.style.setProperty('--sombra-boton', shadowBoton);
  const borderColor = `rgba(212, 175, 55, ${0.25 + brilloLuminarias * 0.6})`;
  root.style.setProperty('--borde-boton', borderColor);

  // 4. Temperatura de color para videos
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

  // 5. Overlay (oscurecimiento del fondo)
  const overlayOpacity = 0.35 * (1 - intensidadLuz * 0.5);
  root.style.setProperty('--overlay-opacity', overlayOpacity);

  // Guardar estado para depuración
  root.dataset.fase = fase;
  root.dataset.intensidad = intensidadLuz.toFixed(2);
  root.dataset.brillo = brilloLuminarias.toFixed(2);
  root.dataset.eventoFallo = eventoFalloActivo ? 'activo' : 'inactivo';

  // Disparar eventos aleatorios de fallo (solo si las luminarias están activas y no hay ya uno)
  if (brilloLuminarias > 0.3 && !eventoFalloActivo && Math.random() < 0.12) {
    iniciarEventoFallo();
  }
}

// Función auxiliar para interpolar
function interpolar(min, max, t) {
  return min + (max - min) * t;
}

// ===== Eventos aleatorios de fallo/parpadeo (sin cambios) =====
function iniciarEventoFallo() {
  if (eventoFalloActivo) return;
  eventoFalloActivo = true;
  console.log('💡 Evento de fallo en luminarias iniciado');

  const duracionMs = 2000 + Math.random() * 8000; // 2-10 segundos (para pruebas)
  // const duracionMs = 60 * 1000 * (2 + Math.random() * 8); // 2-10 minutos (producción)

  let parpadeos = 0;
  const maxParpadeos = 3 + Math.floor(Math.random() * 5);
  const intervalParpadeo = setInterval(() => {
    if (parpadeos >= maxParpadeos || !eventoFalloActivo) {
      clearInterval(intervalParpadeo);
      return;
    }
    const root = document.documentElement;
    const brilloActual = root.style.getPropertyValue('--brillo-nombre');
    root.style.setProperty('--brillo-nombre', '0 0 0px rgba(255,215,0,0)');
    setTimeout(() => {
      root.style.setProperty('--brillo-nombre', brilloActual);
    }, 200 + Math.random() * 400);
    parpadeos++;
  }, 800 + Math.random() * 1200);

  if (timeoutFallo) clearTimeout(timeoutFallo);
  timeoutFallo = setTimeout(() => {
    eventoFalloActivo = false;
    console.log('💡 Evento de fallo finalizado');
    clearInterval(intervalParpadeo);
    actualizarIluminacion();
  }, duracionMs);
}

// Ejecutar iluminación al cargar y luego cada intervalo
actualizarIluminacion();
setInterval(actualizarIluminacion, INTERVALO_MS);

// ================================================================
// 2. RESTO DEL CÓDIGO (config, reja, modales, parallax, etc.)
// ================================================================

// ... (el resto del código es idéntico al que ya tienes, solo se actualiza la parte de iluminación)
// Para evitar duplicar, asumo que el resto del script se mantiene igual.
// Solo debes reemplazar la sección de iluminación con lo de arriba.
