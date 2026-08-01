console.log('📦 juego.js (colisión corregida, arcilla roja, sistema de drops)');

import { soundTap, soundBrick, soundWin, soundLose, soundClose } from './sonidos.js';

const PADDLE_W = 60;
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
const MAX_BALLS = 9;

const BRICK_TYPES = {
  CLAY:   { value: 1, playerPoints: 100, hits: 1, color: '#d9534f', label: 'arcilla' },
  WOOD:   { value: 2, playerPoints: 200, hits: 2, color: '#8b5a2b', label: 'madera' },
  IRON:   { value: 3, playerPoints: 300, hits: 3, color: '#a0a0a0', label: 'hierro' }
};

const FRACTURE_SYMBOLS = {
  1: '|',
  2: '||',
  3: '|||'
};

// ----------------- SISTEMA DE DROPS -----------------
// % de soltar power/downgrade al golpear cada tipo de ladrillo
const DROP_CHANCE_BY_VALUE = {
  1: 0.05, // arcilla -> 5%
  2: 0.10, // madera  -> 10%
  3: 0.20  // hierro  -> 20%
};

// Pesos internos por categoría
const GREEN_ITEMS = [
  { key: 'multibola',   weight: 15 },
  { key: 'pala_grande', weight: 35 },
  { key: 'dureza',      weight: 50 }
];
const RED_ITEMS = [
  { key: 'niebla',    weight: 10 },
  { key: 'pala_mini', weight: 35 },
  { key: 'flaqueza',  weight: 55 }
];

// Velocidad y área de colisión de la caída (verde rápido/chico, rojo lento/grande)
const DROP_SPEED_GREEN = 260;
const DROP_SPEED_RED = 140;
const DROP_R_GREEN = 6;
const DROP_R_RED = 11;

const DROP_COLOR = {
  green: '#2ecc71',
  red: '#e74c3c'
};

// Figuras que aluden al poder de cada drop
const DROP_SHAPE = {
  multibola:   '⋮⋮⋮',
  pala_grande: '▭+',
  dureza:      '◆+',
  pala_mini:   '▭−',
  flaqueza:    '◆−',
  niebla:      '☁'
};

export function initJuego(config) {
  console.log('🎮 Iniciando juego (sin tiempo, mouse, 18 puntos, colisión corregida, drops)');

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

  // Overlay de niebla (se crea una sola vez)
  const fogOverlay = document.createElement('div');
  fogOverlay.style.position = 'absolute';
  fogOverlay.style.left = '0';
  fogOverlay.style.top = '0';
  fogOverlay.style.width = STAGE_W + 'px';
  fogOverlay.style.height = STAGE_H + 'px';
  fogOverlay.style.background = 'rgba(255,255,255,0.9)';
  fogOverlay.style.opacity = '0';
  fogOverlay.style.pointerEvents = 'none';
  fogOverlay.style.transition = 'opacity 0.3s ease, backdrop-filter 0.3s ease';
  fogOverlay.style.zIndex = '50';
  inner.appendChild(fogOverlay);

  let scale = 1;
  let bricks = [];
  let paddle = { x: (STAGE_W - PADDLE_W) / 2 };
  let paddleW = PADDLE_W;
  let paddleState = 'normal'; // 'normal' | 'large' | 'mini'
  let balls = [{ x: STAGE_W / 2, y: STAGE_H - 38, vx: 0, vy: 0, el: ballEl }];
  let drops = []; // items cayendo (power-ups / downgrades)
  let fogLevel = 0; // 0..3
  let elapsedMs = 0; // tiempo transcurrido de partida (para % verde/rojo)
  let lives = 3;
  let running = false;
  let launched = false;
  let animFrameId = null;
  let countdownInterval = null;
  let playerScore = 0;
  let gamePoints = 0;
  let pendingRegeneration = false;

  let mouseActive = false;
  let mouseX = 0;
  const keys = { left: false, right: false };
  let touchActive = false;
  let touchX = 0;

  window.closeGame = closeGame;

  // ----------------- LADRILLOS -----------------
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

      bricks.push({
        x, y, w: brickW, h: brickH,
        el,
        alive: true,
        hits: type.hits,
        maxHits: type.hits,
        value: type.value,
        playerPoints: type.playerPoints,
        cell: cell,
        type: type
      });
      gamePoints += type.value;
    }
  }

  function requestRegeneration() {
    if (pendingRegeneration) return;
    if (getFreeCells().length === 0) return;
    pendingRegeneration = true;
  }

  function checkAndRegenerate() {
    if (!pendingRegeneration || !running) return;
    if (launched && balls.some(b => b.y < BALL_LOW_Y)) return;
    if (getFreeCells().length === 0) {
      pendingRegeneration = false;
      return;
    }
    const values = generateBrickValues();
    placeBricks(values);
    pendingRegeneration = false;
  }

  // ----------------- DUREZA DE LADRILLOS (Dureza / Flaqueza) -----------------
  function getTypeForHits(hits) {
    if (hits <= 1) return BRICK_TYPES.CLAY;
    if (hits === 2) return BRICK_TYPES.WOOD;
    return BRICK_TYPES.IRON;
  }

  function refreshBrickVisual(b) {
    b.el.style.background = b.type.color;
    b.el.textContent = FRACTURE_SYMBOLS[b.hits] || '|';
  }

  function upgradeRandomBrick() {
    // Arcilla -> Madera -> Hierro (acumulativo hasta Hierro)
    const candidates = bricks.filter(b => b.alive && b.maxHits < 3);
    if (candidates.length === 0) return;
    const b = candidates[Math.floor(Math.random() * candidates.length)];
    b.maxHits += 1;
    b.hits += 1;
    b.type = getTypeForHits(b.maxHits);
    b.value = b.type.value;
    b.playerPoints = b.type.playerPoints;
    refreshBrickVisual(b);
  }

  function downgradeRandomBrick() {
    // Hierro -> Madera -> Arcilla (acumulativo hasta Arcilla)
    const candidates = bricks.filter(b => b.alive && b.maxHits > 1);
    if (candidates.length === 0) return;
    const b = candidates[Math.floor(Math.random() * candidates.length)];
    b.maxHits -= 1;
    b.hits = Math.min(b.hits, b.maxHits);
    if (b.hits < 1) b.hits = 1;
    b.type = getTypeForHits(b.maxHits);
    b.value = b.type.value;
    b.playerPoints = b.type.playerPoints;
    refreshBrickVisual(b);
  }

  // ----------------- DROPS (power-ups / downgrades) -----------------
  function decideDropColor() {
    // Minuto 0 = 50/50, baja 3.125% cada minuto hasta 0/100 en el minuto 16
    const minutes = elapsedMs / 60000;
    const greenPct = Math.max(0, 50 - 3.125 * minutes);
    return Math.random() * 100 < greenPct ? 'green' : 'red';
  }

  function weightedPick(pool) {
    const total = pool.reduce((sum, it) => sum + it.weight, 0);
    let r = Math.random() * total;
    for (const it of pool) {
      if (r < it.weight) return it.key;
      r -= it.weight;
    }
    return pool[pool.length - 1].key;
  }

  function maybeDropItem(x, y, brickValue) {
    const chance = DROP_CHANCE_BY_VALUE[brickValue] || 0;
    if (Math.random() >= chance) return;
    spawnDrop(x, y);
  }

  function spawnDrop(x, y) {
    const color = decideDropColor();
    const pool = color === 'green' ? GREEN_ITEMS : RED_ITEMS;
    const key = weightedPick(pool);
    const r = color === 'green' ? DROP_R_GREEN : DROP_R_RED;
    const vy = color === 'green' ? DROP_SPEED_GREEN : DROP_SPEED_RED;

    const el = document.createElement('div');
    el.className = 'dropitem';
    el.style.position = 'absolute';
    el.style.left = '0';
    el.style.top = '0';
    el.style.width = (r * 2) + 'px';
    el.style.height = (r * 2) + 'px';
    el.style.borderRadius = '50%';
    el.style.background = DROP_COLOR[color];
    el.style.color = '#fff';
    el.style.fontWeight = 'bold';
    el.style.fontSize = (color === 'green' ? '7px' : '9px');
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.boxShadow = '0 2px 5px rgba(0,0,0,0.5)';
    el.textContent = DROP_SHAPE[key] || '?';
    inner.appendChild(el);

    drops.push({ x, y, vy, r, color, key, el });
  }

  function updateFogVisual() {
    const opacity = fogLevel * 0.22;
    fogOverlay.style.opacity = opacity;
    fogOverlay.style.backdropFilter = fogLevel > 0 ? `blur(${fogLevel * 1.4}px)` : 'none';
  }

  function addFog() {
    fogLevel = Math.min(3, fogLevel + 1);
    updateFogVisual();
  }

  function resetFog() {
    fogLevel = 0;
    updateFogVisual();
  }

  function clampPaddleX() {
    paddle.x = Math.max(0, Math.min(STAGE_W - paddleW, paddle.x));
  }

  function setPaddleLarge() {
    paddleState = 'large';
    paddleW = PADDLE_W * 1.3;
    clampPaddleX();
  }

  function setPaddleMini() {
    paddleState = 'mini';
    paddleW = PADDLE_W * 0.7;
    clampPaddleX();
  }

  function resetPaddleSize() {
    paddleState = 'normal';
    paddleW = PADDLE_W;
    clampPaddleX();
  }

  function randomBallVelocity() {
    const dir = Math.random() < 0.5 ? -1 : 1;
    const angle = (Math.random() - 0.5) * 0.8;
    return {
      vx: Math.sin(angle) * BALL_SPEED * dir,
      vy: -Math.cos(angle) * BALL_SPEED
    };
  }

  function createBallEl() {
    const el = ballEl.cloneNode(true);
    el.removeAttribute('id');
    inner.appendChild(el);
    return el;
  }

  function multiplyBalls() {
    const current = balls.length;
    if (current !== 1 && current !== 2 && current !== 3) return;
    const target = Math.min(current * 3, MAX_BALLS);
    const toAdd = target - current;
    for (let i = 0; i < toAdd; i++) {
      const src = balls[Math.floor(Math.random() * balls.length)];
      const v = randomBallVelocity();
      balls.push({ x: src.x, y: src.y, vx: v.vx, vy: v.vy, el: createBallEl() });
    }
  }

  function clearExtraBalls() {
    balls.forEach(b => { if (b.el !== ballEl) b.el.remove(); });
  }

  function applyDropEffect(key) {
    switch (key) {
      case 'pala_grande': setPaddleLarge(); break;
      case 'pala_mini': setPaddleMini(); break;
      case 'dureza': upgradeRandomBrick(); break;
      case 'flaqueza': downgradeRandomBrick(); break;
      case 'multibola': multiplyBalls(); break;
      case 'niebla': addFog(); break;
    }
  }

  function updateDrops(delta) {
    const py = STAGE_H - 14;
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.y += d.vy * delta;

      const caught = d.y + d.r >= py && d.y - d.r <= py + PADDLE_H &&
        d.x >= paddle.x - d.r && d.x <= paddle.x + paddleW + d.r;

      if (caught) {
        applyDropEffect(d.key);
        d.el.remove();
        drops.splice(i, 1);
        continue;
      }
      if (d.y - d.r > STAGE_H) {
        d.el.remove();
        drops.splice(i, 1);
        continue;
      }
      d.el.style.transform = 'translate(' + (d.x - d.r) + 'px,' + (d.y - d.r) + 'px)';
    }
  }

  function clearAllDrops() {
    drops.forEach(d => d.el.remove());
    drops = [];
  }

  // ----------------- JUEGO -----------------
  function launchBall() {
    if (launched) return;
    const v = randomBallVelocity();
    balls[0].vx = v.vx;
    balls[0].vy = v.vy;
    launched = true;
  }

  function resetGameState() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    if (countdownInterval) clearInterval(countdownInterval);
    running = false;
    launched = false;
    bricks = [];
    paddle.x = (STAGE_W - PADDLE_W) / 2;
    resetPaddleSize();
    clearExtraBalls();
    balls = [{ x: STAGE_W / 2, y: STAGE_H - 38, vx: 0, vy: 0, el: ballEl }];
    clearAllDrops();
    resetFog();
    elapsedMs = 0;
    lives = 3;
    playerScore = 0;
    gamePoints = 0;
    pendingRegeneration = false;
    keys.left = keys.right = false;
    touchActive = false;
    touchX = 0;
    mouseActive = false;
    mouseX = 0;
    inner.querySelectorAll('.brick').forEach(b => b.remove());
    msgEl.classList.remove('show');
    restartBtn.style.display = 'none';
    updateUI();
    draw();
  }

  function updateUI() {
    livesEl.textContent = '♥ '.repeat(Math.max(lives, 0)).trim() || '—';
    scoreEl.textContent = `Puntos: ${playerScore}`;
  }

  function draw() {
    paddleEl.style.width = paddleW + 'px';
    paddleEl.style.transform = 'translateX(' + paddle.x + 'px)';
    balls.forEach(b => {
      b.el.style.transform = 'translate(' + b.x + 'px, ' + b.y + 'px)';
    });
  }

  let lastTime = 0;

  function gameLoop(timestamp) {
    if (!running) return;

    const delta = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0.016;
    lastTime = timestamp;
    elapsedMs += delta * 1000;

    updateUI();

    let paddleMoved = false;
    if (keys.left) { paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * delta); paddleMoved = true; }
    if (keys.right) { paddle.x = Math.min(STAGE_W - paddleW, paddle.x + PADDLE_SPEED * delta); paddleMoved = true; }
    if (touchActive) {
      paddle.x = Math.max(0, Math.min(STAGE_W - paddleW, touchX));
      paddleMoved = true;
    }
    if (mouseActive) {
      paddle.x = Math.max(0, Math.min(STAGE_W - paddleW, mouseX));
      paddleMoved = true;
    }

    if (!launched) {
      balls[0].x = paddle.x + paddleW / 2;
      balls[0].y = STAGE_H - 14 - BALL_R;
      if (paddleMoved) launchBall();
      updateDrops(delta);
      draw();
      animFrameId = requestAnimationFrame(gameLoop);
      return;
    }

    // Movimiento y colisiones por cada bola activa
    for (let bi = balls.length - 1; bi >= 0; bi--) {
      const ball = balls[bi];

      ball.x += ball.vx * delta;
      ball.y += ball.vy * delta;

      // Rebotes paredes
      if (ball.x - BALL_R < 0) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx); }
      if (ball.x + BALL_R > STAGE_W) { ball.x = STAGE_W - BALL_R; ball.vx = -Math.abs(ball.vx); }
      if (ball.y - BALL_R < 0) { ball.y = BALL_R; ball.vy = Math.abs(ball.vy); }

      // Rebote paleta
      const py = STAGE_H - 14;
      if (ball.vy > 0 && ball.y + BALL_R >= py && ball.y + BALL_R <= py + 10 &&
          ball.x >= paddle.x - BALL_R && ball.x <= paddle.x + paddleW + BALL_R) {
        ball.y = py - BALL_R;
        let hit = (ball.x - (paddle.x + paddleW / 2)) / (paddleW / 2);
        hit = Math.max(-0.85, Math.min(0.85, hit));
        const angle = hit * 0.7;
        ball.vx = Math.sin(angle) * BALL_SPEED;
        ball.vy = -Math.cos(angle) * BALL_SPEED;
      }

      // Colisión con ladrillos (máximo uno por frame por bola)
      for (const b of bricks) {
        if (!b.alive) continue;
        if (ball.x + BALL_R > b.x && ball.x - BALL_R < b.x + b.w &&
            ball.y + BALL_R > b.y && ball.y - BALL_R < b.y + b.h) {

          // Reposicionar la pelota
          const overlapX = Math.min(ball.x + BALL_R - b.x, b.x + b.w - (ball.x - BALL_R));
          const overlapY = Math.min(ball.y + BALL_R - b.y, b.y + b.h - (ball.y - BALL_R));
          if (overlapX < overlapY) {
            if (ball.x < b.x + b.w / 2) ball.x = b.x - BALL_R;
            else ball.x = b.x + b.w + BALL_R;
            ball.vx = -ball.vx;
          } else {
            if (ball.y < b.y + b.h / 2) ball.y = b.y - BALL_R;
            else ball.y = b.y + b.h + BALL_R;
            ball.vy = -ball.vy;
          }

          b.hits--;
          soundBrick();
          maybeDropItem(b.x + b.w / 2, b.y + b.h / 2, b.type.value);

          if (b.hits <= 0) {
            b.alive = false;
            b.el.classList.add('gone');
            playerScore += b.playerPoints;
            gamePoints -= b.value;
            updateUI();
            if (gamePoints <= REGEN_THRESHOLD) requestRegeneration();
          } else {
            b.el.textContent = FRACTURE_SYMBOLS[b.hits] || '|';
          }
          break; // solo un ladrillo por frame por bola
        }
      }

      // Bola perdida (cae fuera del escenario)
      if (ball.y - BALL_R > STAGE_H) {
        ball.el.remove();
        balls.splice(bi, 1);
      }
    }

    updateDrops(delta);

    if (pendingRegeneration) checkAndRegenerate();

    // Pérdida de vida (todas las bolas caídas)
    if (balls.length === 0) {
      lives--;
      soundLose();
      if (lives <= 0) {
        endGame();
        return;
      }
      // Reinicia efectos temporales al morir (no persisten)
      resetPaddleSize();
      resetFog();
      clearAllDrops();
      launched = false;
      balls = [{ x: paddle.x + paddleW / 2, y: STAGE_H - 14 - BALL_R, vx: 0, vy: 0, el: ballEl }];
      updateUI();
    }

    draw();
    animFrameId = requestAnimationFrame(gameLoop);
  }

  function endGame() {
    running = false;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    restartBtn.style.display = 'inline-block';
    msgText.textContent = `Game Over\nPuntaje final: ${playerScore}`;
    msgEl.classList.add('show');
    soundLose();
  }

  function startGame() {
    resetGameState();
    playerScore = 0;
    gamePoints = 0;
    const clayValues = new Array(36).fill(1);
    inner.querySelectorAll('.brick').forEach(b => b.remove());
    bricks = [];
    placeBricks(clayValues);

    paddle.x = (STAGE_W - PADDLE_W) / 2;
    launched = false;
    balls = [{ x: paddle.x + paddleW / 2, y: STAGE_H - 14 - BALL_R, vx: 0, vy: 0, el: ballEl }];
    msgEl.classList.remove('show');
    running = true;
    layoutStage();
    updateUI();
    draw();
    lastTime = 0;
    elapsedMs = 0;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(gameLoop);
  }

  function openGame() {
    resetGameState();
    overlay.classList.add('open');
    inner.querySelectorAll('.brick').forEach(b => b.remove());
    bricks = [];
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

  // Eventos (igual que antes)
  document.getElementById('game-close').addEventListener('click', closeGame);
  restartBtn.addEventListener('click', () => { soundTap(); startGame(); });
  overlay.addEventListener('click', e => { if (e.target === overlay) closeGame(); });

  stage.addEventListener('mousedown', (e) => {
    if (!running) return;
    const rect = stage.getBoundingClientRect();
    const localX = (e.clientX - rect.left) / scale;
    mouseX = Math.min(Math.max(localX - paddleW / 2, 0), STAGE_W - paddleW);
    mouseActive = true;
    if (!launched) launchBall();
  });
  document.addEventListener('mousemove', (e) => {
    if (!running || !mouseActive) return;
    const rect = stage.getBoundingClientRect();
    const localX = (e.clientX - rect.left) / scale;
    mouseX = Math.min(Math.max(localX - paddleW / 2, 0), STAGE_W - paddleW);
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
      touchX = Math.min(Math.max(localX - paddleW / 2, 0), STAGE_W - paddleW);
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
      touchX = Math.min(Math.max(localX - paddleW / 2, 0), STAGE_W - paddleW);
      touchActive = true;
    }
  }, { passive: false });
  stage.addEventListener('touchend', () => { touchActive = false; }, { passive: true });
  stage.addEventListener('touchcancel', () => { touchActive = false; }, { passive: true });

  window.addEventListener('resize', () => { layoutStage(); draw(); });
  layoutStage();
  resetGameState();
  console.log('✅ Juego listo (colisión corregida, drops activos 1)');
}
   
