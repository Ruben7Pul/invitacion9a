console.log('🚀 script.js - Versión completa con juego ABSCIOD v8.1');

// ============================================================
// CONFIGURACIÓN
// ============================================================
let CONFIG = {};

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
  document.getElementById('nombre-hero').textContent = config.nombre;
  document.getElementById('fecha-fija').textContent = config.fechaTexto;
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
}

// ============================================================
// CONTADOR
// ============================================================
function initContador(config) {
  const target = new Date(config.fechaISO).getTime();
  if (isNaN(target)) {
    document.getElementById('clock').innerHTML = '<p style="color:#ff9999;">Error: fecha inválida</p>';
    return;
  }
  const els = { d: document.getElementById('d'), h: document.getElementById('h'), m: document.getElementById('m'), s: document.getElementById('s') };
  const clockEl = document.getElementById('clock');
  const doneEl = document.getElementById('contador-terminado');
  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) {
      clockEl.style.display = 'none';
      doneEl.style.display = 'block';
      clearInterval(timer);
      return;
    }
    els.d.textContent = String(Math.floor(diff / 86400000)).padStart(2, '0');
    els.h.textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
    els.m.textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    els.s.textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
  }
  tick();
  const timer = setInterval(tick, 1000);
}

// ============================================================
// MODALES
// ============================================================
function initModal() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.modal;
      openModal(modalId);
    });
  });
  document.querySelectorAll('.modal-overlay').forEach(ov => {
    ov.addEventListener('click', e => { if (e.target === ov) closeModal(ov); });
    ov.querySelector('[data-close]').addEventListener('click', () => closeModal(ov));
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(closeModal);
  });
}
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
}
function closeModal(el) {
  if (el) el.classList.remove('open');
}

// ============================================================
// MÚSICA
// ============================================================
let audio = null;
function initMusica(config) {
  audio = new Audio(config.audioFile);
  audio.loop = true;
  audio.volume = 0.8;
  audio.addEventListener('error', () => {
    document.getElementById('music-toggle').style.opacity = '0.3';
  });
  audio.load();
}
function playMusic() {
  if (!audio || !audio.paused) return;
  audio.play().catch(() => {});
  document.getElementById('music-toggle').style.opacity = '1';
}
function resetMusic() {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  document.getElementById('music-toggle').style.opacity = '1';
}
function toggleMusic() {
  if (!audio) return;
  if (audio.paused) {
    audio.play().catch(() => {});
    document.getElementById('music-toggle').style.opacity = '1';
  } else {
    audio.pause();
    document.getElementById('music-toggle').style.opacity = '0.5';
  }
}

// ============================================================
// PARTÍCULAS (PÉTALOS)
// ============================================================
function initParticulas() {
  const layer = document.getElementById('petals-layer');
  if (!layer) return;
  const colors = ['#cc2233', '#e63946', '#b71c2e', '#d32f3f', '#ff1744', '#f44336'];
  const petals = [];
  for (let i = 0; i < 18; i++) {
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
    requestAnimationFrame(updatePetals);
  }
  updatePetals();
}

// ============================================================
// JUEGO ABSCIOD v8.1 (TODA LA LÓGICA)
// ============================================================
function initJuego(config) {
  console.log('🎮 Inicializando juego ABSCIOD v8.1');

  const nombreEl = document.getElementById('nombre-hero');
  const overlay = document.getElementById('game-overlay');
  const stage = document.getElementById('game-stage');
  const inner = document.getElementById('game-inner');
  const paddleEl = document.getElementById('paddle');
  const msgEl = document.getElementById('game-msg');
  const msgText = document.getElementById('game-msg-text');
  const livesEl = document.getElementById('lives');
  const scoreEl = document.getElementById('score');
  const comboEl = document.getElementById('combo-display');
  const restartBtn = document.getElementById('game-restart');
  const fogLayer = document.getElementById('fog-layer');

  // Constantes
  const ROWS = 6, COLS = 6;
  const PADDLE_W_BASE = 60, PADDLE_H = 10, BALL_R = 6;
  const STAGE_W = 300, STAGE_H = 420, TOP_OFFSET = 30;
  const BALL_SPEED_BASE = 220;
  const SPEED_INCREMENT = 0.5; // px/s por segundo
  const MAX_SPEED = 800;
  const UMBRAL_RECARGA = 12;
  const UMBRAL_VIDA = 3000;
  const PROB_OBJETO = { 1:0.05, 2:0.10, 3:0.20 };
  const PROB_VERDE = [50,46.875,43.75,40.625,37.5,34.375,31.25,28.125,25,21.875,18.75,15.625,12.5,9.375,6.25,3.125,0];
  const PESOS_VERDES = { multibola:15, pala_grande:35, dureza:50 };
  const PESOS_ROJOS = { niebla:10, pala_mini:35, flaqueza:55 };

  // Estado
  let bricks = [], objects = [], balls = [];
  let paddle = { x: (STAGE_W - PADDLE_W_BASE)/2, w: PADDLE_W_BASE };
  let lives = 3, score = 0, combo = 0, comboActive = false, comboData = [];
  let gameRunning = false, animFrameId = null, countdownInterval = null;
  let gameTime = 0, currentSpeed = BALL_SPEED_BASE, lastTime = 0;
  let powerups = { pala_grande:false, dureza_mejora:false, multibola:false,
                   pala_mini:false, flaqueza:false, niebla_nivel:0, niebla_timer:0,
                   niebla_visible:true, pelota_azul_disponible:false };
  let keys = { left:false, right:false }, touchActive = false, touchX = 0;
  let scale = 1;

  // Funciones auxiliares
  function getTipo(d) {
    if (d===1) return { dureza:1, valor:1, nombre:'Arcilla' };
    if (d===2) return { dureza:2, valor:2, nombre:'Madera' };
    return { dureza:3, valor:3, nombre:'Hierro' };
  }
  function sumarPuntos() {
    let s = 0;
    for (const b of bricks) if (b.alive) s += b.valor;
    return s;
  }
  function distancia(x1,y1,x2,y2) { return Math.hypot(x2-x1, y2-y1); }
  function aleatorio(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  // Recarga de ladrillos
  function recargarLadrillos() {
    if (sumarPuntos() > UMBRAL_RECARGA) return;
    const combos = [];
    for (let a=0; a<=12; a++)
      for (let m=0; m<=6; m++)
        for (let h=0; h<=4; h++)
          if (a*1 + m*2 + h*3 === 12) combos.push({ arcilla:a, madera:m, hierro:h });
    const combo = combos[Math.floor(Math.random() * combos.length)];
    const nuevos = [];
    for (let i=0; i<combo.arcilla; i++) nuevos.push({ dureza:1, valor:1 });
    for (let i=0; i<combo.madera; i++) nuevos.push({ dureza:2, valor:2 });
    for (let i=0; i<combo.hierro; i++) nuevos.push({ dureza:3, valor:3 });
    for (let i=nuevos.length-1; i>0; i--) {
      const j = Math.floor(Math.random() * (i+1));
      [nuevos[i], nuevos[j]] = [nuevos[j], nuevos[i]];
    }
    // Posiciones libres lejos de la trayectoria
    const ocupadas = new Set();
    for (const b of bricks) if (b.alive) ocupadas.add(`${b.gridX},${b.gridY}`);
    const brickW = 38, brickH = 16, gap = 3;
    const totalW = COLS * (brickW + gap) - gap;
    const startX = (STAGE_W - totalW)/2, startY = TOP_OFFSET;
    let trayectoria = [];
    if (balls.length > 0) {
      let x = balls[0].x, y = balls[0].y, vx = balls[0].vx, vy = balls[0].vy;
      for (let i=0; i<30; i++) {
        x += vx * 0.02; y += vy * 0.02;
        if (x < 0 || x > STAGE_W) vx = -vx;
        if (y < 0) vy = -vy;
        trayectoria.push({x,y});
      }
    }
    const libres = [];
    for (let r=0; r<ROWS; r++) {
      for (let c=0; c<COLS; c++) {
        if (!ocupadas.has(`${c},${r}`)) {
          const x = startX + c*(brickW+gap), y = startY + r*(brickH+gap);
          let lejos = true;
          for (const p of trayectoria) {
            if (distancia(x+brickW/2, y+brickH/2, p.x, p.y) < 60) { lejos = false; break; }
          }
          if (lejos) libres.push({x,y,c,r});
        }
      }
    }
    for (let i=libres.length-1; i>0; i--) {
      const j = Math.floor(Math.random() * (i+1));
      [libres[i], libres[j]] = [libres[j], libres[i]];
    }
    let colocados = 0;
    for (const tipo of nuevos) {
      if (colocados >= libres.length) break;
      const pos = libres[colocados];
      const el = document.createElement('div');
      el.className = `brick dureza-${tipo.dureza}`;
      el.style.left = pos.x + 'px';
      el.style.top = pos.y + 'px';
      el.style.width = brickW + 'px';
      el.style.height = brickH + 'px';
      el.style.borderRadius = '4px';
      el.style.color = '#fff';
      el.style.fontWeight = 'bold';
      el.style.textShadow = '0 1px 2px rgba(0,0,0,0.5)';
      el.style.border = '1px solid rgba(255,255,255,0.2)';
      inner.appendChild(el);
      bricks.push({
        x: pos.x, y: pos.y, w: brickW, h: brickH,
        gridX: pos.c, gridY: pos.r,
        dureza: tipo.dureza, valor: tipo.valor,
        el: el, alive: true,
        durezaInicial: tipo.dureza, durezaFinal: tipo.dureza,
        fueGolpeado: false
      });
      colocados++;
    }
  }

  // Combo
  function iniciarCombo() {
    combo = 0; comboData = []; comboActive = true;
    for (const b of bricks) {
      if (b.alive) { b.durezaInicial = b.dureza; b.durezaFinal = b.dureza; b.fueGolpeado = false; }
    }
    actualizarComboDisplay();
  }
  function registrarGolpe(brick) {
    if (!comboActive || !brick.alive) return;
    if (!brick.fueGolpeado) { brick.fueGolpeado = true; brick.durezaInicial = brick.dureza; }
    brick.durezaFinal = brick.dureza;
  }
  function finalizarCombo() {
    if (!comboActive) return;
    comboActive = false;
    let bote = 0;
    for (const b of bricks) {
      if (!b.fueGolpeado) continue;
      const ini = b.durezaInicial, fin = b.durezaFinal;
      if (fin === 0) {
        if (ini === 1) bote += 25;
        else if (ini === 2) bote += 200;
        else if (ini === 3) bote += 450;
      } else {
        if (fin === 2) bote += 75;
        else if (fin === 3) bote += 75;
      }
    }
    score += bote;
    actualizarScoreDisplay();
    combo = 0;
    actualizarComboDisplay();
  }

  // Generación de objetos
  function generarObjeto(brick) {
    const prob = PROB_OBJETO[brick.dureza] || 0;
    if (Math.random() > prob) return;
    const minuto = Math.floor(gameTime / 60);
    const idx = Math.min(minuto, 16);
    const pV = PROB_VERDE[idx] / 100;
    const pR = (100 - PROB_VERDE[idx]) / 100;
    let esVerde = false;
    if (Math.random() < pV) esVerde = true;
    else if (Math.random() < pR) esVerde = false;
    else return;

    let objeto = null;
    if (esVerde) {
      const disp = [];
      if (!powerups.pala_grande) disp.push('pala_grande');
      if (balls.length < 9) disp.push('multibola');
      if (!powerups.dureza_mejora) disp.push('dureza');
      if (disp.length === 0) return;
      let total = 0;
      for (const d of disp) total += PESOS_VERDES[d];
      let r = Math.random() * total;
      for (const d of disp) {
        r -= PESOS_VERDES[d];
        if (r <= 0) { objeto = d; break; }
      }
      if (!objeto) objeto = disp[0];
      crearObjetoVisual(brick.x + brick.w/2, brick.y, 'green', objeto);
    } else {
      const disp = [];
      if (powerups.niebla_nivel < 3) disp.push('niebla');
      if (!powerups.pala_mini) disp.push('pala_mini');
      if (!powerups.flaqueza) disp.push('flaqueza');
      if (disp.length === 0) return;
      let total = 0;
      for (const d of disp) total += PESOS_ROJOS[d];
      let r = Math.random() * total;
      for (const d of disp) {
        r -= PESOS_ROJOS[d];
        if (r <= 0) { objeto = d; break; }
      }
      if (!objeto) objeto = disp[0];
      crearObjetoVisual(brick.x + brick.w/2, brick.y, 'red', objeto);
    }
  }
  function crearObjetoVisual(x, y, color, tipo) {
    const el = document.createElement('div');
    el.className = `game-object ${color}`;
    el.style.left = (x - 10) + 'px';
    el.style.top = y + 'px';
    const label = document.createElement('span');
    label.className = 'obj-label';
    const abrev = { pala_grande:'PG', dureza:'DU', multibola:'MB', pala_mini:'PM', flaqueza:'FL', niebla:'NB', pelota_azul:'AZ' };
    label.textContent = abrev[tipo] || '?';
    el.appendChild(label);
    inner.appendChild(el);
    let vel = 0;
    if (color === 'green') vel = 120 + Math.random() * 60;
    else if (color === 'red') vel = 40 + Math.random() * 30;
    else vel = 80 + Math.random() * 40;
    objects.push({ el, x: x-10, y, velocidad: vel, color, tipo, activo: true });
  }

  // Atrapar objeto
  function atraparObjeto(obj) {
    if (!obj.activo) return;
    obj.activo = false;
    obj.el.remove();
    if (obj.color === 'green') {
      if (obj.tipo === 'pala_grande') {
        powerups.pala_grande = true;
        paddle.w = PADDLE_W_BASE * 1.3;
        actualizarPaddle();
      } else if (obj.tipo === 'dureza') {
        powerups.dureza_mejora = true;
        const vivos = bricks.filter(b => b.alive && b.dureza < 3);
        if (vivos.length > 0) {
          const target = vivos[Math.floor(Math.random() * vivos.length)];
          target.dureza++; target.valor++;
          target.el.className = `brick dureza-${target.dureza}`;
        }
      } else if (obj.tipo === 'multibola') {
        const nuevas = [];
        for (let i = 0; i < balls.length; i++) {
          if (balls.length >= 9) break;
          const b = balls[i];
          const ang = (Math.random() - 0.5) * 1.2;
          const spd = Math.hypot(b.vx, b.vy);
          nuevas.push({
            x: b.x + (Math.random()-0.5)*10,
            y: b.y + (Math.random()-0.5)*10,
            vx: Math.sin(ang) * spd,
            vy: -Math.cos(ang) * spd,
            active: true
          });
        }
        balls.push(...nuevas);
      }
    } else if (obj.color === 'red') {
      if (obj.tipo === 'pala_mini') {
        powerups.pala_mini = true;
        paddle.w = PADDLE_W_BASE * 0.7;
        actualizarPaddle();
      } else if (obj.tipo === 'flaqueza') {
        powerups.flaqueza = true;
        const vivos = bricks.filter(b => b.alive && b.dureza > 1);
        if (vivos.length > 0) {
          const target = vivos[Math.floor(Math.random() * vivos.length)];
          target.dureza--; target.valor--;
          target.el.className = `brick dureza-${target.dureza}`;
        }
      } else if (obj.tipo === 'niebla') {
        powerups.niebla_nivel = Math.min(3, powerups.niebla_nivel + 1);
        actualizarNiebla();
      }
    } else if (obj.color === 'blue') {
      // Pelota Azul
      powerups.pala_mini = false;
      powerups.flaqueza = false;
      powerups.niebla_nivel = 0;
      actualizarNiebla();
      if (paddle.w < PADDLE_W_BASE) { paddle.w = PADDLE_W_BASE; actualizarPaddle(); }
      const verdes = ['pala_grande', 'dureza', 'multibola'];
      const disponibles = verdes.filter(v => {
        if (v === 'pala_grande' && powerups.pala_grande) return false;
        if (v === 'dureza' && powerups.dureza_mejora) return false;
        if (v === 'multibola' && balls.length >= 9) return false;
        return true;
      });
      if (disponibles.length > 0) {
        const elegido = disponibles[Math.floor(Math.random() * disponibles.length)];
        const falso = { color: 'green', tipo: elegido, activo: true };
        atraparObjeto(falso);
      }
      score += 500;
      actualizarScoreDisplay();
    }
  }

  function actualizarPaddle() {
    document.getElementById('paddle').style.width = paddle.w + 'px';
  }
  function actualizarNiebla() {
    const nivel = powerups.niebla_nivel;
    if (nivel > 0) {
      fogLayer.classList.add('active');
      fogLayer.className = `active level-${nivel}`;
      powerups.niebla_visible = false;
    } else {
      fogLayer.classList.remove('active');
      fogLayer.className = '';
      powerups.niebla_visible = true;
    }
  }
  function actualizarVidasDisplay() {
    livesEl.textContent = '♥ '.repeat(Math.max(lives, 0)).trim() || '—';
  }
  function actualizarScoreDisplay() {
    scoreEl.textContent = Math.floor(score);
    const vidasExtra = Math.floor(score / UMBRAL_VIDA);
    if (vidasExtra > 0) {
      if (lives < 3) {
        lives = Math.min(3, lives + 1);
        actualizarVidasDisplay();
        score = score % UMBRAL_VIDA;
        actualizarScoreDisplay();
      } else {
        if (!powerups.pelota_azul_disponible) {
          powerups.pelota_azul_disponible = true;
        }
      }
    }
  }
  function actualizarComboDisplay() {
    comboEl.textContent = `Combo: ${combo}`;
  }

  // Inicializar tablero
  function initBoard() {
    const brickW = 38, brickH = 16, gap = 3;
    const totalW = COLS * (brickW + gap) - gap;
    const startX = (STAGE_W - totalW)/2, startY = TOP_OFFSET;
    for (let r=0; r<ROWS; r++) {
      for (let c=0; c<COLS; c++) {
        const x = startX + c*(brickW+gap);
        const y = startY + r*(brickH+gap);
        const el = document.createElement('div');
        el.className = 'brick dureza-1';
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.width = brickW + 'px';
        el.style.height = brickH + 'px';
        el.style.borderRadius = '4px';
        el.style.color = '#fff';
        el.style.fontWeight = 'bold';
        el.style.textShadow = '0 1px 2px rgba(0,0,0,0.5)';
        el.style.border = '1px solid rgba(255,255,255,0.2)';
        inner.appendChild(el);
        bricks.push({
          x, y, w: brickW, h: brickH, gridX: c, gridY: r,
          dureza: 1, valor: 1, el, alive: true,
          durezaInicial: 1, durezaFinal: 1, fueGolpeado: false
        });
      }
    }
  }

  // Layout y dibujo
  function layoutStage() {
    const availW = Math.min(window.innerWidth * 0.92, 420);
    const availH = Math.min(window.innerHeight * 0.72, 560);
    scale = Math.min(availW / STAGE_W, availH / STAGE_H);
    stage.style.width = (STAGE_W * scale) + 'px';
    stage.style.height = (STAGE_H * scale) + 'px';
    inner.style.width = STAGE_W + 'px';
    inner.style.height = STAGE_H + 'px';
    inner.style.transform = 'scale(' + scale + ')';
    inner.style.transformOrigin = 'top left';
  }
  function draw() {
    paddleEl.style.left = paddle.x + 'px';
    paddleEl.style.top = (STAGE_H - 16) + 'px';
    paddleEl.style.width = paddle.w + 'px';
    document.querySelectorAll('.ball-instance').forEach(el => el.remove());
    for (const b of balls) {
      const el = document.createElement('div');
      el.className = 'ball-instance';
      el.style.width = (BALL_R * 2) + 'px';
      el.style.height = (BALL_R * 2) + 'px';
      el.style.left = (b.x - BALL_R) + 'px';
      el.style.top = (b.y - BALL_R) + 'px';
      inner.appendChild(el);
    }
  }

  // Loop principal
  function gameLoop(timestamp) {
    if (!gameRunning) return;
    const delta = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0.016;
    lastTime = timestamp;
    gameTime += delta;
    currentSpeed = Math.min(MAX_SPEED, BALL_SPEED_BASE + gameTime * SPEED_INCREMENT);

    // Movimiento paleta
    if (keys.left) paddle.x = Math.max(0, paddle.x - 5);
    if (keys.right) paddle.x = Math.min(STAGE_W - paddle.w, paddle.x + 5);
    if (touchActive) paddle.x = Math.max(0, Math.min(STAGE_W - paddle.w, touchX));

    // Movimiento bolas
    for (const b of balls) {
      b.x += b.vx * delta;
      b.y += b.vy * delta;
      if (b.x - BALL_R < 0) { b.x = BALL_R; b.vx = Math.abs(b.vx); }
      if (b.x + BALL_R > STAGE_W) { b.x = STAGE_W - BALL_R; b.vx = -Math.abs(b.vx); }
      if (b.y - BALL_R < 0) { b.y = BALL_R; b.vy = Math.abs(b.vy); }
      const py = STAGE_H - 16;
      if (b.vy > 0 && b.y + BALL_R >= py && b.y + BALL_R <= py + 12 &&
          b.x >= paddle.x - BALL_R && b.x <= paddle.x + paddle.w + BALL_R) {
        b.y = py - BALL_R;
        let hit = (b.x - (paddle.x + paddle.w/2)) / (paddle.w/2);
        hit = Math.max(-0.85, Math.min(0.85, hit));
        const angle = hit * 0.7;
        b.vx = Math.sin(angle) * currentSpeed;
        b.vy = -Math.cos(angle) * currentSpeed;
        let golpeo = false;
        for (const brick of bricks) {
          if (!brick.alive) continue;
          if (b.x + BALL_R > brick.x && b.x - BALL_R < brick.x + brick.w &&
              b.y + BALL_R > brick.y && b.y - BALL_R < brick.y + brick.h) {
            golpeo = true;
            if (comboActive) {
              registrarGolpe(brick);
              combo++;
              actualizarComboDisplay();
            } else {
              iniciarCombo();
              combo++;
              actualizarComboDisplay();
            }
            brick.dureza--;
            brick.valor--;
            if (brick.dureza <= 0) {
              brick.alive = false;
              brick.el.classList.add('gone');
              const ptsBase = [0,100,200,300][brick.durezaInicial] || 0;
              score += ptsBase;
              actualizarScoreDisplay();
              generarObjeto(brick);
              recargarLadrillos();
            } else {
              brick.el.className = `brick dureza-${brick.dureza}`;
            }
            const cx = brick.x + brick.w/2, cy = brick.y + brick.h/2;
            const dx = b.x - cx, dy = b.y - cy;
            const ox = (BALL_R + brick.w/2) - Math.abs(dx);
            const oy = (BALL_R + brick.h/2) - Math.abs(dy);
            if (ox < oy) b.vx = -b.vx;
            else b.vy = -b.vy;
            break;
          }
        }
        if (!golpeo && comboActive) finalizarCombo();
      }
      if (b.y - BALL_R > STAGE_H) b.active = false;
    }
    balls = balls.filter(b => b.active !== false);
    if (balls.length === 0) {
      perderVida();
      return;
    }

    // Actualizar objetos cayendo
    for (const obj of objects) {
      if (!obj.activo) continue;
      obj.y += obj.velocidad * delta;
      obj.el.style.top = obj.y + 'px';
      const py = STAGE_H - 16;
      if (obj.y + 10 >= py && obj.y - 10 <= py + 12 &&
          obj.x + 10 >= paddle.x && obj.x - 10 <= paddle.x + paddle.w) {
        atraparObjeto(obj);
      }
      if (obj.y > STAGE_H + 20) { obj.activo = false; obj.el.remove(); }
    }
    objects = objects.filter(o => o.activo);

    // Niebla
    if (powerups.niebla_nivel >= 2) {
      const ciclo = powerups.niebla_nivel === 2 ? 4 : 5;
      const invisible = powerups.niebla_nivel === 2 ? 1 : 2;
      powerups.niebla_timer += delta;
      if (powerups.niebla_timer > ciclo) {
        powerups.niebla_timer = 0;
        powerups.niebla_visible = !powerups.niebla_visible;
        const vis = powerups.niebla_visible;
        for (const b of bricks) {
          if (b.alive) b.el.style.opacity = vis ? 1 : 0.1;
        }
        for (const o of objects) {
          if (o.activo) o.el.style.opacity = vis ? 1 : 0.1;
        }
      }
    }

    // Pelota Azul
    if (powerups.pelota_azul_disponible && lives === 3) {
      const x = paddle.x + Math.random() * paddle.w;
      const y = STAGE_H - 40 - Math.random() * 20;
      const el = document.createElement('div');
      el.className = 'game-object blue';
      el.style.left = (x - 13) + 'px';
      el.style.top = y + 'px';
      el.style.width = '26px';
      el.style.height = '26px';
      const label = document.createElement('span');
      label.className = 'obj-label';
      label.textContent = 'AZ';
      el.appendChild(label);
      inner.appendChild(el);
      objects.push({ el, x: x-13, y, velocidad: 80 + Math.random()*40, color: 'blue', tipo: 'pelota_azul', activo: true });
      powerups.pelota_azul_disponible = false;
    }

    draw();
    animFrameId = requestAnimationFrame(gameLoop);
  }

  function perderVida() {
    if (comboActive) finalizarCombo();
    lives--;
    if (lives <= 0) { endGame(false); return; }
    powerups.pala_grande = false;
    powerups.pala_mini = false;
    powerups.dureza_mejora = false;
    powerups.flaqueza = false;
    powerups.niebla_nivel = 0;
    powerups.niebla_visible = true;
    paddle.w = PADDLE_W_BASE;
    actualizarPaddle();
    actualizarNiebla();
    const bola = balls[0] || { x: STAGE_W/2, y: STAGE_H - 38 };
    balls = [{
      x: STAGE_W/2,
      y: STAGE_H - 38,
      vx: (Math.random() - 0.5) * 2 * currentSpeed,
      vy: -Math.sqrt(currentSpeed*currentSpeed - (Math.random()-0.5)**2 * 4),
      active: true
    }];
    actualizarVidasDisplay();
  }

  function endGame(win) {
    gameRunning = false;
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    restartBtn.style.display = 'inline-block';
    const message = win ?
      `👑 ¡${config.nombre} ha roto el hechizo!\n✨ Puntuación: ${Math.floor(score)} pts` :
      `🎩 ¡${config.nombre} ha perdido!\n💔 Puntuación final: ${Math.floor(score)} pts`;
    msgText.textContent = message;
    msgEl.classList.add('show');
  }

  function startGame() {
    resetGameState();
    gameTime = 0;
    currentSpeed = BALL_SPEED_BASE;
    lives = 3;
    score = 0;
    combo = 0;
    comboActive = false;
    powerups = { pala_grande:false, dureza_mejora:false, multibola:false,
                 pala_mini:false, flaqueza:false, niebla_nivel:0, niebla_timer:0,
                 niebla_visible:true, pelota_azul_disponible:false };
    paddle.w = PADDLE_W_BASE;
    paddle.x = (STAGE_W - paddle.w)/2;
    balls = [{
      x: STAGE_W/2,
      y: STAGE_H - 38,
      vx: (Math.random() - 0.5) * 2 * currentSpeed,
      vy: -Math.sqrt(currentSpeed*currentSpeed - (Math.random()-0.5)**2 * 4),
      active: true
    }];
    objects = [];
    actualizarVidasDisplay();
    actualizarScoreDisplay();
    actualizarComboDisplay();
    actualizarPaddle();
    actualizarNiebla();
    msgEl.classList.remove('show');
    gameRunning = true;
    layoutStage();
    draw();
    lastTime = 0;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(gameLoop);
  }

  function resetGameState() {
    gameRunning = false;
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
    inner.querySelectorAll('.brick').forEach(b => b.remove());
    inner.querySelectorAll('.game-object').forEach(o => o.remove());
    inner.querySelectorAll('.ball-instance').forEach(b => b.remove());
    bricks = [];
    objects = [];
    balls = [];
    paddle.x = (STAGE_W - PADDLE_W_BASE)/2;
    paddle.w = PADDLE_W_BASE;
    actualizarPaddle();
    msgEl.classList.remove('show');
    restartBtn.style.display = 'none';
  }

  function openGame() {
    resetGameState();
    overlay.classList.add('open');
    initBoard();
    recargarLadrillos();
    let countdown = 3;
    msgText.textContent = countdown;
    msgEl.classList.add('show');
    countdownInterval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        msgText.textContent = countdown;
      } else {
        clearInterval(countdownInterval);
        countdownInterval = null;
        msgEl.classList.remove('show');
        startGame();
      }
    }, 1000);
  }

  function closeGame() {
    overlay.classList.remove('open');
    resetGameState();
  }

  // Eventos
  nombreEl.addEventListener('click', () => openGame());
  document.getElementById('game-close').addEventListener('click', closeGame);
  restartBtn.addEventListener('click', () => { openGame(); });
  overlay.addEventListener('click', e => { if (e.target === overlay) closeGame(); });

  document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
      keys.left = true;
      e.preventDefault();
    } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
      keys.right = true;
      e.preventDefault();
    }
  });
  document.addEventListener('keyup', (e) => {
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
      keys.left = false;
      e.preventDefault();
    } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
      keys.right = false;
      e.preventDefault();
    }
  });

  stage.addEventListener('touchstart', (e) => {
    if (!gameRunning) return;
    const touch = e.touches[0];
    if (touch) {
      const rect = stage.getBoundingClientRect();
      const localX = (touch.clientX - rect.left) / scale;
      touchX = Math.min(Math.max(localX - paddle.w/2, 0), STAGE_W - paddle.w);
      touchActive = true;
    }
  }, { passive: true });
  stage.addEventListener('touchmove', (e) => {
    if (!gameRunning) return;
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) {
      const rect = stage.getBoundingClientRect();
      const localX = (touch.clientX - rect.left) / scale;
      touchX = Math.min(Math.max(localX - paddle.w/2, 0), STAGE_W - paddle.w);
      touchActive = true;
    }
  }, { passive: false });
  stage.addEventListener('touchend', () => { touchActive = false; }, { passive: true });
  stage.addEventListener('touchcancel', () => { touchActive = false; }, { passive: true });

  window.addEventListener('resize', () => { layoutStage(); draw(); });
  layoutStage();
  resetGameState();
  console.log('✅ Juego ABSCIOD v8.1 listo');
}

// ============================================================
// INICIO DE LA APLICACIÓN
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  const config = await cargarConfig();
  window.CONFIG = config;
  rellenarDatos(config);

  initSonidos();
  initParticulas();
  initMusica(config);
  initContador(config);
  initModal();
  initJuego(config);

  // Botón de música
  document.getElementById('music-toggle').addEventListener('click', toggleMusic);

  // Transición reja
  const portal = document.getElementById('portal');
  const gateWrapper = document.getElementById('gate-wrapper');
  const app = document.getElementById('app');
  const backBtn = document.getElementById('back-link');

  function abrirReja() {
    gateWrapper.classList.add('open');
    setTimeout(() => {
      portal.classList.add('hide');
      app.classList.add('show');
      playMusic();
    }, 300);
  }
  function cerrarReja() {
    app.classList.remove('show');
    portal.classList.remove('hide');
    portal.classList.add('closing');
    gateWrapper.classList.remove('open');
    resetMusic();
    setTimeout(() => portal.classList.remove('closing'), 700);
  }

  gateWrapper.addEventListener('click', abrirReja);
  gateWrapper.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirReja(); }
  });
  backBtn.addEventListener('click', cerrarReja);
});

// ============================================================
// SONIDOS (FALLBACK)
// ============================================================
let audioCtx = null;
let soundEnabled = true;
function ensureAudioCtx() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  } catch (e) { soundEnabled = false; return null; }
}
function chime(freqs, dur) {
  if (!soundEnabled) return;
  try {
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0, now + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.04, now + i * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.05 + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + dur + 0.05);
    });
  } catch (e) { soundEnabled = false; }
}
function initSonidos() {
  document.addEventListener('click', () => ensureAudioCtx(), { once: true });
}
