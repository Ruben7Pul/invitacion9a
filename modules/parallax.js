console.log('📦 parallax.js');

// Parallax 3D suave para celular, usando el giroscopio (deviceorientation).
// Se activa SOLO si:
//  1) el dispositivo parece ser un celular, y
//  2) el navegador permite acceso al sensor (algunos piden permiso explícito
//     -como iOS 13+-, y otros lo bloquean directamente).
//
// Si se activa: apaga las animaciones de reposo (reja, óvalo, nombre) via
// la clase "parallax-activo" en <html>, y mueve dos grupos completos como
// una sola unidad (no elemento por elemento):
//   - .portal-inner  → la reja + los dos mensajes de esa pantalla
//   - #app           → todos los elementos de la pantalla principal

let activo = false;
let grupoPortal = null;
let grupoApp = null;
let objetivo = { x: 0, y: 0 };
let actual = { x: 0, y: 0 };
let rafId = null;

function esMovil() {
  const porPuntero = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const porUA = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  return !!(porPuntero || porUA);
}

function manejarOrientacion(e) {
  if (e.beta === null && e.gamma === null) return;
  const beta = Math.max(-30, Math.min(30, e.beta || 0));
  const gamma = Math.max(-30, Math.min(30, e.gamma || 0));
  objetivo.x = gamma / 30;
  objetivo.y = beta / 30;
}

function animar() {
  actual.x += (objetivo.x - actual.x) * 0.06;
  actual.y += (objetivo.y - actual.y) * 0.06;

  const rotY = actual.x * 5;
  const rotX = -actual.y * 4;
  const transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;

  if (grupoPortal) grupoPortal.style.transform = transform;
  if (grupoApp) grupoApp.style.transform = transform;

  rafId = requestAnimationFrame(animar);
}

function activarParallax() {
  if (activo) return;
  activo = true;
  document.documentElement.classList.add('parallax-activo');
  grupoPortal = document.querySelector('.portal-inner');
  grupoApp = document.getElementById('app');
  window.addEventListener('deviceorientation', manejarOrientacion, true);
  if (!rafId) rafId = requestAnimationFrame(animar);
}

async function pedirPermiso() {
  if (typeof DeviceOrientationEvent === 'undefined') return false;
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      const respuesta = await DeviceOrientationEvent.requestPermission();
      return respuesta === 'granted';
    } catch (e) {
      return false;
    }
  }
  // Android y otros navegadores que no piden permiso explícito
  return true;
}

function probarSoporte() {
  return new Promise((resolve) => {
    let resuelto = false;
    const limite = setTimeout(() => {
      if (!resuelto) {
        resuelto = true;
        window.removeEventListener('deviceorientation', probar);
        resolve(false);
      }
    }, 700);
    function probar(e) {
      if ((e.beta !== null && e.beta !== undefined) || (e.gamma !== null && e.gamma !== undefined)) {
        if (!resuelto) {
          resuelto = true;
          clearTimeout(limite);
          window.removeEventListener('deviceorientation', probar);
          resolve(true);
        }
      }
    }
    window.addEventListener('deviceorientation', probar);
  });
}

export function initParallax() {
  if (!esMovil()) return;

  let intentado = false;
  async function intentar() {
    if (intentado) return;
    intentado = true;
    try {
      const permiso = await pedirPermiso();
      if (!permiso) return;
      const soporta = await probarSoporte();
      if (soporta) activarParallax();
    } catch (e) {
      // Navegador bloqueó el sensor: se queda con las animaciones normales.
    }
  }

  document.addEventListener('touchstart', intentar, { once: true, passive: true });
  document.addEventListener('click', intentar, { once: true });
}
