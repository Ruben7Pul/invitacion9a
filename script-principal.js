console.log('🚀 script-principal.js');

// ===== DETECCIÓN DE HORA =====
function detectarPeriodoDia() {
  const hora = new Date().getHours();
  let periodo = 'day';
  if (hora >= 6 && hora < 8) periodo = 'sunrise';
  else if (hora >= 8 && hora < 17) periodo = 'day';
  else if (hora >= 17 && hora < 19) periodo = 'sunset';
  else if (hora >= 19 || hora < 6) periodo = 'night';
  document.documentElement.setAttribute('data-time-period', periodo);
}
detectarPeriodoDia();
setInterval(detectarPeriodoDia, 60000);

// ===== CONFIGURACIÓN =====
async function cargarConfig() {
  try {
    const res = await fetch(`config.json?t=${Date.now()}`);
    if (!res.ok) throw new Error('HTTP error ' + res.status);
    const data = await res.json();
    if (!data.nombre) throw new Error('Falta "nombre"');
    return data;
  } catch {
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
  // Firma en agradecimientos
  const firmaNombre = document.getElementById('firma-nombre');
  if (firmaNombre) firmaNombre.textContent = config.nombre;
  // Libro de firmas (enlace genérico)
  const linkLibro = document.getElementById('link-libro-firmas');
  if (linkLibro) linkLibro.href = '#';
}

// ===== CALENDARIO =====
function generarCalendario() {
  const container = document.getElementById('calendario-container');
  if (!container) return;
  const year = 2026,
    month = 9,
    diasEspeciales = [8, 10, 11];
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
    if (d === 10) {
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

function marcarDiaActual() {
  const ahora = new Date();
  if (ahora.getFullYear() === 2026 && ahora.getMonth() === 9) {
    const dia = ahora.getDate();
    document.querySelectorAll('.calendario-container .dia').forEach(celda => {
      if (parseInt(celda.textContent) === dia) celda.classList.add('hoy');
    });
  }
}

// ===== EVENTOS CALENDARIO =====
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
      <button class="btn-agregar" data-evento='${JSON.stringify(ev)}'>📅 Añadir</button>
    `;
    container.appendChild(div);
  });
  container.querySelectorAll('.btn-agregar').forEach(btn => {
    btn.addEventListener('click', () => {
      const ev = JSON.parse(btn.dataset.evento);
      const fecha = new Date(ev.fechaISO);
      const inicio = fecha.toISOString().replace(/-|:|\.\d+/g, '');
      const fin = new Date(fecha.getTime() + ev.duracion * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d+/g, '');
      const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.desc + ' · ' + config.nombre)}&dates=${inicio}/${fin}&details=${encodeURIComponent('Invitación a los XV años de ' + config.nombre + '. ' + ev.desc)}&location=${encodeURIComponent('Iglesia de Tianguistenco de Galeana / Auditorio')}&sf=true&output=xml`;
      window.open(url, '_blank');
    });
  });
}

// ===== CONTADOR CON ANILLO (optimizado) =====
function initContadorCircular(config) {
  const target = new Date(config.fechaISO).getTime();
  if (isNaN(target)) return;
  const units = document.querySelectorAll('.clock .unit');
  if (!units.length) return;
  const msgEl = document.getElementById('contador-mensaje');
  const clockEl = document.querySelector('.clock');

  // Crear SVG una sola vez
  units.forEach(unit => {
    if (!unit.querySelector('.circle-wrap')) {
      const wrap = document.createElement('div');
      wrap.className = 'circle-wrap';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 60 60');
      svg.innerHTML = `<circle class="bg-circle" cx="30" cy="30" r="26"/><circle class="progress-circle" cx="30" cy="30" r="26" stroke-dasharray="163.36" stroke-dashoffset="0"/>`;
      wrap.appendChild(svg);
      const num = unit.querySelector('.num');
      unit.insertBefore(wrap, num);
      wrap.appendChild(num);
      num.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)';
    }
  });

  let animFrameId = null;
  let lastUpdate = 0;

  function actualizar() {
    const now = Date.now();
    const diff = target - now;
    if (diff <= 0) {
      if (clockEl) clockEl.style.display = 'none';
      if (msgEl) msgEl.textContent = '¡El gran día ha llegado! 🎉';
      if (animFrameId) cancelAnimationFrame(animFrameId);
      return;
    }
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    const values = [days, hours, minutes, seconds];
    const maxValues = [365, 24, 60, 60];
    units.forEach((unit, i) => {
      const num = unit.querySelector('.num');
      if (num) num.textContent = String(values[i]).padStart(2, '0');
      const circle = unit.querySelector('.progress-circle');
      if (circle) {
        const circumference = 163.36; // 2*PI*26
        const progress = maxValues[i] > 0 ? (maxValues[i] - values[i]) / maxValues[i] : 0;
        circle.style.strokeDashoffset = progress * circumference;
      }
    });
    // Mensaje dinámico
    if (msgEl) {
      let mensaje = '';
      if (days > 30) mensaje = 'Falta un poco más de un mes...';
      else if (days > 7) mensaje = 'La espera se hace corta.';
      else if (days > 1) mensaje = '¡Ya casi llega!';
      else if (days === 1) mensaje = '¡Mañana es el gran día!';
      else if (days === 0 && hours > 6) mensaje = '¡Hoy es el día!';
      else if (days === 0 && hours > 1) mensaje = '¡En unas horas comienza!';
      else if (days === 0 && hours >= 0) mensaje = '¡El momento está aquí!';
      msgEl.textContent = mensaje;
    }
    // Programar siguiente frame
    animFrameId = requestAnimationFrame(actualizar);
  }
  actualizar();
}

// ===== BRILLO ITINERARIO =====
function iniciarBrilloItinerario() {
  const ahora = new Date();
  if (ahora.getFullYear() !== 2026 || ahora.getMonth() !== 9) return;
  const dia = ahora.getDate();
  if (dia !== 10 && dia !== 11) return;
  const totalMinutos = ahora.getHours() * 60 + ahora.getMinutes();
  const items = document.querySelectorAll('.itinerario-item');
  if (!items.length) return;

  function actualizarBrillo() {
    const ahora2 = new Date();
    if (ahora2.getFullYear() !== 2026 || ahora2.getMonth() !== 9 || (ahora2.getDate() !== dia)) return;
    const total = ahora2.getHours() * 60 + ahora2.getMinutes();
    let activo = null;
    items.forEach(item => {
      const horaMin = parseInt(item.dataset.hora, 10);
      if (total >= horaMin) activo = item;
    });
    items.forEach(item => item.classList.remove('activo'));
    if (activo) activo.classList.add('activo');
  }
  actualizarBrillo();
  setInterval(actualizarBrillo, 60000);
}

// ===== INICIO =====
document.addEventListener('DOMContentLoaded', async () => {
  const config = await cargarConfig();
  rellenarDatos(config);
  generarCalendario();
  generarEventosCalendario(config);
  marcarDiaActual();
  initContadorCircular(config);
  iniciarBrilloItinerario();

  // Cargar módulos de sonido y música
  try {
    const { initSonidos } = await import('./modules/sonidos.js');
    initSonidos();
  } catch {}
  try {
    const { initMusica, playMusic, toggleMusic, resetMusic } = await import('./modules/musica.js');
    initMusica(config);
    window.playMusic = playMusic;
    window.toggleMusic = toggleMusic;
    window.resetMusic = resetMusic;
  } catch {}

  // ===== ABRIR JUEGO =====
  document.getElementById('nombre-hero').addEventListener('click', () => {
    window.location.href = 'juego1/';
  });

  // ===== REJA =====
  const portal = document.getElementById('portal');
  const gateWrapper = document.getElementById('gate-wrapper');
  const app = document.getElementById('app');
  const backBtn = document.getElementById('back-link');
  const caption = document.querySelector('.portal-caption');

  const volviendo = new URLSearchParams(window.location.search).get('volver') === '1';
  if (volviendo) {
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
    requestAnimationFrame(() => portal.classList.add('closing'));
    setTimeout(() => {
      portal.classList.remove('closing');
      setTimeout(() => {
        caption.classList.add('show');
        gateWrapper.classList.add('active');
      }, 2000);
    }, 700);
  }

  gateWrapper.addEventListener('click', abrirReja);
  gateWrapper.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault();
      abrirReja(e); }
  });
  backBtn.addEventListener('click', cerrarReja);

  // ===== PARALLAX =====
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  let currentX = 0,
    currentY = 0,
    targetX = 0,
    targetY = 0;
  const portalInner = document.querySelector('.portal-inner');
  const appInner = document.getElementById('app-inner');

  function applyParallax() {
    const maxOffset = 18;
    const ox = Math.min(Math.max(-targetX, -maxOffset), maxOffset);
    const oy = Math.min(Math.max(-targetY, -maxOffset), maxOffset);
    if (!portal.classList.contains('hide') && portalInner) {
      portalInner.style.transform = `translate(${ox*0.6}px, ${oy*0.6}px)`;
    }
    if (app.classList.contains('show') && appInner) {
      appInner.style.transform = `translate(${ox*0.45}px, ${oy*0.45}px)`;
    }
  }

  if (!isMobile) {
    document.addEventListener('mousemove', e => {
      if (portal.classList.contains('hide') && !app.classList.contains('show')) return;
      targetX = (e.clientX / window.innerWidth - 0.5) * 30;
      targetY = (e.clientY / window.innerHeight - 0.5) * 30;
      applyParallax();
    }, { passive: true });
  } else if (typeof DeviceOrientationEvent !== 'undefined') {
    window.addEventListener('deviceorientation', e => {
      if (e.gamma !== null && e.beta !== null) {
        targetX = (e.gamma / 90) * 30;
        targetY = ((e.beta - 45) / 90) * 30;
        applyParallax();
      }
    }, { passive: true });
  }

  // ===== MÚSICA TOGGLE =====
  document.getElementById('music-toggle').addEventListener('click', () => {
    if (window.toggleMusic) window.toggleMusic();
  });

  // ===== INTERSECTION OBSERVER PARA SECCIONES (solo entrada) =====
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        } else {
          // Eliminar clase para que al volver a entrar se repita la animación
          entry.target.classList.remove('visible');
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.seccion').forEach(sec => observer.observe(sec));
  } else {
    document.querySelectorAll('.seccion').forEach(sec => sec.classList.add('visible'));
  }
});
