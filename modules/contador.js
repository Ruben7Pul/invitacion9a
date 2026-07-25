// contador.js - Cuenta regresiva con fecha fija
console.log('📦 módulo contador.js cargado');

export function initContador(config) {
  console.log('🕒 Iniciando contador...');

  // ⭐ FECHA FIJA: cámbiala AQUÍ si es necesario
  const FECHA_FIJA = new Date("2026-10-24T13:00:00");
  console.log('📅 Fecha fija para contador:', FECHA_FIJA);

  const target = isNaN(FECHA_FIJA.getTime()) 
    ? new Date(config.fechaISO).getTime() 
    : FECHA_FIJA.getTime();

  console.log('⏱️ Target timestamp:', target);

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
  console.log('✅ Contador iniciado correctamente');
}
