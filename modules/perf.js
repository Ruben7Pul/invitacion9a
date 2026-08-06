// ============================================================
// perf.js – Medición de FPS durante el video de transición
// ============================================================
console.log('📦 perf.js cargado');

let rafId = null;
let frames = [];

export function iniciarMedicionFPS() {
  frames = [];
  if (rafId) cancelAnimationFrame(rafId);

  function medir(t) {
    frames.push(t);
    rafId = requestAnimationFrame(medir);
  }
  rafId = requestAnimationFrame(medir);
  console.log('🧪 Medición de FPS iniciada');
}

export function detenerMedicion() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  const copia = frames.slice();
  frames = [];
  return copia;
}

// Respaldo cuando no hay suficientes datos (video saltado muy rápido)
function nivelEstatico() {
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  if (cores <= 4 || mem <= 2) return 'bajo';
  if (cores >= 8 && mem >= 6) return 'alto';
  return 'medio';
}

export function clasificarNivel(frames) {
  if (!frames || frames.length < 15) {
    const nivel = nivelEstatico();
    console.log('🧪 Pocos datos de FPS, usando señales del dispositivo → nivel "' + nivel + '"');
    return nivel;
  }

  const deltas = [];
  for (let i = 1; i < frames.length; i++) {
    deltas.push(frames[i] - frames[i - 1]);
  }
  const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const avgFPS = 1000 / avgDelta;
  const lentos = deltas.filter(d => d > 33.3).length;
  const ratioLentos = lentos / deltas.length;

  let nivel;
  if (avgFPS >= 50 && ratioLentos < 0.1) {
    nivel = 'alto';
  } else if (avgFPS >= 30 && ratioLentos < 0.35) {
    nivel = 'medio';
  } else {
    nivel = 'bajo';
  }

  console.log(`🧪 Resultado: ${avgFPS.toFixed(0)}fps, ${(ratioLentos * 100).toFixed(0)}% frames lentos → nivel "${nivel}"`);
  return nivel;
}

export function guardarNivel(nivel) {
  try {
    sessionStorage.setItem('perfTier', nivel);
  } catch (e) {
    // sessionStorage no disponible
  }
}

export function obtenerNivel() {
  let nivel = null;
  try {
    nivel = sessionStorage.getItem('perfTier');
  } catch (e) {}
  return nivel || nivelEstatico();
}
