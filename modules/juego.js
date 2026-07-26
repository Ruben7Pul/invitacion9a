console.log('📦 juego.js (60 FPS, 36 ladrillos, velocidad fija)');

import { soundTap, soundBrick, soundWin, soundLose, soundClose } from './sonidos.js';

const BRICK_COUNT = 36; // 6x6
const PADDLE_W = 60;
const PADDLE_H = 8;
const BALL_R = 4;
const STAGE_W = 300;
const STAGE_H = 420;
const TOP_OFFSET = 30;

// Velocidad fija en píxeles por frame (a 60 FPS)
const BALL_SPEED = 5; // 5 px/frame

export function initJuego(config) {
  console.log('🎮 Iniciando juego (60 FPS, 36 ladrillos, velocidad fija)');

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
  let gameInterval = null;
  let countdownInterval = null;
  let startTime = 0;
  let endTime = 0;

  const keys = { left: false, right: false };
  let touchActive = false;
  let touchX = 0;

  window.closeGame = closeGame;

  function generateBrickLayout() {
    const cols = 6;
    const rows = 6;
    const brickW = 38;
    const brickH = 16;
    const gap = 3;
    const totalWidth = cols * (brickW + gap) - gap;
    const startX = (STAGE_W - totalWidth) / 2;
    const startY = TOP_OFFSET;

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
    return grid;
  }

  function buildBricks() {
    inner.querySelectorAll('.brick').forEach(b => b.remove());
    bricks = [];
    const layout = generateBrickLayout();
    const colors = ['#FFD700', '#FF4500', '#00FF7F', '#1E90FF', '#FF1493', '#FFA500', '#7FFF00', '#FF00FF', '#00FFFF', '#FF6347'];
    layout.forEach((pos, index) => {
      const el = document.createElement('div');
      el.className = 'brick';
      el.style.left = pos.x + 'px';
      el.style.top = pos.y + 'px';
      el.style.width = pos.w + 'px';
      el.style.height = pos.h + 'px';
      el.style.background = colors[index % colors.length];
      el.style.borderRadius = '4px';
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.3)';
      el.style.color = '#000';
      el.style.fontWeight = 'bold';
      el.style.textShadow = '0 1px 2px rgba(255,255,255,0.2)';
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
    ball.vx = Math.sin(angle) * BALL_SPEED * dir;
    ball.vy = -Math.cos(angle) * BALL_SPEED;
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

  function gameLoop() {
    if (!running) return;

    if (keys.left) paddle.x = Math.max(0, paddle.x - 7);
    if (keys.right) paddle.x = Math.min(STAGE_W - PADDLE_W, paddle.x + 7);
    if (touchActive) {
      paddle.x = Math.max(0, Math.min(STAGE_W - PADDLE_W, touchX));
    }

    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x - BALL_R < 0) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx); }
    if (ball.x + BALL_R > STAGE_W) { ball.x = STAGE_W - BALL_R; ball.vx = -Math.abs(ball.vx); }
    if (ball.y - BALL_R < 0) { ball.y = BALL_R; ball.vy = Math.abs(ball.vy); }

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

    for (const b of bricks) {
      if (!b.alive) continue;
      if (ball.x + BALL_R > b.x && ball.x - BALL_R < b.x + b.w &&
          ball.y + BALL_R > b.y && ball.y - BALL_R < b.y + b.h) {
        b.alive = false;
        b.el.classList.add('gone');
        soundBrick();
        const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
        const dx = ball.x - cx, dy = ball.y - cy;
        const overlapX = (BALL_R + b.w / 2) - Math.abs(dx);
        const overlapY = (BALL_R + b.h / 2) - Math.abs(dy);
        if (overlapX < overlapY) { ball.vx = -ball.vx; }
        else { ball.vy = -ball.vy; }
        break;
      }
    }

    if (ball.y - BALL_R > STAGE_H) {
      lives--;
      updateLives();
      soundLose();
      if (lives <= 0) { endGame(false); return; }
      resetBall();
    }

    if (bricks.every(b => !b.alive)) {
      endTime = performance.now();
      endGame(true);
      return;
    }

    draw();
  }

  function endGame(win) {
    running = false;
    if (gameInterval) { clearInterval(gameInterval); gameInterval = null; }
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
    lives = 3;
    updateLives();
    buildBricks();
    resetBall();
    paddle.x = (STAGE_W - PADDLE_W) / 2;
    msgEl.classList.remove('show');
    running = true;
    layoutStage();
    draw();
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, 16);
  }

  function openGame() {
    // Limpiar cualquier intervalo pendiente
    if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
    if (gameInterval) { clearInterval(gameInterval); gameInterval = null; }
    running = false;

    overlay.classList.add('open');
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
    if (gameInterval) { clearInterval(gameInterval); gameInterval = null; }
    if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
    soundClose();
    console.log('🔚 Juego cerrado (limpiado)');
  }

  document.getElementById('game-close').addEventListener('click', closeGame);
  restartBtn.addEventListener('click', () => { soundTap(); startGame(); });
  overlay.addEventListener('click', e => { if (e.target === overlay) closeGame(); });

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
  console.log('✅ Juego listo (60 FPS, 36 bloques, velocidad fija)');
}
