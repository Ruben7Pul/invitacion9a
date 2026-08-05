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
  return periodo;
}
detectarPeriodoDia();
setInterval(detectarPeriodoDia, 60000);

async function cargarConfig() {
  try {
    const res = await fetch(`config.json?t=${Date.now()}`);
    if (!res.ok) throw new Error('HTTP error ' + res.status);
    const data = await res.json();
    if (!data.nombre) throw new Error('Falta "nombre"');
    return data;
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
  if (nombreEl) {
    nombreEl.textContent = config.nombre;
    nombreEl.setAttribute('data-text', config.nombre);
  }
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

  const firmaNombre = document.getElementById('firma-nombre');
  if (firmaNombre) {
    firmaNombre.textContent = config.nombre;
  }

  const linkLibro = document.getElementById('link-libro-firmas');
  if (linkLibro) {
    linkLibro.href = 'https://docs.google.com/forms/d/e/1FAIpQLSd9CtYaj-_JR6s5MhZQXrxQPPPBfFTjmB-2FoBk6lvA8PWAIg/viewform';
  }
}

// ===== GENERAR CALENDARIO =====
function generarCalendario() {
  const container = document.getElementById('calendario-container');
  if (!container) return;
  const year = 2026;
  const month = 9;
  const fechaEspecial = 10;
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

// ===== MARCAR DÍA ACTUAL EN CALENDARIO =====
function marcarDiaActualEnCalendario() {
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = ahora.getMonth();
  const dia = ahora.getDate();

  if (año === 2026 && mes === 9) {
    const celdas = document.querySelectorAll('.calendario-container .dia');
    celdas.forEach(celda => {
      const num = parseInt(celda.textContent);
      if (num === dia) {
        celda.classList.add('hoy');
      }
    });
  }
}

// ===== GENERAR EVENTOS DEL CALENDARIO =====
function generarEventosCalendario(config) {
  const container = document.getElementById('calendario-eventos');
  if (!container) return;

  const eventos = [
    { fecha: '8 de octubre', desc: '🎂 Cumpleaños', fechaISO: '2026-10-08T09:00:00', duracion: 2 },
    { fecha: '10 de octubre', desc: '⛪ Misa', fechaISO: '2026-10-10T13:00:00', duracion: 2 },
    { fecha: '10 de octubre', desc: '🎉 Recepción', fechaISO: '2026-10-10T15:00:00', duracion: 5 },
    { fecha: '11 de octubre', desc: '☀️ Desayuno', fechaISO: '2026-10-11T09:00:00', duracion: 3 },
  ];

  container.innerHTML = '';
  eventos.forEach(ev => {
    const div = document.createElement('div');
    div.className = 'calendario-evento';

    const info = document.createElement('div');
    info.className = 'evento-info';
    info.innerHTML = `
      <span class="fecha">${ev.fecha}</span>
      <span class="desc">${ev.desc}</span>
    `;

    const btn = document.createElement('button');
    btn.className = 'btn-agregar';
    btn.textContent = '📅 Añadir';
    btn.addEventListener('click', () => {
      agregarACalendario(ev, config);
    });

    div.appendChild(info);
    div.appendChild(btn);
    container.appendChild(div);
  });
}

function agregarACalendario(evento, config) {
  const fecha = new Date(evento.fechaISO);
  const inicio = fecha.toISOString().replace(/-|:|\.\d+/g, '');
  const fin = new Date(fecha.getTime() + evento.duracion * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d+/g, '');

  const titulo = encodeURIComponent(`${evento.desc} · ${config.nombre}`);
  const descripcion = encodeURIComponent(`Invitación a los XV años de ${config.nombre}. ${evento.desc}`);
  const ubicacion = encodeURIComponent('Iglesia de Tianguistenco de Galeana / Auditorio');

  const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${titulo}&dates=${inicio}/${fin}&details=${descripcion}&location=${ubicacion}&sf=true&output=xml`;
  window.open(url, '_blank');
}

// ===== RESALTAR ACTIVIDAD ACTUAL EN ITINERARIO =====
function iniciarBrilloItinerario() {
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = ahora.getMonth();
  const dia = ahora.getDate();
  const hora = ahora.getHours();
  const minutos = ahora.getMinutes();
  const totalMinutos = hora * 60 + minutos;

  if (año === 2026 && mes === 9 && (dia === 10 || dia === 11)) {
    const items = document.querySelectorAll('.itinerario-item');
    let activo = null;
    let anterior = null;

    items.forEach(item => {
      const horaMin = parseInt(item.dataset.hora);
      if (totalMinutos >= horaMin) {
        anterior = item;
      }
    });

    if (anterior) {
      activo = anterior;
    }

    if (activo) {
      activo.classList.add('activo');
    }

    setInterval(() => {
      const ahora2 = new Date();
      const hora2 = ahora2.getHours();
      const min2 = ahora2.getMinutes();
      const totalMin2 = hora2 * 60 + min2;

      if (ahora2.getDate() === dia && ahora2.getMonth() === mes && ahora2.getFullYear() === año) {
        const items2 = document.querySelectorAll('.itinerario-item');
        let nuevoActivo = null;
        items2.forEach(item => {
          const horaMin2 = parseInt(item.dataset.hora);
          if (totalMin2 >= horaMin2) {
            nuevoActivo = item;
          }
        });

        items2.forEach(item => item.classList.remove('activo'));
        if (nuevoActivo) {
          nuevoActivo.classList.add('activo');
        }
      }
    }, 60000);
  }
}

// ===== CONTADOR CON ANILLO CIRCULAR =====
function initContadorCircular(config) {
  const target = new Date(config.fechaISO).getTime();
  if (isNaN(target)) return;

  const units = document.querySelectorAll('.clock .unit');
  if (!units.length) return;

  function actualizarContador() {
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      document.querySelector('.clock').style.display = 'none';
      document.getElementById('contador-mensaje').textContent = '¡El gran día ha llegado! 🎉';
      return;
    }

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    const maxValues = [365, 24, 60, 60];
    const values = [days, hours, minutes, seconds];

    units.forEach((unit, index) => {
      const numEl = unit.querySelector('.num');
      const circle = unit.querySelector('.progress-circle');
      if (numEl) numEl.textContent = String(values[index]).padStart(2, '0');

      if (circle) {
        const max = maxValues[index];
        const val = values[index];
        const circumference = 2 * Math.PI * 26;
        const progress = max > 0 ? (max - val) / max : 0;
        const offset = progress * circumference;
        circle.style.strokeDasharray = circumference;
        circle.style.strokeDashoffset = offset;
      }
    });

    const msgEl = document.getElementById('contador-mensaje');
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
  }

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

  actualizarContador();
  setInterval(actualizarContador, 200);
}

// ===== COLLAGE DE GUSTOS (VERSIÓN MEJORADA) =====
var collageTimer = null;
var imagenesCollage = [];
var collageInicializado = false; // <--- AGREGADO

function iniciarCollage() {
  var container = document.getElementById('collage-container');
  if (!container) return;

  container.style.overflow = 'visible';
  container.style.position = 'relative';
  container.style.aspectRatio = '1 / 1';
  container.style.width = '100%';

  var maxImages = 12;
  var imagenes = [];
  var cargadas = 0;
  var totalIntentos = maxImages;

  function verificarYRenderizar() {
    cargadas++;
    if (cargadas === totalIntentos) {
      imagenesCollage = imagenes;
      if (imagenes.length > 0) {
        renderCollage(container);
      } else {
        container.innerHTML = '<div style="text-align:center; padding:2rem; color:#fae3a0; font-family:var(--script); font-size:1.2rem;">No se encontraron imágenes.</div>';
      }
    }
  }

  for (var i = 1; i <= maxImages; i++) {
    var src = 'archivos/imgcoll' + i + '.jpg';
    var img = new Image();
    img.onload = function() {
      imagenes.push(src);
      verificarYRenderizar();
    };
    img.onerror = function() {
      verificarYRenderizar();
    };
    img.src = src;
  }
}

function renderCollage(container) {
  container.innerHTML = '';
  var total = imagenesCollage.length;
  if (total === 0) return;

  var items = [];
  for (var i = 0; i < total; i++) {
    var w = 12 + Math.random() * 35;
    var h = 12 + Math.random() * 35;
    var x = Math.random() * (100 - w);
    var y = Math.random() * (100 - h);
    var rot = (Math.random() - 0.5) * 40;
    items.push({
      src: imagenesCollage[i],
      w: w,
      h: h,
      x: x,
      y: y,
      rot: rot,
      visible: false,
      el: null
    });
  }

  items.forEach(function(item) {
    var div = document.createElement('div');
    div.className = 'collage-item';
    div.style.cssText =
      'width:' + item.w + '%;' +
      'height:' + item.h + '%;' +
      'left:' + item.x + '%;' +
      'top:' + item.y + '%;' +
      'transform: rotate(' + item.rot + 'deg) scale(0.2);' +
      'opacity: 0;' +
      'z-index:' + Math.floor(Math.random() * 10) + ';';
    var img = document.createElement('img');
    img.src = item.src;
    img.loading = 'lazy';
    img.alt = 'Gusto';
    div.appendChild(img);
    container.appendChild(div);
    item.el = div;
  });

  function mostrarImagen(item) {
    if (!item.el) return;
    item.el.style.transition = 'opacity 1.5s ease, transform 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
    item.el.style.opacity = '1';
    item.el.style.transform = 'rotate(' + item.rot + 'deg) scale(1)';
    item.visible = true;
  }

  function ocultarImagen(item) {
    if (!item.el) return;
    item.el.style.transition = 'opacity 1.2s ease, transform 1.2s ease';
    item.el.style.opacity = '0';
    var newRot = item.rot + (Math.random() - 0.5) * 20;
    item.el.style.transform = 'rotate(' + newRot + 'deg) scale(0.3)';
    item.visible = false;
  }

  function elegirSiguiente() {
    var noVisibles = items.filter(function(item) { return !item.visible; });
    if (noVisibles.length === 0) return null;
    return noVisibles[Math.floor(Math.random() * noVisibles.length)];
  }

  function elegirParaOcultar() {
    var visibles = items.filter(function(item) { return item.visible; });
    if (visibles.length === 0) return null;
    return visibles[Math.floor(Math.random() * visibles.length)];
  }

  var primerLote = items.slice(0, Math.min(4, items.length));
  primerLote.forEach(function(item, idx) {
    setTimeout(function() {
      mostrarImagen(item);
    }, 300 + idx * 800);
  });

  if (collageTimer) clearInterval(collageTimer);
  collageTimer = setInterval(function() {
    var visibles = items.filter(function(item) { return item.visible; });
    if (visibles.length < 4) {
      var siguiente = elegirSiguiente();
      if (siguiente) {
        mostrarImagen(siguiente);
      }
    } else {
      var ocultar = elegirParaOcultar();
      if (ocultar) {
        ocultarImagen(ocultar);
        setTimeout(function() {
          var siguiente = elegirSiguiente();
          if (siguiente) {
            mostrarImagen(siguiente);
          }
        }, 400);
      }
    }
  }, 2500 + Math.random() * 1500);
}

function limpiarCollage() {
  if (collageTimer) {
    clearInterval(collageTimer);
    collageTimer = null;
  }
  var container = document.getElementById('collage-container');
  if (container) {
    container.innerHTML = '<div id="collage-loading" style="text-align:center; padding:2rem; color:#fae3a0; font-family:var(--script); font-size:1.2rem;">Cargando collage...</div>';
    container.style.overflow = 'hidden';
  }
}

document.addEventListener('DOMContentLoaded', async function() {
  var config = await cargarConfig();
  rellenarDatos(config);
  generarCalendario();
  generarEventosCalendario(config);
  initContadorCircular(config);
  marcarDiaActualEnCalendario();
  iniciarBrilloItinerario();

  // ---- COLLAGE ----
  var btnAbrir = document.getElementById('btn-abrir-gustos');
  var modal = document.getElementById('modal-gustos');
  var closeBtns = modal.querySelectorAll('[data-close-gustos]');

  if (btnAbrir && modal) {
    btnAbrir.addEventListener('click', function() {
      modal.classList.add('open');
      if (!collageInicializado) {
        iniciarCollage();
        collageInicializado = true;
      } else {
        limpiarCollage();
        iniciarCollage();
      }
    });

    closeBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        modal.classList.remove('open');
        limpiarCollage();
        collageInicializado = false;
      });
    });

    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.classList.remove('open');
        limpiarCollage();
        collageInicializado = false;
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        modal.classList.remove('open');
        limpiarCollage();
        collageInicializado = false;
      }
    });
  }

  // ---- MÚSICA Y RESTO ----
  try {
    var { initSonidos } = await import('./modules/sonidos.js');
    initSonidos();
  } catch (e) { console.error('❌ Sonidos:', e); }

  try {
    var { initMusica, playMusic, toggleMusic, resetMusic } = await import('./modules/musica.js');
    initMusica(config);
    window.playMusic = playMusic;
    window.toggleMusic = toggleMusic;
    window.resetMusic = resetMusic;
  } catch (e) { console.error('❌ Música:', e); }

  var appIniciada = false;
  async function cargarContador() {
    if (appIniciada) return;
    appIniciada = true;
  }

  var nombreEl = document.getElementById('nombre-hero');
  nombreEl.addEventListener('click', function() {
    window.location.href = 'juego1/';
  });

  var portal = document.getElementById('portal');
  var gateWrapper = document.getElementById('gate-wrapper');
  var app = document.getElementById('app');
  var backBtn = document.getElementById('back-link');
  var caption = document.querySelector('.portal-caption');

  portal.classList.remove('hide');
  gateWrapper.classList.remove('open');
  caption.classList.remove('show');
  gateWrapper.classList.remove('active');

  var params = new URLSearchParams(window.location.search);
  var volviendoDelJuego = params.get('volver') === '1';

  if (volviendoDelJuego) {
    portal.classList.add('hide');
    app.classList.add('show');
    gateWrapper.classList.add('active');
    gateWrapper.classList.add('open');
    caption.classList.add('show');
    cargarContador();
    if (window.playMusic) window.playMusic();
    history.replaceState(null, '', window.location.pathname);
    document.documentElement.classList.remove('sin-reja');
  } else {
    setTimeout(function() {
      caption.classList.add('show');
      gateWrapper.classList.add('active');
    }, 2000);
  }

  function abrirReja(e) {
    if (e) e.stopPropagation();
    gateWrapper.classList.add('open');
    portal.classList.add('hide');
    app.classList.add('show');
    cargarContador();
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
    requestAnimationFrame(function() {
      portal.classList.add('closing');
    });
    setTimeout(function() {
      portal.classList.remove('closing');
      setTimeout(function() {
        caption.classList.add('show');
        gateWrapper.classList.add('active');
      }, 2000);
    }, 700);
  }

  gateWrapper.addEventListener('click', abrirReja);
  gateWrapper.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirReja(e); }
  });
  backBtn.addEventListener('click', cerrarReja);

  // ===== PARALLAX =====
  var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  var hasGyro = typeof DeviceOrientationEvent !== 'undefined';
  var gyroWorking = false;

  var appInner = document.getElementById('app-inner');
  if (!appInner) {
    appInner = document.createElement('div');
    appInner.id = 'app-inner';
    appInner.style.cssText =
      'display: flex;' +
      'flex-direction: column;' +
      'align-items: center;' +
      'justify-content: flex-start;' +
      'width: 100%;' +
      'max-width: 560px;' +
      'will-change: transform;' +
      'gap: 0.5rem;' +
      'padding: 0 0.5rem 2rem;';
    while (app.firstChild) {
      appInner.appendChild(app.firstChild);
    }
    app.appendChild(appInner);
  }

  var portalInner = document.querySelector('.portal-inner');

  function applyParallax(x, y) {
    var invertX = -x;
    var invertY = -y;
    var maxOffset = 18;
    var offsetX = Math.min(Math.max(invertX, -maxOffset), maxOffset);
    var offsetY = Math.min(Math.max(invertY, -maxOffset), maxOffset);

    if (!portal.classList.contains('hide') && portalInner) {
      portalInner.style.transform = 'translate(' + (offsetX * 0.6) + 'px, ' + (offsetY * 0.6) + 'px)';
    }
    if (app.classList.contains('show') && appInner) {
      appInner.style.transform = 'translate(' + (offsetX * 0.45) + 'px, ' + (offsetY * 0.45) + 'px)';
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
    if (portal.classList.contains('hide') && !app.classList.contains('show')) return;
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
    if (portal.classList.contains('hide') && !app.classList.contains('show')) return;
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

  // Música
  var muteBtn = document.getElementById('music-toggle');
  if (muteBtn) {
    muteBtn.addEventListener('click', function() {
      if (window.toggleMusic) window.toggleMusic();
    });
  }

  // Observador para animaciones de secciones
  if ('IntersectionObserver' in window) {
    var secciones = document.querySelectorAll('.seccion');
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        } else {
          entry.target.classList.remove('visible');
        }
      });
    }, { threshold: 0.15 });
    secciones.forEach(function(sec) { observer.observe(sec); });
  } else {
    document.querySelectorAll('.seccion').forEach(function(sec) { sec.classList.add('visible'); });
  }
});
