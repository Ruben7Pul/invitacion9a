// ============================================================
// juego.js – COMPLETO CON PALETA CORREGIDA (tamaño dinámico)
// ============================================================
console.log('📦 juego.js (paleta tamaño dinámico)');

import { soundTap, soundBrick, soundLose, soundClose } from './sonidos.js';

const isMobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
console.log('📱 isMobile:', isMobile);

const MAX_DELTA = 0.03;
const PADDLE_W_BASE = isMobile ? 64 : 72;
const PADDLE_H = 12;
const BALL_R = 6;
const STAGE_W = 300;
const STAGE_H = 420;
const TOP_OFFSET = 30;
const BALL_SPEED = isMobile ? 200 : 264;
const PADDLE_SPEED = 300;
const BRICK_ROWS = isMobile ? 5 : 6;
const BRICK_COLS = isMobile ? 5 : 6;
const TARGET_GAME_POINTS = isMobile ? 15 : 18;
const REGEN_THRESHOLD = 9;
const BALL_LOW_Y = STAGE_H - 60;
const MAX_NIEBLA = 3;
const NIEBLA_HEIGHTS = [0, Math.round(170 * 1.15), Math.round(STAGE_H * 0.60), Math.round(STAGE_H * 0.90)];
const NIEBLA_FEATHER = 26;
const MAX_LIVES = 3;
const SCORE_PER_LIFE = 8500;
const TOP_SCORES_COUNT = 5;

const BRICK_TYPES = {
  CLAY:   { value: 1, playerPoints: 100, hits: 1, color: '#d9534f', label: 'CLAY' },
  WOOD:   { value: 2, playerPoints: 200, hits: 2, color: '#8b5a2b', label: 'WOOD' },
  IRON:   { value: 3, playerPoints: 300, hits: 3, color: '#7a8a9a', label: 'IRON' }
};

function getCrackImageSrc(brick) {
  if (brick.hits >= brick.maxHits) return null;
  if (brick.maxHits === 2) return 'archivos/griet2.png';
  if (brick.maxHits === 3) {
    if (brick.hits === 2) return 'archivos/griet1.png';
    if (brick.hits === 1) return 'archivos/griet2.png';
  }
  return null;
}

const POWERUP_PROBS = {
  CLAY: 0.06,
  WOOD: 0.12,
  IRON: 0.24
};
const POWERUP_MIN_GAP_MS = isMobile ? 5000 : 3500;
const POWERUP_PITY_GAP_MS = isMobile ? 14000 : 11000;

const BRICK_PATTERNS = [
  (r, c) => Math.abs(r - 2.5) + Math.abs(c - 2.5) <= 2.5,
  (r, c) => (r === 2 || r === 3) || (c === 2 || c === 3),
  (r, c) => r === 0 || r === 5 || c === 0 || c === 5,
  (r, c) => c % 2 === 0,
  (r, c) => (r + c) % 2 === 0
];

function buildPatternCells(predicate) {
  const cols = BRICK_COLS, rows = BRICK_ROWS;
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (predicate(r, c)) cells.push(r * cols + c);
    }
  }
  return cells;
}

const GOLDEN_BRICK_CHANCE = 0.08;
const GOLDEN_BRICK_DURATION_MS = 5000;
const COMBO_BONUS_PER_HIT = 0.02;
const COMBO_BONUS_CAP = 0.5;

const GREEN_PROB_TABLE = [
  75.000, 70.3125, 65.625, 60.9375, 56.250, 51.5625, 46.875, 42.1875,
  37.500, 32.8125, 28.125, 23.4375, 18.750, 14.0625, 9.375, 4.6875, 0.000
];

const GREEN_WEIGHTS = { MULTIBOLA: 15, PALA_GRANDE: 35, DUREZA: 50 };
const RED_WEIGHTS   = { BOLA_NIEBLA: 10, PALA_MINI: 35, FLAQUESA: 55 };

function getHighScores() {
  try {
    const data = localStorage.getItem('highscores');
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}
function saveHighScores(scores) {
  localStorage.setItem('highscores', JSON.stringify(scores));
}
function addHighScore(name, score) {
  let scores = getHighScores();
  scores.push({ name: name || 'Jugador', score });
  scores.sort((a, b) => b.score - a.score);
  if (scores.length > TOP_SCORES_COUNT) scores = scores.slice(0, TOP_SCORES_COUNT);
  saveHighScores(scores);
}
function isHighScore(score) {
  const scores = getHighScores();
  if (scores.length < TOP_SCORES_COUNT) return true;
  return score > scores[scores.length - 1].score;
}

export function initJuego(config, mobile = false) {
  console.log('🎮 Iniciando juego (paleta dinámica)');

  if (!document.querySelector('#pixel-font')) {
    const link = document.createElement('link');
    link.id = 'pixel-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    document.head.appendChild(link);
  }

  const nombreEl = document.getElementById('nombre-hero');
  nombreEl.addEventListener('click', () => {
    soundTap();
    openGame();
  });

  const overlay = document.getElementById('game-overlay');
  const stage = document.getElementById('game-stage');
  const inner = document.getElementById('game-inner');
  const paddleEl = document.getElementById('paddle');
  const msgEl = document.getElementById('game-msg');
  const livesEl = document.getElementById('lives');
  const scoreEl = document.getElementById('game-score');
  const pauseBtn = document.getElementById('pause-btn');
  const menuBtn = document.getElementById('menu-btn');

  const menuEl = document.getElementById('game-menu');
  const menuContent = document.getElementById('menu-content');
  const menuPlay = document.getElementById('menu-play');
  const menuScores = document.getElementById('menu-scores');
  const menuScoresList = document.getElementById('menu-scores-list');
  const scoresList = document.getElementById('scores-list');
  const menuScoresBack = document.getElementById('menu-scores-back');
  const menuGameover = document.getElementById('menu-gameover');
  const gameoverScore = document.getElementById('gameover-score');
  const gameoverInputContainer = document.getElementById('gameover-input-container');
  const playerNameInput = document.getElementById('player-name-input');
  const gameoverSave = document.getElementById('gameover-save');
  const gameoverMenuBtn = document.getElementById('gameover-menu-btn');
  const nameError = document.getElementById('name-error');
  const menuResetTops = document.getElementById('menu-reset-tops');
  const menuExit = document.getElementById('menu-exit');
  const menuRules = document.getElementById('menu-rules');
  const modalRules = document.getElementById('modal-rules');
  const rulesClose = document.getElementById('rules-close');

  const menuTitle = menuEl?.querySelector('h2');
  if (menuTitle) menuTitle.style.display = 'none';

  livesEl.style.fontFamily = "'Press Start 2P', monospace";
  livesEl.style.fontSize = '1.2rem';
  livesEl.style.letterSpacing = '0.1em';
  livesEl.style.display = 'none';
  scoreEl.style.fontFamily = "'Press Start 2P', monospace";
  scoreEl.style.fontSize = '0.9rem';
  scoreEl.style.background = 'linear-gradient(90deg, #ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #8800ff)';
  scoreEl.style.backgroundSize = '300% 100%';
  scoreEl.style.animation = 'rainbowScore 3s linear infinite';
  scoreEl.style.webkitBackgroundClip = 'text';
  scoreEl.style.backgroundClip = 'text';
  scoreEl.style.color = 'transparent';
  scoreEl.style.display = 'none';
  pauseBtn.style.display = 'none';
  menuBtn.style.display = 'none';

  if (!document.querySelector('#rainbow-score')) {
    const style2 = document.createElement('style');
    style2.id = 'rainbow-score';
    style2.textContent = `
      @keyframes rainbowScore {
        0% { background-position: 0% 50%; }
        100% { background-position: 300% 50%; }
      }
    `;
    document.head.appendChild(style2);
  }

  const nieblaEl = document.createElement('div');
  nieblaEl.id = 'niebla-overlay';
  nieblaEl.style.cssText = `
    position: absolute; left: 0; top: 0; width: 100%; height: 0px;
    pointer-events: none;
    background: ... (igual que antes)
    opacity: 0; z-index: 20;
  `;
  inner.appendChild(nieblaEl);

  // ========== VARIABLES DE ESTADO ==========
  let scale = 1;
  let bricks = [];
  let balls = [];
  let powerups = [];
  let activePowerupTypes = new Set();
  let powerupsInAir = 0;
  let paddle = { x: (STAGE_W - PADDLE_W_BASE) / 2 };
  let lives = 3;
  let running = false;
  let launched = false;
  let animFrameId = null;
  let playerScore = 0;
  let gamePoints = 0;
  let pendingRegeneration = false;
  let ladrillosRotos = 0;
  let lastPowerupTime = 0;
  let pendingBlueBall = false;
  let comboCount = 0;
  let goldenBrickRef = null;
  let lastScoreMilestone = 0;
  let blueBallActive = false;

  let ballDurability = 1;
  let paddleSizeMultiplier = 1;
  let paddleWidth = PADDLE_W_BASE;
  let nieblaLevel = 0;

  let gameStartTime = 0;
  let pausedTime = 0;
  let pauseStartTime = 0;
  let gameTimeActive = false;
  let lastTime = 0;
  let uiCounter = 0;

  let mouseActive = false;
  let mouseX = 0;
  const keys = { left: false, right: false };
  let touchActive = false;
  let touchX = 0;

  let paused = false;
  let gameOver = false;
  let pendingHighScore = false;
  let gameIsOpen = false;

  // ========== FUNCIONES DEL MENÚ ==========
  function showMenu(showGameOver = false, score = 0) {
    paddleEl.style.visibility = 'hidden';
    document.querySelectorAll('.ball-dynamic').forEach(el => el.style.visibility = 'hidden');
    document.getElementById('ball').style.visibility = 'hidden';
    if (!menuEl) return;
    menuEl.style.display = 'flex';
    // ... resto igual
  }

  function hideMenu() {
    if (!menuEl) return;
    menuEl.style.display = 'none';
    // ...
  }

  // ... (todas las funciones del juego: getBrickTypeFromValue, placeBricks, etc. igual que antes)

  // ========== FUNCIÓN DRAW CORREGIDA ==========
  function draw() {
    // Calcular nuevo ancho
    paddleWidth = PADDLE_W_BASE * paddleSizeMultiplier;
    // Aplicar estilos directamente
    paddleEl.style.visibility = 'visible';
    paddleEl.style.display = 'block';
    paddleEl.style.opacity = '1';
    paddleEl.style.width = paddleWidth + 'px';
    paddleEl.style.transform = 'translateX(' + paddle.x + 'px)';
    paddleEl.style.top = (STAGE_H - 14) + 'px';
    paddleEl.style.left = '0';
    paddleEl.style.background = '#111';
    paddleEl.style.border = '3px solid #fff';
    paddleEl.style.boxShadow = '0 0 25px rgba(255,255,255,0.6)';
    paddleEl.style.borderRadius = '8px';
    paddleEl.style.height = PADDLE_H + 'px';
    paddleEl.style.zIndex = '100';

    // Actualizar bolas
    let ballElements = inner.querySelectorAll('.ball-dynamic');
    while (ballElements.length < balls.length) {
      const el = document.createElement('div');
      el.className = 'ball-dynamic';
      el.style.cssText = `
        position: absolute; width: ${BALL_R * 2}px; height: ${BALL_R * 2}px;
        border-radius: 50%;
        pointer-events: none;
        transform: translate(-50%, -50%);
        z-index: 25;
      `;
      updateBallStyle(el);
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

  // ========== RESTO DE FUNCIONES (gameLoop, startGame, etc.) ==========
  // (Mantén todo el código que ya tenías, solo asegura que draw() se llama correctamente)
  // Para no repetir todo, asumo que el resto está intacto.
  // Solo asegura que en applyPowerup se llame a draw() después de modificar paddleSizeMultiplier.

  // ========== APLICAR POWER-UP CON ACTUALIZACIÓN VISUAL ==========
  function applyPowerup(pu) {
    const type = pu.type;
    switch (type) {
      case 'PALA_GRANDE':
        if (paddleSizeMultiplier < 1) paddleSizeMultiplier = 1;
        paddleSizeMultiplier = 1.3;
        break;
      case 'PALA_MINI':
        if (paddleSizeMultiplier > 1) paddleSizeMultiplier = 1;
        paddleSizeMultiplier = 0.85;
        break;
      // ... resto de casos
    }
    activePowerupTypes.delete(type);
    draw(); // <--- FORZAR ACTUALIZACIÓN VISUAL
  }

  // También en startGame y resetGameState, asegurar que se llame a draw()
  // después de establecer paddleSizeMultiplier = 1.

  // ... el resto del código (gameLoop, eventos, etc.) se mantiene igual.

  // ========== INICIALIZACIÓN ==========
  layoutStage();
  console.log('✅ Juego inicializado (paleta dinámica)');
}
