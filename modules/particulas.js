console.log('📦 partículas (setInterval fijo)');

let petals = [];
let intervalId = null;

export function initParticulas() {
  const layer = document.getElementById('petals-layer');
  if (!layer) {
    console.error('❌ #petals-layer no encontrado');
    return;
  }

  // Crear 6 pétalos
  const colors = ['#e08a99', '#d68a96', '#f0d9a3', '#c9a24d', '#8a2c3b', '#f0d9a3'];
  for (let i = 0; i < 6; i++) {
    const p = document.createElement('div');
    p.className = 'petal';
    const size = 10 + Math.random() * 8;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.left = Math.random() * 95 + 'vw';
    p.style.top = -20 + Math.random() * 10 + 'vh';
    p.style.background = colors[i % colors.length];
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    layer.appendChild(p);
    petals.push({
      el: p,
      x: parseFloat(p.style.left),
      y: parseFloat(p.style.top),
      speed: 0.5 + Math.random() * 0.5, // píxeles por frame (a 60 FPS)
      rotSpeed: (Math.random() - 0.5) * 2,
      drift: (Math.random() - 0.5) * 0.4,
      size: size
    });
  }

  // Limpiar intervalo anterior si existe
  if (intervalId) clearInterval(intervalId);
  
  // Mover pétalos cada 16ms (60 FPS fijos)
  intervalId = setInterval(() => {
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
        p.speed = 0.5 + Math.random() * 0.5;
        p.drift = (Math.random() - 0.5) * 0.4;
        p.el.style.left = p.x + 'vw';
        p.el.style.top = p.y + 'vh';
      }
    }
  }, 16); // 16ms = ~60 FPS

  console.log('✅ 6 pétalos creados y animados con setInterval (60 FPS)');
}

export function burst() { /* vacío */ }
