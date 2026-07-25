console.log('📦 juego.js (con recompensa y contador 3,2,1)');

import { soundTap, soundBrick, soundWin, soundLose, soundClose } from './sonidos.js';

const ROWS = 4;
const COLS = 6;
const BRICK_W = 44;
const BRICK_H = 20;
const GAP = 4;
const TOP = 30;
const SPEED = 3.8;

export function initJuego(config) {
  console.log('🎮 Iniciando juego (recompensa por rendimiento)');

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

  const LW = 300, LH = 420;
  let scale = 1;
  let bricks = [];

  const totalBricksW = COLS * BRICK_W + (COLS - 1) * GAP;
  const startX = (LW - totalBricksW) / 2;

  let paddle = { w: 60, h: 8, x: (LW - 60) / 2 };
  let ball = { x: LW / 2, y: LH - 38, vx: 0, vy: 0, r: 4 };
  let lives = 3;
  let running = false;
  let gameInterval = null;

  // ---- Variables para rendimiento ----
  let startTime = 0;
  let endTime = 0;
  let finalLives = 3;

  // ---- Controles ----
  const keys = { left: false, right: false };
  let touchActive = false;
  let touchX = 0;

  window.closeGame = closeGame;

  // ---- Funciones ----
  function letras() {
    const src = (config.nombre || 'X').toUpperCase().replace(/\s+/g, '');
    return src.length ? src : 'X';
  }

  function setVel(vx, vy) {
    const mag = Math.hypot(vx, vy) || 1;
    const s = SPEED / mag;
    ball.vx = vx * s;
    ball.vy = vy * s;
  }

  function buildBricks() {
    inner.querySelectorAll('.brick').forEach(b => b.remove());
    bricks = [];
    const nombreLetras = letras();
    let li = 0;
    const colors = ['#c9a24d', '#e08a99', '#8a2c3b', '#2e4a3c', '#f0d9a3', '#d68a96'];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = startX + c * (BRICK_W + GAP);
        const y = TOP + r * (BRICK_H + GAP);
        const el = document.createElement('div');
        el.className = 'brick';
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.width = BRICK_W + 'px';
        el.style.height = BRICK_H + 'px';
        el.style.background = 'linear-gradient(180deg,' + colors[r % colors.length] + ',rgba(0,0,0,.15))';
        const ch = nombreLetras[li % nombreLetras.length];
        li++;
        el.textContent = ch;
        inner.appendChild(el);
        bricks.push({ x, y, w: BRICK_W, h: BRICK_H, el, alive: true });
      }
    }
  }

  function layoutStage() {
    const availW = Math.min(window.innerWidth * 0.92, 420);
    const availH = Math.min(window.innerHeight * 0.72, 560);
    scale = Math.min(availW / LW, availH / LH);
    stage.style.width = (LW * scale) + 'px';
    stage.style.height = (LH * scale) + 'px';
    inner.style.width = LW + 'px';
    inner.style.height = LH + 'px';
    inner.style.transform = 'scale(' + scale + ')';
    inner.style.transformOrigin = 'top left';
  }

  function resetBall() {
    ball.x = LW / 2;
    ball.y = LH - 38;
    const dir = Math.random() < 0.5 ? -1 : 1;
    setVel(1.2 * dir, -2.4);
  }

  function updateLives() {
    livesEl.textContent = '♥ '.repeat(Math.max(lives, 0)).trim() || '—';
    finalLives = lives;
  }

  function draw() {
    paddleEl.style.left = paddle.x + 'px';
    paddleEl.style.top = (LH - 14) + 'px';
    paddleEl.style.width = paddle.w + 'px';
    ballEl.style.left = (ball.x - ball.r) + 'px';
    ballEl.style.top = (ball.y - ball.r) + 'px';
  }

  // ---- BUCLE ----
  function gameLoop() {
    if (!running) return;

    // Teclado
    if (keys.left) paddle.x = Math.max(0, paddle.x - 8);
    if (keys.right) paddle.x = Math.min(LW - paddle.w, paddle.x + 8);

    // Arrastre con dedo
    if (touchActive) {
      paddle.x = Math.max(0, Math.min(LW - paddle.w, touchX));
    }

    // Física
    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x - ball.r < 0) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); }
    if (ball.x + ball.r > LW) { ball.x = LW - ball.r; ball.vx = -Math.abs(ball.vx); }
    if (ball.y - ball.r < 0) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); }

    const py = LH - 14;
    if (ball.vy > 0 && ball.y + ball.r >= py && ball.y + ball.r <= py + 10 &&
        ball.x >= paddle.x - ball.r && ball.x <= paddle.x + paddle.w + ball.r) {
      ball.y = py - ball.r;
      let hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
      hit = Math.max(-0.85, Math.min(0.85, hit));
      const angle = hit * 0.8;
      const speed = SPEED;
      ball.vx = Math.sin(angle) * speed;
      ball.vy = -Math.cos(angle) * speed;
    }

    for (const b of bricks) {
      if (!b.alive) continue;
      if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w &&
          ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
        b.alive = false;
        b.el.classList.add('gone');
        soundBrick();
        const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
        const dx = ball.x - cx, dy = ball.y - cy;
        const overlapX = (ball.r + b.w / 2) - Math.abs(dx);
        const overlapY = (ball.r + b.h / 2) - Math.abs(dy);
        if (overlapX < overlapY) { ball.vx = -ball.vx; }
        else { ball.vy = -ball.vy; }
        break;
      }
    }

    if (ball.y - ball.r > LH) {
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

  // ---- FIN DEL JUEGO (con recompensa) ----
  function endGame(win) {
    running = false;
    if (gameInterval) { clearInterval(gameInterval); gameInterval = null; }

    let message = '';
    let extraClass = '';

    if (win) {
      const elapsed = (endTime - startTime) / 1000; // segundos
      const vidas = finalLives;

      // Determinar personaje según rendimiento
      if (elapsed < 10 && vidas === 3) {
        message = `👑 ¡${config.nombre} se convierte en el PRÍNCIPE TRANSFORMADO! \n✨ Tiempo: ${elapsed.toFixed(1)}s, 3 vidas. ¡Perfecto!`;
        extraClass = 'perfect';
        soundWin();
      } else if (elapsed < 15 && vidas >= 2) {
        message = `🤴 ¡${config.nombre} es el PRÍNCIPE! \n⏱️ Tiempo: ${elapsed.toFixed(1)}s, ${vidas} vidas. ¡Muy bien!`;
        extraClass = 'good';
        soundWin();
      } else {
        message = `🐻 ${config.nombre} sigue siendo la BESTIA... \n⏱️ Tiempo: ${elapsed.toFixed(1)}s, ${vidas} vidas. ¡Sigue intentando!`;
        extraClass = 'ok';
        soundWin();
      }
    } else {
      // Perdió
      message = `🎩 ¡${config.nombre} se convierte en GASTÓN! \n💔 ¡Has perdido todas las vidas! Vuelve a intentarlo.`;
      extraClass = 'lose';
      soundLose();
    }

    msgText.textContent = message;
    msgEl.classList.add('show');
    // Añadir clase extra para estilos (opcional)
    msgEl.className = 'show ' + extraClass;
  }

  // ---- INICIO ----
  function startGame() {
    // Reiniciar variables de rendimiento
    startTime = performance.now();
    endTime = 0;
    finalLives = 3;

    lives = 3;
    updateLives();
    buildBricks();
    resetBall();
    paddle.x = (LW - paddle.w) / 2;
    msgEl.classList.remove('show');
    running = true;
    layoutStage();
    draw();
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, 16);
  }

  function openGame() {
    overlay.classList.add('open');
    // Mostrar solo números 3, 2, 1 (sin "Preparando")
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
    if (gameInterval) { clearInterval(gameInterval); gameInterval = null; }
    soundClose();
    console.log('🔚 Juego cerrado');
  }

  // ---- Eventos UI ----
  document.getElementById('game-close').addEventListener('click', closeGame);
  restartBtn.addEventListener('click', () => { soundTap(); startGame(); });
  overlay.addEventListener('click', e => { if (e.target === overlay) closeGame(); });

  // ---- TECLADO ----
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

  // ---- ARRASTRE CON DEDO ----
  stage.addEventListener('touchstart', (e) => {
    if (!running) return;
    const touch = e.touches[0];
    if (touch) {
      const rect = stage.getBoundingClientRect();
      const localX = (touch.clientX - rect.left) / scale;
      touchX = Math.min(Math.max(localX - paddle.w / 2, 0), LW - paddle.w);
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
      touchX = Math.min(Math.max(localX - paddle.w / 2, 0), LW - paddle.w);
      touchActive = true;
    }
  }, { passive: false });

  stage.addEventListener('touchend', () => { touchActive = false; }, { passive: true });
  stage.addEventListener('touchcancel', () => { touchActive = false; }, { passive: true });

  // ---- RESIZE ----
  window.addEventListener('resize', () => { layoutStage(); draw(); });
  layoutStage();
  console.log('✅ Juego con recompensa por rendimiento listo');
}
