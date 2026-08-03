console.log('🚀 script 1b.js');

async function cargarConfig() {
  try {
    const res = await fetch(`config.json?t=${Date.now()}`);
    if (!res.ok) throw new Error('HTTP error ' + res.status);
    const data = await res.json();
    if (!data.nombre) throw new Error('Falta el campo "nombre"');
    return data;
  } catch (e) {
    console.warn('⚠️ Error al cargar config.json:', e);
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:rgba(0,0,0,0.8); color:#fff; padding:1rem 2rem; border-radius:12px; z-index:999; text-align:center; font-family:sans-serif;';
    errorDiv.innerHTML = `<p>⚠️ No se pudo cargar la configuración.</p><p style="font-size:0.8rem; opacity:0.7;">Usando valores de respaldo.</p>`;
    document.body.prepend(errorDiv);
    return {
      nombre: 'Dania',
      fechaTexto: '24 de octubre de 2026',
      fechaISO: '2026-10-24T13:00:00',
      frase: 'Con la bendición de Dios...',
      horaMisa: '3:00 pm',
      ubicacionMisa: 'Iglesia',
      mapaMisa: '#',
      horaFiesta: '1:00 pm',
      ubicacionFiesta: 'Salón',
      mapaFiesta: '#',
      padre: 'Papá',
      madre: 'Mamá',
      padrino: 'Padrino',
      madrina: 'Madrina',
      audioFile: 'archivos/cancion.mp3'
    };
  }
}

function rellenarDatos(config) {
  const nombreEl = document.getElementById('nombre-hero');
  if (nombreEl) {
    nombreEl.textContent = config.nombre;
    nombreEl.setAttribute('data-text', config.nombre);
  }
  const fechaEl = document.getElementById('fecha-fija');
  if (fechaEl) fechaEl.textContent = config.fechaTexto;
  const fraseEl = document.getElementById('frase-texto');
  if (fraseEl) fraseEl.textContent = config.frase;
  const horaMisa = document.getElementById('hora-misa');
  if (horaMisa) horaMisa.textContent = config.horaMisa;
  const lugarMisa = document.getElementById('lugar-misa');
  if (lugarMisa) lugarMisa.textContent = config.ubicacionMisa;
  const mapaMisa = document.getElementById('mapa-misa');
  if (mapaMisa) mapaMisa.href = config.mapaMisa;
  const horaFiesta = document.getElementById('hora-fiesta');
  if (horaFiesta) horaFiesta.textContent = config.horaFiesta;
  const lugarFiesta = document.getElementById('lugar-fiesta');
  if (lugarFiesta) lugarFiesta.textContent = config.ubicacionFiesta;
  const mapaFiesta = document.getElementById('mapa-fiesta');
  if (mapaFiesta) mapaFiesta.href = config.mapaFiesta;
  const padre1 = document.getElementById('padre1');
  if (padre1) padre1.textContent = config.padre;
  const padre2 = document.getElementById('padre2');
  if (padre2) padre2.textContent = config.madre;
  const padrino1 = document.getElementById('padrino1');
  if (padrino1) padrino1.textContent = config.padrino;
  const padrino2 = document.getElementById('padrino2');
  if (padrino2) padrino2.textContent = config.madrina;
  document.title = `Mis XV años · ${config.nombre}`;
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.content = `Invitación a los XV años de ${config.nombre}`;
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.content = `Te invitamos a celebrar los 15 años de ${config.nombre}. ¡No faltes!`;
}

// ---- MARIPOSAS CON MOVIMIENTO REALISTA (JS) — versión corregida ----
function iniciarMariposas() {
  const emojis = ['🦋', '🦋', '🦋', '🦋'];
  const container = document.body;
  const mariposas = [];

  emojis.forEach((emoji) => {
    const el = document.createElement('div');
    el.className = 'mariposa';
    el.textContent = emoji;
    // Importante: NO usar left/top, toda la posición vive en el transform.
    el.style.left = '0';
    el.style.top = '0';

    const x = 10 + Math.random() * 80; // 10-90 vw
    const y = 10 + Math.random() * 80; // 10-90 vh

    const mariposa = {
      el,
      x, y,
      angle: 0,
      speed: 0.4 + Math.random() * 0.6,
      targetX: x,
      targetY: y,
      changeTimer: 0,
      currentAngle: 0,
      facing: 1,               // 1 = mira a la derecha, -1 = mira a la izquierda
      wingPhase: Math.random() * Math.PI * 2,
      wingSpeed: 2 + Math.random() * 2,
    };

    // Colocamos el transform inicial ANTES de insertarla, así no hay salto/flash.
    el.style.transform = `translate(${x}vw, ${y}vh)`;
    container.appendChild(el);
    mariposas.push(mariposa);
  });

  function nuevoObjetivo(m) {
    const margin = 10;
    m.targetX = margin + Math.random() * (100 - 2 * margin);
    m.targetY = margin + Math.random() * (100 - 2 * margin);
    m.changeTimer = 3 + Math.random() * 5;
  }

  mariposas.forEach(m => {
    nuevoObjetivo(m);
    const dx = m.targetX - m.x;
    const dy = m.targetY - m.y;
    m.angle = Math.atan2(dy, dx);
    m.currentAngle = m.angle;
    m.facing = Math.cos(m.angle) >= 0 ? 1 : -1;
  });

  let lastTimestamp = 0;

  function animarMariposas(timestamp) {
    const delta = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 1000, 0.05) : 0.016;
    lastTimestamp = timestamp;

    for (const m of mariposas) {
      m.changeTimer -= delta;
      if (m.changeTimer <= 0) nuevoObjetivo(m);

      const dx = m.targetX - m.x;
      const dy = m.targetY - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0.5) {
        const targetAngle = Math.atan2(dy, dx);
        let diff = targetAngle - m.currentAngle;
        diff = ((diff % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
        m.currentAngle += diff * Math.min(1, 4 * delta); // giro suave

        const speedFactor = Math.min(1, dist / 5); // frena cerca del objetivo
        const moveSpeed = m.speed * speedFactor * delta * 60;
        m.x += Math.cos(m.currentAngle) * moveSpeed;
        m.y += Math.sin(m.currentAngle) * moveSpeed;
        m.angle = m.currentAngle;

        // Solo cambia de "cara" cuando el rumbo es claramente horizontal,
        // para que no se voltee constantemente con giros pequeños.
        if (Math.cos(m.angle) > 0.15) m.facing = 1;
        else if (Math.cos(m.angle) < -0.15) m.facing = -1;
      }

      // Aleteo suave e independiente del rumbo (rango sutil, ya no agresivo)
      m.wingPhase += delta * m.wingSpeed;
      const wingScale = 0.88 + 0.12 * Math.sin(m.wingPhase);

      // Inclinación limitada según si sube o baja — nada de rotación completa
      const tiltDeg = Math.max(-14, Math.min(14, Math.sin(m.angle) * 14));

      m.el.style.transform = `
        translate(${m.x}vw, ${m.y}vh)
        rotate(${tiltDeg}deg)
        scale(${m.facing}, ${wingScale})
      `;
      m.el.style.opacity = 0.65 + 0.25 * (0.5 + 0.5 * Math.sin(m.wingPhase * 0.5));
    }

    requestAnimationFrame(animarMariposas);
  }

  requestAnimationFrame(animarMariposas);
}

document.addEventListener('DOMContentLoaded', async () => {
  const config = await cargarConfig();
  rellenarDatos(config);

  // Mariposas (con JS)
  iniciarMariposas();

  try {
    const { initSonidos } = await import('./modules/sonidos.js');
    initSonidos();
  } catch (e) { console.error('❌ Sonidos:', e); }

  try {
    const { initParticulas } = await import('./modules/particulas.js');
    initParticulas();
  } catch (e) { console.error('❌ Partículas:', e); }

  try {
    const { initMusica, playMusic, toggleMusic, resetMusic } = await import('./modules/musica.js');
    initMusica(config);
    window.playMusic = playMusic;
    window.toggleMusic = toggleMusic;
    window.resetMusic = resetMusic;
  } catch (e) { console.error('❌ Música:', e); }

  let appIniciada = false;
  async function iniciarApp() {
    if (appIniciada) return;
    appIniciada = true;

    try {
      const { initContador } = await import('./modules/contador.js');
      initContador(config);
    } catch (e) { console.error('❌ Contador:', e); }

    try {
      const { initModal } = await import('./modules/modal.js');
      initModal();
    } catch (e) { console.error('❌ Modal:', e); }

    try {
      const { initJuego } = await import('./modules/juego.js');
      initJuego(config);
    } catch (e) { console.error('❌ Juego:', e); }

    const muteBtn = document.getElementById('music-toggle');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        if (window.toggleMusic) window.toggleMusic();
      });
    }
  }

  const portal = document.getElementById('portal');
  const gateWrapper = document.getElementById('gate-wrapper');
  const app = document.getElementById('app');
  const backBtn = document.getElementById('back-link');
  const caption = document.querySelector('.portal-caption');

  gateWrapper.classList.remove('active');
  caption.classList.remove('show');

  setTimeout(() => {
    caption.classList.add('show');
    gateWrapper.classList.add('active');
  }, 2000);

  function abrirReja() {
    console.log('🔄 Abriendo la reja');
    gateWrapper.classList.add('open');
    portal.classList.add('hide');
    app.classList.add('show');
    iniciarApp();
    if (window.playMusic) window.playMusic();
  }

  function cerrarReja() {
    console.log('↩️ Volviendo a la reja');
    app.classList.remove('show');
    portal.classList.remove('hide');
    portal.classList.add('closing');
    gateWrapper.classList.remove('open');
    if (window.resetMusic) window.resetMusic();
    setTimeout(() => {
      portal.classList.remove('closing');
    }, 700);
    caption.classList.remove('show');
    gateWrapper.classList.remove('active');
    setTimeout(() => {
      caption.classList.add('show');
      gateWrapper.classList.add('active');
    }, 2000);
  }

  if (gateWrapper) {
    gateWrapper.addEventListener('click', (e) => {
      e.preventDefault();
      abrirReja();
    });
    gateWrapper.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        abrirReja();
      }
    });
  } else {
    console.error('❌ No se encontró #gate-wrapper');
  }

  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      cerrarReja();
    });
  }
});
