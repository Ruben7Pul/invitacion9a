console.log('📦 contador.js (con sonido de reloj)');

let audioCtx = null;
let oscillator = null;
let gainNode = null;
let isPlaying = false;

function createTickSound() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Usamos un sonido de tic-tac suave: dos tonos cortos (tic y tac)
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
    // Segundo tono (tac) ligeramente diferente
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(900, now + 0.05);
    gain2.gain.setValueAtTime(0.12, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.13);
  } catch (e) {
    // Silenciar error (no crucial)
  }
}

let tickInterval = null;

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
  const doneEl = document.getElementById('contador-terminado');

  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) {
      clockEl.style.display = 'none';
      if (doneEl) doneEl.style.display = 'block';
      clearInterval(tickInterval);
      stopTickSound();
      return;
    }
    els.d.textContent = String(Math.floor(diff / 86400000)).padStart(2, '0');
    els.h.textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
    els.m.textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    els.s.textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    
    // Reproducir sonido de tic-tac en cada cambio de segundo (solo si el modal está abierto)
    const modal = document.getElementById('modal-contador');
    if (modal && modal.classList.contains('open')) {
      createTickSound();
    }
  }

  // Función para iniciar el intervalo
  function startTicking() {
    if (tickInterval) clearInterval(tickInterval);
    tick();
    tickInterval = setInterval(tick, 1000);
  }

  // Observar la apertura/cierre del modal para activar/desactivar el sonido
  const modalContador = document.getElementById('modal-contador');
  if (modalContador) {
    const observer = new MutationObserver(() => {
      if (modalContador.classList.contains('open')) {
        // Modal abierto: asegurar que el intervalo esté corriendo
        if (!tickInterval) startTicking();
      } else {
        // Modal cerrado: detener sonido (pero el intervalo sigue corriendo para actualizar la hora)
        // No detenemos el intervalo, solo el sonido se controla en tick()
      }
    });
    observer.observe(modalContador, { attributes: true, attributeFilter: ['class'] });
  }

  // Iniciar el intervalo siempre (actualiza la hora aunque el modal esté cerrado)
  startTicking();

  // Al cerrar la página, limpiar
  window.addEventListener('beforeunload', () => {
    if (tickInterval) clearInterval(tickInterval);
  });
}
