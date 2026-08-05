console.log('📦 contador.js (sin sonido de tick)');

let intervalId = null;

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
  }

  // Ejecutar inmediatamente
  actualizarContador();

  // Programar actualización cada 200 ms para que los segundos se vean fluidos
  intervalId = setInterval(actualizarContador, 200);

  // Función de limpieza (opcional)
  window._cleanContador = function() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}
