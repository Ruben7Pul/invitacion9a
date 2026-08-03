// ============================================================
// juego.js – CORREGIDO (bug pelota y resumeParticulas, ocultar paddle en menú)
// ============================================================
console.log('📦 juego w.js (corregido: bug pelota y resumeParticulas, ocultar paddle en menú)');

import { soundTap, soundBrick, soundWin, soundLose, soundClose } from './sonidos.js';
import { pauseParticulas, resumeParticulas } from './particulas.js';

const PADDLE_W_BASE = 72;
const PADDLE_H = 10;
const BALL_R = 6;
const STAGE_W = 300;
const STAGE_H = 420;
const TOP_OFFSET = 30;
const BALL_SPEED = 264;
const PADDLE_SPEED = 300;
const TARGET_GAME_POINTS = 18;
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

const POWERUP_MIN_GAP_MS = 3500;
const POWERUP_PITY_GAP_MS = 11000;

const BRICK_PATTERNS = [
  (r, c) => Math.abs(r - 2.5) + Math.abs(c - 2.5) <= 2.5,
  (r, c) => (r === 2 || r === 3) || (c === 2 || c === 3),
  (r, c) => r === 0 || r === 5 || c === 0 || c === 5,
  (r, c) => c % 2 === 0,
  (r, c) => (r + c) % 2 === 0
];

function buildPatternCells(predicate) {
  const cols = 6, rows = 6;
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

const SCORE_MESSAGES = [
  "¡Ánimo! Cada punto cuenta.",
  "¡Vas bien! Sigue así.",
  "¡Buen ritmo! No te detengas.",
  "¡Excelente! Cada vez mejor.",
  "¡Increíble! Eres un campeón.",
  "¡Fantástico! Nadie te detiene.",
  "¡Genial! Estás en la cima.",
  "¡Brillante! Eres imparable.",
  "¡Legendario! Dejas huella.",
  "¡Dios del juego! Eres el mejor."
];

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

function getRandomName() {
  const names = ['Jugador', 'Campeón', 'Leyenda', 'Guerrero', 'Mago', 'Ninja', 'Samurai', 'Vikingo', 'Fénix', 'Titan'];
  return names[Math.floor(Math.random() * names.length)];
}

export function initJuego(config) {
  console.log('🎮 Iniciando juego (corregido)');

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
  const msgText = document.getElementById('game-msg-text');
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

  paddleEl.style.cssText += `
    background: linear-gradient(90deg, #ff00cc, #3333ff, #00ffcc, #ffcc00, #ff00cc);
    background-size: 300% 100%;
    animation: neonPaddle 2s linear infinite;
    border: 2px solid #fff;
    box-shadow: 0 0 20px rgba(255,255,255,0.6);
    border-radius: 6px;
  `;
  if (!document.querySelector('#neon-style')) {
    const style = document.createElement('style');
    style.id = 'neon-style';
    style.textContent = `
      @keyframes neonPaddle {
        0% { background-position: 0% 50%; }
        100% { background-position: 300% 50%; }
      }
    `;
    document.head.appendChild(style);
  }

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
    background:
      radial-gradient(circle at 12% 20%, #ffffff 0%, #e9edf5 65%),
      radial-gradient(circle at 60% 10%, #ffffff 0%, #eef1f8 60%),
      radial-gradient(circle at 85% 35%, #ffffff 0%, #e9edf5 65%),
      radial-gradient(circle at 25% 55%, #ffffff 0%, #eef1f8 60%),
      radial-gradient(circle at 70% 60%, #ffffff 0%, #e9edf5 65%),
      radial-gradient(circle at 40% 85%, #ffffff 0%, #eef1f8 60%),
      linear-gradient(180deg, #ffffff 0%, #eef1f8 100%);
    background-size: 140% 140%, 130% 130%, 150% 150%, 130% 130%, 140% 140%, 130% 130%, 100% 100%;
    -webkit-mask-image:
      radial-gradient(ellipse 44px 30px at 8% 100%, #000 55%, transparent 100%),
      radial-gradient(ellipse 52px 34px at 28% 100%, #000 55%, transparent 100%),
      radial-gradient(ellipse 48px 32px at 48% 100%, #000 55%, transparent 100%),
      radial-gradient(ellipse 54px 34px at 68% 100%, #000 55%, transparent 100%),
      radial-gradient(ellipse 50px 30px at 88% 100%, #000 55%, transparent 100%),
      linear-gradient(to bottom, #000 0, #000 calc(100% - ${NIEBLA_FEATHER}px), transparent 100%);
    mask-image:
      radial-gradient(ellipse 44px 30px at 8% 100%, #000 55%, transparent 100%),
      radial-gradient(ellipse 52px 34px at 28% 100%, #000 55%, transparent 100%),
      radial-gradient(ellipse 48px 32px at 48% 100%, #000 55%, transparent 100%),
      radial-gradient(ellipse 54px 34px at 68% 100%, #000 55%, transparent 100%),
      radial-gradient(ellipse 50px 30px at 88% 100%, #000 55%, transparent 100%),
      linear-gradient(to bottom, #000 0, #000 calc(100% - ${NIEBLA_FEATHER}px), transparent 100%);
    transition: height 0.6s ease, opacity 0.6s ease;
    opacity: 0; z-index: 20;
  `;
  inner.appendChild(nieblaEl);

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

  let mouseActive = false;
  let mouseX = 0;
  const keys = { left: false, right: false };
  let touchActive = false;
  let touchX = 0;

  let paused = false;
  let gameOver = false;
  let pendingHighScore = false;
  let gameIsOpen = false;

  // ---- FUNCIONES DEL MENÚ ----
  function showMenu(showGameOver = false, score = 0) {
    paddleEl.style.display = 'none';
    document.querySelectorAll('.ball-dynamic').forEach(el => el.style.display = 'none');
    document.getElementById('ball').style.display = 'none';

    if (!menuEl) return;
    menuEl.style.display = 'flex';
    if (showGameOver) {
      menuGameover.style.display = 'block';
      menuContent.style.display = 'none';
      gameoverScore.textContent = `Puntuación: ${score}`;
      const statsEl = document.getElementById('gameover-stats');
      if (statsEl) statsEl.style.display = 'none';

      const isTop = isHighScore(score) && score > 0;
      if (isTop) {
        pendingHighScore = true;
        gameoverInputContainer.style.display = 'block';
        playerNameInput.value = '';
        playerNameInput.focus();
        gameoverMenuBtn.style.display = 'none';
        nameError.style.display = 'none';
      } else {
        pendingHighScore = false;
        gameoverInputContainer.style.display = 'none';
        gameoverMenuBtn.style.display = 'block';
        gameoverMenuBtn.textContent = '🏠 Volver al menú';
      }
    } else {
      menuGameover.style.display = 'none';
      menuContent.style.display = 'flex';
      gameoverInputContainer.style.display = 'none';
      gameoverMenuBtn.style.display = 'none';
      pendingHighScore = false;
    }
    menuScoresList.style.display = 'none';
  }

  function hideMenu() {
    if (!menuEl) return;
    menuEl.style.display = 'none';
    menuScoresList.style.display = 'none';
    menuContent.style.display = 'flex';
    menuGameover.style.display = 'none';
    gameoverInputContainer.style.display = 'none';
    gameoverMenuBtn.style.display = 'none';
  }

  function updateScoresList() {
    const scores = getHighScores();
    scoresList.innerHTML = '';
    if (scores.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No hay puntuaciones aún';
      li.style.color = '#888';
      scoresList.appendChild(li);
    } else {
      scores.forEach((s, i) => {
        const li = document.createElement('li');
        li.textContent = `#${i+1} ${s.name} — ${s.score}`;
        scoresList.appendChild(li);
      });
    }
  }

  menuPlay.addEventListener('click', (e) => {
    e.stopPropagation();
    soundTap();
    hideMenu();
    startGame();
  });

  menuScores.addEventListener('click', (e) => {
    e.stopPropagation();
    soundTap();
    updateScoresList();
    menuContent.style.display = 'none';
    menuScoresList.style.display = 'block';
  });

  menuScoresBack.addEventListener('click', (e) => {
    e.stopPropagation();
    soundTap();
    menuScoresList.style.display = 'none';
    menuContent.style.display = 'flex';
  });

  menuExit.addEventListener('click', (e) => {
    e.stopPropagation();
    soundTap();
    closeGame();
  });

  menuRules.addEventListener('click', (e) => {
    e.stopPropagation();
    soundTap();
    if (modalRules) modalRules.classList.add('open');
  });

  rulesClose.addEventListener('click', () => {
    if (modalRules) modalRules.classList.remove('open');
  });

  if (menuResetTops) {
    menuResetTops.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('¿Seguro que quieres reiniciar las mejores puntuaciones?')) {
        saveHighScores([]);
        updateScoresList();
        soundTap();
      }
    });
  }

  function isValidName(name) {
    return /^[A-Za-záéíóúÁÉÍÓÚñÑ\s]+$/.test(name);
  }

  gameoverSave.addEventListener('click', (e) => {
    e.stopPropagation();
    const name = playerNameInput.value.trim();
    if (!isValidName(name) || name === '') {
      nameError.style.display = 'block';
      return;
    }
    nameError.style.display = 'none';
    addHighScore(name, playerScore);
    pendingHighScore = false;
    gameoverInputContainer.style.display = 'none';
    cleanGameState();
    showMenu(false);
    livesEl.style.display = 'none';
    scoreEl.style.display = 'none';
    pauseBtn.style.display = 'none';
    menuBtn.style.display = 'none';
    running = false;
    gameOver = false;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    soundTap();
  });

  playerNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') gameoverSave.click();
  });

  gameoverMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    soundTap();
    cleanGameState();
    hideMenu();
    showMenu(false);
    livesEl.style.display = 'none';
    scoreEl.style.display = 'none';
    pauseBtn.style.display = 'none';
    menuBtn.style.display = 'none';
    running = false;
    gameOver = false;
    if (animFrameId) cancelAnimationFrame(animFrameId);
  });

  menuBtn.addEventListener('click', () => {
    if (!running && !gameOver) return;
    soundTap();
    cleanGameState();
    hideMenu();
    showMenu(false);
    livesEl.style.display = 'none';
    scoreEl.style.display = 'none';
    pauseBtn.style.display = 'none';
    menuBtn.style.display = 'none';
    running = false;
    gameOver = false;
    if (animFrameId) cancelAnimationFrame(animFrameId);
  });

  // ---- PAUSA ----
  function togglePause() {
    if (!running || gameOver) return;
    const now = performance.now();
    if (!paused) {
      paused = true;
      pauseBtn.textContent = '▶️';
      pauseStartTime = now;
      if (gameTimeActive) gameTimeActive = false;
    } else {
      paused = false;
      pauseBtn.textContent = '⏸️';
      pausedTime += (now - pauseStartTime);
      if (launched) gameTimeActive = true;
      lastTime = 0;
    }
  }

  function handleSpace() {
    if (!running || gameOver) return;
    if (paused) { togglePause(); return; }
    if (!launched) launchBall();
    else togglePause();
  }

  pauseBtn.addEventListener('click', togglePause);
  document.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Space') {
      e.preventDefault();
      handleSpace();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && running && !paused && !gameOver) togglePause();
  });

  // ---- FUNCIONES DEL JUEGO ----
  function getBrickTypeFromValue(val) {
    if (val === 1) return BRICK_TYPES.CLAY;
    if (val === 2) return BRICK_TYPES.WOOD;
    return BRICK_TYPES.IRON;
  }

  function updateBrickVisual(brick) {
    const el = brick.el;
    const type = brick.type;
    el.style.background = `
      linear-gradient(135deg, ${type.color} 0%, ${adjustColor(type.color, -20)} 50%, ${type.color} 100%)
    `;
    el.style.backgroundSize = '200% 200%';
    if (brick.isGolden) {
      el.style.boxShadow = 'inset 0 -3px 0 rgba(0,0,0,0.3), inset 0 3px 0 rgba(255,255,255,0.2), 0 0 10px 2px rgba(255,215,0,0.85)';
      el.style.border = '2px solid #ffd700';
    } else {
      el.style.boxShadow = 'inset 0 -3px 0 rgba(0,0,0,0.3), inset 0 3px 0 rgba(255,255,255,0.2)';
      el.style.border = '1px solid rgba(0,0,0,0.3)';
    }
    updateBrickCrack(brick);
  }

  function updateBrickCrack(brick) {
    const src = getCrackImageSrc(brick);
    if (src) {
      if (brick.crackImg.getAttribute('src') !== src) brick.crackImg.setAttribute('src', src);
      brick.crackImg.style.display = 'block';
    } else {
      brick.crackImg.style.display = 'none';
    }
  }

  function adjustColor(hex, percent) {
    let r = parseInt(hex.slice(1,2), 16) * 17;
    let g = parseInt(hex.slice(2,3), 16) * 17;
    let b = parseInt(hex.slice(3,4), 16) * 17;
    if (hex.length === 7) {
      r = parseInt(hex.slice(1,3), 16);
      g = parseInt(hex.slice(3,5), 16);
      b = parseInt(hex.slice(5,7), 16);
    }
    r = Math.min(255, Math.max(0, r + percent));
    g = Math.min(255, Math.max(0, g + percent));
    b = Math.min(255, Math.max(0, b + percent));
    return `rgb(${r},${g},${b})`;
  }

  function upgradeBrickType(brick) {
    if (brick.type === BRICK_TYPES.CLAY) {
      brick.type = BRICK_TYPES.WOOD;
    } else if (brick.type === BRICK_TYPES.WOOD) {
      brick.type = BRICK_TYPES.IRON;
    } else return false;
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
    } else return false;
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

  function getFreeCells(excludeCells = new Set()) {
    const cols = 6, rows = 6;
    const used = new Set();
    bricks.forEach(b => { if (b.alive) used.add(b.cell); });
    for (const cell of excludeCells) used.add(cell);
    const free = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        if (!used.has(idx)) free.push(idx);
      }
    }
    return free;
  }

  function getCellsWithBalls() {
    const cols = 6, rows = 6;
    const brickW = 38, brickH = 16, gap = 3;
    const totalWidth = cols * (brickW + gap) - gap;
    const startX = (STAGE_W - totalWidth) / 2;
    const startY = TOP_OFFSET;
    const cells = new Set();
    for (const b of balls) {
      for (let r = 
