// juego.js - Juego secreto Breakout
import { soundTap, soundBrick, soundWin, soundLose, soundClose } from './sonidos.js';
import { burst } from './particulas.js';

export function initJuego(config) {
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
  const rows = 5, cols = 6;
  const brickW = 44, brickH = 20, gap = 4, top = 34;
  const totalBricksW = cols * brickW + (cols - 1) * gap;
  const startX = (LW - totalBricksW) / 2;
  const BASE_SPEED = 4.2;
  let paddle = { w: 64, h: 10, x: (LW - 64) / 2 };
  let ball = { x: LW / 2, y: LH - 40, vx: 0, vy: 0, r: 5 };
  let lives = 3;
  let running = false;
  let rafId = null;
  let trailInterval = null;

  function letras() {
    const src = (config.nombre || 'X').toUpperCase().replace(/\s+/g, '');
    return src.length ? src : 'X';
  }

  function setVel(vx, vy) {
    const mag = Math.hypot(vx, vy) || 1;
    const s = BASE_SPEED / mag;
    ball.vx = vx * s;
    ball.vy = vy * s;
  }

  function buildBricks() {
    inner.querySelectorAll('.brick').forEach(b => b.remove());
    bricks = [];
    const nombreLetras = letras();
    let li = 0;
    const colors = ['#c9a24d', '#e08a99', '#8a2c3b', '#2e4a3c', '#f0d9a3'];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + c * (brickW + gap);
        const y = top + r * (brickH + gap);
        const el = document.createElement('div');
        el.className = 'brick';
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.width = brickW + 'px';
        el.style.height = brickH + 'px';
        el.style.background = 'linear-gradient(180deg,' + colors[r % colors.length] + ',rgba(0,0,0,.15))';
        const ch = nombreLetras[li % nombreLetras.length];
        li++;
        el.textContent = ch;
        inner.appendChild(el);
        bricks.push({ x, y, w: brickW, h: brickH, el, alive: true });
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
    ball.y = LH - 40;
    const dir = Math.random() < 0.5 ? -1 : 1;
    setVel(1.3 * dir, -2.6);
  }

  function updateLives() { livesEl.textContent = '♥ '.repeat(Math.max(lives, 0)).trim() || '—'; }

  function draw() {
    paddleEl.style.left = paddle.x + 'px';
    paddleEl.style.top = (LH - 16) + 'px';
    paddleEl.style.width = paddle.w + 'px';
    ballEl.style.left = (ball.x - ball.r) + 'px';
    ballEl.style.top = (ball.y - ball.r) + 'px';
  }

  function startTrail() {
    if (trailInterval) clearInterval(trailInterval);
    trailInterval = setInterval(() => {
      if (!running) return;
      const t = document.createElement('div');
      t.className = 'ball-trail';
      t.style.left = (ball.x - 3) + 'px';
      t.style.top = (ball.y - 3) + 'px';
      inner.appendChild(t);
      setTimeout(() => t.remove(), 500);
    }, 50);
  }

  function stopTrail() { if (trailInterval) { clearInterval(trailInterval);
      trailInterval = null; } }

  function step() {
    if (!running) return;
    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x - ball.r < 0) { ball.x = ball.r;
      ball.vx = Math.abs(ball.vx); }
    if (ball.x + ball.r > LW) { ball.x = LW - ball.r;
      ball.vx = -Math.abs(ball.vx); }
    if (ball.y - ball.r < 0) { ball.y = ball.r;
      ball.vy = Math.abs(ball.vy); }

    const py = LH - 16;
    if (ball.vy > 0 && ball.y + ball.r >= py && ball.y + ball.r <= py + 14 && ball.x >= paddle.x - ball.r && ball.x <= paddle.x + paddle.w + ball.r) {
      ball.y = py - ball.r;
      let hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
      hit = Math.max(-0.85, Math.min(0.85, hit));
      setVel(hit * 2.8, -Math.sqrt(Math.max(BASE_SPEED * BASE_SPEED - (hit * 2.8) * (hit * 2.8), 1)));
    }

    for (const b of bricks) {
      if (!b.alive) continue;
      if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w && ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
        b.alive = false;
        b.el.classList.add('gone');
        soundBrick();
        const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
        const rect = stage.getBoundingClientRect();
        burst(cx * scale + rect.left, cy * scale + rect.top, 10);
        const dx = ball.x - cx, dy = ball.y - cy;
        const overlapX = (ball.r + b.w / 2) - Math.abs(dx);
        const overlapY = (ball.r + b.h / 2) - Math.abs(dy);
        if (overlapX < overlapY) { setVel(-ball.vx, ball.vy); } else { setVel(ball.vx, -ball.vy); }
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

    if (bricks.every(b => !b.alive)) { endGame(true); return; }

    draw();
    rafId = requestAnimationFrame(step);
  }

  function endGame(win) {
    running = false;
    stopTrail();
    cancelAnimationFrame(rafId);
    if (win) {
      soundWin();
      // Confeti masivo
      for (let i = 0; i < 80; i++) {
        const el = document.createElement('div');
        el.className = 'confetti-burst';
        const colors = ['#c9a24d', '#e08a99', '#ff6b6b', '#4ecdc4', '#ffe66d', '#ffd700', '#ff0088'];
        el.style.background = colors[Math.floor(Math.random() * colors.length)];
        el.style.width = (6 + Math.random() * 8) + 'px';
        el.style.height = (6 + Math.random() * 12) + 'px';
        el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        const angle = Math.random() * 2 * Math.PI;
        const dist = 120 + Math.random() * 220;
        el.style.setProperty('--bx2', Math.cos(angle) * dist + 'px');
        el.style.setProperty('--by2', Math.sin(angle) * dist - 100 + 'px');
        el.style.left = (window.innerWidth / 2 - 5 + Math.random() * 10) + 'px';
        el.style.top = (window.innerHeight / 2 - 5 + Math.random() * 10) + 'px';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1800);
      }
    }
    msgText.textContent = win ? '🎉 ¡Has roto el hechizo, ' + config.nombre + '! ✨' : '💔 El hechizo continúa... inténtalo de nuevo';
    msgEl.classList.add('show');
  }

  function startGame() {
    lives = 3;
    updateLives();
    buildBricks();
    resetBall();
    paddle.x = (LW - paddle.w) / 2;
    msgEl.classList.remove('show');
    running = true;
    layoutStage();
    draw();
    startTrail();
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(step);
  }

  function openGame() { overlay.classList.add('open');
    startGame(); }

  function closeGame() { overlay.classList.remove('open');
    running = false;
    stopTrail();
    cancelAnimationFrame(rafId);
    soundClose(); }

  document.getElementById('game-close').addEventListener('click', closeGame);
  restartBtn.addEventListener('click', () => { soundTap();
    startGame(); });
  overlay.addEventListener('click', e => { if (e.target === overlay) closeGame(); });

  function movePaddle(clientX) {
    const rect = stage.getBoundingClientRect();
    const localX = (clientX - rect.left) / scale;
    paddle.x = Math.min(Math.max(localX - paddle.w / 2, 0), LW - paddle.w);
    if (!running) draw();
  }
  stage.addEventListener('pointermove', e => movePaddle(e.clientX));
  stage.addEventListener('touchmove', e => { if (e.touches[0]) movePaddle(e.touches[0].clientX);
    e.preventDefault(); }, { passive: false });

  window.addEventListener('resize', () => { layoutStage();
    draw(); });
  layoutStage();
}
