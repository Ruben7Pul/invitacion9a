console.log('📦 contador.js (usa fecha de config.json)');

export function initContador(config) {
  console.log('🕒 Iniciando contador con fecha:', config.fechaISO);
  
  const target = new Date(config.fechaISO).getTime();
  
  if (isNaN(target)) {
    console.error('❌ Fecha inválida en config.json:', config.fechaISO);
    document.getElementById('clock').innerHTML = '<p style="color:#ff9999;">Error: fecha inválida en la configuración.</p>';
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
      doneEl.style.display = 'block';
      clearInterval(timer);
      console.log('🎉 Contador finalizado');
      return;
    }
    els.d.textContent = String(Math.floor(diff / 86400000)).padStart(2, '0');
    els.h.textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
    els.m.textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    els.s.textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
  }
  tick();
  const timer = setInterval(tick, 1000);
  console.log('✅ Contador iniciado con fecha:', new Date(target).toLocaleString());
}
