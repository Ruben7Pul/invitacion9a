console.log('📦 contador.js (corregido, sin saltos)');

let tickAudioCtx = null;
let intervalId = null;
let prevSeconds = -1;

function createTickSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const duration = 0.04;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      const freq1 = 1200 + Math.sin(t * 200) * 200;
      const amp = Math.exp(-t * 80) * 0.15;
      data[i] = Math.sin(2 * Math.PI * freq1 * t) * amp;
      data[i] += Math.sin(2 * Math.PI * (freq1 * 1.7) * t) * amp * 0.3;
    }
    return { ctx, buffer };
  } catch (e) {
    console.warn('⚠️ No se pudo crear el sonido de tick:', e);
    return null;
  }
}

function playTick() {
  if (!tickAudioCtx) {
    const sound = createTickSound();
    if (!sound) return;
    tickAudioCtx = sound.ctx;
    tickAudioCtx.buffer = sound.buffer;
  }
  try {
    const source = tickAudioCtx.createBufferSource();
    source.buffer = tickAudioCtx.buffer;
    const gain = tickAudioCtx.createGain();
    gain.gain.value = 0.4;
    source.connect(gain).connect(tickAudioCtx.destination);
    source.start();
  } catch (e) {
    // silencio
  }
}

export function initContador(config) {
  console.log('🕒 Iniciando contador con fecha:', config.fechaISO);
  const target = new Date(config.fechaISO).getTime();
  if (isNaN(target)) {
    console.error('❌ Fecha inválida');
    document.getElementById('clock').innerHTML = '<p style="color:#ff9999;">Error: fecha inválida.</p>';
    return;
  }

  const els = {
    d: document.getElementById('d'),
    h: document.getElementById('h'),
    m: document.getElementById('m'),
    s: document.getElementById('s')
  };
  const clockEl = document.getElementById('clock');
  const modalContador = document.getElementById('modal-contador');

  // Limpiar intervalo anterior si existe
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }

  function actualizarContador() {
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      clockEl.style.display = 'none';
      if (document.getElementById('contador-terminado')) {
        document.getElementById('contador-terminado').style.display = 'block';
      }
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      return;
    }

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    els.d.textContent = String(days).padStart(2, '0');
    els.h.textContent = String(hours).padStart(2, '0');
    els.m.textContent = String(minutes).padStart(2, '0');
    els.s.textContent = String(seconds).padStart(2, '0');

    // Reproducir tick solo si el modal está abierto y el segundo cambió
    if (modalContador && modalContador.classList.contains('open')) {
      if (seconds !== prevSeconds) {
        prevSeconds = seconds;
        playTick();
      }
    }
  }

  // Inicializar prevSeconds
  const now = Date.now();
  const diff = target - now;
  if (diff > 0) {
    prevSeconds = Math.floor((diff % 60000) / 1000);
  } else {
    prevSeconds = -1;
  }

  // Ejecutar inmediatamente
  actualizarContador();

  // Programar actualización cada 100 ms para detectar cambios de segundo sin saltos
  intervalId = setInterval(actualizarContador, 100);

  // Si el modal se cierra, no hacemos nada, el sonido no se reproduce.
  // Si se abre, el sonido se activa automáticamente.

  // Función de limpieza (opcional)
  window._cleanContador = function() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}
