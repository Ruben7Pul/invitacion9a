console.log('📦 juego.js (sin tiempo, mouse, fracturas, 18 puntos)');

import { soundTap, soundBrick, soundWin, soundLose, soundClose } from './sonidos.js';

const PADDLE_W = 60;
const PADDLE_H = 8;
const BALL_R = 4;
const STAGE_W = 300;
const STAGE_H = 420;
const TOP_OFFSET = 30;
const BALL_SPEED = 300;
const PADDLE_SPEED = 300;
const TARGET_GAME_POINTS = 18;  // Ahora 18 puntos de área
const REGEN_THRESHOLD = 9;
const BALL_LOW_Y = STAGE_H - 60;

// Definición de tipos de ladrillos con colores
const BRICK_TYPES = {
  CLAY:   { value: 1, playerPoints: 100, hits: 1, color: '#d9534f', label: 'arcilla' },
  WOOD:   { value: 2, playerPoints: 200, hits: 2, color: '#8b5a2b', label: 'madera' },
  IRON:   { value: 3, playerPoints: 300, hits: 3, color: '#a0a0a0', label: 'hierro' }
};

// Símbolos de fractura según los golpes restantes
const FRACTURE_SYMBOLS = {
  1: '|',
  2: '||',
  3: '|||'
};

export function initJuego(config) {
  console.log('🎮 Iniciando juego (sin tiempo, mouse, 18 puntos)');

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

  // Eliminar el elemento de tiempo del DOM
  const timeEl = document.getElementById('game-time');
  if (timeEl) timeEl.style.display = 'none';

  restartBtn.style.display = 'none';

  let scale = 1;
  let bricks = [];
  let paddle = { x: (STAGE_W - PADDLE_W) / 2 };
  let ball = { x: STAGE_W / 2, y: STAGE_H - 38, vx: 0, vy: 0 };
  let lives = 3;
  let running = false;
  let launched = false;
  let animFrameId = null;
  let countdownInterval = null;
  let playerScore = 0;
  let gamePoints = 0;
  let pendingRegeneration = false;

  // Control con mouse
  let mouseActive = false;
  let mouseX = 0;

  const keys = { left: false, right: false };
  let touchActive = false;
  let touchX = 0;

  window.closeGame = closeGame;

  // --- Funciones de ladrillos ---

  // Genera valores que suman exactamente TARGET_GAME_POINTS (18)
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
    if (sum !== total) {
      return generateBrickValues();
    }
    return values;
  }

  function getFreeCells() {
    const cols = 6;
    const rows = 6;
    const used = new Set();
    bricks.forEach(b => {
      if (b.alive) {
        used.add(b.cell);
      }
    });
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
    const cols = 6;
    const brickW = 38;
    const brickH = 16;
    const gap = 3;
    const totalWidth = cols * (brickW + gap) - gap;
    const startX = (STAGE_W - totalWidth) / 2;
    const startY = TOP_OFFSET;

    const freeCells = getFreeCells();
    if (freeCells.length === 0) {
      console.warn('⚠️ No hay celdas libres');
      return;
    }

    const shuffled = freeCells.sort(() => Math.random() - 0.5);
    const toPlace = Math.min(values.length, shuffled.length);
    if (toPlace < values.length) {
      console.warn(`⚠️ Solo ${toPlace} celdas libres para ${values.length} ladrillos`);
    }
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
      // Mostrar fracturas en lugar de números
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
    console.log('🔄 Nuevos ladrillos colocados, puntos de área:', gamePoints);
  }

  function requestRegeneration() {
    if (pendingRegeneration) return;
    const free = getFreeCells();
    if (free.length === 0) {
      console.warn('⚠️ No hay celdas libres para regenerar');
      return;
    }
    pendingRegeneration = true;
    console.log('⏳ Regeneración pendiente');
  }

  function checkAndRegenerate() {
    if (!pendingRegeneration) return;
    if (!running) return;
    if (launched && ball.y < BALL_LOW_Y) {
      return;
    }
    const free = getFreeCells();
    if (free.length === 0) {
      console.warn('⚠️ Sin celdas libres, cancelando');
      pendingRegeneration = false;
      return;
    }
    const values = generateBrickValues();
    placeBricks(values);
    pendingRegeneration = false;
    console.log('✅ Regeneración completada');
  }

  // --- Funciones del juego ---

  function launchBall() {
    if (launched) return;
    const dir = Math.random() < 0.5 ? -1 : 1;
    const angle = (Math.random() - 0.5) * 0.8;
    ball.vx = Math.sin(angle) * BALL_SPEED * dir;
    ball.vy = -Math.cos(angle) * BALL_SPEED;
    launched = true;
  }

  function resetGameState() {
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
    running = false;
    launched = false;
    bricks = [];
    paddle.x = (STAGE_W - PADDLE_W) / 2;
    ball.x = STAGE_W / 2;
    ball.y = STAGE_H - 38;
    ball.vx = 0;
    ball.vy = 0;
    lives = 3;
    playerScore = 0;
    gamePoints = 0;
    pendingRegeneration = false;
    keys.left = false;
    keys.right = false;
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
    // El tiempo ya no se muestra
  }

  function draw() {
    paddleEl.style.width = PADDLE_W + 'px';
    paddleEl.style.transform = 'translateX(' + paddle.x + 'px)';
    ballEl.style.transform = 'translate(' + ball.x + 'px, ' + ball.y + 'px)';
  }

  let lastTime = 0;

  function gameLoop(timestamp) {
    if (!running) return;

    const delta = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0.016;
    lastTime = timestamp;

    updateUI();

    let paddleMoved = false;
    // Teclado
    if (keys.left) { paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * delta); paddleMoved = true; }
    if (keys.right) { paddle.x = Math.min(STAGE_W - PADDLE_W, paddle.x + PADDLE_SPEED * delta); paddleMoved = true; }
    // Touch
    if (touchActive) {
      paddle.x = Math.max(0, Math.min(STAGE_W - PADDLE_W, touchX));
      paddleMoved = true;
    }
    // Mouse (arrastre)
    if (mouseActive) {
      paddle.x = Math.max(0, Math.min(STAGE_W - PADDLE_W, mouseX));
      paddleMoved = true;
    }

    if (!launched) {
      // Pelota pegada a la paleta
      ball.x = paddle.x + PADDLE_W / 2;
      ball.y = STAGE_H - 14 - BALL_R;
      if (paddleMoved) {
        launchBall();
      }
      draw();
      animFrameId = requestAnimationFrame(gameLoop);
      return;
    }

    // Mover pelota
    ball.x += ball.vx * delta;
    ball.y += ball.vy * delta;

    // Rebotes en paredes
    if (ball.x - BALL_R < 0) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx); }
    if (ball.x + BALL_R > STAGE_W) { ball.x = STAGE_W - BALL_R; ball.vx = -Math.abs(ball.vx); }
    if (ball.y - BALL_R < 0) { ball.y = BALL_R; ball.vy = Math.abs(ball.vy); }

    // Rebote en paleta
    const py = STAGE_H - 14;
    if (ball.vy > 0 && ball.y + BALL_R >= py && ball.y + BALL_R <= py + 10 &&
        ball.x >= paddle.x - BALL_R && ball.x <= paddle.x + PADDLE_W + BALL_R) {
      ball.y = py - BALL_R;
      let hit = (ball.x - (paddle.x + PADDLE_W / 2)) / (PADDLE_W / 2);
      hit = Math.max(-0.85, Math.min(0.85, hit));
      const angle = hit * 0.7;
      ball.vx = Math.sin(angle) * BALL_SPEED;
      ball.vy = -Math.cos(angle) * BALL_SPEED;
    }

    // Colisión con ladrillos (máximo 1 por frame)
    let hitBrick = false;
    for (const b of bricks) {
      if (!b.alive) continue;
      if (ball.x + BALL_R > b.x && ball.x - BALL_R < b.x + b.w &&
          ball.y + BALL_R > b.y && ball.y - BALL_R < b.y + b.h) {

        // Reposicionar la pelota
        const overlapX = Math.min(ball.x + BALL_R - b.x, b.x + b.w - (ball.x - BALL_R));
        const overlapY = Math.min(ball.y + BALL_R - b.y, b.y + b.h - (ball.y - BALL_R));
        if (overlapX < overlapY) {
          if (ball.x < b.x + b.w / 2) {
            ball.x = b.x - BALL_R;
          } else {
            ball.x = b.x + b.w + BALL_R;
          }
          ball.vx = -ball.vx;
        } else {
          if (ball.y < b.y + b.h / 2) {
            ball.y = b.y - BALL_R;
          } else {
            ball.y = b.y + b.h + BALL_R;
          }
          ball.vy = -ball.vy;
        }

        // Reducir hits
        b.hits--;
        soundBrick();
        if (b.hits <= 0) {
          b.alive = false;
          b.el.classList.add('gone');
          playerScore += b.playerPoints;
          gamePoints -= b.value;
          updateUI();
          if (gamePoints <= REGEN_THRESHOLD) {
            requestRegeneration();
          }
        } else {
          // Actualizar fractura
          b.el.textContent = FRACTURE_SYMBOLS[b.hits] || '|';
        }
        hitBrick = true;
        break;
      }
    }

    // Verificar regeneración pendiente
    if (pendingRegeneration) {
      checkAndRegenerate();
    }

    // Pérdida de vida
    if (ball.y - BALL_R > STAGE_H) {
      lives--;
      soundLose();
      if (lives <= 0) {
        endGame();
        return;
      }
      // Reiniciar pelota pegada a la paleta
      launched = false;
      ball.x = paddle.x + PADDLE_W / 2;
      ball.y = STAGE_H - 14 - BALL_R;
      ball.vx = 0;
      ball.vy = 0;
      updateUI();
    }

    draw();
    animFrameId = requestAnimationFrame(gameLoop);
  }

  function endGame() {
    running = false;
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    restartBtn.style.display = 'inline-block';
    msgText.textContent = `Game Over\nPuntaje final: ${playerScore}`;
    msgEl.classList.add('show');
    soundLose();
  }

  function startGame() {
    resetGameState();
    playerScore = 0;
    gamePoints = 0;

    // 36 ladrillos de arcilla
    const clayValues = new Array(36).fill(1);
    inner.querySelectorAll('.brick').forEach(b => b.remove());
    bricks = [];
    placeBricks(clayValues);

    paddle.x = (STAGE_W - PADDLE_W) / 2;
    launched = false;
    ball.x = paddle.x + PADDLE_W / 2;
    ball.y = STAGE_H - 14 - BALL_R;
    ball.vx = 0;
    ball.vy = 0;
    msgEl.classList.remove('show');
    running = true;
    layoutStage();
    updateUI();
    draw();
    lastTime = 0;
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
    console.log('🔚 Juego cerrado');
  }

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

  document.getElementById('game-close').addEventListener('click', closeGame);
  restartBtn.addEventListener('click', () => { 
    soundTap(); 
    // Al reiniciar, la pelota debe empezar pegada a la paleta
    startGame(); // startGame ya coloca la pelota sin lanzar
  });
  overlay.addEventListener('click', e => { if (e.target === overlay) closeGame(); });

  // --- Eventos de mouse para mover la paleta ---
  stage.addEventListener('mousedown', (e) => {
    if (!running) return;
    const rect = stage.getBoundingClientRect();
    const localX = (e.clientX - rect.left) / scale;
    mouseX = Math.min(Math.max(localX - PADDLE_W / 2, 0), STAGE_W - PADDLE_W);
    mouseActive = true;
    // Si la pelota no está lanzada, se lanza al hacer clic
    if (!launched) {
      launchBall();
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (!running || !mouseActive) return;
    const rect = stage.getBoundingClientRect();
    const localX = (e.clientX - rect.left) / scale;
    mouseX = Math.min(Math.max(localX - PADDLE_W / 2, 0), STAGE_W - PADDLE_W);
  });

  document.addEventListener('mouseup', () => {
    mouseActive = false;
  });

  // También se puede hacer clic en el área para lanzar
  stage.addEventListener('click', (e) => {
    if (running && !launched) {
      launchBall();
    }
  });

  // Teclado
  document.addEventListener('keydown', (e) => {
    if (!running) return;
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

  // Touch
  stage.addEventListener('touchstart', (e) => {
    if (!running) return;
    const touch = e.touches[0];
    if (touch) {
      const rect = stage.getBoundingClientRect();
      const localX = (touch.clientX - rect.left) / scale;
      touchX = Math.min(Math.max(localX - PADDLE_W / 2, 0), STAGE_W - PADDLE_W);
      touchActive = true;
      if (!launched) {
        launchBall();
      }
    }
  }, { passive: true });
  stage.addEventListener('touchmove', (e) => {
    if (!running) return;
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) {
      const rect = stage.getBoundingClientRect();
      const localX = (touch.clientX - rect.left) / scale;
      touchX = Math.min(Math.max(localX - PADDLE_W / 2, 0), STAGE_W - PADDLE_W);
      touchActive = true;
    }
  }, { passive: false });
  stage.addEventListener('touchend', () => { touchActive = false; }, { passive: true });
  stage.addEventListener('touchcancel', () => { touchActive = false; }, { passive: true });

  window.addEventListener('resize', () => { layoutStage(); draw(); });
  layoutStage();
  resetGameState();
  console.log('✅ Juego listo (sin tiempo, mouse, 18 puntos, fracturas)');
}
