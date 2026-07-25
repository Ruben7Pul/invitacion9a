console.log('📦 contador');

export function initContador(config) {
  const target = new Date(config.fechaISO).getTime();
  if (isNaN(target)) {
    console.error('❌ fechaISO inválida en config.json:', config.fechaISO);
    return;
  }
  const els = { d: document.getElementById('d'), h: document.getElementById('h'), m: document.getElementById('m'), s: document.getElementById('s') };
  const clockEl = document.getElementById('clock');
  const doneEl = document.getElementById('contador-terminado');

  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) {
      clockEl.style.display = 'none';
      doneEl.style.display = 'block';
      clearInterval(timer);
      return;
    }
    els.d.textContent = String(Math.floor(diff / 86400000)).padStart(2, '0');
    els.h.textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
    els.m.textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    els.s.textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
  }
  tick();
  const timer = setInterval(tick, 1000);
}
