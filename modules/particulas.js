console.log('📦 partículas optimizadas');

let petals = [];
let animationId = null;
let lastTime = 0;
let pauseCounter = 0;
let frameCounter = 0;

export function initParticulas(isMobile = false) {
  const layer = document.getElementById('petals-layer');
  if (!layer) return;

  const colors = ['#cc2233', '#e63946', '#b71c2e', '#d32f3f', '#ff1744', '#f44336'];
  const count = isMobile ? 5 : 8;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'petal';
    const size = 10 + Math.random() * 10;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    const x = Math.random() * 95;
    const y = -20 + Math.random() * 20;
    p.style.transform = `translate(${x}vw, ${y}vh) rotate(${Math.random() * 360}deg)`;
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.opacity = 0.4 + Math.random() * 0.4;
    layer.appendChild(p);
    petals.push({
      el: p,
      x, y,
      speed: 0.3 + Math.random() * 0.6,
      rotSpeed: (Math.random() - 0.5) * 2,
      drift: (Math.random() - 0.5) * 0.5,
      rot: Math.random() * 360
    });
  }

  function updatePetals(timestamp) {
    if (pauseCounter > 0) {
      animationId = requestAnimationFrame(updatePetals);
      return;
    }
    const delta = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0.016;
    lastTime = timestamp;

    frameCounter++;
    if (frameCounter % 2 === 0) {
      for (const p of petals) {
        p.y += p.speed * delta * 60;
        p.x += p.drift * delta * 60;
        p.rot += p.rotSpeed * delta * 60;
        p.el.style.transform = `translate(${p.x}vw, ${p.y}vh) rotate(${p.rot}deg)`;
        if (p.y > 110) {
          p.y = -10 - Math.random() * 20;
          p.x = Math.random() * 95;
          p.speed = 0.3 + Math.random() * 0.6;
          p.drift = (Math.random() - 0.5) * 0.5;
          p.rot = Math.random() * 360;
          p.el.style.transform = `translate(${p.x}vw, ${p.y}vh) rotate(${p.rot}deg)`;
          p.el.style.opacity = 0.4 + Math.random() * 0.4;
        }
      }
    }
    animationId = requestAnimationFrame(updatePetals);
  }

  if (animationId) cancelAnimationFrame(animationId);
  lastTime = 0;
  frameCounter = 0;
  updatePetals(0);
}

export function pauseParticulas() { pauseCounter++; }
export function resumeParticulas() {
  if (pauseCounter > 0) {
    pauseCounter--;
    if (pauseCounter === 0) lastTime = 0;
  }
}
export function burst(cx, cy, count = 12) { /* mantiene compatibilidad */ }
