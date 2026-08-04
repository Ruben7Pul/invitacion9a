console.log('📦 contador.js con sonido tick');

import { soundTap } from './sonidos.js';

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

  let lastSecond = -1;

  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) {
      clockEl.style.display = 'none';
      if (doneEl) doneEl.style.display = 'block';
      clearInterval(timer);
      return;
    }
    const seconds = Math.floor(diff / 1000);
    if (seconds !== lastSecond) {
      lastSecond = seconds;
      soundTap(); // Sonido cada segundo
    }
    els.d.textContent = String(Math.floor(diff / 86400000)).padStart(2, '0');
    els.h.textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
    els.m.textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    els.s.textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
  }
  tick();
  const timer = setInterval(tick, 1000);
}
