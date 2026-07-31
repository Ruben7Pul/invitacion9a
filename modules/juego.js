console.log('📦 juego.js (nuevo sistema de puntos y ladrillos)');

import { soundTap, soundBrick, soundWin, soundLose, soundClose } from './sonidos.js';

const PADDLE_W = 60;
const PADDLE_H = 8;
const BALL_R = 4;
const STAGE_W = 300;
const STAGE_H = 420;
const TOP_OFFSET = 30;
const BALL_SPEED = 300;
const PADDLE_SPEED = 300;
const TARGET_GAME_POINTS = 12; // puntos de área a regenerar
const REGEN_THRESHOLD = 9;     // cuando los puntos de área son ≤ 9 se regenera

// Definición de tipos de ladrillos
const BRICK_TYPES = {
  CLAY:   { value: 1, playerPoints: 100, hits: 1, color: '#b5651d', label: 'arcilla' },
  WOOD:   { value: 2, playerPoints: 200, hits: 2, color: '#8b5a2b', label: 'madera' },
  IRON:   { value: 3, playerPoints: 300, hits: 3, color: '#a0a0a0', label: 'hierro' }
};

export function initJuego(config) {
  console.log('🎮 Iniciando juego con nuevo sistema de puntos');

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
  const timeEl = document.getElementById('game-time');
  const restartBtn = document.getElementById('game-restart');

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
  let startTime = 0;
  let elapsedTime = 0;
  let playerScore = 0;
  let gamePoints = 0; // suma de los puntos de área de todos los ladrillos vivos

  const keys = { left: false, right: false };
  let touchActive = false;
  let touchX = 0;

  window.closeGame = closeGame;

  // --- Funciones de ladrillos ---

  // Genera una lista de valores (1,2,3) que sumen exactamente 12
  function generateBrickValues() {
    let remaining = TARGET_GAME_POINTS;
    const values = [];
    while (remaining > 0) {
      let max = Math.min(3, remaining);
      let val = Math.floor(Math.random() * max) + 1;
      // Evitar que quede un remanente que no se pueda completar (1 o 2)
      // Si remaining - val es 1 o 2 y no se puede completar, ajustar.
      if (remaining - val === 1 && remaining > 1) {
        // Si queda 1 y podemos cambiar a 2 (si val era 1), o a 3 (si val era 2)
        if (val === 1 && remaining >= 2) {
          val = 2;
        } else if (val === 2 && remaining >= 3) {
          val = 3;
        }
      }
      values.push(val);
      remaining -= val;
    }
    return values;
  }

  // Obtiene celdas libres en la cuadrícula (6x6)
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

  // Coloca nuevos ladrillos con los valores dados en celdas libres
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
      console.warn('⚠️ No hay celdas libres para colocar ladrillos');
      return;
    }

    // Mezclar celdas libres
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
      el.textContent = type.hits; // mostrar toques restantes

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

  // Función para regenerar ladrillos cuando los puntos de área son ≤ REGEN_THRESHOLD
  function regenerateBricks() {
    if (!running) return;
    // Solo regenerar si hay al menos una celda libre
    const free = getFreeCells();
    if (free.length === 0) {
      console.warn('⚠️ No hay celdas libres para regenerar');
      return;
    }
    const values = generateBrickValues();
    placeBricks(values);
  }

  // --- Fin funciones de ladrillos ---

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
    startTime = 0;
    elapsedTime = 0;
    playerScore = 0;
    gamePoints = 0;
    keys.left = false;
    keys.right = false;
    touchActive = false;
    touchX = 0;
    inner.querySelectorAll('.brick').forEach(b => b.remove());
    msgEl.classList.remove('show');
    restartBtn.style.display = 'none';
    updateUI();
    draw();
  }

  function updateUI() {
    livesEl.textContent = '♥ '.repeat(Math.max(lives, 0)).trim() || '—';
    scoreEl.textContent = `Puntos: ${playerScore}`;
    timeEl.textContent = `Tiempo: ${elapsedTime.toFixed(1)}s`;
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

    elapsedTime += delta;
    updateUI();

    let paddleMoved = false;
    if (keys.left) { paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * delta); paddleMoved = true; }
    if (keys.right) { paddle.x = Math.min(STAGE_W - PADDLE_W, paddle.x + PADDLE_SPEED * delta); paddleMoved = true; }
    if (touchActive) {
      paddle.x = Math.max(0, Math.min(STAGE_W - PADDLE_W, touchX));
      paddleMoved = true;
    }

    if (!launched) {
      ball.x = paddle.x + PADDLE_W / 2;
      ball.y = STAGE_H - 14 - BALL_R;
      if (paddleMoved) {
        launchBall();
      }
      draw();
      animFrameId = requestAnimationFrame(gameLoop);
      return;
    }

    // Movimiento de la pelota
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

    // Colisión con ladrillos
    for (const b of bricks) {
      if (!b.alive) continue;
      if (ball.x + BALL_R > b.x && ball.x - BALL_R < b.x + b.w &&
          ball.y + BALL_R > b.y && ball.y - BALL_R < b.y + b.h) {
        // Reducir hits
        b.hits--;
        soundBrick();
        if (b.hits <= 0) {
          // Destruir ladrillo
          b.alive = false;
          b.el.classList.add('gone');
          playerScore += b.playerPoints;
          gamePoints -= b.value;
          updateUI();
          // Verificar si hay que regenerar
          if (gamePoints <= REGEN_THRESHOLD) {
            regenerateBricks();
          }
        } else {
          // Actualizar texto del ladrillo con los toques restantes
          b.el.textContent = b.hits;
        }
        // Rebote de la pelota
        const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
        const dx = ball.x - cx, dy = ball.y - cy;
        const overlapX = (BALL_R + b.w / 2) - Math.abs(dx);
        const overlapY = (BALL_R + b.h / 2) - Math.abs(dy);
        if (overlapX < overlapY) { ball.vx = -ball.vx; }
        else { ball.vy = -ball.vy; }
        break;
      }
    }

    // Pérdida de vida
    if (ball.y - BALL_R > STAGE_H) {
      lives--;
      soundLose();
      if (lives <= 0) {
        endGame();
        return;
      }
      // Reiniciar pelota sobre la paleta
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
    msgText.textContent = `Game Over\nPuntaje final: ${playerScore}\nTiempo: ${elapsedTime.toFixed(1)}s`;
    msgEl.classList.add('show');
    soundLose();
  }

  function startGame() {
    resetGameState();
    startTime = performance.now();
    elapsedTime = 0;
    lives = 3;
    playerScore = 0;
    gamePoints = 0;

    // Colocar 36 ladrillos de arcilla (valor 1 cada uno)
    const clayValues = new Array(36).fill(1);
    placeBricks(clayValues); // Esto colocará 36 ladrillos de arcilla
    // Nota: placeBricks usa getFreeCells() que ahora está vacío, pero como no hay ladrillos,
    // todas las celdas están libres, así que colocará los 36.

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
    console.log('🔚 Juego cerrado y reiniciado');
  }

  // Layout y eventos
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
  restartBtn.addEventListener('click', () => { soundTap(); startGame(); });
  overlay.addEventListener('click', e => { if (e.target === overlay) closeGame(); });

  stage.addEventListener('click', (e) => {
    if (running && !launched) {
      launchBall();
    }
  });

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
  console.log('✅ Juego con nuevo sistema de puntos listo');
}
