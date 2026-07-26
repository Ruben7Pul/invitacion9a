console.log('📦 partículas (pétalos rojos con requestAnimationFrame)');

let petals = [];
let animationId = null;

export function initParticulas() {
  const layer = document.getElementById('petals-layer');
  if (!layer) {
    console.error('❌ #petals-layer no encontrado');
    return;
  }

  const colors = ['#cc2233', '#e63946', '#b71c2e', '#d32f3f', '#ff1744', '#f44336'];
  const count = 18;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'petal';
    const size = 10 + Math.random() * 10;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.left = Math.random() * 95 + 'vw';
    p.style.top = -20 + Math.random() * 20 + 'vh';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    p.style.opacity = 0.4 + Math.random() * 0.4;
    layer.appendChild(p);
    petals.push({
      el: p,
      x: parseFloat(p.style.left),
      y: parseFloat(p.style.top),
      speed: 0.3 + Math.random() * 0.6,
      rotSpeed: (Math.random() - 0.5) * 2,
      drift: (Math.random() - 0.5) * 0.5,
    });
  }

  function updatePetals() {
    for (const p of petals) {
      p.y += p.speed;
      p.x += p.drift;
      p.el.style.top = p.y + 'vh';
      p.el.style.left = p.x + 'vw';
      const currentRot = parseFloat(p.el.style.transform?.match(/[\d.]+/)?.[0] || 0);
      p.el.style.transform = `rotate(${currentRot + p.rotSpeed}deg)`;

      if (p.y > 110) {
        p.y = -10 - Math.random() * 20;
        p.x = Math.random() * 95;
        p.speed = 0.3 + Math.random() * 0.6;
        p.drift = (Math.random() - 0.5) * 0.5;
        p.el.style.left = p.x + 'vw';
        p.el.style.top = p.y + 'vh';
        p.el.style.opacity = 0.4 + Math.random() * 0.4;
      }
    }
    animationId = requestAnimationFrame(updatePetals);
  }

  if (animationId) cancelAnimationFrame(animationId);
  updatePetals();
  console.log('✅ 18 pétalos rojos con requestAnimationFrame');
}

export function burst() { /* compatibilidad */ }
