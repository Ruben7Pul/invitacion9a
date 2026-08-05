console.log('🚀 script-principal.js');

// Detección de hora del día
function detectarPeriodoDia() {
  const ahora = new Date();
  const hora = ahora.getHours();
  let periodo = 'day';
  if (hora >= 6 && hora < 8) periodo = 'sunrise';
  else if (hora >= 8 && hora < 17) periodo = 'day';
  else if (hora >= 17 && hora < 19) periodo = 'sunset';
  else if (hora >= 19 || hora < 6) periodo = 'night';
  document.documentElement.setAttribute('data-time-period', periodo);
}
detectarPeriodoDia();
setInterval(detectarPeriodoDia, 60000);

async function cargarConfig() {
  try {
    const res = await fetch(`config.json?t=${Date.now()}`);
    if (!res.ok) throw new Error('HTTP error ' + res.status);
    return await res.json();
  } catch (e) {
    console.warn('⚠️ Error config:', e);
    return {
      nombre: 'Melina',
      fechaTexto: '10 de octubre de 2026',
      fechaISO: '2026-10-10T13:00:00',
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
  if (nombreEl) nombreEl.textContent = config.nombre;
  document.getElementById('frase-texto').textContent = config.frase;
  document.getElementById('hora-misa').textContent = config.horaMisa;
  document.getElementById('lugar-misa').textContent = config.ubicacionMisa;
  document.getElementById('mapa-misa').href = config.mapaMisa;
  document.getElementById('hora-fiesta').textContent = config.horaFiesta;
  document.getElementById('lugar-fiesta').textContent = config.ubicacionFiesta;
  document.getElementById('mapa-fiesta').href = config.mapaFiesta;
  document.getElementById('padre1').textContent = config.padre;
  document.getElementById('padre2').textContent = config.madre;
  document.getElementById('padrino1').textContent = config.padrino;
  document.getElementById('padrino2').textContent = config.madrina;
  document.title = `Mis XV años · ${config.nombre}`;
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.content = `Invitación a los XV años de ${config.nombre}`;
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.content = `Te invitamos a celebrar los 15 años de ${config.nombre}. ¡No faltes!`;

  // Rellenar firma
  document.getElementById('firma-nombre').textContent = config.nombre;
}

// ===== GENERAR CALENDARIO =====
function generarCalendario() {
  const container = document.getElementById('calendario-container');
  if (!container) return;
  const year = 2026, month = 9, fechaEspecial = 10;
  const diasEspeciales = [8, 10, 11];
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const primerDia = new Date(year, month, 1).getDay();
  const diasEnMes = new Date(year, month + 1, 0).getDate();

  container.innerHTML = '';
  diasSemana.forEach(nombre => {
    const div = document.createElement('div');
    div.className = 'dia-nombre';
    div.textContent = nombre;
    container.appendChild(div);
  });

  for (let i = 0; i < primerDia; i++) {
    const div = document.createElement('div');
    div.className = 'dia';
    div.style.visibility = 'hidden';
    container.appendChild(div);
  }

  for (let d = 1; d <= diasEnMes; d++) {
    const div = document.createElement('div');
    div.className = 'dia';
    if (d === fechaEspecial) {
      div.classList.add('especial', 'dia-10');
      div.innerHTML = `${d}<span class="rosa">🌹</span>`;
    } else if (diasEspeciales.includes(d)) {
      div.classList.add('especial');
      div.textContent = d;
    } else {
      div.textContent = d;
    }
    container.appendChild(div);
  }
}

// ===== MARCAR DÍA ACTUAL =====
function marcarDiaActual() {
  const ahora = new Date();
  if (ahora.getFullYear() === 2026 && ahora.getMonth() === 9) {
    const dia = ahora.getDate();
    document.querySelectorAll('.calendario-container .dia').forEach(celda => {
      if (parseInt(celda.textContent) === dia) celda.classList.add('hoy');
    });
  }
}

// ===== RESALTAR ACTIVIDAD ACTUAL =====
function iniciarBrilloItinerario() {
  const ahora = new Date();
  if (ahora.getFullYear() !== 2026 || ahora.getMonth() !== 9) return;
  const dia = ahora.getDate();
  if (dia !== 10 && dia !== 11) return;
  const totalMinutos = ahora.getHours() * 60 + ahora.getMinutes();

  const items = document.querySelectorAll('.itinerario-item');
  let activo = null;
  items.forEach(item => {
    if (totalMinutos >= parseInt(item.dataset.hora)) activo = item;
  });
  if (activo) activo.classList.add('activo');

  setInterval(() => {
    const ahora2 = new Date();
    if (ahora2.getDate() !== dia) return;
    const totalMin2 = ahora2.getHours() * 60 + ahora2.getMinutes();
    const items2 = document.querySelectorAll('.itinerario-item');
    let nuevo = null;
    items2.forEach(item => {
      if (totalMin2 >= parseInt(item.dataset.hora)) nuevo = item;
    });
    items2.forEach(item => item.classList.remove('activo'));
    if (nuevo) nuevo.classList.add('activo');
  }, 60000);
}

// ===== GENERAR EVENTOS DEL CALENDARIO =====
function generarEventosCalendario(config) {
  const container = document.getElementById('calendario-eventos');
  if (!container) return;
  const eventos = [
    { fecha: '8 de octubre', hora: '9:00 AM', desc: '🎂 Cumpleaños', fechaISO: '2026-10-08T09:00:00', duracion: 2 },
    { fecha: '10 de octubre', hora: '1:00 PM', desc: '🌹 XV años', fechaISO: '2026-10-10T13:00:00', duracion: 8 },
    { fecha: '11 de octubre', hora: '9:00 AM', desc: '☀️ Desayuno', fechaISO: '2026-10-11T09:00:00', duracion: 3 },
  ];
  container.innerHTML = '';
  eventos.forEach(ev => {
    const div = document.createElement('div');
    div.className = 'calendario-evento';
    div.innerHTML = `
      <div class="evento-info">
        <span class="fecha">${ev.fecha}</span>
        <span class="hora">${ev.hora}</span>
        <span class="desc">${ev.desc}</span>
      </div>
      <button class="btn-agregar">📅 Añadir</button>
    `;
    div.querySelector('.btn-agregar').addEventListener('click', () => {
      const fecha = new Date(ev.fechaISO);
      const inicio = fecha.toISOString().replace(/-|:|\.\d+/g, '');
      const fin = new Date(fecha.getTime() + ev.duracion * 3600000).toISOString().replace(/-|:|\.\d+/g, '');
      const titulo = encodeURIComponent(`${ev.desc} · ${config.nombre}`);
      const descripcion = encodeURIComponent(`Invitación a los XV años de ${config.nombre}. ${ev.desc}`);
      const ubicacion = encodeURIComponent('Iglesia de Tianguistenco de Galeana / Auditorio');
      const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${titulo}&dates=${inicio}/${fin}&details=${descripcion}&location=${ubicacion}&sf=true&output=xml`;
      window.open(url, '_blank');
    });
    container.appendChild(div);
  });
}

// ===== CONTADOR CIRCULAR =====
function initContadorCircular(config) {
  const target = new Date(config.fechaISO).getTime();
  if (isNaN(target)) return;

  const units = document.querySelectorAll('.clock .unit');
  if (!units.length) return;

  // Crear los SVG una sola vez
  units.forEach((unit) => {
    let circleWrap = unit.querySelector('.circle-wrap');
    if (!circleWrap) {
      const wrap = document.createElement('div');
      wrap.className = 'circle-wrap';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 60 60');
      svg.innerHTML = `
        <circle class="bg-circle" cx="30" cy="30" r="26" />
        <circle class="progress-circle" cx="30" cy="30" r="26" stroke-dasharray="163.36" stroke-dashoffset="0" />
      `;
      wrap.appendChild(svg);
      const num = unit.querySelector('.num');
      unit.insertBefore(wrap, num);
      wrap.appendChild(num);
      num.style.position = 'absolute';
      num.style.top = '50%';
      num.style.left = '50%';
      num.style.transform = 'translate(-50%, -50%)';
    }
  });

  function actualizar() {
    const diff = target - Date.now();
    if (diff <= 0) {
      document.querySelector('.clock').style.display = 'none';
      document.getElementById('contador-mensaje').textContent = '¡El gran día ha llegado! 🎉';
      return;
    }
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    const values = [days, hours, minutes, seconds];
    const maxValues = [365, 24, 60, 60];
    const circunferencia = 2 * Math.PI * 26;

    units.forEach((unit, i) => {
      const num = unit.querySelector('.num');
      if (num) num.textContent = String(values[i]).padStart(2, '0');
      const circle = unit.querySelector('.progress-circle');
      if (circle) {
        const progress = maxValues[i] > 0 ? (maxValues[i] - values[i]) / maxValues[i] : 0;
        circle.style.strokeDashoffset = progress * circunferencia;
      }
    });

    // Mensaje dinámico
    const msg = document.getElementById('contador-mensaje');
    if (msg) {
      let texto = '';
      if (days > 30) texto = 'Falta un poco más de un mes...';
      else if (days > 7) texto = 'La espera se hace corta.';
      else if (days > 1) texto = '¡Ya casi llega!';
      else if (days === 1) texto = '¡Mañana es el gran día!';
      else if (days === 0 && hours > 6) texto = '¡Hoy es el día!';
      else if (days === 0 && hours > 1) texto = '¡En unas horas comienza!';
      else if (days === 0 && hours >= 0) texto = '¡El momento está aquí!';
      msg.textContent = texto;
    }
  }

  actualizar();
  setInterval(actualizar, 200);
}

document.addEventListener('DOMContentLoaded', async () => {
  const config = await cargarConfig();
  rellenarDatos(config);
  generarCalendario();
  generarEventosCalendario(config);
  initContadorCircular(config);
  marcarDiaActual();
  iniciarBrilloItinerario();

  // Cargar módulos de sonido y música
  try {
    const { initSonidos } = await import('./modules/sonidos.js');
    initSonidos();
  } catch (e) { console.warn('Sonidos no disponibles'); }

  try {
    const { initMusica, playMusic, toggleMusic, resetMusic } = await import('./modules/musica.js');
    initMusica(config);
    window.playMusic = playMusic;
    window.toggleMusic = toggleMusic;
    window.resetMusic = resetMusic;
  } catch (e) { console.warn('Música no disponible'); }

  // ===== REJA Y APP =====
  const portal = document.getElementById('portal');
  const gateWrapper = document.getElementById('gate-wrapper');
  const app = document.getElementById('app');
  const backBtn = document.getElementById('back-link');
  const caption = document.querySelector('.portal-caption');
  const nombreEl = document.getElementById('nombre-hero');

  // Ir al juego al hacer clic en el nombre
  nombreEl.addEventListener('click', () => window.location.href = 'juego1/');

  const params = new URLSearchParams(window.location.search);
  const volviendoDelJuego = params.get('volver') === '1';

  if (volviendoDelJuego) {
    portal.classList.add('hide');
    app.classList.add('show');
    gateWrapper.classList.add('active', 'open');
    caption.classList.add('show');
    if (window.playMusic) window.playMusic();
    history.replaceState(null, '', window.location.pathname);
    document.documentElement.classList.remove('sin-reja');
  } else {
    setTimeout(() => {
      caption.classList.add('show');
      gateWrapper.classList.add('active');
    }, 2000);
  }

  function abrirReja(e) {
    if (e) e.stopPropagation();
    gateWrapper.classList.add('open');
    portal.classList.add('hide');
    app.classList.add('show');
    if (window.playMusic) window.playMusic();
  }

  function cerrarReja(e) {
    if (e) e.stopPropagation();
    app.classList.remove('show');
    portal.classList.remove('hide');
    gateWrapper.classList.remove('open');
    if (window.resetMusic) window.resetMusic();
    caption.classList.remove('show');
    gateWrapper.classList.remove('active');
    void portal.offsetHeight;
    requestAnimationFrame(() => {
      portal.classList.add('closing');
    });
    setTimeout(() => {
      portal.classList.remove('closing');
      setTimeout(() => {
        caption.classList.add('show');
        gateWrapper.classList.add('active');
      }, 2000);
    }, 700);
  }

  gateWrapper.addEventListener('click', abrirReja);
  gateWrapper.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirReja(e); }
  });
  backBtn.addEventListener('click', cerrarReja);

  // ===== PARALLAX (optimizado) =====
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const hasGyro = typeof DeviceOrientationEvent !== 'undefined';
  let gyroWorking = false;

  let appInner = document.getElementById('app-inner');
  if (!appInner) {
    appInner = document.createElement('div');
    appInner.id = 'app-inner';
    appInner.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:flex-start;width:100%;max-width:560px;gap:0.5rem;padding:0 0.5rem 2rem;';
    while (app.firstChild) appInner.appendChild(app.firstChild);
    app.appendChild(appInner);
  }

  const portalInner = document.querySelector('.portal-inner');
  let currentX = 0, currentY = 0, targetX = 0, targetY = 0;
  let frameId = null;

  function applyParallax(x, y) {
    const maxOffset = 18;
    const offsetX = Math.min(Math.max(-x, -maxOffset), maxOffset);
    const offsetY = Math.min(Math.max(-y, -maxOffset), maxOffset);
    if (!portal.classList.contains('hide') && portalInner) {
      portalInner.style.transform = `translate(${offsetX * 0.6}px, ${offsetY * 0.6}px)`;
    }
    if (app.classList.contains('show') && appInner) {
      appInner.style.transform = `translate(${offsetX * 0.45}px, ${offsetY * 0.45}px)`;
    }
  }

  function smoothParallax() {
    currentX += (targetX - currentX) * 0.1;
    currentY += (targetY - currentY) * 0.1;
    if (Math.abs(currentX - targetX) > 0.05 || Math.abs(currentY - targetY) > 0.05) {
      applyParallax(currentX, currentY);
      frameId = requestAnimationFrame(smoothParallax);
    } else {
      applyParallax(targetX, targetY);
      frameId = null;
    }
  }

  if (!isMobile) {
    document.addEventListener('mousemove', (e) => {
      if (portal.classList.contains('hide') && !app.classList.contains('show')) return;
      targetX = (e.clientX / window.innerWidth - 0.5) * 30;
      targetY = (e.clientY / window.innerHeight - 0.5) * 30;
      if (!frameId) frameId = requestAnimationFrame(smoothParallax);
    });
  }

  if (isMobile && hasGyro) {
    const gyroTest = (e) => {
      if (e.gamma !== null || e.beta !== null) {
        gyroWorking = true;
        window.removeEventListener('deviceorientation', gyroTest);
        window.addEventListener('deviceorientation', handleOrientation);
      }
    };
    window.addEventListener('deviceorientation', gyroTest);
    setTimeout(() => {
      if (!gyroWorking) window.removeEventListener('deviceorientation', gyroTest);
    }, 3000);
  }

  function handleOrientation(e) {
    if (portal.classList.contains('hide') && !app.classList.contains('show')) return;
    targetX = ((e.gamma || 0) / 90) * 30;
    targetY = (((e.beta || 45) - 45) / 90) * 30;
    if (!frameId) frameId = requestAnimationFrame(smoothParallax);
  }

  // ===== MÚSICA =====
  document.getElementById('music-toggle')?.addEventListener('click', () => {
    if (window.toggleMusic) window.toggleMusic();
  });

  // ===== OBSERVADOR DE SECCIONES (solo entrada) =====
  if ('IntersectionObserver' in window) {
    const secciones = document.querySelectorAll('.seccion');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.15 });
    secciones.forEach(sec => observer.observe(sec));
  } else {
    document.querySelectorAll('.seccion').forEach(sec => sec.classList.add('visible'));
  }
});
