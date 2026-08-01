console.log('📦 juego.js (con power-ups y multibola)');

import { soundTap, soundBrick, soundWin, soundLose, soundClose } from './sonidos.js';

// Constantes del juego
const PADDLE_W_BASE = 60;
const PADDLE_H = 8;
const BALL_R = 4;
const STAGE_W = 300;
const STAGE_H = 420;
const TOP_OFFSET = 30;
const BALL_SPEED = 300;
const PADDLE_SPEED = 300;
const TARGET_GAME_POINTS = 18;
const REGEN_THRESHOLD = 9;
const BALL_LOW_Y = STAGE_H - 60;

// Tipos de ladrillos (con valores de dureza y puntos)
const BRICK_TYPES = {
  CLAY:   { value: 1, playerPoints: 100, hits: 1, maxHits: 1, color: '#d9534f', label: 'arcilla' },
  WOOD:   { value: 2, playerPoints: 200, hits: 2, maxHits: 2, color: '#8b5a2b', label: 'madera' },
  IRON:   { value: 3, playerPoints: 300, hits: 3, maxHits: 3, color: '#a0a0a0', label: 'hierro' }
};

// Símbolos de fractura según dureza actual
const FRACTURE_SYMBOLS = {
  1: '|',
  2: '||',
  3: '|||'
};

// Pesos para power‑ups verdes (Multibola, Pala Grande, Dureza)
const GREEN_WEIGHTS = {
  MULTIBOLA: 15,
  PADDLE_BIG: 35,
  DUREZA: 50
};

// Pesos para downgrades rojos (Bola de Niebla, Pala Mini, Flaquesa)
const RED_WEIGHTS = {
  NIEBLA: 10,
  PADDLE_MINI: 35,
  FLAQUESA: 55
};

// Tabla de probabilidades verde/rojo por minuto (0‑16)
const PROB_TABLE = [
  { min: 0, green: 50.000, red: 50.000 },
  { min: 1, green: 46.875, red: 53.125 },
  { min: 2, green: 43.750, red: 56.250 },
  { min: 3, green: 40.625, red: 59.375 },
  { min: 4, green: 37.500, red: 62.500 },
  { min: 5, green: 34.375, red: 65.625 },
  { min: 6, green: 31.250, red: 68.750 },
  { min: 7, green: 28.125, red: 71.875 },
  { min: 8, green: 25.000, red: 75.000 },
  { min: 9, green: 21.875, red: 78.125 },
  { min: 10, green: 18.750, red: 81.250 },
  { min: 11, green: 15.625, red: 84.375 },
  { min: 12, green: 12.500, red: 87.500 },
  { min: 13, green: 9.375, red: 90.625 },
  { min: 14, green: 6.250, red: 93.750 },
  { min: 15, green: 3.125, red: 96.875 },
  { min: 16, green: 0.000, red: 100.000 }
];

// Probabilidades de soltar un power‑up según tipo de ladrillo
const DROP_CHANCE = {
  [BRICK_TYPES.CLAY.label]: 0.05,   // 5%
  [BRICK_TYPES.WOOD.label]: 0.10,   // 10%
  [BRICK_TYPES.IRON.label]: 0.20    // 20%
};

// Velocidades de caída y áreas de colisión
const POWERUP_SPEED = {
  green: 80,   // rápida
  red: 40      // lenta
};
const POWERUP_SIZE = {
  green: 12,   // área pequeña
  red: 20      // área grande
};

// Límite de power‑ups en pantalla
const MAX_POWERUPS = 5;

export function initJuego(config) {
  console.log('🎮 Iniciando juego con power‑ups, multibola y niebla');

  const nombreEl = document.getElementById('nombre-hero');
  nombreEl.addEventListener('click', () => { soundTap(); openGame(); });

  const overlay = document.getElementById('game-overlay');
  const stage = document.getElementById('game-stage');
  const inner = document.getElementById('game-inner');
  const paddleEl = document.getElementById('paddle');
  const ballEl = document.getElementById('ball');
  const msgEl = document.getElementById('game-msg');
  const msgText = document.getElementById('game-msg-text');
  const livesEl = document.getElementById('lives');
  const scoreEl = document.getElementById('game-score');
  const restartBtn = document.getElementById('game-restart');

  const timeEl = document.getElementById('game-time');
  if (timeEl) timeEl.style.display = 'none';

  restartBtn.style.display = 'none';

  // Capa de niebla (overlay dentro del stage)
  let fogLayer = document.createElement('div');
  fogLayer.style.position = 'absolute';
  fogLayer.style.top = '0';
  fogLayer.style.left = '0';
  fogLayer.style.width = '100%';
  fogLayer.style.height = '100%';
  fogLayer.style.pointerEvents = 'none';
  fogLayer.style.background = 'rgba(200, 200, 255, 0)';
  fogLayer.style.transition = 'background 0.5s ease';
  fogLayer.style.zIndex = '5';
  stage.appendChild(fogLayer);

  let scale = 1;
  let bricks = [];
  let paddle = { x: (STAGE_W - PADDLE_W_BASE) / 2 };
  let balls = [];
  let lives = 3;
  let running = false;
  let launched = false;
  let animFrameId = null;
  let countdownInterval = null;
  let playerScore = 0;
  let gamePoints = 0;
  let pendingRegeneration = false;

  // Variables para power‑ups
  let powerups = [];
  let nieblaLevel = 0;
  let paddleScale = 1; // 1 = normal, >1 grande, <1 mini

  // Tiempo de juego (para probabilidades)
  let gameStartTime = null;

  // Controles
  let mouseActive = false;
  let mouseX = 0;
  const keys = { left: false, right: false };
  let touchActive = false;
  let touchX = 0;

  window.closeGame = closeGame;

  // ---------- Funciones auxiliares ----------
  function getPaddleWidth() {
    return PADDLE_W_BASE * paddleScale;
  }

  function getPaddleHeight() {
    return PADDLE_H;
  }

  // ---------- Generación de ladrillos ----------
  function generateBrickValues() {
    const total = TARGET_GAME_POINTS;
    const values = [];
    let remaining = total;
    while (remaining > 0) {
      let max = Math.min(3, remaining);
      let val = Math.floor(Math.random() * max) + 1;
      const rest = remaining - val;
      if (rest === 1 && remaining > 2) {
        if (remaining >= 3) val = 2;
        else val = 2;
      } else if (rest === 2 && remaining > 3) {
        if (remaining >= 4) val = 3;
      }
      values.push(val);
      remaining -= val;
    }
    const sum = values.reduce((a, b) => a + b, 0);
    if (sum !== total) return generateBrickValues();
    return values;
  }

  function getFreeCells() {
    const cols = 6, rows = 6;
    const used = new Set();
    bricks.forEach(b => { if (b.alive) used.add(b.cell); });
    const free = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        if (!used.has(idx)) free.push(idx);
      }
    }
    return free;
  }

  function placeBricks(values) {
    const cols = 6, brickW = 38, brickH = 16, gap = 3;
    const totalWidth = cols * (brickW + gap) - gap;
    const startX = (STAGE_W - totalWidth) / 2;
    const startY = TOP_OFFSET;

    const freeCells = getFreeCells();
    if (freeCells.length === 0) return;

    const shuffled = freeCells.sort(() => Math.random() - 0.5);
    const toPlace = Math.min(values.length, shuffled.length);
    for (let i = 0; i < toPlace; i++) {
      const cell = shuffled[i];
      const row = Math.floor(cell / cols);
      const col = cell % cols;
      const x = startX + col * (brickW + gap);
      const y = startY + row * (brickH + gap);
      const value = values[i];
      const type = value === 1 ? BRICK_TYPES.CLAY : value === 2 ? BRICK_TYPES.WOOD : BRICK_TYPES.IRON;

      const el = document.createElement('div');
      el.className = 'brick';
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.width = brickW + 'px';
      el.style.height = brickH + 'px';
      el.style.background = type.color;
      el.style.borderRadius = '4px';
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.3)';
      el.style.color = '#fff';
      el.style.fontWeight = 'bold';
      el.style.textShadow = '0 1px 2px rgba(0,0,0,0.5)';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.textContent = FRACTURE_SYMBOLS[type.hits] || '|';

      inner.appendChild(el);

      const brick = {
        x, y, w: brickW, h: brickH,
        el,
        alive: true,
        hits: type.hits,
        baseHits: type.hits,       // guardamos la dureza original
        maxHits: type.maxHits,
        value: type.value,
        playerPoints: type.playerPoints,
        cell: cell,
        type: type.label,
        baseType: type.label,
        // para restaurar al morir
      };
      bricks.push(brick);
      gamePoints += type.value;
    }
  }

  // ---------- Lógica de power‑ups ----------
  function getProbabilities(minute) {
    const entry = PROB_TABLE.find(p => p.min === minute);
    if (entry) return { green: entry.green / 100, red: entry.red / 100 };
    if (minute > 16) return { green: 0, red: 1 };
    return { green: 0.5, red: 0.5 };
  }

  function pickSubtype(weights) {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;
    for (const [key, weight] of Object.entries(weights)) {
      rand -= weight;
      if (rand <= 0) return key;
    }
    return Object.keys(weights)[0];
  }

  function tryDropPowerup(x, y, brickLabel) {
    if (powerups.length >= MAX_POWERUPS) return;

    const chance = DROP_CHANCE[brickLabel] || 0;
    if (Math.random() > chance) return;

    // Calcular minutos transcurridos
    let minutes = 0;
    if (gameStartTime) {
      minutes = Math.floor((Date.now() - gameStartTime) / 60000);
    }
    const probs = getProbabilities(minutes);
    const isGreen = Math.random() < probs.green;

    let subtype;
    let color, icon, speed, size;
    if (isGreen) {
      subtype = pickSubtype(GREEN_WEIGHTS);
      color = '#4caf50';
      speed = POWERUP_SPEED.green;
      size = POWERUP_SIZE.green;
      if (subtype === 'MULTIBOLA') icon = '⚡';
      else if (subtype === 'PADDLE_BIG') icon = '🏏';
      else if (subtype === 'DUREZA') icon = '🛡️';
    } else {
      subtype = pickSubtype(RED_WEIGHTS);
      color = '#f44336';
      speed = POWERUP_SPEED.red;
      size = POWERUP_SIZE.red;
      if (subtype === 'NIEBLA') icon = '🌫️';
      else if (subtype === 'PADDLE_MINI') icon = '🪚';
      else if (subtype === 'FLAQUESA') icon = '💧';
    }

    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.left = (x - size/2) + 'px';
    el.style.top = y + 'px';
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.borderRadius = '50%';
    el.style.background = color;
    el.style.boxShadow = `0 0 10px ${color}`;
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.fontSize = (size * 0.7) + 'px';
    el.style.color = '#fff';
    el.style.textShadow = '0 0 6px rgba(0,0,0,0.6)';
    el.textContent = icon;
    el.style.pointerEvents = 'none';
    inner.appendChild(el);

    powerups.push({
      el,
      x: x - size/2,
      y: y,
      w: size,
      h: size,
      speed: speed,
      type: isGreen ? 'green' : 'red',
      subtype: subtype,
      alive: true
    });
  }

  function applyPowerup(power) {
    if (power.type === 'green') {
      switch (power.subtype) {
        case 'MULTIBOLA':
          applyMultibola();
          break;
        case 'PADDLE_BIG':
          paddleScale = 1.3;
          break;
        case 'DUREZA':
          applyDureza();
          break;
      }
    } else {
      switch (power.subtype) {
        case 'NIEBLA':
          applyNiebla();
          break;
        case 'PADDLE_MINI':
          paddleScale = 0.7;
          break;
        case 'FLAQUESA':
          applyFlaquesa();
          break;
      }
    }
  }

  function applyMultibola() {
    const count = balls.length;
    if (count < 1 || count > 3) return; // solo si 1,2 o 3
    const maxBalls = 9;
    let newBalls = [];
    const target = Math.min(count * 3, maxBalls);
    const toAdd = target - count;
    if (toAdd <= 0) return;

    // Crear nuevas bolas a partir de las existentes
    for (let i = 0; i < toAdd; i++) {
      const src = balls[i % count];
      const angleOffset = (Math.random() - 0.5) * 0.8;
      const speed = BALL_SPEED * (0.9 + Math.random() * 0.2);
      const vx = src.vx + (Math.random() - 0.5) * 60;
      const vy = src.vy + (Math.random() - 0.5) * 60;
      const newBall = {
        x: src.x + (Math.random() - 0.5) * 10,
        y: src.y + (Math.random() - 0.5) * 10,
        vx: vx,
        vy: vy,
        r: BALL_R,
        // color dorado para las nuevas
        el: null
      };
      newBalls.push(newBall);
    }
    balls = balls.concat(newBalls);
    // Asegurar que no exceda 9
    if (balls.length > 9) balls = balls.slice(0, 9);
    // Actualizar elementos visuales para todas las bolas (se recrean en draw)
  }

  function applyDureza() {
    // Encontrar un ladrillo vivo que no sea hierro (maxHits < 3)
    const candidates = bricks.filter(b => b.alive && b.maxHits < 3);
    if (candidates.length === 0) return;
    const brick = candidates[Math.floor(Math.random() * candidates.length)];
    // Subir un nivel de dureza
    let newType;
    if (brick.type === 'arcilla') newType = BRICK_TYPES.WOOD;
    else if (brick.type === 'madera') newType = BRICK_TYPES.IRON;
    else return;
    // Actualizar propiedades
    brick.hits = newType.hits;
    brick.maxHits = newType.maxHits;
    brick.value = newType.value;
    brick.playerPoints = newType.playerPoints;
    brick.type = newType.label;
    brick.el.style.background = newType.color;
    brick.el.textContent = FRACTURE_SYMBOLS[brick.hits] || '|';
    // Recalcular gamePoints
    // (se actualizará en el bucle)
  }

  function applyFlaquesa() {
    const candidates = bricks.filter(b => b.alive && b.maxHits > 1);
    if (candidates.length === 0) return;
    const brick = candidates[Math.floor(Math.random() * candidates.length)];
    let newType;
    if (brick.type === 'hierro') newType = BRICK_TYPES.WOOD;
    else if (brick.type === 'madera') newType = BRICK_TYPES.CLAY;
    else return;
    brick.hits = newType.hits;
    brick.maxHits = newType.maxHits;
    brick.value = newType.value;
    brick.playerPoints = newType.playerPoints;
    brick.type = newType.label;
    brick.el.style.background = newType.color;
    brick.el.textContent = FRACTURE_SYMBOLS[brick.hits] || '|';
  }

  function applyNiebla() {
    if (nieblaLevel < 3) nieblaLevel++;
    updateFog();
  }

  function updateFog() {
    const opacity = [0, 0.15, 0.30, 0.50][nieblaLevel] || 0;
    fogLayer.style.background = `rgba(200, 200, 255, ${opacity})`;
  }

  // ---------- Restaurar al morir ----------
  function resetEffectsOnDeath() {
    // Restaurar pala
    paddleScale = 1;
    // Restaurar bolas a una sola
    const paddleW = getPaddleWidth();
    const pX = paddle.x + paddleW / 2;
    const pY = STAGE_H - 14 - BALL_R;
    balls = [{
      x: pX,
      y: pY,
      vx: 0,
      vy: 0,
      r: BALL_R,
      el: null
    }];
    // Resetear niebla
    nieblaLevel = 0;
    updateFog();
    // Restaurar dureza de ladrillos a su base
    for (const b of bricks) {
      if (!b.alive) continue;
      // Revertir a baseHits
      const base = b.baseHits;
      if (b.hits !== base) {
        b.hits = base;
        b.maxHits = base;
        // Restaurar tipo según base
        let baseType;
        if (base === 1) baseType = BRICK_TYPES.CLAY;
        else if (base === 2) baseType = BRICK_TYPES.WOOD;
        else baseType = BRICK_TYPES.IRON;
        b.type = baseType.label;
        b.value = baseType.value;
        b.playerPoints = baseType.playerPoints;
        b.el.style.background = baseType.color;
        b.el.textContent = FRACTURE_SYMBOLS[b.hits] || '|';
      }
    }
    // Recalcular gamePoints
    gamePoints = bricks.filter(b => b.alive).reduce((sum, b) => sum + b.value, 0);
    // Eliminar powerups en pantalla
    for (const p of powerups) {
      if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el);
    }
    powerups = [];
    launched = false;
    // La bola se posiciona en la pala
    const pw = getPaddleWidth();
    balls[0].x = paddle.x + pw / 2;
    balls[0].y = STAGE_H - 14 - BALL_R;
    balls[0].vx = 0;
    balls[0].vy = 0;
  }

  // ---------- Inicialización y reseteo ----------
  function resetGameState() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    if (countdownInterval) clearInterval(countdownInterval);
    running = false;
    launched = false;
    bricks = [];
    paddle.x = (STAGE_W - PADDLE_W_BASE) / 2;
    balls = [{
      x: STAGE_W / 2,
      y: STAGE_H - 14 - BALL_R,
      vx: 0,
      vy: 0,
      r: BALL_R,
      el: null
    }];
    lives = 3;
    playerScore = 0;
    gamePoints = 0;
    pendingRegeneration = false;
    powerups = [];
    nieblaLevel = 0;
    paddleScale = 1;
    gameStartTime = null;
    keys.left = keys.right = false;
    touchActive = false;
    touchX = 0;
    mouseActive = false;
    mouseX = 0;
    inner.querySelectorAll('.brick').forEach(b => b.remove());
    inner.querySelectorAll('.powerup').forEach(p => p.remove());
    msgEl.classList.remove('show');
    restartBtn.style.display = 'none';
    updateFog();
    updateUI();
    draw();
  }

  function updateUI() {
    livesEl.textContent = '♥ '.repeat(Math.max(lives, 0)).trim() || '—';
    scoreEl.textContent = `Puntos: ${playerScore}`;
  }

  // ---------- Dibujo ----------
  function draw() {
    const pw = getPaddleWidth();
    paddleEl.style.width = pw + 'px';
    paddleEl.style.transform = 'translateX(' + paddle.x + 'px)';

    // Dibujar todas las bolas
    // Eliminar los elementos de bola viejos
    const oldBalls = inner.querySelectorAll('.ball-element');
    oldBalls.forEach(el => el.remove());

    for (let i = 0; i < balls.length; i++) {
      const b = balls[i];
      const el = document.createElement('div');
      el.className = 'ball-element';
      el.style.position = 'absolute';
      el.style.left = (b.x - b.r) + 'px';
      el.style.top = (b.y - b.r) + 'px';
      el.style.width = (b.r * 2) + 'px';
      el.style.height = (b.r * 2) + 'px';
      el.style.borderRadius = '50%';
      // Color: normal rojo, adicionales doradas
      const isExtra = i > 0;
      el.style.background = isExtra
        ? 'radial-gradient(circle at 35% 30%, #fff0b0, #d4af37 60%, #8a6d1b)'
        : 'radial-gradient(circle at 35% 30%, #fff, #d68a96 60%, #a13545)';
      el.style.boxShadow = isExtra
        ? '0 0 10px rgba(212, 175, 55, 0.8)'
        : '0 0 8px rgba(255, 200, 200, 0.3)';
      el.style.transform = 'translate(' + (b.x - b.r) + 'px, ' + (b.y - b.r) + 'px)';
      el.style.transformOrigin = '0 0';
      el.style.pointerEvents = 'none';
      inner.appendChild(el);
      b.el = el;
    }

    // Dibujar powerups (ya tienen su propio elemento)
    // Solo actualizar posición
    for (const p of powerups) {
      if (p.el) {
        p.el.style.left = p.x + 'px';
        p.el.style.top = p.y + 'px';
      }
    }
  }

  // ---------- Lógica de bolas ----------
  function launchBall() {
    if (launched) return;
    const dir = Math.random() < 0.5 ? -1 : 1;
    const angle = (Math.random() - 0.5) * 0.8;
    const speed = BALL_SPEED * (0.9 + Math.random() * 0.2);
    balls.forEach(b => {
      b.vx = Math.sin(angle) * speed * dir;
      b.vy = -Math.cos(angle) * speed;
    });
    launched = true;
  }

  // ---------- Bucle principal ----------
  let lastTime = 0;

  function gameLoop(timestamp) {
    if (!running) return;

    const delta = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0.016;
    lastTime = timestamp;

    updateUI();

    // Movimiento de la pala
    let paddleMoved = false;
    const pw = getPaddleWidth();
    if (keys.left) { paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * delta); paddleMoved = true; }
    if (keys.right) { paddle.x = Math.min(STAGE_W - pw, paddle.x + PADDLE_SPEED * delta); paddleMoved = true; }
    if (touchActive) {
      paddle.x = Math.max(0, Math.min(STAGE_W - pw, touchX));
      paddleMoved = true;
    }
    if (mouseActive) {
      paddle.x = Math.max(0, Math.min(STAGE_W - pw, mouseX));
      paddleMoved = true;
    }

    // Si no ha lanzado, las bolas siguen a la pala
    if (!launched) {
      const cx = paddle.x + pw / 2;
      const cy = STAGE_H - 14 - BALL_R;
      balls.forEach(b => {
        b.x = cx;
        b.y = cy;
      });
      if (paddleMoved) launchBall();
      draw();
      animFrameId = requestAnimationFrame(gameLoop);
      return;
    }

    // Actualizar bolas
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      b.x += b.vx * delta;
      b.y += b.vy * delta;

      // Rebotes paredes
      if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx); }
      if (b.x + b.r > STAGE_W) { b.x = STAGE_W - b.r; b.vx = -Math.abs(b.vx); }
      if (b.y - b.r < 0) { b.y = b.r; b.vy = Math.abs(b.vy); }

      // Rebote pala
      const py = STAGE_H - 14;
      if (b.vy > 0 && b.y + b.r >= py && b.y + b.r <= py + 10 &&
          b.x >= paddle.x - b.r && b.x <= paddle.x + pw + b.r) {
        b.y = py - b.r;
        let hit = (b.x - (paddle.x + pw / 2)) / (pw / 2);
        hit = Math.max(-0.85, Math.min(0.85, hit));
        const angle = hit * 0.7;
        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        b.vx = Math.sin(angle) * speed;
        b.vy = -Math.cos(angle) * speed;
      }

      // Colisión con ladrillos (máximo uno por bola por frame)
      let collided = false;
      for (const brick of bricks) {
        if (!brick.alive) continue;
        if (b.x + b.r > brick.x && b.x - b.r < brick.x + brick.w &&
            b.y + b.r > brick.y && b.y - b.r < brick.y + brick.h) {
          // Reposicionar
          const overlapX = Math.min(b.x + b.r - brick.x, brick.x + brick.w - (b.x - b.r));
          const overlapY = Math.min(b.y + b.r - brick.y, brick.y + brick.h - (b.y - b.r));
          if (overlapX < overlapY) {
            if (b.x < brick.x + brick.w / 2) b.x = brick.x - b.r;
            else b.x = brick.x + brick.w + b.r;
            b.vx = -b.vx;
          } else {
            if (b.y < brick.y + brick.h / 2) b.y = brick.y - b.r;
            else b.y = brick.y + brick.h + b.r;
            b.vy = -b.vy;
          }

          brick.hits--;
          soundBrick();

          // Intentar soltar power‑up
          tryDropPowerup(brick.x + brick.w/2, brick.y, brick.type);

          if (brick.hits <= 0) {
            brick.alive = false;
            brick.el.classList.add('gone');
            playerScore += brick.playerPoints;
            gamePoints -= brick.value;
            updateUI();
            if (gamePoints <= REGEN_THRESHOLD) requestRegeneration();
          } else {
            brick.el.textContent = FRACTURE_SYMBOLS[brick.hits] || '|';
          }
          collided = true;
          break;
        }
      }
      if (collided) continue;

      // Pérdida de bola (si cae al fondo)
      if (b.y - b.r > STAGE_H) {
        // Eliminar esta bola
        if (b.el && b.el.parentNode) b.el.parentNode.removeChild(b.el);
        balls.splice(i, 1);
        soundLose();
        if (balls.length === 0) {
          // Se perdió la última bola
          lives--;
          if (lives <= 0) {
            endGame();
            return;
          } else {
            // Resetear efectos y volver a tener una bola
            resetEffectsOnDeath();
            // La bola se coloca en la pala
            const cx = paddle.x + pw / 2;
            const cy = STAGE_H - 14 - BALL_R;
            balls = [{
              x: cx,
              y: cy,
              vx: 0,
              vy: 0,
              r: BALL_R,
              el: null
            }];
            launched = false;
            updateUI();
            draw();
            // Continuar el bucle
          }
        } else {
          // Solo se perdió una bola, continuar
          updateUI();
          draw();
        }
      }
    }

    // Actualizar power‑ups
    for (let i = powerups.length - 1; i >= 0; i--) {
      const p = powerups[i];
      p.y += p.speed * delta;
      // Colisión con pala
      const pw2 = getPaddleWidth();
      const ph = getPaddleHeight();
      // Área de colisión: el powerup tiene un tamaño p.w/p.h
      if (p.y + p.h > STAGE_H - 14 - ph && p.y < STAGE_H - 14 + ph &&
          p.x + p.w > paddle.x && p.x < paddle.x + pw2) {
        // Atrapado
        applyPowerup(p);
        if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el);
        powerups.splice(i, 1);
        soundTap();
        continue;
      }
      // Si cae al fondo
      if (p.y > STAGE_H) {
        if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el);
        powerups.splice(i, 1);
      }
    }

    // Regeneración de ladrillos
    if (pendingRegeneration) checkAndRegenerate();

    draw();
    animFrameId = requestAnimationFrame(gameLoop);
  }

  function requestRegeneration() {
    if (pendingRegeneration) return;
    if (getFreeCells().length === 0) return;
    pendingRegeneration = true;
  }

  function checkAndRegenerate() {
    if (!pendingRegeneration || !running) return;
    if (getFreeCells().length === 0) {
      pendingRegeneration = false;
      return;
    }
    const values = generateBrickValues();
    placeBricks(values);
    pendingRegeneration = false;
  }

  // ---------- Fin del juego ----------
  function endGame() {
    running = false;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    restartBtn.style.display = 'inline-block';
    msgText.textContent = `Game Over\nPuntaje final: ${playerScore}`;
    msgEl.classList.add('show');
    soundLose();
  }

  // ---------- Iniciar juego ----------
  function startGame() {
    resetGameState();
    // Generar ladrillos iniciales (todos arcilla)
    const clayValues = new Array(36).fill(1);
    inner.querySelectorAll('.brick').forEach(b => b.remove());
    bricks = [];
    placeBricks(clayValues);

    const pw = getPaddleWidth();
    paddle.x = (STAGE_W - pw) / 2;
    launched = false;
    const cx = paddle.x + pw / 2;
    const cy = STAGE_H - 14 - BALL_R;
    balls = [{
      x: cx,
      y: cy,
      vx: 0,
      vy: 0,
      r: BALL_R,
      el: null
    }];
    msgEl.classList.remove('show');
    running = true;
    gameStartTime = Date.now();
    layoutStage();
    updateUI();
    draw();
    lastTime = 0;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(gameLoop);
  }

  // ---------- Abrir/cerrar juego ----------
  function openGame() {
    resetGameState();
    overlay.classList.add('open');
    inner.querySelectorAll('.brick').forEach(b => b.remove());
    bricks = [];
    powerups = [];
    msgEl.classList.remove('show');
    restartBtn.style.display = 'none';
    draw();

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
    soundClose();
  }

  // ---------- Layout responsivo ----------
  function layoutStage() {
    const availW = Math.min(window.innerWidth * 0.92, 450);
    const availH = Math.min(window.innerHeight * 0.72, 560);
    scale = Math.min(availW / STAGE_W, availH / STAGE_H);
    stage.style.width = (STAGE_W * scale) + 'px';
    stage.style.height = (STAGE_H * scale) + 'px';
    inner.style.width = STAGE_W + 'px';
    inner.style.height = STAGE_H + 'px';
    inner.style.transform = 'scale(' + scale + ')';
    inner.style.transformOrigin = 'top left';
  }

  // ---------- Eventos ----------
  document.getElementById('game-close').addEventListener('click', closeGame);
  restartBtn.addEventListener('click', () => { soundTap(); startGame(); });
  overlay.addEventListener('click', e => { if (e.target === overlay) closeGame(); });

  stage.addEventListener('mousedown', (e) => {
    if (!running) return;
    const rect = stage.getBoundingClientRect();
    const localX = (e.clientX - rect.left) / scale;
    const pw = getPaddleWidth();
    mouseX = Math.min(Math.max(localX - pw / 2, 0), STAGE_W - pw);
    mouseActive = true;
    if (!launched) launchBall();
  });
  document.addEventListener('mousemove', (e) => {
    if (!running || !mouseActive) return;
    const rect = stage.getBoundingClientRect();
    const localX = (e.clientX - rect.left) / scale;
    const pw = getPaddleWidth();
    mouseX = Math.min(Math.max(localX - pw / 2, 0), STAGE_W - pw);
  });
  document.addEventListener('mouseup', () => { mouseActive = false; });

  stage.addEventListener('click', (e) => {
    if (running && !launched) launchBall();
  });

  document.addEventListener('keydown', (e) => {
    if (!running) return;
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') { keys.left = true; e.preventDefault(); }
    else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') { keys.right = true; e.preventDefault(); }
  });
  document.addEventListener('keyup', (e) => {
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') { keys.left = false; e.preventDefault(); }
    else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') { keys.right = false; e.preventDefault(); }
  });

  stage.addEventListener('touchstart', (e) => {
    if (!running) return;
    const touch = e.touches[0];
    if (touch) {
      const rect = stage.getBoundingClientRect();
      const localX = (touch.clientX - rect.left) / scale;
      const pw = getPaddleWidth();
      touchX = Math.min(Math.max(localX - pw / 2, 0), STAGE_W - pw);
      touchActive = true;
      if (!launched) launchBall();
    }
  }, { passive: true });
  stage.addEventListener('touchmove', (e) => {
    if (!running) return;
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) {
      const rect = stage.getBoundingClientRect();
      const localX = (touch.clientX - rect.left) / scale;
      const pw = getPaddleWidth();
      touchX = Math.min(Math.max(localX - pw / 2, 0), STAGE_W - pw);
      touchActive = true;
    }
  }, { passive: false });
  stage.addEventListener('touchend', () => { touchActive = false; }, { passive: true });
  stage.addEventListener('touchcancel', () => { touchActive = false; }, { passive: true });

  window.addEventListener('resize', () => { layoutStage(); draw(); });
  layoutStage();
  resetGameState();
  console.log('✅ Juego listo con power‑ups, multibola y niebla');
}
