// ============================================================
// juego.js – con power‑ups (probabilidades altas para pruebas)
// ============================================================
console.log('📦 juego.js (con powerups y niebla)');

import { soundTap, soundBrick, soundWin, soundLose, soundClose } from './sonidos.js';

// Constantes base
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
const MAX_NIEBLA = 3;

// Tipos de ladrillos
const BRICK_TYPES = {
  CLAY:   { value: 1, playerPoints: 100, hits: 1, color: '#d9534f', label: 'CLAY' },
  WOOD:   { value: 2, playerPoints: 200, hits: 2, color: '#8b5a2b', label: 'WOOD' },
  IRON:   { value: 3, playerPoints: 300, hits: 3, color: '#a0a0a0', label: 'IRON' }
};

const FRACTURE_SYMBOLS = {
  1: '|',
  2: '||',
  3: '|||'
};

// Tabla de probabilidad de verde según minuto (0..16)
const GREEN_PROB_TABLE = [
  50.000, 46.875, 43.750, 40.625, 37.500, 34.375, 31.250, 28.125,
  25.000, 21.875, 18.750, 15.625, 12.500, 9.375, 6.250, 3.125, 0.000
];

const GREEN_WEIGHTS = { MULTIBOLA: 15, PALA_GRANDE: 35, DUREZA: 50 };
const RED_WEIGHTS   = { BOLA_NIEBLA: 10, PALA_MINI: 35, FLAQUESA: 55 };

export function initJuego(config) {
  console.log('🎮 Iniciando juego con power‑ups (prob. altas)');

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

  // Elemento para la niebla
  const nieblaEl = document.createElement('div');
  nieblaEl.id = 'niebla-overlay';
  nieblaEl.style.cssText = `
    position: absolute; inset: 0; pointer-events: none;
    background: rgba(20, 30, 50, 0.4); transition: opacity 0.5s;
    opacity: 0; border-radius: 12px; z-index: 20;
  `;
  stage.appendChild(nieblaEl);

  const timeEl = document.getElementById('game-time');
  if (timeEl) timeEl.style.display = 'none';

  restartBtn.style.display = 'none';

  // Variables de estado
  let scale = 1;
  let bricks = [];
  let balls = [];
  let powerups = [];
  let paddle = { x: (STAGE_W - PADDLE_W_BASE) / 2 };
  let lives = 3;
  let running = false;
  let launched = false;
  let animFrameId = null;
  let countdownInterval = null;
  let playerScore = 0;
  let gamePoints = 0;
  let pendingRegeneration = false;

  let paddleSizeMultiplier = 1;
  let paddleWidth = PADDLE_W_BASE;
  let nieblaLevel = 0;
  let gameStartTime = 0;

  let mouseActive = false;
  let mouseX = 0;
  const keys = { left: false, right: false };
  let touchActive = false;
  let touchX = 0;

  window.closeGame = closeGame;

  // ------------------------------------------------------------
  // Funciones auxiliares para ladrillos
  // ------------------------------------------------------------
  function getBrickTypeFromValue(val) {
    if (val === 1) return BRICK_TYPES.CLAY;
    if (val === 2) return BRICK_TYPES.WOOD;
    return BRICK_TYPES.IRON;
  }

  function updateBrickVisual(brick) {
    const el = brick.el;
    const type = brick.type;
    el.style.background = type.color;
    el.textContent = FRACTURE_SYMBOLS[brick.hits] || '|';
  }

  function upgradeBrickType(brick) {
    if (brick.type === BRICK_TYPES.CLAY) {
      brick.type = BRICK_TYPES.WOOD;
    } else if (brick.type === BRICK_TYPES.WOOD) {
      brick.type = BRICK_TYPES.IRON;
    } else {
      return false;
    }
    brick.hits = brick.type.hits;
    brick.maxHits = brick.type.hits;
    brick.value = brick.type.value;
    brick.playerPoints = brick.type.playerPoints;
    updateBrickVisual(brick);
    return true;
  }

  function downgradeBrickType(brick) {
    if (brick.type === BRICK_TYPES.IRON) {
      brick.type = BRICK_TYPES.WOOD;
    } else if (brick.type === BRICK_TYPES.WOOD) {
      brick.type = BRICK_TYPES.CLAY;
    } else {
      return false;
    }
    brick.hits = brick.type.hits;
    brick.maxHits = brick.type.hits;
    brick.value = brick.type.value;
    brick.playerPoints = brick.type.playerPoints;
    updateBrickVisual(brick);
    return true;
  }

  function resetBricksToOriginal() {
    for (const b of bricks) {
      b.type = b.originalType;
      b.hits = b.originalHits;
      b.maxHits = b.originalHits;
      b.value = b.type.value;
      b.playerPoints = b.type.playerPoints;
      updateBrickVisual(b);
    }
  }

  // ------------------------------------------------------------
  // Generación de ladrillos
  // ------------------------------------------------------------
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
      const type = getBrickTypeFromValue(value);

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
        maxHits: type.hits,
        value: type.value,
        playerPoints: type.playerPoints,
        cell: cell,
        type: type,
        originalType: type,
        originalHits: type.hits
      };
      bricks.push(brick);
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

  // ------------------------------------------------------------
  // Power‑ups (probabilidades aumentadas)
  // ------------------------------------------------------------
  function getGreenProbability(minutes) {
    if (minutes < 0) return GREEN_PROB_TABLE[0];
    if (minutes >= GREEN_PROB_TABLE.length - 1) return GREEN_PROB_TABLE[GREEN_PROB_TABLE.length - 1];
    const idx = Math.floor(minutes);
    const frac = minutes - idx;
    return GREEN_PROB_TABLE[idx] + (GREEN_PROB_TABLE[idx + 1] - GREEN_PROB_TABLE[idx]) * frac;
  }

  function selectPowerupByColor(color) {
    const weights = color === 'verde' ? GREEN_WEIGHTS : RED_WEIGHTS;
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (const [key, weight] of Object.entries(weights)) {
      r -= weight;
      if (r <= 0) return key;
    }
    return Object.keys(weights)[0];
  }

  function spawnPowerup(brick) {
    // PROBABILIDADES ALTAS PARA PRUEBAS
    let prob = 0;
    if (brick.type === BRICK_TYPES.CLAY) prob = 0.20;   // antes 0.05
    else if (brick.type === BRICK_TYPES.WOOD) prob = 0.30; // antes 0.10
    else if (brick.type === BRICK_TYPES.IRON) prob = 0.50; // antes 0.20
    if (Math.random() >= prob) return;

    const now = performance.now();
    const minutes = (now - gameStartTime) / 60000;
    const greenProb = getGreenProbability(minutes);
    const color = Math.random() * 100 < greenProb ? 'verde' : 'rojo';
    const typeKey = selectPowerupByColor(color);
    const isGreen = color === 'verde';

    console.log(`⚡ Powerup generado: ${typeKey} (${color})`);

    const speed = isGreen ? 120 : 40;
    const size = isGreen ? 12 : 24;
    const cx = brick.x + brick.w / 2;
    const cy = brick.y + brick.h / 2;

    const el = document.createElement('div');
    el.style.cssText = `
      position: absolute;
      width: ${size}px; height: ${size}px;
      border-radius: 50%;
      background: ${isGreen ? '#3c9' : '#e74c3c'};
      box-shadow: 0 0 12px rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: bold; font-size: ${size * 0.5}px;
      pointer-events: none; z-index: 15;
      transform: translate(-50%, -50%);
    `;
    let symbol = '';
    switch (typeKey) {
      case 'MULTIBOLA': symbol = '✧'; break;
      case 'PALA_GRANDE': symbol = '▬'; break;
      case 'DUREZA': symbol = '⬆'; break;
      case 'BOLA_NIEBLA': symbol = '☁'; break;
      case 'PALA_MINI': symbol = '▭'; break;
      case 'FLAQUESA': symbol = '⬇'; break;
    }
    el.textContent = symbol;
    inner.appendChild(el);

    powerups.push({
      x: cx,
      y: cy,
      vx: 0,
      vy: speed,
      size: size,
      color: color,
      type: typeKey,
      el: el,
      alive: true
    });
  }

  function applyPowerup(pu) {
    const type = pu.type;
    switch (type) {
      case 'PALA_GRANDE':
        paddleSizeMultiplier = 1.3;
        break;
      case 'PALA_MINI':
        paddleSizeMultiplier = 0.7;
        break;
      case 'MULTIBOLA': {
        const count = balls.length;
        if (count >= 1 && count <= 3) {
          const newCount = Math.min(9, count * 3);
          const extra = newCount - count;
          for (let i = 0; i < extra; i++) {
            const src = balls[Math.floor(Math.random() * balls.length)];
            const angle = (Math.random() - 0.5) * 1.2;
            const speed = Math.sqrt(src.vx * src.vx + src.vy * src.vy) || BALL_SPEED;
            const vx = Math.sin(angle) * speed;
            const vy = -Math.cos(angle) * speed;
            balls.push({
              x: src.x + (Math.random() - 0.5) * 10,
              y: src.y + (Math.random() - 0.5) * 10,
              vx: vx,
              vy: vy
            });
          }
        }
        break;
      }
      case 'DUREZA': {
        const candidates = bricks.filter(b => b.alive && b.type !== BRICK_TYPES.IRON);
        if (candidates.length > 0) {
          const idx = Math.floor(Math.random() * candidates.length);
          upgradeBrickType(candidates[idx]);
        }
        break;
      }
      case 'FLAQUESA': {
        const candidates = bricks.filter(b => b.alive && b.type !== BRICK_TYPES.CLAY);
        if (candidates.length > 0) {
          const idx = Math.floor(Math.random() * candidates.length);
          downgradeBrickType(candidates[idx]);
        }
        break;
      }
      case 'BOLA_NIEBLA': {
        nieblaLevel = Math.min(MAX_NIEBLA, nieblaLevel + 1);
        updateNiebla();
        break;
      }
    }
  }

  function updateNiebla() {
    const opacity = nieblaLevel / MAX_NIEBLA * 0.5;
    nieblaEl.style.opacity = opacity;
  }

  // ------------------------------------------------------------
  // Funciones de bola y juego
  // ------------------------------------------------------------
  function launchBall() {
    if (launched) return;
    for (const b of balls) {
      if (b.vx === 0 && b.vy === 0) {
        const dir = Math.random() < 0.5 ? -1 : 1;
        const angle = (Math.random() - 0.5) * 0.8;
        b.vx = Math.sin(angle) * BALL_SPEED * dir;
        b.vy = -Math.cos(angle) * BALL_SPEED;
      }
    }
    launched = true;
  }

  function resetGameState() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    if (countdownInterval) clearInterval(countdownInterval);
    running = false;
    launched = false;
    bricks = [];
    powerups = [];
    balls = [];
    paddle.x = (STAGE_W - PADDLE_W_BASE) / 2;
    paddleSizeMultiplier = 1;
    paddleWidth = PADDLE_W_BASE;
    nieblaLevel = 0;
    updateNiebla();
    lives = 3;
    playerScore = 0;
    gamePoints = 0;
    pendingRegeneration = false;
    keys.left = keys.right = false;
    touchActive = false;
    touchX = 0;
    mouseActive = false;
    mouseX = 0;
    gameStartTime = 0;

    inner.querySelectorAll('.brick').forEach(b => b.remove());
    powerups.forEach(p => p.el.remove());
    powerups = [];
    balls.push({ x: STAGE_W / 2, y: STAGE_H - 38, vx: 0, vy: 0 });

    msgEl.classList.remove('show');
    restartBtn.style.display = 'none';
    updateUI();
    draw();
  }

  function loseLife() {
    lives--;
    if (lives <= 0) {
      endGame();
      return;
    }
    paddleSizeMultiplier = 1;
    paddleWidth = PADDLE_W_BASE;
    nieblaLevel = 0;
    updateNiebla();
    resetBricksToOriginal();
    powerups.forEach(p => p.el.remove());
    powerups = [];
    balls = [{ x: paddle.x + paddleWidth / 2, y: STAGE_H - 14 - BALL_R, vx: 0, vy: 0 }];
    launched = false;
    updateUI();
    draw();
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
    const clayValues = new Array(36).fill(1);
    inner.querySelectorAll('.brick').forEach(b => b.remove());
    bricks = [];
    gamePoints = 0;
    placeBricks(clayValues);

    paddle.x = (STAGE_W - paddleWidth) / 2;
    launched = false;
    balls = [{ x: paddle.x + paddleWidth / 2, y: STAGE_H - 14 - BALL_R, vx: 0, vy: 0 }];
    msgEl.classList.remove('show');
    running = true;
    gameStartTime = performance.now();
    layoutStage();
    updateUI();
    draw();
    lastTime = 0;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(gameLoop);
  }

  function updateUI() {
    livesEl.textContent = '♥ '.repeat(Math.max(lives, 0)).trim() || '—';
    scoreEl.textContent = `Puntos: ${playerScore}`;
  }

  function draw() {
    paddleWidth = PADDLE_W_BASE * paddleSizeMultiplier;
    paddleEl.style.width = paddleWidth + 'px';
    paddleEl.style.transform = 'translateX(' + paddle.x + 'px)';

    let ballElements = inner.querySelectorAll('.ball-dynamic');
    while (ballElements.length < balls.length) {
      const el = document.createElement('div');
      el.className = 'ball-dynamic';
      el.style.cssText = `
        position: absolute; width: ${BALL_R * 2}px; height: ${BALL_R * 2}px;
        border-radius: 50%; background: radial-gradient(circle at 35% 30%, #fff, #d68a96 60%, #a13545);
        box-shadow: 0 0 8px rgba(255,200,200,0.3); pointer-events: none;
        transform: translate(-50%, -50%);
      `;
      inner.appendChild(el);
      ballElements = inner.querySelectorAll('.ball-dynamic');
    }
    while (ballElements.length > balls.length) {
      ballElements[ballElements.length - 1].remove();
      ballElements = inner.querySelectorAll('.ball-dynamic');
    }
    for (let i = 0; i < balls.length; i++) {
      const el = ballElements[i];
      el.style.left = balls[i].x + 'px';
      el.style.top = balls[i].y + 'px';
    }

    for (const pu of powerups) {
      pu.el.style.left = pu.x + 'px';
      pu.el.style.top = pu.y + 'px';
    }
  }

  // ------------------------------------------------------------
  // Bucle principal
  // ------------------------------------------------------------
  let lastTime = 0;

  function gameLoop(timestamp) {
    if (!running) return;

    const delta = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0.016;
    lastTime = timestamp;

    updateUI();

    let paddleMoved = false;
    if (keys.left) { paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * delta); paddleMoved = true; }
    if (keys.right) { paddle.x = Math.min(STAGE_W - paddleWidth, paddle.x + PADDLE_SPEED * delta); paddleMoved = true; }
    if (touchActive) {
      paddle.x = Math.max(0, Math.min(STAGE_W - paddleWidth, touchX));
      paddleMoved = true;
    }
    if (mouseActive) {
      paddle.x = Math.max(0, Math.min(STAGE_W - paddleWidth, mouseX));
      paddleMoved = true;
    }

    if (!launched) {
      if (balls.length > 0) {
        const b = balls[0];
        b.x = paddle.x + paddleWidth / 2;
        b.y = STAGE_H - 14 - BALL_R;
      }
      if (paddleMoved) launchBall();
      draw();
      animFrameId = requestAnimationFrame(gameLoop);
      return;
    }

    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      b.x += b.vx * delta;
      b.y += b.vy * delta;

      if (b.x - BALL_R < 0) { b.x = BALL_R; b.vx = Math.abs(b.vx); }
      if (b.x + BALL_R > STAGE_W) { b.x = STAGE_W - BALL_R; b.vx = -Math.abs(b.vx); }
      if (b.y - BALL_R < 0) { b.y = BALL_R; b.vy = Math.abs(b.vy); }

      const py = STAGE_H - 14;
      if (b.vy > 0 && b.y + BALL_R >= py && b.y + BALL_R <= py + 10 &&
          b.x >= paddle.x - BALL_R && b.x <= paddle.x + paddleWidth + BALL_R) {
        b.y = py - BALL_R;
        let hit = (b.x - (paddle.x + paddleWidth / 2)) / (paddleWidth / 2);
        hit = Math.max(-0.85, Math.min(0.85, hit));
        const angle = hit * 0.7;
        b.vx = Math.sin(angle) * BALL_SPEED;
        b.vy = -Math.cos(angle) * BALL_SPEED;
      }

      for (const br of bricks) {
        if (!br.alive) continue;
        if (b.x + BALL_R > br.x && b.x - BALL_R < br.x + br.w &&
            b.y + BALL_R > br.y && b.y - BALL_R < br.y + br.h) {

          const overlapX = Math.min(b.x + BALL_R - br.x, br.x + br.w - (b.x - BALL_R));
          const overlapY = Math.min(b.y + BALL_R - br.y, br.y + br.h - (b.y - BALL_R));
          if (overlapX < overlapY) {
            if (b.x < br.x + br.w / 2) b.x = br.x - BALL_R;
            else b.x = br.x + br.w + BALL_R;
            b.vx = -b.vx;
          } else {
            if (b.y < br.y + br.h / 2) b.y = br.y - BALL_R;
            else b.y = br.y + br.h + BALL_R;
            b.vy = -b.vy;
          }

          br.hits--;
          soundBrick();
          if (br.hits <= 0) {
            br.alive = false;
            br.el.classList.add('gone');
            playerScore += br.playerPoints;
            gamePoints -= br.value;
            updateUI();
            spawnPowerup(br); // <-- aquí se genera el power‑up
            if (gamePoints <= REGEN_THRESHOLD) requestRegeneration();
          } else {
            br.el.textContent = FRACTURE_SYMBOLS[br.hits] || '|';
          }
          break;
        }
      }

      if (b.y - BALL_R > STAGE_H) {
        balls.splice(i, 1);
        soundLose();
        if (balls.length === 0) {
          loseLife();
          if (lives <= 0) {
            draw();
            animFrameId = requestAnimationFrame(gameLoop);
            return;
          }
          balls = [{ x: paddle.x + paddleWidth / 2, y: STAGE_H - 14 - BALL_R, vx: 0, vy: 0 }];
          launched = false;
          updateUI();
          draw();
          animFrameId = requestAnimationFrame(gameLoop);
          return;
        }
      }
    }

    for (let i = powerups.length - 1; i >= 0; i--) {
      const pu = powerups[i];
      pu.y += pu.vy * delta;

      const px = paddle.x;
      const py2 = STAGE_H - 14 - PADDLE_H / 2;
      if (pu.y + pu.size / 2 > py2 - PADDLE_H / 2 &&
          pu.y - pu.size / 2 < py2 + PADDLE_H / 2 &&
          pu.x + pu.size / 2 > px &&
          pu.x - pu.size / 2 < px + paddleWidth) {
        applyPowerup(pu);
        pu.el.remove();
        powerups.splice(i, 1);
        soundTap();
        continue;
      }

      if (pu.y - pu.size / 2 > STAGE_H) {
        pu.el.remove();
        powerups.splice(i, 1);
        continue;
      }

      pu.el.style.left = pu.x + 'px';
      pu.el.style.top = pu.y + 'px';
    }

    if (pendingRegeneration) checkAndRegenerate();

    draw();
    animFrameId = requestAnimationFrame(gameLoop);
  }

  // ------------------------------------------------------------
  // Abrir / cerrar juego
  // ------------------------------------------------------------
  function openGame() {
    resetGameState();
    overlay.classList.add('open');
    inner.querySelectorAll('.brick').forEach(b => b.remove());
    bricks = [];
    powerups.forEach(p => p.el.remove());
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

  // ------------------------------------------------------------
  // Eventos
  // ------------------------------------------------------------
  document.getElementById('game-close').addEventListener('click', closeGame);
  restartBtn.addEventListener('click', () => { soundTap(); startGame(); });
  overlay.addEventListener('click', e => { if (e.target === overlay) closeGame(); });

  stage.addEventListener('mousedown', (e) => {
    if (!running) return;
    const rect = stage.getBoundingClientRect();
    const localX = (e.clientX - rect.left) / scale;
    mouseX = Math.min(Math.max(localX - paddleWidth / 2, 0), STAGE_W - paddleWidth);
    mouseActive = true;
    if (!launched) launchBall();
  });
  document.addEventListener('mousemove', (e) => {
    if (!running || !mouseActive) return;
    const rect = stage.getBoundingClientRect();
    const localX = (e.clientX - rect.left) / scale;
    mouseX = Math.min(Math.max(localX - paddleWidth / 2, 0), STAGE_W - paddleWidth);
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
      touchX = Math.min(Math.max(localX - paddleWidth / 2, 0), STAGE_W - paddleWidth);
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
      touchX = Math.min(Math.max(localX - paddleWidth / 2, 0), STAGE_W - paddleWidth);
      touchActive = true;
    }
  }, { passive: false });
  stage.addEventListener('touchend', () => { touchActive = false; }, { passive: true });
  stage.addEventListener('touchcancel', () => { touchActive = false; }, { passive: true });

  window.addEventListener('resize', () => { layoutStage(); draw(); });
  layoutStage();
  resetGameState();
  console.log('✅ Juego listo con power‑ups (prob. altas)');
}
