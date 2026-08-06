console.log('🚪 script-portal.js');

document.addEventListener('DOMContentLoaded', async function() {
  // Título / og:title con el nombre real, si config.json está disponible.
  // No es indispensable para que la reja funcione, así que si falla no bloquea nada.
  try {
    const res = await fetch(`config.json?t=${Date.now()}`);
    if (res.ok) {
      const config = await res.json();
      if (config.nombre) {
        document.title = `Mis XV años · ${config.nombre}`;
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.content = `Invitación a los XV años de ${config.nombre}`;
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.content = `Te invitamos a celebrar los 15 años de ${config.nombre}. ¡No faltes!`;
      }
    }
  } catch (e) { console.warn('⚠️ Config (portal):', e); }

  var portal = document.getElementById('portal');
  var gateWrapper = document.getElementById('gate-wrapper');
  var caption = document.querySelector('.portal-caption');

  setTimeout(function() {
    caption.classList.add('show');
    gateWrapper.classList.add('active');
  }, 2000);

  // ===== Utilidad: fade suave de volumen (para que el audio no se sienta cortado) =====
  function fadeVolumen(video, destino, duracionMs, onDone) {
    if (!video) { if (onDone) onDone(); return; }
    const inicio = video.volume;
    const t0 = performance.now();
    function paso(ahora) {
      const t = Math.min((ahora - t0) / duracionMs, 1);
      video.volume = inicio + (destino - inicio) * t;
      if (t < 1) {
        requestAnimationFrame(paso);
      } else if (onDone) {
        onDone();
      }
    }
    requestAnimationFrame(paso);
  }

  const FADE_IN_MS = 1300;     // fundido de entrada del audio (más largo = más seguro)
  const FADE_OUT_SKIP_MS = 400; // fundido si el usuario salta la transición

  // ===== FUNCIÓN ABRIR REJA: reproduce el video completo (con audio) y luego navega a principal/ =====
  function abrirReja(e) {
    if (e) e.stopPropagation();

    const overlay = document.getElementById('transition-overlay');
    const video = document.getElementById('transition-video');

    // 1. Mostrar overlay inmediatamente
    if (overlay) overlay.classList.add('show');

    // 2. Abrir la reja (animación)
    gateWrapper.classList.add('open');

    let finalizado = false;
    let timeoutId = null;

    // Termina la transición: navega a la app principal (página aparte).
    // Al ser una navegación real, el navegador destruye por completo este
    // video/audio antes de que exista la página principal — así nunca
    // pueden sonar/pisarse entre sí, y esa página solo carga UN video
    // (el de fondo, mar1.mp4) en vez de tres a la vez.
    const finalizar = () => {
      if (finalizado) return;
      finalizado = true;
      if (timeoutId) clearTimeout(timeoutId);
      window.location.href = 'principal/index.html';
    };

    const onError = (err) => {
      console.warn('Error en video:', err);
      finalizar();
    };

    // Red de seguridad por si el video nunca reproduce/termina.
    const programarSeguridad = (segundos) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.warn('⏰ Timeout de seguridad, finalizando transición');
        finalizar();
      }, segundos * 1000 + 500);
    };
    programarSeguridad(30); // tope amplio inicial mientras carga metadata

    const programarConDuracion = () => {
      if (video.duration && isFinite(video.duration)) {
        console.log(`⏱️ Duración real del video: ${video.duration.toFixed(1)}s`);
        programarSeguridad(video.duration);
      }
    };

    const onMetadata = () => programarConDuracion();

    if (video) {
      video.addEventListener('ended', finalizar);
      video.addEventListener('error', onError);

      // IMPORTANTE: play() se llama de inmediato, dentro del mismo gesto de clic del usuario,
      // si no el navegador deja de considerarlo una acción iniciada por el usuario y bloquea el audio.
      video.muted = false;
      video.volume = 0;
      try { video.currentTime = 0; } catch (err) { /* puede fallar si aún no hay metadata, no pasa nada */ }

      video.play().then(() => {
        fadeVolumen(video, 1, FADE_IN_MS);
      }).catch((err) => {
        console.warn('No se pudo reproducir con audio, reintentando en silencio:', err);
        video.muted = true;
        video.play().catch((err2) => {
          console.warn('No se pudo reproducir el video:', err2);
          finalizar();
        });
      });

      if (video.readyState >= 1 && video.duration && isFinite(video.duration)) {
        programarConDuracion();
      } else {
        video.addEventListener('loadedmetadata', onMetadata, { once: true });
      }
    } else {
      programarSeguridad(1);
    }

    // Permitir que el usuario haga clic en el overlay para saltar la transición
    if (overlay) overlay.addEventListener('click', finalizar);
  }

  gateWrapper.addEventListener('click', abrirReja);
  gateWrapper.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirReja(e); }
  });

  // ===== PARALLAX (solo portal) =====
  var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  var hasGyro = typeof DeviceOrientationEvent !== 'undefined';
  var gyroWorking = false;

  var portalInner = document.querySelector('.portal-inner');

  function applyParallax(x, y) {
    var invertX = -x;
    var invertY = -y;
    var maxOffset = 18;
    var offsetX = Math.min(Math.max(invertX, -maxOffset), maxOffset);
    var offsetY = Math.min(Math.max(invertY, -maxOffset), maxOffset);

    if (portalInner) {
      portalInner.style.transform = 'translate(' + (offsetX * 0.6) + 'px, ' + (offsetY * 0.6) + 'px)';
    }
  }

  var currentX = 0, currentY = 0;
  var targetX = 0, targetY = 0;

  function smoothParallax() {
    currentX += (targetX - currentX) * 0.1;
    currentY += (targetY - currentY) * 0.1;
    if (Math.abs(currentX - targetX) > 0.05 || Math.abs(currentY - targetY) > 0.05) {
      applyParallax(currentX, currentY);
      requestAnimationFrame(smoothParallax);
    } else {
      applyParallax(targetX, targetY);
    }
  }

  document.addEventListener('mousemove', function(e) {
    if (isMobile) return;
    var x = (e.clientX / window.innerWidth - 0.5) * 30;
    var y = (e.clientY / window.innerHeight - 0.5) * 30;
    targetX = x;
    targetY = y;
    if (Math.abs(currentX - targetX) > 0.1 || Math.abs(currentY - targetY) > 0.1) {
      requestAnimationFrame(smoothParallax);
    }
  });

  if (isMobile && hasGyro) {
    var gyroTest = function(e) {
      if (e.gamma !== null || e.beta !== null) {
        gyroWorking = true;
        window.removeEventListener('deviceorientation', gyroTest);
        window.addEventListener('deviceorientation', handleOrientation);
      }
    };
    window.addEventListener('deviceorientation', gyroTest);
    setTimeout(function() {
      if (!gyroWorking) {
        window.removeEventListener('deviceorientation', gyroTest);
      }
    }, 3000);
  }

  function handleOrientation(e) {
    var gamma = e.gamma || 0;
    var beta = e.beta || 0;
    var x = (gamma / 90) * 30;
    var y = ((beta - 45) / 90) * 30;
    targetX = x;
    targetY = y;
    if (Math.abs(currentX - targetX) > 0.1 || Math.abs(currentY - targetY) > 0.1) {
      requestAnimationFrame(smoothParallax);
    }
  }
});
