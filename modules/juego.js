console.log('📦 juego.js (versión optimizada)');

import { soundTap, soundBrick, soundWin, soundLose, soundClose } from './sonidos.js';

const BRICK_COUNT = 20;
const PADDLE_W = 60;
const PADDLE_H = 8;
const BALL_R = 4;
const STAGE_W = 300;
const STAGE_H = 420;
const TOP_OFFSET = 30;

// Velocidades
const INITIAL_SPEED = 2.2;
const MAX_SPEED = 6.0;
const SPEED_INCREMENT = 0.06; // por ladrillo roto

export function initJuego(config) {
  console.log('🎮 Iniciando juego con dificultad progresiva');

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
  const restartBtn = document.getElementById('game-restart');

  restartBtn.style.display = 'none';

  let scale = 1;
  let bricks = [];
  let paddle = { x: (STAGE_W - PADDLE_W) / 2 };
  let ball = { x: STAGE_W / 2, y: STAGE_H - 38, vx: 0, vy: 0 };
  let lives = 3;
  let running = false;
  let animationId = null;
  let bricksBroken = 0;
  let currentSpeed = INITIAL_SPEED;
  let startTime = 0;
  let endTime = 0;

  const keys = { left: false, right: false };
  let touchActive = false;
  let touchX = 0;

  window.closeGame = closeGame;

  // Generar disposición aleatoria de 20 ladrillos sin solapamiento
  function generateBrickLayout() {
    const positions = [];
    const maxAttempts = 1000;
    const cols = 6;
    const rows = 4;
    const brickW = 40;
    const brickH = 18;
    const gap = 4;
    const totalWidth = cols * (brickW + gap) - gap;
    const startX = (STAGE_W - totalWidth) / 2;
    const startY = TOP_OFFSET;

    // Crear una cuadrícula de posibles ubicaciones (6x4 = 24)
    const grid = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        grid.push({
          x: startX + c * (brickW + gap),
          y: startY + r * (brickH + gap),
          w: brickW,
          h: brickH
        });
      }
    }

    // Elegir 20 aleatoriamente (o menos si no hay suficientes)
    const shuffled = grid.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, BRICK_COUNT);

    // Si no se alcanzan 20, rellenar con posiciones aleatorias adicionales
    while (selected.length < BRICK_COUNT) {
      const x = 10 + Math.random() * (STAGE_W - brickW - 20);
      const y = TOP_OFFSET + Math.random() * (STAGE_H - TOP_OFFSET - brickH - 40);
      // Verificar que no solape
      let overlap = false;
      for (const p of selected) {
        if (x < p.x + p.w + 2 && x + brickW + 2 > p.x &&
            y < p.y + p.h + 2 && y + brickH + 2 > p.y) {
          overlap = true;
          break;
        }
      }
      if (!overlap) {
        selected.push({ x, y, w: brickW, h: brickH });
      }
    }

    return selected;
  }

  function buildBricks() {
    inner.querySelectorAll('.brick').forEach(b => b.remove());
    bricks = [];
    const layout = generateBrickLayout();
    const colors = ['#c9a24d', '#e08a99', '#8a2c3b', '#2e4a3c', '#f0d9a3', '#d68a96', '#b8860b', '#a52a2a'];

    layout.forEach((pos, index) => {
      const el = document.createElement('div');
      el.className = 'brick';
      el.style.left = pos.x + 'px';
      el.style.top = pos.y + 'px';
      el.style.width = pos.w + 'px';
      el.style.height = pos.h + 'px';
      el.style.background = 'linear-gradient(180deg, ' + colors[index % colors.length] + ', rgba(0,0,0,0.2))';
      el.style.borderRadius = '3px';
      inner.appendChild(el);
      bricks.push({
        x: pos.x, y: pos.y, w: pos.w, h: pos.h,
        el, alive: true
      });
    });
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

  function resetBall() {
    ball.x = STAGE_W / 2;
    ball.y = STAGE_H - 38;
    const dir = Math.random() < 0.5 ? -1 : 1;
    const angle = (Math.random() - 0.5) * 0.8;
    const speed = currentSpeed;
    ball.vx = Math.sin(angle) * speed * dir;
    ball.vy = -Math.cos(angle) * speed;
  }

  function updateLives() {
    livesEl.textContent = '♥ '.repeat(Math.max(lives, 0)).trim() || '—';
  }

  function draw() {
    paddleEl.style.left = paddle.x + 'px';
    paddleEl.style.top = (STAGE_H - 14) + 'px';
    paddleEl.style.width = PADDLE_W + 'px';
    ballEl.style.left = (ball.x - BALL_R) + 'px';
    ballEl.style.top = (ball.y - BALL_R) + 'px';
  }

  function gameLoop(timestamp) {
    if (!running) return;

    // Movimiento de la paleta
    if (keys.left) paddle.x = Math.max(0, paddle.x - 7);
    if (keys.right) paddle.x = Math.min(STAGE_W - PADDLE_W, paddle.x + 7);
    if (touchActive) {
      paddle.x = Math.max(0, Math.min(STAGE_W - PADDLE_W, touchX));
    }

    // Movimiento de la pelota
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Rebotes en paredes
    if (ball.x - BALL_R < 0) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx); }
    if (ball.x + BALL_R > STAGE_W) { ball.x = STAGE_W - BALL_R; ball.vx = -Math.abs(ball.vx); }
    if (ball.y - BALL_R < 0) { ball.y = BALL_R; ball.vy = Math.abs(ball.vy); }

    // Rebote en la paleta
    const py = STAGE_H - 14;
    if (ball.vy > 0 && ball.y + BALL_R >= py && ball.y + BALL_R <= py + 10 &&
        ball.x >= paddle.x - BALL_R && ball.x <= paddle.x + PADDLE_W + BALL_R) {
      ball.y = py - BALL_R;
      let hit = (ball.x - (paddle.x + PADDLE_W / 2)) / (PADDLE_W / 2);
      hit = Math.max(-0.85, Math.min(0.85, hit));
      const angle = hit * 0.7;
      const speed = currentSpeed;
      ball.vx = Math.sin(angle) * speed;
      ball.vy = -Math.cos(angle) * speed;
    }

    // Colisión con ladrillos
    for (const b of bricks) {
      if (!b.alive) continue;
      if (ball.x + BALL_R > b.x && ball.x - BALL_R < b.x + b.w &&
          ball.y + BALL_R > b.y && ball.y - BALL_R < b.y + b.h) {
        b.alive = false;
        b.el.classList.add('gone');
        soundBrick();
        bricksBroken++;
        // Aumentar velocidad progresivamente
        currentSpeed = Math.min(MAX_SPEED, currentSpeed + SPEED_INCREMENT);
        // Ajustar velocidad actual (mantener dirección)
        const mag = Math.hypot(ball.vx, ball.vy);
        if (mag > 0) {
          const factor = currentSpeed / mag;
          ball.vx *= factor;
          ball.vy *= factor;
        }
        // Rebote simple
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
      updateLives();
      soundLose();
      if (lives <= 0) { endGame(false); return; }
      resetBall();
    }

    // Victoria
    if (bricks.every(b => !b.alive)) {
      endTime = performance.now();
      endGame(true);
      return;
    }

    draw();
    animationId = requestAnimationFrame(gameLoop);
  }

  function endGame(win) {
    running = false;
    if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
    restartBtn.style.display = 'inline-block';

    let message = '';
    if (win) {
      const elapsed = (endTime - startTime) / 1000;
      const vidas = lives;
      if (elapsed < 15 && vidas === 3) {
        message = `👑 ¡${config.nombre} se convierte en el PRÍNCIPE TRANSFORMADO!\n✨ Tiempo: ${elapsed.toFixed(1)}s, ${vidas} vidas. ¡Perfecto!`;
        soundWin();
      } else if (elapsed < 25 && vidas >= 2) {
        message = `🤴 ¡${config.nombre} es el PRÍNCIPE!\n⏱️ Tiempo: ${elapsed.toFixed(1)}s, ${vidas} vidas. ¡Muy bien!`;
        soundWin();
      } else {
        message = `🐻 ${config.nombre} sigue siendo la BESTIA...\n⏱️ Tiempo: ${elapsed.toFixed(1)}s, ${vidas} vidas. ¡Sigue intentando!`;
        soundWin();
      }
    } else {
      message = `🎩 ¡${config.nombre} se convierte en GASTÓN!\n💔 ¡Has perdido todas las vidas! Vuelve a intentarlo.`;
      soundLose();
    }
    msgText.textContent = message;
    msgEl.classList.add('show');
  }

  function startGame() {
    startTime = performance.now();
    bricksBroken = 0;
    currentSpeed = INITIAL_SPEED;
    lives = 3;
    updateLives();
    buildBricks();
    resetBall();
    paddle.x = (STAGE_W - PADDLE_W) / 2;
    msgEl.classList.remove('show');
    running = true;
    layoutStage();
    draw();
    if (animationId) cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(gameLoop);
  }

  function openGame() {
    overlay.classList.add('open');
    // Reiniciar completamente
    inner.querySelectorAll('.brick').forEach(b => b.remove());
    bricks = [];
    paddle.x = (STAGE_W - PADDLE_W) / 2;
    ball.x = STAGE_W / 2;
    ball.y = STAGE_H - 38;
    ball.vx = 0;
    ball.vy = 0;
    msgEl.classList.remove('show');
    restartBtn.style.display = 'none';
    draw();

    let countdown = 3;
    msgText.textContent = countdown;
    msgEl.classList.add('show');
    const timer = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        msgText.textContent = countdown;
      } else {
        clearInterval(timer);
        msgEl.classList.remove('show');
        startGame();
      }
    }, 1000);
  }

  function closeGame() {
    overlay.classList.remove('open');
    running = false;
    if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
    soundClose();
    console.log('🔚 Juego cerrado');
  }

  document.getElementById('game-close').addEventListener('click', closeGame);
  restartBtn.addEventListener('click', () => { soundTap(); startGame(); });
  overlay.addEventListener('click', e => { if (e.target === overlay) closeGame(); });

  // Controles de teclado
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

  // Táctil
  stage.addEventListener('touchstart', (e) => {
    if (!running) return;
    const touch = e.touches[0];
    if (touch) {
      const rect = stage.getBoundingClientRect();
      const localX = (touch.clientX - rect.left) / scale;
      touchX = Math.min(Math.max(localX - PADDLE_W / 2, 0), STAGE_W - PADDLE_W);
      touchActive = true;
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
  console.log('✅ Juego optimizado listo');
}
