// juego.js - versión con power‑ups, downgrades, niebla y múltiples bolas
console.log('📦 juego.js (power‑ups + downgrades + niebla)');

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
const TARGET_GAME_POINTS = 18;
const REGEN_THRESHOLD = 9;
const BALL_LOW_Y = STAGE_H - 60;
const MAX_BALLS = 9;

// Tipos de ladrillos
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

// Probabilidades de soltar power‑up por tipo de ladrillo
const DROP_PROB = {
  CLAY: 0.05,
  WOOD: 0.10,
  IRON: 0.20
};

// Pesos para elegir el poder dentro de cada categoría
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

// Velocidad de caída y radio de colisión para verdes y rojos
const POWERUP_SPEED = { GREEN: 180, RED: 80 };   // píxeles/segundo
const POWERUP_RADIUS = { GREEN: 8, RED: 16 };

// ========== VARIABLES DE ESTADO ==========
let balls = [];
let paddle = { x: 0, width: PADDLE_BASE_W };
let bricks = [];
let powerups = [];
let fogLevel = 0;
let gameStartTime = 0;
let lives = 3;
let playerScore = 0;
let gamePoints = 0;
let running = false;
let launched = false;
let animFrameId = null;
let countdownInterval = null;
let pendingRegeneration = false;
let basePaddleWidth = PADDLE_BASE_W;  // referencia para resetear

// Elementos DOM
let stage, inner, paddleEl, ballContainer, msgEl, msgText, livesEl, scoreEl, restartBtn, fogOverlay;
let overlay;
let scale = 1;

// Controles
let keys = { left: false, right: false };
let touchActive = false, touchX = 0;
let mouseActive = false, mouseX = 0;

// ========== FUNCIONES DE UTILIDAD ==========
function getRandomColor() {
  const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#1dd1a1', '#f368e0'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// ========== GESTIÓN DE BOLAS ==========
function createBallDOM(x, y, color) {
  const el = document.createElement('div');
  el.className = 'ball';
  el.style.width = (BALL_R * 2) + 'px';
  el.style.height = (BALL_R * 2) + 'px';
  el.style.borderRadius = '50%';
  el.style.background = color || 'radial-gradient(circle at 35% 30%, #fff, #d68a96 60%, #a13545)';
  el.style.boxShadow = '0 0 8px rgba(255,200,200,0.3)';
  el.style.position = 'absolute';
  el.style.transform = `translate(${x - BALL_R}px, ${y - BALL_R}px)`;
  el.style.willChange = 'transform';
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
  // eliminar todas las bolas existentes
  balls.forEach(b => { if (b.el && b.el.parentNode) b.el.parentNode.removeChild(b.el); });
  balls = [];
  const color = getRandomColor();
  const b = createBall(paddle.x + paddle.width / 2, STAGE_H - 14 - BALL_R, 0, 0, color);
  balls.push(b);
  launched = false;
}

// ========== GESTIÓN DE LADRILLOS ==========
function getBrickTypeByHits(hits) {
  if (hits === 1) return BRICK_TYPES.CLAY;
  if (hits === 2) return BRICK_TYPES.WOOD;
  if (hits >= 3) return BRICK_TYPES.IRON;
  return BRICK_TYPES.CLAY;
}

function updateBrickAppearance(brick) {
  const type = getBrickTypeByHits(brick.hits);
  brick.el.style.background = type.color;
  brick.el.textContent = FRACTURE_SYMBOLS[brick.hits] || '|';
  brick.value = type.value;
  brick.playerPoints = type.playerPoints;
}

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
    const hits = values[i];
    const type = getBrickTypeByHits(hits);

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
    el.textContent = FRACTURE_SYMBOLS[hits] || '|';

    inner.appendChild(el);

    bricks.push({
      x, y, w: brickW, h: brickH,
      el,
      alive: true,
      hits: hits,
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
  // si hay bolas en juego y alguna está por debajo de BALL_LOW_Y, esperar
  if (launched && balls.some(b => b.y < BALL_LOW_Y)) return;
  if (getFreeCells().length === 0) {
    pendingRegeneration = false;
    return;
  }
  const values = generateBrickValues();
  placeBricks(values);
  pendingRegeneration = false;
}

// ========== POWER‑UPS / DOWNGRADES ==========
function spawnPowerup(x, y, type) {
  // type: 'GREEN' o 'RED'
  const isGreen = (type === 'GREEN');
  const pool = isGreen ? GREEN_WEIGHTS : RED_WEIGHTS;
  // elegir según pesos
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
  el.style.position = 'absolute';
  el.style.width = (radius * 2) + 'px';
  el.style.height = (radius * 2) + 'px';
  el.style.borderRadius = '50%';
  el.style.background = color;
  el.style.boxShadow = isGreen ? '0 0 12px rgba(46,204,113,0.6)' : '0 0 12px rgba(231,76,60,0.6)';
  el.style.border = '2px solid #fff';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.fontSize = '12px';
  el.style.fontWeight = 'bold';
  el.style.color = '#fff';
  el.style.textShadow = '0 1px 2px rgba(0,0,0,0.5)';
  el.textContent = chosen.charAt(0).toUpperCase(); // inicial
  el.style.transform = `translate(${x - radius}px, ${y - radius}px)`;
  inner.appendChild(el);

  const powerup = {
    x, y,
    vx: (Math.random() - 0.5) * 20, // ligero desplazamiento horizontal
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
    case 'bigPaddle': {
      paddle.width = basePaddleWidth * 1.3;
      updatePaddleDOM();
      break;
    }
    case 'miniPaddle': {
      paddle.width = basePaddleWidth * 0.7;
      updatePaddleDOM();
      break;
    }
    case 'durability': {
      // elegir un ladrillo vivo al azar y subir su dureza si es < 3
      const alive = bricks.filter(b => b.alive);
      if (alive.length === 0) break;
      const brick = alive[Math.floor(Math.random() * alive.length)];
      if (brick.hits < 3) {
        brick.hits++;
        updateBrickAppearance(brick);
        // actualizar gamePoints? No, porque gamePoints es la suma de valores de ladrillos vivos
        // pero al cambiar el valor, debemos ajustar gamePoints
        const oldVal = brick.value;
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
      // clonar bolas existentes con pequeñas variaciones de velocidad
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
    default: break;
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

// ========== LÓGICA PRINCIPAL DEL JUEGO ==========
function updateBalls(delta) {
  if (!running) return;
  const ballsToRemove = [];

  for (const ball of balls) {
    // Movimiento
    ball.x += ball.vx * delta;
    ball.y += ball.vy * delta;

    // Rebotes en paredes
    if (ball.x - BALL_R < 0) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx); }
    if (ball.x + BALL_R > STAGE_W) { ball.x = STAGE_W - BALL_R; ball.vx = -Math.abs(ball.vx); }
    if (ball.y - BALL_R < 0) { ball.y = BALL_R; ball.vy = Math.abs(ball.vy); }

    // Rebote en la pala
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

        // Golpear ladrillo
        soundBrick();
        b.hits--;
        if (b.hits <= 0) {
          b.alive = false;
          b.el.classList.add('gone');
          playerScore += b.playerPoints;
          gamePoints -= b.value;
          updateUI();
          if (gamePoints <= REGEN_THRESHOLD) requestRegeneration();
        } else {
          updateBrickAppearance(b);
        }

        // Probabilidad de soltar power‑up
        let prob = 0;
        const type = getBrickTypeByHits(b.hits + 1); // hits original antes de reducir
        if (type === BRICK_TYPES.CLAY) prob = DROP_PROB.CLAY;
        else if (type === BRICK_TYPES.WOOD) prob = DROP_PROB.WOOD;
        else if (type === BRICK_TYPES.IRON) prob = DROP_PROB.IRON;
        if (Math.random() < prob) {
          // decidir verde o rojo según tiempo
          const elapsed = (Date.now() - gameStartTime) / 60000; // minutos
          const minutes = Math.min(elapsed, 16);
          const greenProb = 50 - (minutes * 3.125); // 50, 46.875, ... 0
          const isGreen = Math.random() < (greenProb / 100);
          spawnPowerup(b.x + b.w/2, b.y, isGreen ? 'GREEN' : 'RED');
        }

        break; // solo un ladrillo por frame
      }
    }

    // Verificar si la bola se perdió
    if (ball.y - BALL_R > STAGE_H) {
      ballsToRemove.push(ball);
    }
  }

  // Eliminar bolas perdidas
  for (const ball of ballsToRemove) {
    removeBall(ball);
  }

  // Si no hay bolas, perder vida
  if (balls.length === 0 && running) {
    loseLife();
  }

  // Actualizar posición visual de las bolas
  for (const ball of balls) {
    ball.el.style.transform = `translate(${ball.x - BALL_R}px, ${ball.y - BALL_R}px)`;
  }

  // Actualizar power‑ups
  updatePowerups(delta);

  // Regenerar si es necesario
  if (pendingRegeneration) checkAndRegenerate();

  updateUI();
}

function updatePowerups(delta) {
  const toRemove = [];
  for (const p of powerups) {
    p.y += p.vy * delta;
    p.x += p.vx * delta;
    p.el.style.transform = `translate(${p.x - p.radius}px, ${p.y - p.radius}px)`;

    // Colisión con la pala
    const paddleY = STAGE_H - 14;
    if (p.y + p.radius >= paddleY && p.y - p.radius <= paddleY + PADDLE_H &&
        p.x >= paddle.x - p.radius && p.x <= paddle.x + paddle.width + p.radius) {
      // Atrapado
      applyPowerup(p);
      toRemove.push(p);
      soundTap();
    } else if (p.y - p.radius > STAGE_H) {
      // Se perdió
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
  // Resetear estado del jugador (no ladrillos)
  resetPlayerState();
  // Mantener los ladrillos actuales
  // Asegurarse de que hay al menos una bola
  if (balls.length === 0) {
    resetBallsToSingle();
  }
  launched = false;
  // Colocar bola sobre la pala
  const b = balls[0];
  if (b) {
    b.x = paddle.x + paddle.width / 2;
    b.y = STAGE_H - 14 - BALL_R;
    b.vx = 0; b.vy = 0;
  }
  updateUI();
  draw();
}

function resetPlayerState() {
  // Resetear pala
  paddle.width = basePaddleWidth;
  paddle.x = (STAGE_W - paddle.width) / 2;
  updatePaddleDOM();
  // Resetear niebla
  fogLevel = 0;
  updateFog();
  // Resetear bolas a una sola
  resetBallsToSingle();
  launched = false;
  // Limpiar powerups en pantalla
  powerups.forEach(p => { if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el); });
  powerups = [];
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
  // Limpiar todo
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

  // Generar ladrillos iniciales (todos arcilla, valor 1)
  const initialValues = new Array(36).fill(1);
  placeBricks(initialValues);

  // Crear bola inicial
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

// ========== LOOP PRINCIPAL ==========
let lastTime = 0;
function gameLoop(timestamp) {
  if (!running) return;
  const delta = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0.016;
  lastTime = timestamp;

  // Movimiento de la pala
  let paddleMoved = false;
  if (keys.left) { paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * delta); paddleMoved = true; }
  if (keys.right) { paddle.x = Math.min(STAGE_W - paddle.width, paddle.x + PADDLE_SPEED * delta); paddleMoved = true; }
  if (touchActive) {
    paddle.x = Math.max(0, Math.min(STAGE_W - paddle.width, touchX));
    paddleMoved = true;
  }
  if (mouseActive) {
    paddle.x = Math.max(0, Math.min(STAGE_W - paddle.width, mouseX));
    paddleMoved = true;
  }

  // Si no lanzado, la bola sigue a la pala
  if (!launched && balls.length > 0) {
    const b = balls[0];
    b.x = paddle.x + paddle.width / 2;
    b.y = STAGE_H - 14 - BALL_R;
    if (paddleMoved) {
      // Lanzar la bola al mover la pala (como antes)
      launchBall();
    }
  }

  // Actualizar bolas y power‑ups
  updateBalls(delta);

  // Actualizar UI
  updateUI();

  // Dibujar pala
  paddleEl.style.transform = `translateX(${paddle.x}px)`;
  animFrameId = requestAnimationFrame(gameLoop);
}

function launchBall() {
  if (launched) return;
  if (balls.length === 0) return;
  const b = balls[0];
  const dir = Math.random() < 0.5 ? -1 : 1;
  const angle = (Math.random() - 0.5) * 0.8;
  b.vx = Math.sin(angle) * BALL_SPEED * dir;
  b.vy = -Math.cos(angle) * BALL_SPEED;
  launched = true;
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

// ========== INICIALIZACIÓN Y EXPORTACIÓN ==========
export function initJuego(config) {
  console.log('🎮 Iniciando juego con power‑ups y niebla');

  // Obtener elementos DOM
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
  fogOverlay.style.position = 'absolute';
  fogOverlay.style.top = '0';
  fogOverlay.style.left = '0';
  fogOverlay.style.width = '100%';
  fogOverlay.style.height = '100%';
  fogOverlay.style.background = 'rgba(0,0,0,0.6)';
  fogOverlay.style.pointerEvents = 'none';
  fogOverlay.style.opacity = '0';
  fogOverlay.style.transition = 'opacity 0.5s ease';
  fogOverlay.style.zIndex = '10';
  stage.appendChild(fogOverlay);

  // Ocultar elemento de tiempo si existe
  const timeEl = document.getElementById('game-time');
  if (timeEl) timeEl.style.display = 'none';

  // Asignar evento al nombre para abrir el juego
  const nombreEl = document.getElementById('nombre-hero');
  nombreEl.addEventListener('click', () => { soundTap(); openGame(); });

  // Eventos de control
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

  stage.addEventListener('click', (e) => {
    if (running && !launched) launchBall();
  });

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

  // Inicializar estado
  resetPlayerState();
  layoutStage();
  startGame(); // arranca automáticamente después del conteo

  console.log('✅ Juego listo con power‑ups');
}

function openGame() {
  resetPlayerState();
  overlay.classList.add('open');
  // Contador de 3 segundos antes de empezar
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
  // limpiar elementos
  inner.querySelectorAll('.brick, .ball, .powerup').forEach(el => el.remove());
  bricks = [];
  powerups = [];
  resetPlayerState();
}
