console.log('🚀 principal/script-principal.js (versión con pausa de recursos en collage, SIN pausar el contador)');

// Renombrado para evitar conflictos de declaración
async function obtenerConfiguracion() {
  try {
    const res = await fetch(`../config.json?t=${Date.now()}`);
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
      madrina: 'Madrina'
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
  const diasEspeciales = [8, 10];

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

// ===== GENERAR EVENTOS DEL CALENDARIO =====
function generarEventosCalendario(config) {
  const container = document.getElementById('calendario-eventos');
  if (!container) return;

  const eventos = [
    { fecha: '8 de octubre', desc: '🎂 Mi Cumpleaños', fechaISO: '2026-10-08T09:00:00', duracion: 2 },
    { fecha: '10 de octubre', desc: '⛪ Misa', fechaISO: '2026-10-10T13:00:00', duracion: 2 },
    { fecha: '10 de octubre', desc: '🎉 Recepción', fechaISO: '2026-10-10T15:00:00', duracion: 5 },
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

  let ubicacion = '';
  if (!evento.desc.includes('Mi Cumpleaños')) {
    if (evento.desc.includes('Misa')) {
      ubicacion = encodeURIComponent('Capilla del Puente, Rayon 164, Tianguistenco de Galeana, 52603 Guadalupe Yancuictlalpan, Méx., México');
    } else if (evento.desc.includes('Recepción')) {
      ubicacion = encodeURIComponent('Auditorio Gualupita Yancuictlalpan, Allende 2, Tianguistenco de Galeana, 52603 Guadalupe Yancuictlalpan, Méx., México');
    }
  }

  let url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${titulo}&dates=${inicio}/${fin}&details=${descripcion}`;
  if (ubicacion) {
    url += `&location=${ubicacion}`;
  }
  url += '&sf=true&output=xml';

  window.open(url, '_blank');
}

// ===== CONTADOR CON ANILLO CIRCULAR (NO se pausa al abrir modal) =====
function initContadorCircular(config) {
  const target = new Date(config.fechaISO).getTime();
  if (isNaN(target)) return;

  const units = document.querySelectorAll('.clock .unit');
  if (!units.length) return;

  const isMobile = window.matchMedia('(pointer: coarse)').matches;
  const intervalo = isMobile ? 1000 : 200;

  function actualizarContador() {
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      document.querySelector('.clock').style.display = 'none';
      document.getElementById('contador-mensaje').textContent = '🎉 ¡El gran día ha llegado! 🎉';
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
      else if (days === 0 && hours > 6) mensaje = '¡Hoy es el gran día!';
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
  let intervalId = setInterval(actualizarContador, intervalo);

  // No exponemos funciones para pausar/reanudar, porque NO se debe pausar
}

// ===== COLLAGE DE GUSTOS =====
var collageTimer = null;
var imagenesCollage = [];
var collageInicializado = false;
var collageIndiceActual = 0;
var collageZIndex = 1;
var collageElementos = [];
var collageHistorialImagenes = [];
var collageUltimaRotacion = 0;
var collageIntervaloMs = 3000;
var MAX_IMAGENES_SIMULTANEAS = 6;
var CARPETA_IMGCOLL = '../imgcoll/';

function detectarImagenesCollage(callback) {
  var fallosSeguidosParaParar = 3;
  var encontradas = [];
  var fallosSeguidos = 0;

  function probar(i) {
    var src = CARPETA_IMGCOLL + 'imgcoll' + i + '.jpg';
    var img = new Image();
    img.onload = function() {
      encontradas.push(src);
      fallosSeguidos = 0;
      probar(i + 1);
    };
    img.onerror = function() {
      fallosSeguidos++;
      if (fallosSeguidos >= fallosSeguidosParaParar) {
        callback(encontradas);
        return;
      }
      probar(i + 1);
    };
    img.src = src;
  }
  probar(1);
}

function iniciarCollage() {
  var container = document.getElementById('collage-container');
  if (!container) return;

  container.style.overflow = 'hidden';
  container.style.position = 'relative';
  container.style.aspectRatio = '1 / 1';
  container.style.width = '100%';

  detectarImagenesCollage(function(rutas) {
    if (!rutas || rutas.length === 0) {
      container.innerHTML = '<div style="text-align:center; padding:2rem; color:#fae3a0; font-family:var(--script); font-size:1.2rem;">No se encontraron imágenes.</div>';
      return;
    }

    var datos = [];
    var restantes = rutas.length;

    function terminar() {
      imagenesCollage = datos;
      if (datos.length > 0) {
        renderCollage(container);
      } else {
        container.innerHTML = '<div style="text-align:center; padding:2rem; color:#fae3a0; font-family:var(--script); font-size:1.2rem;">No se encontraron imágenes.</div>';
      }
    }

    rutas.forEach(function(src) {
      var img = new Image();
      img.onload = function() {
        var ratio = (img.naturalWidth && img.naturalHeight) ? (img.naturalWidth / img.naturalHeight) : 1;
        datos.push({ src: src, ratio: ratio });
        restantes--;
        if (restantes === 0) terminar();
      };
      img.onerror = function() {
        restantes--;
        if (restantes === 0) terminar();
      };
      img.src = src;
    });
  });
}

function shuffleArray(arr) {
  var copied = arr.slice();
  for (var i = copied.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = copied[i];
    copied[i] = copied[j];
    copied[j] = temp;
  }
  return copied;
}

function elegirImagenAleatoria() {
  var disponibles = [];
  for (var i = 0; i < imagenesCollage.length; i++) {
    if (collageHistorialImagenes.indexOf(i) === -1) {
      disponibles.push(i);
    }
  }
  if (disponibles.length === 0) {
    collageHistorialImagenes = [];
    disponibles = Array.from({length: imagenesCollage.length}, (_, i) => i);
  }
  var indiceElegido = disponibles[Math.floor(Math.random() * disponibles.length)];
  collageHistorialImagenes.push(indiceElegido);
  if (collageHistorialImagenes.length > 5) {
    collageHistorialImagenes.shift();
  }
  return indiceElegido;
}

function elegirRotacionContraria() {
  var esPositivaAnterior = collageUltimaRotacion > 0;
  var nuevaRotacion;
  if (esPositivaAnterior) {
    nuevaRotacion = -25 + Math.random() * 25;
  } else {
    nuevaRotacion = Math.random() * 25;
  }
  collageUltimaRotacion = nuevaRotacion;
  return nuevaRotacion;
}

function renderCollage(container) {
  container.innerHTML = '';
  var total = imagenesCollage.length;
  if (total === 0) return;

  collageIndiceActual = 0;
  collageZIndex = 1;
  collageElementos = [];
  collageHistorialImagenes = [];
  collageUltimaRotacion = 0;

  var TAMANIO_BASE = 80;

  var ZONAS_COLLAGE = [
    { x: 15, y: 20 },
    { x: 50, y: 14 },
    { x: 85, y: 20 },
    { x: 15, y: 52 },
    { x: 85, y: 52 },
    { x: 30, y: 84 },
    { x: 70, y: 84 }
  ];

  function elegirZona() {
    var ocupadas = collageElementos.map(function(el) { return el.zona; });
    var disponibles = [];
    for (var i = 0; i < ZONAS_COLLAGE.length; i++) {
      if (ocupadas.indexOf(i) === -1) disponibles.push(i);
    }
    if (disponibles.length === 0) {
      disponibles = Array.from({length: ZONAS_COLLAGE.length}, (_, i) => i);
    }
    return disponibles[Math.floor(Math.random() * disponibles.length)];
  }

  function mostrarSiguienteImagen() {
    var indiceEnImagen = elegirImagenAleatoria();
    var dato = imagenesCollage[indiceEnImagen];
    var src = dato.src;
    var ratio = dato.ratio || 1;

    var w, h;
    if (ratio >= 1) {
      w = TAMANIO_BASE;
      h = TAMANIO_BASE / ratio;
    } else {
      h = TAMANIO_BASE;
      w = TAMANIO_BASE * ratio;
    }

    var indiceZona = elegirZona();
    var zona = ZONAS_COLLAGE[indiceZona];
    var jitter = 6;
    var centroX = zona.x + (Math.random() * jitter * 2 - jitter);
    var centroY = zona.y + (Math.random() * jitter * 2 - jitter);

    var maxX = Math.max(0, 100 - w);
    var maxY = Math.max(0, 100 - h);
    var x = Math.min(maxX, Math.max(0, centroX - w / 2));
    var y = Math.min(maxY, Math.max(0, centroY - h / 2));

    var rot = elegirRotacionContraria();

    var elemento = document.createElement('img');
    elemento.className = 'collage-item';
    elemento.src = src;
    elemento.alt = 'Gusto';
    elemento.loading = 'lazy';
    elemento.style.cssText =
      'width:' + w + '%;' +
      'height:' + h + '%;' +
      'left:' + x + '%;' +
      'top:' + y + '%;' +
      'z-index:' + collageZIndex + ';' +
      'opacity: 1;' +
      'transform: rotate(' + rot + 'deg) scale(1);';
    container.appendChild(elemento);

    collageElementos.push({ div: elemento, zona: indiceZona });
    collageZIndex++;

    if (collageElementos.length > MAX_IMAGENES_SIMULTANEAS) {
      var antiguo = collageElementos.shift();
      var antiguoDiv = antiguo.div;
      antiguoDiv.style.opacity = '0';
      setTimeout(function() {
        if (antiguoDiv.parentNode) {
          antiguoDiv.parentNode.removeChild(antiguoDiv);
        }
      }, 100);
    }
  }

  mostrarSiguienteImagen();

  if (collageTimer) clearInterval(collageTimer);
  collageTimer = setInterval(function() {
    mostrarSiguienteImagen();
  }, collageIntervaloMs);
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
  // ===== INICIALIZAR SONIDOS =====
  try {
    const { initSonidos } = await import('../modules/sonidos.js');
    initSonidos();
  } catch (e) {
    console.warn('⚠️ Sonidos no disponibles:', e);
  }

  var config = await obtenerConfiguracion();
  rellenarDatos(config);
  generarCalendario();
  generarEventosCalendario(config);
  initContadorCircular(config); // El contador se ejecuta y NO se pausa

  // ---- COLLAGE CON PAUSA DE RECURSOS (excepto el contador) ----
  var btnAbrir = document.getElementById('btn-abrir-gustos');
  var modal = document.getElementById('modal-gustos');
  var closeBtns = modal.querySelectorAll('[data-close-gustos]');

  function pausarRecursos() {
    document.body.classList.add('modal-open');
    const videoApp = document.getElementById('video-app');
    if (videoApp) videoApp.pause();
    // NO se pausa el contador
  }

  function reanudarRecursos() {
    document.body.classList.remove('modal-open');
    const videoApp = document.getElementById('video-app');
    if (videoApp) videoApp.play().catch(() => {});
    // NO se reanuda el contador porque nunca se pausó
  }

  if (btnAbrir && modal) {
    btnAbrir.addEventListener('click', function() {
      modal.classList.add('open');
      pausarRecursos();
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
        reanudarRecursos();
        limpiarCollage();
        collageInicializado = false;
      });
    });

    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.classList.remove('open');
        reanudarRecursos();
        limpiarCollage();
        collageInicializado = false;
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        modal.classList.remove('open');
        reanudarRecursos();
        limpiarCollage();
        collageInicializado = false;
      }
    });
  }

  // ---- MÚSICA SIMPLIFICADA ----
  try {
    var { initMusica, playMusic, toggleMusic } = await import('../modules/musica.js');
    initMusica();
    window.toggleMusic = toggleMusic;
    setTimeout(() => {
      if (playMusic) playMusic();
    }, 100);
  } catch (e) { console.error('❌ Música:', e); }

  var appIniciada = false;
  async function cargarContador() {
    if (appIniciada) return;
    appIniciada = true;
  }

  var nombreEl = document.getElementById('nombre-hero');
  var hintJuegoEl = document.getElementById('hint-juego');

  function irAlJuego() {
    window.location.href = '../juego1/';
  }

  if (nombreEl) nombreEl.addEventListener('click', irAlJuego);
  if (hintJuegoEl) hintJuegoEl.addEventListener('click', irAlJuego);

  var app = document.getElementById('app');
  var backBtn = document.getElementById('back-link');

  app.classList.add('show');
  cargarContador();

  backBtn.addEventListener('click', function() {
    window.location.href = '../index.html';
  });

  // ===== PARALLAX (DESACTIVADO EN MÓVIL) =====
  var isMobile = window.matchMedia('(pointer: coarse)').matches;
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

  if (isMobile) {
    console.log('📱 Parallax desactivado en móvil');
    if (appInner) {
      appInner.style.transform = 'none';
      appInner.style.transition = 'none';
    }
  } else {
    function applyParallax(x, y) {
      var invertX = -x;
      var invertY = -y;
      var maxOffset = 18;
      var offsetX = Math.min(Math.max(invertX, -maxOffset), maxOffset);
      var offsetY = Math.min(Math.max(invertY, -maxOffset), maxOffset);

      if (appInner) {
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
      var x = (e.clientX / window.innerWidth - 0.5) * 30;
      var y = (e.clientY / window.innerHeight - 0.5) * 30;
      targetX = x;
      targetY = y;
      if (Math.abs(currentX - targetX) > 0.1 || Math.abs(currentY - targetY) > 0.1) {
        requestAnimationFrame(smoothParallax);
      }
    });

    if (hasGyro) {
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
  }

  var muteBtn = document.getElementById('music-toggle');
  if (muteBtn) {
    muteBtn.addEventListener('click', function() {
      if (window.toggleMusic) window.toggleMusic();
    });
  }

  // ===== INTERSECTION OBSERVER =====
  if ('IntersectionObserver' in window) {
    var secciones = document.querySelectorAll('.seccion');
    var umbralAparicion = isMobile ? 0.05 : 0.15;
    var umbralDesaparicion = isMobile ? 0.02 : 0.04;
    var umbrales = isMobile ? [0, 0.02, 0.05, 0.10] : [0, 0.02, 0.04, 0.08, 0.15, 0.25, 0.4];

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.intersectionRatio >= umbralAparicion) {
          entry.target.classList.add('visible');
        } else if (entry.intersectionRatio <= umbralDesaparicion) {
          entry.target.classList.remove('visible');
        }
      });
    }, { threshold: umbrales });

    secciones.forEach(function(sec) { observer.observe(sec); });
  } else {
    document.querySelectorAll('.seccion').forEach(function(sec) { sec.classList.add('visible'); });
  }
});
