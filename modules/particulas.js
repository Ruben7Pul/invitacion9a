console.log('📦 partículas optimizadas (8 pétalos, frame skipping)');

let petals = [];
let animationId = null;
let lastTime = 0;
let pauseCounter = 0;
let frameCount = 0;

export function initParticulas() {
  const layer = document.getElementById('petals-layer');
  if (!layer) {
    console.error('❌ #petals-layer no encontrado');
    return;
  }

  const colors = ['#cc2233', '#e63946', '#b71c2e', '#d32f3f', '#ff1744', '#f44336'];
  const count = 8; // reducido de 12 a 8

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'petal';
    const size = 10 + Math.random() * 10;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    const x = Math.random() * 95;
    const y = -20 + Math.random() * 20;
    p.style.transform = `translate3d(${x}vw, ${y}vh, 0) rotate(${Math.random() * 360}deg)`;
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.opacity = 0.4 + Math.random() * 0.4;
    layer.appendChild(p);
    petals.push({
      el: p,
      x: x,
      y: y,
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

    // Saltar un frame de cada dos para reducir carga (mantiene fluidez)
    frameCount++;
    if (frameCount % 2 === 0) {
      for (const p of petals) {
        p.y += p.speed * delta * 60;
        p.x += p.drift * delta * 60;
        p.rot += p.rotSpeed * delta * 60;

        p.el.style.transform = `translate3d(${p.x}vw, ${p.y}vh, 0) rotate(${p.rot}deg)`;

        if (p.y > 110) {
          p.y = -10 - Math.random() * 20;
          p.x = Math.random() * 95;
          p.speed = 0.3 + Math.random() * 0.6;
          p.drift = (Math.random() - 0.5) * 0.5;
          p.rot = Math.random() * 360;
          p.el.style.transform = `translate3d(${p.x}vw, ${p.y}vh, 0) rotate(${p.rot}deg)`;
          p.el.style.opacity = 0.4 + Math.random() * 0.4;
        }
      }
    }
    animationId = requestAnimationFrame(updatePetals);
  }

  if (animationId) cancelAnimationFrame(animationId);
  lastTime = 0;
  frameCount = 0;
  updatePetals(0);
  console.log('✅ Pétalos optimizados (8, frame skipping)');
}

export function pauseParticulas() {
  pauseCounter++;
  console.log(`⏸️ Pétalos pausados (contador: ${pauseCounter})`);
}

export function resumeParticulas() {
  if (pauseCounter > 0) {
    pauseCounter--;
    if (pauseCounter === 0) {
      lastTime = 0;
      frameCount = 0;
      console.log('▶️ Pétalos reanudados');
    } else {
      console.log(`⏸️ Pétalos aún pausados (contador: ${pauseCounter})`);
    }
  } else {
    console.warn('⚠️ resumeParticulas llamado sin pausa activa');
  }
}

export function burst() { /* compatibilidad */ }
