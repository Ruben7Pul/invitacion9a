// ============================================================
// juego.js – Versión definitiva con power‑ups, niebla y multibola
// ============================================================
console.log('🎮 juego.js (power‑ups + niebla + multibola)');

import { soundTap, soundBrick, soundWin, soundLose, soundClose } from './sonidos.js';

// ========== CONSTANTES ==========
const PADDLE_BASE_W = 60;
const PADDLE_H = 8;
const BALL_R = 4;
const STAGE_W = 300;
const STAGE_H = 420;
const TOP_OFFSET = 30;
const BALL_SPEED = 300;
const PADDLE_SPEED = 300;
const MAX_BALLS = 9;
const DROP_PROB = { CLAY: 0.05, WOOD: 0.10, IRON: 0.20 };

// Pesos para elegir poder dentro de cada categoría
const GREEN_WEIGHTS = [
  { name: 'multiball', weight: 15 },
  { name: 'bigPaddle', weight: 35 },
  { name: 'durability', weight: 50 }
];
const RED_WEIGHTS = [
  { name: 'fog', weight: 10 },
  { name: 'miniPaddle', weight: 35 },
  { name: 'weakness', weight: 55 }
];

const POWERUP_SPEED = { GREEN: 180, RED: 80 };   // píxeles/segundo
const POWERUP_RADIUS = { GREEN: 8, RED: 16 };

// ========== ELEMENTOS DOM ==========
let stage, inner, paddleEl, ballContainer, msgEl, msgText, livesEl, scoreEl, restartBtn, fogOverlay;
let overlay;
let scale = 1;

// ========== ESTADO DEL JUEGO ==========
let bricks = [];
let balls = [];
let powerups = [];
let paddle = { x: 0, width: PADDLE_BASE_W };
let fogLevel = 0;
let gameStartTime = 0;
let lives = 3;
let playerScore = 0;
let gamePoints = 0;          // suma de valores de ladrillos vivos
let running = false;
let launched = false;
let animFrameId = null;
let countdownInterval = null;
let pendingRegeneration = false;
let basePaddleWidth = PADDLE_BASE_W;
let lastTime = 0;

// Controles
let keys = { left: false, right: false };
let touchActive = false, touchX = 0;
let mouseActive = false, mouseX = 0;

// ========== FUNCIONES AUXILIARES ==========
function getRandomColor() {
  const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#1dd1a1', '#f368e0'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getBrickTypeByHits(hits) {
  if (hits === 1) return { value: 1, playerPoints: 100, hits: 1, color: '#d9534f', label: 'arcilla' };
  if (hits === 2) return { value: 2, playerPoints: 200, hits: 2, color: '#8b5a2b', label: 'madera' };
  return { value: 3, playerPoints: 300, hits: 3, color: '#a0a0a0', label: 'hierro' };
}

const FRACTURE_SYMBOLS = { 1: '|', 2: '||', 3: '|||' };

function updateBrickAppearance(brick) {
  const type = getBrickTypeByHits(brick.hits);
  brick.el.style.background = type.color;
  brick.el.textContent = FRACTURE_SYMBOLS[brick.hits] || '|';
  brick.value = type.value;
  brick.playerPoints = type.playerPoints;
}

// ========== LADRILLOS ==========
function generateBrickValues() {
  const total = 18; // TARGET_GAME_POINTS
  const values = [];
  let remaining = total;
  while (remaining > 0) {
    let max = Math.min(3, remaining);
    let val = Math.floor(Math.random() * max) + 1;
    const rest = remaining - val;
    if (rest === 1 && remaining > 2) val = 2;
    else if (rest === 2 && remaining > 3) val = 3;
    values.push(val);
    remaining -= val;
  }
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
    const hits = values[i];
    const type = getBrickTypeByHits(hits);

    const el = document.createElement('div');
    el.className = 'brick';
    Object.assign(el.style, {
      left: x + 'px', top: y + 'px',
      width: brickW + 'px', height: brickH + 'px',
      background: type.color,
      borderRadius: '4px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.3)',
      color: '#fff', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    });
    el.textContent = FRACTURE_SYMBOLS[hits] || '|';
    inner.appendChild(el);

    bricks.push({
      x, y, w: brickW, h: brickH, el, alive: true,
      hits: hits, maxHits: type.hits, value: type.value,
      playerPoints: type.playerPoints, cell: cell
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
  if (launched && balls.some(b => b.y < STAGE_H - 60)) return;
  if (getFreeCells().length === 0) { pendingRegeneration = false; return; }
  const values = generateBrickValues();
  placeBricks(values);
  pendingRegeneration = false;
}

// ========== BOLAS ==========
function createBallDOM(x, y, color) {
  const el = document.createElement('div');
  el.className = 'ball';
  Object.assign(el.style, {
    position: 'absolute',
    width: (BALL_R * 2) + 'px',
    height: (BALL_R * 2) + 'px',
    borderRadius: '50%',
    background: color || 'radial-gradient(circle at 35% 30%, #fff, #d68a96 60%, #a13545)',
    boxShadow: '0 0 8px rgba(255,200,200,0.3)',
    transform: `translate(${x - BALL_R}px, ${y - BALL_R}px)`,
    willChange: 'transform'
  });
  inner.appendChild(el);
  return el;
}

function createBall(x, y, vx = 0, vy = 0, color = null) {
  const el = createBallDOM(x, y, color);
  return { x, y, vx, vy, el, color: color || '#ff6b6b' };
}

function removeBall(ball) {
  if (ball.el && ball.el.parentNode) ball.el.parentNode.removeChild(ball.el);
  const idx = balls.indexOf(ball);
  if (idx !== -1) balls.splice(idx, 1);
}

function resetBallsToSingle() {
  balls.forEach(b => { if (b.el && b.el.parentNode) b.el.parentNode.removeChild(b.el); });
  balls = [];
  const color = getRandomColor();
  const b = createBall(paddle.x + paddle.width / 2, STAGE_H - 14 - BALL_R, 0, 0, color);
  balls.push(b);
  launched = false;
}

function launchBall() {
  if (launched || balls.length === 0) return;
  const b = balls[0];
  const dir = Math.random() < 0.5 ? -1 : 1;
  const angle = (Math.random() - 0.5) * 0.8;
  b.vx = Math.sin(angle) * BALL_SPEED * dir;
  b.vy = -Math.cos(angle) * BALL_SPEED;
  launched = true;
}

// ========== POWER‑UPS ==========
function spawnPowerup(x, y, type) {
  const isGreen = (type === 'GREEN');
  const pool = isGreen ? GREEN_WEIGHTS : RED_WEIGHTS;
  const totalWeight = pool.reduce((s, p) => s + p.weight, 0);
  let rand = Math.random() * totalWeight;
  let chosen = pool[0].name;
  for (const item of pool) {
    rand -= item.weight;
    if (rand <= 0) { chosen = item.name; break; }
  }

  const speed = isGreen ? POWERUP_SPEED.GREEN : POWERUP_SPEED.RED;
  const radius = isGreen ? POWERUP_RADIUS.GREEN : POWERUP_RADIUS.RED;
  const color = isGreen ? '#2ecc71' : '#e74c3c';
  const el = document.createElement('div');
  Object.assign(el.style, {
    position: 'absolute',
    width: (radius * 2) + 'px',
    height: (radius * 2) + 'px',
    borderRadius: '50%',
    background: color,
    boxShadow: isGreen ? '0 0 12px rgba(46,204,113,0.6)' : '0 0 12px rgba(231,76,60,0.6)',
    border: '2px solid #fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '12px', fontWeight: 'bold', color: '#fff',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
    transform: `translate(${x - radius}px, ${y - radius}px)`
  });
  el.textContent = chosen.charAt(0).toUpperCase();
  inner.appendChild(el);

  const powerup = {
    x, y,
    vx: (Math.random() - 0.5) * 20,
    vy: speed,
    radius,
    el,
    type: isGreen ? 'GREEN' : 'RED',
    name: chosen,
    alive: true
  };
  powerups.push(powerup);
}

function applyPowerup(power) {
  const name = power.name;
  console.log('💥 Aplicando:', name);
  switch (name) {
    case 'bigPaddle':
      paddle.width = basePaddleWidth * 1.3;
      updatePaddleDOM();
      break;
    case 'miniPaddle':
      paddle.width = basePaddleWidth * 0.7;
      updatePaddleDOM();
      break;
    case 'durability': {
      const alive = bricks.filter(b => b.alive);
      if (alive.length === 0) break;
      const brick = alive[Math.floor(Math.random() * alive.length)];
      if (brick.hits < 3) {
        const oldVal = brick.value;
        brick.hits++;
        updateBrickAppearance(brick);
        const newType = getBrickTypeByHits(brick.hits);
        brick.value = newType.value;
        brick.playerPoints = newType.playerPoints;
        gamePoints += (brick.value - oldVal);
      }
      break;
    }
    case 'weakness': {
      const alive = bricks.filter(b => b.alive);
      if (alive.length === 0) break;
      const brick = alive[Math.floor(Math.random() * alive.length)];
      if (brick.hits > 1) {
        const oldVal = brick.value;
        brick.hits--;
        updateBrickAppearance(brick);
        const newType = getBrickTypeByHits(brick.hits);
        brick.value = newType.value;
        brick.playerPoints = newType.playerPoints;
        gamePoints += (brick.value - oldVal);
      }
      break;
    }
    case 'multiball': {
      const currentCount = balls.length;
      if (currentCount >= MAX_BALLS) break;
      let newCount = Math.min(currentCount * 3, MAX_BALLS);
      const existing = balls.slice();
      const target = newCount - currentCount;
      for (let i = 0; i < target; i++) {
        const src = existing[i % existing.length];
        const angleOffset = (Math.random() - 0.5) * 1.2;
        const speed = Math.sqrt(src.vx * src.vx + src.vy * src.vy) || BALL_SPEED;
        const baseAngle = Math.atan2(src.vy, src.vx);
        const newAngle = baseAngle + angleOffset;
        const vx = Math.cos(newAngle) * speed;
        const vy = Math.sin(newAngle) * speed;
        const color = getRandomColor();
        const b = createBall(src.x + (Math.random() - 0.5) * 10, src.y + (Math.random() - 0.5) * 10, vx, vy, color);
        balls.push(b);
      }
      launched = true;
      break;
    }
    case 'fog': {
      if (fogLevel < 3) {
        fogLevel++;
        updateFog();
      }
      break;
    }
  }
}

function updateFog() {
  if (!fogOverlay) return;
  const opacity = fogLevel * 0.2; // 0, 0.2, 0.4, 0.6
  fogOverlay.style.opacity = opacity;
}

function updatePaddleDOM() {
  paddleEl.style.width = paddle.width + 'px';
  paddleEl.style.transform = `translateX(${paddle.x}px)`;
}

// ========== ACTUALIZACIÓN DEL JUEGO ==========
function updateBalls(delta) {
  const ballsToRemove = [];
  for (const ball of balls) {
    ball.x += ball.vx * delta;
    ball.y += ball.vy * delta;

    // Rebotes paredes
    if (ball.x - BALL_R < 0) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx); }
    if (ball.x + BALL_R > STAGE_W) { ball.x = STAGE_W - BALL_R; ball.vx = -Math.abs(ball.vx); }
    if (ball.y - BALL_R < 0) { ball.y = BALL_R; ball.vy = Math.abs(ball.vy); }

    // Rebote pala
    const py = STAGE_H - 14;
    if (ball.vy > 0 && ball.y + BALL_R >= py && ball.y + BALL_R <= py + 10 &&
        ball.x >= paddle.x - BALL_R && ball.x <= paddle.x + paddle.width + BALL_R) {
      ball.y = py - BALL_R;
      let hit = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
      hit = Math.max(-0.85, Math.min(0.85, hit));
      const angle = hit * 0.7;
      ball.vx = Math.sin(angle) * BALL_SPEED;
      ball.vy = -Math.cos(angle) * BALL_SPEED;
    }

    // Colisión con ladrillos
    for (const b of bricks) {
      if (!b.alive) continue;
      if (ball.x + BALL_R > b.x && ball.x - BALL_R < b.x + b.w &&
          ball.y + BALL_R > b.y && ball.y - BALL_R < b.y + b.h) {
        // Reposicionar
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

        soundBrick();
        b.hits--;
        if (b.hits <= 0) {
          b.alive = false;
          b.el.classList.add('gone');
          playerScore += b.playerPoints;
          gamePoints -= b.value;
          updateUI();
          if (gamePoints <= 9) requestRegeneration();
        } else {
          updateBrickAppearance(b);
        }

        // Probabilidad de soltar power‑up
        const hitsBefore = b.hits + 1;
        let prob = 0;
        if (hitsBefore === 1) prob = DROP_PROB.CLAY;
        else if (hitsBefore === 2) prob = DROP_PROB.WOOD;
        else if (hitsBefore >= 3) prob = DROP_PROB.IRON;
        if (Math.random() < prob) {
          const elapsed = (Date.now() - gameStartTime) / 60000;
          const minutes = Math.min(elapsed, 16);
          const greenProb = 50 - (minutes * 3.125);
          const isGreen = Math.random() < (greenProb / 100);
          spawnPowerup(b.x + b.w/2, b.y, isGreen ? 'GREEN' : 'RED');
        }
        break;
      }
    }

    if (ball.y - BALL_R > STAGE_H) {
      ballsToRemove.push(ball);
    }
  }

  for (const ball of ballsToRemove) removeBall(ball);

  if (balls.length === 0 && running) {
    loseLife();
  }

  // Actualizar posiciones visuales
  for (const ball of balls) {
    ball.el.style.transform = `translate(${ball.x - BALL_R}px, ${ball.y - BALL_R}px)`;
  }
}

function updatePowerups(delta) {
  const toRemove = [];
  for (const p of powerups) {
    p.y += p.vy * delta;
    p.x += p.vx * delta;
    p.el.style.transform = `translate(${p.x - p.radius}px, ${p.y - p.radius}px)`;

    const paddleY = STAGE_H - 14;
    if (p.y + p.radius >= paddleY && p.y - p.radius <= paddleY + PADDLE_H &&
        p.x >= paddle.x - p.radius && p.x <= paddle.x + paddle.width + p.radius) {
      applyPowerup(p);
      toRemove.push(p);
      soundTap();
    } else if (p.y - p.radius > STAGE_H) {
      toRemove.push(p);
    }
  }
  for (const p of toRemove) {
    if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el);
    const idx = powerups.indexOf(p);
    if (idx !== -1) powerups.splice(idx, 1);
  }
}

function loseLife() {
  lives--;
  soundLose();
  if (lives <= 0) {
    endGame();
    return;
  }
  // Resetear efectos del jugador (pala, niebla, bolas)
  paddle.width = basePaddleWidth;
  paddle.x = (STAGE_W - paddle.width) / 2;
  updatePaddleDOM();
  fogLevel = 0;
  updateFog();
  resetBallsToSingle();
  launched = false;
  // Limpiar powerups en pantalla
  powerups.forEach(p => { if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el); });
  powerups = [];
  // Colocar bola sobre la pala
  if (balls.length > 0) {
    const b = balls[0];
    b.x = paddle.x + paddle.width / 2;
    b.y = STAGE_H - 14 - BALL_R;
    b.vx = 0; b.vy = 0;
  }
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

// ========== BUCLE PRINCIPAL ==========
function gameLoop(timestamp) {
  if (!running) return;
  const delta = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0.016;
  lastTime = timestamp;

  // Movimiento de pala
  if (keys.left) paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * delta);
  if (keys.right) paddle.x = Math.min(STAGE_W - paddle.width, paddle.x + PADDLE_SPEED * delta);
  if (touchActive) paddle.x = Math.max(0, Math.min(STAGE_W - paddle.width, touchX));
  if (mouseActive) paddle.x = Math.max(0, Math.min(STAGE_W - paddle.width, mouseX));

  // Lanzar bola si se mueve la pala
  if (!launched && balls.length > 0) {
    const b = balls[0];
    b.x = paddle.x + paddle.width / 2;
    b.y = STAGE_H - 14 - BALL_R;
    if (keys.left || keys.right || touchActive || mouseActive) {
      launchBall();
    }
  }

  updateBalls(delta);
  updatePowerups(delta);
  if (pendingRegeneration) checkAndRegenerate();

  paddleEl.style.transform = `translateX(${paddle.x}px)`;
  updateUI();
  animFrameId = requestAnimationFrame(gameLoop);
}

function draw() {
  paddleEl.style.transform = `translateX(${paddle.x}px)`;
  for (const ball of balls) {
    ball.el.style.transform = `translate(${ball.x - BALL_R}px, ${ball.y - BALL_R}px)`;
  }
  for (const p of powerups) {
    p.el.style.transform = `translate(${p.x - p.radius}px, ${p.y - p.radius}px)`;
  }
}

function updateUI() {
  livesEl.textContent = '♥ '.repeat(Math.max(lives, 0)).trim() || '—';
  scoreEl.textContent = `Puntos: ${playerScore}`;
}

// ========== INICIO Y REINICIO ==========
function startGame() {
  // Limpiar escenario
  inner.querySelectorAll('.brick, .ball, .powerup').forEach(el => el.remove());
  bricks = [];
  powerups = [];
  gamePoints = 0;
  playerScore = 0;
  lives = 3;
  fogLevel = 0;
  updateFog();
  basePaddleWidth = PADDLE_BASE_W;
  paddle.width = basePaddleWidth;
  paddle.x = (STAGE_W - paddle.width) / 2;
  updatePaddleDOM();

  // Ladrillos iniciales (todos arcilla)
  const initialValues = new Array(36).fill(1);
  placeBricks(initialValues);

  resetBallsToSingle();
  const b = balls[0];
  if (b) {
    b.x = paddle.x + paddle.width / 2;
    b.y = STAGE_H - 14 - BALL_R;
    b.vx = 0; b.vy = 0;
  }
  launched = false;
  msgEl.classList.remove('show');
  running = true;
  gameStartTime = Date.now();
  layoutStage();
  updateUI();
  draw();
  if (animFrameId) cancelAnimationFrame(animFrameId);
  lastTime = 0;
  animFrameId = requestAnimationFrame(gameLoop);
}

function openGame() {
  resetBallsToSingle();
  overlay.classList.add('open');
  let countdown = 3;
  msgText.textContent = countdown;
  msgEl.classList.add('show');
  if (countdownInterval) clearInterval(countdownInterval);
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
  running = false;
  if (animFrameId) cancelAnimationFrame(animFrameId);
  if (countdownInterval) clearInterval(countdownInterval);
  soundClose();
  inner.querySelectorAll('.brick, .ball, .powerup').forEach(el => el.remove());
  bricks = [];
  powerups = [];
  resetBallsToSingle();
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

// ========== EXPORTACIÓN E INICIALIZACIÓN ==========
export function initJuego(config) {
  console.log('🎮 Inicializando juego con power‑ups');

  // Obtener referencias DOM
  overlay = document.getElementById('game-overlay');
  stage = document.getElementById('game-stage');
  inner = document.getElementById('game-inner');
  paddleEl = document.getElementById('paddle');
  msgEl = document.getElementById('game-msg');
  msgText = document.getElementById('game-msg-text');
  livesEl = document.getElementById('lives');
  scoreEl = document.getElementById('game-score');
  restartBtn = document.getElementById('game-restart');
  const closeBtn = document.getElementById('game-close');

  // Crear overlay de niebla
  fogOverlay = document.createElement('div');
  Object.assign(fogOverlay.style, {
    position: 'absolute', top: '0', left: '0',
    width: '100%', height: '100%',
    background: 'rgba(0,0,0,0.6)',
    pointerEvents: 'none',
    opacity: '0',
    transition: 'opacity 0.5s ease',
    zIndex: '10'
  });
  stage.appendChild(fogOverlay);

  // Ocultar tiempo si existe
  const timeEl = document.getElementById('game-time');
  if (timeEl) timeEl.style.display = 'none';

  // Evento de clic en el nombre para abrir juego
  const nombreEl = document.getElementById('nombre-hero');
  nombreEl.addEventListener('click', () => { soundTap(); openGame(); });

  // Controles
  document.addEventListener('keydown', (e) => {
    if (!running) return;
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') { keys.left = true; e.preventDefault(); }
    else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') { keys.right = true; e.preventDefault(); }
  });
  document.addEventListener('keyup', (e) => {
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') { keys.left = false; e.preventDefault(); }
    else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') { keys.right = false; e.preventDefault(); }
  });

  stage.addEventListener('mousedown', (e) => {
    if (!running) return;
    const rect = stage.getBoundingClientRect();
    const localX = (e.clientX - rect.left) / scale;
    mouseX = Math.min(Math.max(localX - paddle.width / 2, 0), STAGE_W - paddle.width);
    mouseActive = true;
    if (!launched) launchBall();
  });
  document.addEventListener('mousemove', (e) => {
    if (!running || !mouseActive) return;
    const rect = stage.getBoundingClientRect();
    const localX = (e.clientX - rect.left) / scale;
    mouseX = Math.min(Math.max(localX - paddle.width / 2, 0), STAGE_W - paddle.width);
  });
  document.addEventListener('mouseup', () => { mouseActive = false; });

  stage.addEventListener('click', () => { if (running && !launched) launchBall(); });

  stage.addEventListener('touchstart', (e) => {
    if (!running) return;
    const touch = e.touches[0];
    if (touch) {
      const rect = stage.getBoundingClientRect();
      const localX = (touch.clientX - rect.left) / scale;
      touchX = Math.min(Math.max(localX - paddle.width / 2, 0), STAGE_W - paddle.width);
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
      touchX = Math.min(Math.max(localX - paddle.width / 2, 0), STAGE_W - paddle.width);
      touchActive = true;
    }
  }, { passive: false });
  stage.addEventListener('touchend', () => { touchActive = false; }, { passive: true });
  stage.addEventListener('touchcancel', () => { touchActive = false; }, { passive: true });

  closeBtn.addEventListener('click', closeGame);
  restartBtn.addEventListener('click', () => { soundTap(); startGame(); });
  overlay.addEventListener('click', e => { if (e.target === overlay) closeGame(); });

  window.addEventListener('resize', () => { layoutStage(); draw(); });

  // Estado inicial
  resetBallsToSingle();
  layoutStage();
  // No iniciar automáticamente; se inicia al abrir el juego
  console.log('✅ Juego listo');
}
