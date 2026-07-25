// particulas.js - Estrellas, pétalos, confeti, cursor
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initParticulas() {
  if (reduce) return;
  crearEstrellasFugaces();
  crearPetalesFlotantes();
  crearChispasCursor();
}

function crearEstrellasFugaces() {
  const container = document.getElementById('stars');
  if (!container) return;
  setInterval(() => {
    const star = document.createElement('div');
    star.className = 'shooting-star';
    const x = Math.random() * 90 + 5;
    const y = Math.random() * 40 + 5;
    const angle = Math.PI / 4 + Math.random() * 0.8;
    const dist = 150 + Math.random() * 200;
    star.style.left = x + 'vw';
    star.style.top = y + 'vh';
    star.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
    star.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
    star.style.animationDuration = (1.2 + Math.random() * 0.8) + 's';
    container.appendChild(star);
    setTimeout(() => star.remove(), 2500);
  }, 4000);
}

function crearPetalesFlotantes() {
  const layer = document.getElementById('petals-layer');
  if (!layer) return;
  const colors = ['#e08a99', '#d68a96', '#f0d9a3', '#c9a24d', '#8a2c3b'];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'petal-float';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.top = -5 + Math.random() * 5 + 'vh';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.width = (8 + Math.random() * 10) + 'px';
    p.style.height = (8 + Math.random() * 12) + 'px';
    p.style.borderRadius = Math.random() > 0.5 ? '60% 0 60% 0' : '0 60% 0 60%';
    p.style.animationDuration = (12 + Math.random() * 10) + 's';
    p.style.animationDelay = (Math.random() * 8) + 's';
    layer.appendChild(p);
  }
}

function crearChispasCursor() {
  const layer = document.getElementById('cursor-layer');
  if (!layer) return;
  let last = 0;
  const handler = (e) => {
    const now = performance.now();
    if (now - last < 40) return;
    last = now;
    const s = document.createElement('div');
    s.className = 'cursor-spark';
    s.style.left = (e.clientX + (Math.random() * 12 - 6)) + 'px';
    s.style.top = (e.clientY + (Math.random() * 12 - 6)) + 'px';
    layer.appendChild(s);
    s.addEventListener('animationend', () => s.remove());
  };
  window.addEventListener('mousemove', handler);
  window.addEventListener('touchmove', (e) => {
    if (e.touches[0]) handler({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
  }, { passive: true });
}

// Función para explosión de chispas (se usa desde otros módulos)
export function burst(x, y, count = 14) {
  for (let i = 0; i < count; i++) {
    const d = document.createElement('div');
    d.className = 'burst-dot';
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const dist = 30 + Math.random() * 35;
    d.style.setProperty('--bx', Math.cos(angle) * dist + 'px');
    d.style.setProperty('--by', Math.sin(angle) * dist + 'px');
    d.style.left = x + 'px';
    d.style.top = y + 'px';
    document.body.appendChild(d);
    d.addEventListener('animationend', () => d.remove());
  }
}
