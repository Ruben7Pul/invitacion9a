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

// ---- MARIPOSAS CON MOVIMIENTO REALISTA (JS) ----
function iniciarMariposas() {
  const emojis = ['🦋', '🦋', '🦋', '🦋'];
  const container = document.body;
  const mariposas = [];

  emojis.forEach((emoji, i) => {
    const el = document.createElement('div');
    el.className = 'mariposa';
    el.textContent = emoji;
    // Posición inicial aleatoria
    const x = Math.random() * 80 + 10; // 10-90vw
    const y = Math.random() * 80 + 10;
    el.style.left = x + 'vw';
    el.style.top = y + 'vh';
    el.style.transform = 'rotate(0deg) scale(1, 1)';
    container.appendChild(el);

    // Estado de la mariposa
    const mariposa = {
      el: el,
      x: x,
      y: y,
      // Dirección actual en radianes
      angle: Math.random() * 2 * Math.PI,
      // Velocidad (módulo)
      speed: 0.4 + Math.random() * 0.6,
      // Objetivo (punto al que se dirige)
      targetX: x,
      targetY: y,
      // Tiempo hasta próximo cambio de objetivo
      changeTimer: 0,
      // Suavizado de rotación (lerp)
      currentAngle: Math.random() * 2 * Math.PI,
      // Aleteo
      wingPhase: Math.random() * 2 * Math.PI,
      wingSpeed: 2 + Math.random() * 2,
    };

    mariposas.push(mariposa);
  });

  // Función para generar un nuevo objetivo dentro de los límites
  function nuevoObjetivo(mariposa) {
    const margin = 10;
    mariposa.targetX = margin + Math.random() * (100 - 2 * margin);
    mariposa.targetY = margin + Math.random() * (100 - 2 * margin);
    mariposa.changeTimer = 3 + Math.random() * 5; // segundos hasta próximo cambio
  }

  // Inicializar objetivos
  mariposas.forEach(m => {
    nuevoObjetivo(m);
    // Además, establecer una dirección inicial hacia el objetivo
    const dx = m.targetX - m.x;
    const dy = m.targetY - m.y;
    m.angle = Math.atan2(dy, dx);
    m.currentAngle = m.angle;
  });

  let lastTimestamp = 0;

  function animarMariposas(timestamp) {
    const delta = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 1000, 0.05) : 0.016;
    lastTimestamp = timestamp;

    for (const m of mariposas) {
      // Reducir temporizador para cambio de objetivo
      m.changeTimer -= delta;
      if (m.changeTimer <= 0) {
        nuevoObjetivo(m);
      }

      // Calcular dirección hacia el objetivo
      const dx = m.targetX - m.x;
      const dy = m.targetY - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0.5) {
        // Ángulo deseado
        const targetAngle = Math.atan2(dy, dx);
        // Interpolar suavemente el ángulo actual hacia el deseado (lerp)
        let diff = targetAngle - m.currentAngle;
        // Normalizar a [-PI, PI]
        diff = ((diff % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
        m.currentAngle += diff * Math.min(1, 4 * delta); // velocidad de giro

        // Mover hacia el objetivo con aceleración suave
        const speedFactor = Math.min(1, dist / 5); // más lento cerca del objetivo
        const moveSpeed = m.speed * speedFactor * delta * 60;
        m.x += Math.cos(m.currentAngle) * moveSpeed;
        m.y += Math.sin(m.currentAngle) * moveSpeed;

        // Actualizar el ángulo visual (para la rotación del elemento)
        m.angle = m.currentAngle;
      }

      // Aleteo: oscilación en escala Y y rotación en X
      m.wingPhase += delta * m.wingSpeed;
      const wingFlap = Math.sin(m.wingPhase);
      // Escala en Y: 0.7 a 1.3, y un pequeño giro en X para dar profundidad
      const scaleY = 0.75 + 0.25 * Math.sin(m.wingPhase);
      const rotateX = 5 * Math.sin(m.wingPhase * 0.8); // grados

      // Aplicar transformación: traslación + rotación (hacia donde mira) + aleteo
      const angleDeg = (m.angle * 180 / Math.PI);
      // Invertir el escalado en Y según la dirección para que el aleteo sea asimétrico
      const flip = Math.cos(m.angle) > 0 ? 1 : -1; // para que mire hacia la derecha
      // La mariposa siempre mira hacia la derecha por defecto, pero la rotación la orienta
      // Usamos scaleY y rotateX para el aleteo
      m.el.style.transform = `
        translate(${m.x}vw, ${m.y}vh)
        rotate(${angleDeg}deg)
        scale(1, ${scaleY})
        rotateX(${rotateX}deg)
      `;
      // Ajuste de opacidad para dar sensación de profundidad
      m.el.style.opacity = 0.6 + 0.3 * (0.5 + 0.5 * Math.sin(m.wingPhase * 0.5));
    }

    requestAnimationFrame(animarMariposas);
  }

  // Iniciar animación
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
