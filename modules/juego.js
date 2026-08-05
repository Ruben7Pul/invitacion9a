// ============================================================
// juego.js – COMPLETO CON NUEVOS ICONOS, SONIDOS Y MENSAJES
// ============================================================
console.log('📦 juego.js (con sonidos y mejoras visuales)');

import { 
  soundTap, 
  soundBrick, 
  soundLose, 
  soundClose,
  soundWin,
  soundClay,
  soundWood,
  soundIron,
  soundPowerupGood,
  soundPowerupBad,
  soundBlueBall,
  soundExtraLife,
  soundWallHit,
  soundPaddleHit,
  soundGameOver,
  soundFogAppear,
  soundFogDisappear,
  ensureAudioCtx
} from './sonidos.js';

// ========== CONSTANTES FIJAS ==========
const MAX_DELTA = 0.03;
const PADDLE_W_BASE = 72;
const PADDLE_H = 12;
const BALL_R = 6;
const STAGE_W = 300;
const STAGE_H = 420;
const TOP_OFFSET = 30;
const BALL_SPEED = 264;
const PADDLE_SPEED = 300;
const BRICK_ROWS = 6;
const BRICK_COLS = 6;
const TARGET_GAME_POINTS = 18;
const REGEN_THRESHOLD = 9;
const BALL_LOW_Y = STAGE_H - 60;
const MAX_NIEBLA = 3;
const NIEBLA_HEIGHTS = [0, Math.round(170 * 1.15), Math.round(STAGE_H * 0.60), Math.round(STAGE_H * 0.90)];
const NIEBLA_FEATHER = 26;
const MAX_LIVES = 3;
const SCORE_PER_LIFE = 8500;
const TOP_SCORES_COUNT = 5;

// ========== TIPOS DE LADRILLOS ==========
const BRICK_TYPES = {
  CLAY:   { value: 1, playerPoints: 100, hits: 1, color: '#d9534f', label: 'CLAY' },
  WOOD:   { value: 2, playerPoints: 200, hits: 2, color: '#8b5a2b', label: 'WOOD' },
  IRON:   { value: 3, playerPoints: 300, hits: 3, color: '#7a8a9a', label: 'IRON' }
};

function getCrackImageSrc(brick) {
  if (brick.hits >= brick.maxHits) return null;
  if (brick.maxHits === 2) return '../archivos/griet2.png';
  if (brick.maxHits === 3) {
    if (brick.hits === 2) return '../archivos/griet1.png';
    if (brick.hits === 1) return '../archivos/griet2.png';
  }
  return null;
}

// ========== POWER-UPS ==========
const POWERUP_PROBS = {
  CLAY: 0.06,
  WOOD: 0.12,
  IRON: 0.24
};
const POWERUP_MIN_GAP_MS = 3500;
const POWERUP_PITY_GAP_MS = 11000;

// ========== PATRONES DE LADRILLOS ==========
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

// ========== LADRILLO DORADO Y COMBO ==========
const GOLDEN_BRICK_CHANCE = 0.08;
const GOLDEN_BRICK_DURATION_MS = 5000;
const COMBO_BONUS_PER_HIT = 0.02;
const COMBO_BONUS_CAP = 0.5;

// ========== PROBABILIDAD DE POWER-UP VERDE ==========
const GREEN_PROB_TABLE = [
  75.000, 70.3125, 65.625, 60.9375, 56.250, 51.5625, 46.875, 42.1875,
  37.500, 32.8125, 28.125, 23.4375, 18.750, 14.0625, 9.375, 4.6875, 0.000
];

// ========== NUEVOS ICONOS ==========
const POWERUP_SYMBOLS = {
  MULTIBOLA: 'x3',
  PALA_GRANDE: '<>',
  DUREZA: '↑',
  BOLA_NIEBLA: '🌫️',
  PALA_MINI: '-<',
  FLAQUESA: '↓'
};

// ========== PUNTUACIONES ==========
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

// ========== FUNCIÓN PRINCIPAL ==========
export function initJuego(config, mobile = false) {
  console.log('🎮 Iniciando juego (con sonidos y mejoras)');
  ensureAudioCtx();

  if (!document.querySelector('#pixel-font')) {
    const link = document.createElement('link');
    link.id = 'pixel-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    document.head.appendChild(link);
  }

  // ========== OBTENER ELEMENTOS ==========
  const nombreEl = document.getElementById('nombre-hero');
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
  const gameoverThemeMsg = document.getElementById('gameover-theme-msg');
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

  if (nombreEl) {
    nombreEl.addEventListener('click', () => {
      soundTap();
      openGame();
    });
  } else {
    setTimeout(openGame, 300);
  }

  const menuTitle = menuEl?.querySelector('h2');
  if (menuTitle) menuTitle.style.display = 'none';

  paddleEl.style.background = '#111';
  paddleEl.style.border = '2px solid #d4af37';
  paddleEl.style.boxShadow = '0 0 25px rgba(212,175,55,0.3)';
  paddleEl.style.borderRadius = '8px';
  paddleEl.style.height = PADDLE_H + 'px';
  paddleEl.style.willChange = 'transform';
  paddleEl.style.zIndex = '100';
  paddleEl.style.pointerEvents = 'none';

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

  // ========== NIEBLA ==========
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
  let prevNieblaLevel = 0;

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

  // ========== MENSAJES TEMÁTICOS ==========
  const THEME_MESSAGES = [
    'La rosa apenas empieza a florecer... ¡vuelve a intentarlo!',
    'Como Bella cruzando el portón por primera vez: buen comienzo, sigue así.',
    'El hechizo comienza a ceder ante ti. ¡Vas por buen camino!',
    'Los candelabros del salón se encienden para acompañarte. ¡Bien hecho!',
    'Bailas con la gracia de una quinceañera en su vals. ¡Sigue brillando!',
    'La Bestia sonríe al ver tu talento. ¡Vas a medio camino!',
    'Todo el castillo murmura tu nombre. ¡Vas impresionando!',
    'Tu corona de XV brilla un poco más con cada punto. ¡Adelante!',
    'Como en el cuento, la magia está de tu lado. ¡Vas muy arriba!',
    'Los pétalos de la rosa encantada aún no caen: tu magia sigue viva.',
    '¡Cien mil puntos! Dignos de una noche de gala en el gran salón.',
    'Bailas como la propia Bella con su vestido dorado. ¡Espectacular!',
    'El hechizo se rompe gracias a ti: puntaje digno de leyenda.',
    'Toda la corte del castillo aplaude de pie. ¡Ya casi al tope!',
    'A un paso de la perfección... una quinceañera legendaria.',
    '🌹 ¡Puntaje máximo! Un final de cuento de hadas — fuiste el alma de esta fiesta encantada. ¡Feliz XV!'
  ];
  function getThemeMessage(score) {
    const tier = Math.min(Math.floor(Math.max(score, 0) / 10000), THEME_MESSAGES.length - 1);
    return THEME_MESSAGES[tier];
  }

  // ========== MENSAJES FLOTANTES ==========
  function showFloatingMessage(text, color = '#fff', duration = 1500) {
    const el = document.createElement('div');
    el.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'Press Start 2P', monospace;
      font-size: 1.1rem;
      color: ${color};
      text-shadow: 0 0 20px rgba(0,0,0,0.9), 0 0 10px ${color}40;
      pointer-events: none;
      z-index: 30;
      animation: floatMsg 1.8s ease forwards;
      text-align: center;
      white-space: nowrap;
      background: rgba(0,0,0,0.4);
      padding: 0.3rem 1.2rem;
      border-radius: 30px;
      backdrop-filter: blur(2px);
      border: 1px solid ${color}60;
    `;
    el.textContent = text;
    inner.appendChild(el);
    setTimeout(() => el.remove(), duration + 200);
  }

  // ========== FUNCIONES DEL MENÚ ==========
  function showMenu(showGameOver = false, score = 0) {
    paddleEl.style.visibility = 'hidden';
    document.querySelectorAll('.ball-dynamic').forEach(el => el.style.visibility = 'hidden');
    document.getElementById('ball').style.visibility = 'hidden';

    if (!menuEl) return;
    menuEl.style.display = 'flex';
    if (showGameOver) {
      menuGameover.style.display = 'block';
      menuContent.style.display = 'none';
      gameoverScore.textContent = `Puntuación: ${score}`;
      if (gameoverThemeMsg) gameoverThemeMsg.textContent = getThemeMessage(score);
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

  // ========== EVENTOS DEL MENÚ ==========
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
    const veil = document.getElementById('loading-veil');
    if (veil) {
      veil.style.transition = 'none';
      veil.style.display = 'block';
      veil.classList.remove('hide');
      void veil.offsetHeight;
    }
    setTimeout(() => {
      window.location.href = '../index.html?volver=1';
    }, 220);
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

  // ========== PAUSA ==========
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

  // ========== FUNCIONES DEL JUEGO ==========
  function getBrickTypeFromValue(val) {
    if (val === 1) return BRICK_TYPES.CLAY;
    if (val === 2) return BRICK_TYPES.WOOD;
    return BRICK_TYPES.IRON;
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
    const cols = BRICK_COLS, rows = BRICK_ROWS;
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
    const cols = BRICK_COLS, rows = BRICK_ROWS;
    const brickW = 38, brickH = 16, gap = 3;
    const totalWidth = cols * (brickW + gap) - gap;
    const startX = (STAGE_W - totalWidth) / 2;
    const startY = TOP_OFFSET;
    const cells = new Set();
    for (const b of balls) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = startX + c * (brickW + gap);
          const y = startY + r * (brickH + gap);
          if (b.x > x - 10 && b.x < x + brickW + 10 &&
              b.y > y - 10 && b.y < y + brickH + 10) {
            cells.add(r * cols + c);
          }
        }
      }
    }
    return cells;
  }

  function placeBricks(values, excludeCells = new Set(), preferredCells = null) {
    const cols = BRICK_COLS, rows = BRICK_ROWS;
    const brickW = 38, brickH = 16, gap = 3;
    const totalWidth = cols * (brickW + gap) - gap;
    const startX = (STAGE_W - totalWidth) / 2;
    const startY = TOP_OFFSET;

    const freeCells = getFreeCells(excludeCells);
    if (freeCells.length === 0) return;

    let shuffled;
    if (preferredCells && preferredCells.length > 0) {
      const preferredSet = new Set(preferredCells);
      const inPattern = freeCells.filter(c => preferredSet.has(c)).sort(() => Math.random() - 0.5);
      const outPattern = freeCells.filter(c => !preferredSet.has(c)).sort(() => Math.random() - 0.5);
      shuffled = inPattern.concat(outPattern);
    } else {
      shuffled = freeCells.sort(() => Math.random() - 0.5);
    }
    const toPlace = Math.min(values.length, shuffled.length);
    for (let i = 0; i < toPlace; i++) {
      const cell = shuffled[i];
      const row = Math.floor(cell / cols);
      const col = cell % cols;
      const x = startX + col * (brickW + gap);
      const y = startY + row * (brickH + gap);
      const value = values[i];
      const type = getBrickTypeFromValue(value);

      const el = document.createElement('div');
      el.className = 'brick';
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.width = brickW + 'px';
      el.style.height = brickH + 'px';
      el.style.borderRadius = '4px';
      el.style.border = '1px solid rgba(0,0,0,0.3)';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.color = '#fff';
      el.style.fontWeight = 'bold';
      el.style.fontSize = '11px';
      el.style.textShadow = '0 1px 2px rgba(0,0,0,0.5)';

      const crackImg = document.createElement('img');
      crackImg.style.cssText = `
        max-width: 78%; max-height: 62%;
        width: auto; height: auto;
        object-fit: contain;
        pointer-events: none;
        display: none;
      `;
      el.appendChild(crackImg);

      inner.appendChild(el);

      const brick = {
        x, y, w: brickW, h: brickH,
        el,
        alive: true,
        hits: type.hits,
        maxHits: type.hits,
        value: type.value,
        playerPoints: type.playerPoints,
        cell: cell,
        type: type,
        originalType: type,
        originalHits: type.hits,
        isGolden: false,
        goldenExpiresAt: 0,
        crackImg
      };
      bricks.push(brick);
      gamePoints += type.value;
      updateBrickVisual(brick);
    }
  }

  function requestRegeneration() {
    if (pendingRegeneration) return;
    if (getFreeCells().size === 0) return;
    pendingRegeneration = true;
  }

  function maybeMakeGolden(fromIndex) {
    if (goldenBrickRef && goldenBrickRef.alive) return;
    if (Math.random() >= GOLDEN_BRICK_CHANCE) return;
    const recent = bricks.slice(fromIndex);
    if (recent.length === 0) return;
    const chosen = recent[Math.floor(Math.random() * recent.length)];
    chosen.isGolden = true;
    chosen.goldenExpiresAt = performance.now() + GOLDEN_BRICK_DURATION_MS;
    goldenBrickRef = chosen;
    updateBrickVisual(chosen);
  }

  function checkGoldenExpiry() {
    if (!goldenBrickRef) return;
    if (!goldenBrickRef.alive) { goldenBrickRef = null; return; }
    if (performance.now() >= goldenBrickRef.goldenExpiresAt) {
      goldenBrickRef.isGolden = false;
      updateBrickVisual(goldenBrickRef);
      goldenBrickRef = null;
    }
  }

  function checkAndRegenerate() {
    if (!pendingRegeneration || !running) return;
    const pattern = BRICK_PATTERNS[Math.floor(Math.random() * BRICK_PATTERNS.length)];
    const preferredCells = buildPatternCells(pattern);
    if (balls.length > 1) {
      const exclude = getCellsWithBalls();
      const values = generateBrickValues();
      const before = bricks.length;
      placeBricks(values, exclude, preferredCells);
      maybeMakeGolden(before);
      pendingRegeneration = false;
      return;
    }
    if (launched && balls.some(b => b.y < BALL_LOW_Y)) {
      const values = generateBrickValues();
      const before = bricks.length;
      placeBricks(values, undefined, preferredCells);
      maybeMakeGolden(before);
      pendingRegeneration = false;
    }
  }

  function getElapsedMinutes() {
    if (!gameTimeActive || gameStartTime <= 0) return 0;
    const now = performance.now();
    return Math.max(0, (now - gameStartTime - pausedTime) / 60000);
  }

  const BALL_SPEED_RAMP_MINUTES = 14;
  const BALL_SPEED_MAX_MULT = 2.7;
  function getSpeedMultiplier(minutes) {
    const t = Math.min(minutes, BALL_SPEED_RAMP_MINUTES) / BALL_SPEED_RAMP_MINUTES;
    const eased = t * t * (3 - 2 * t);
    return 1 + eased * (BALL_SPEED_MAX_MULT - 1);
  }

  function getCurrentBallSpeed() {
    return BALL_SPEED * getSpeedMultiplier(getElapsedMinutes());
  }

  function getGreenProbability(minutes) {
    const step = minutes * 2;
    if (step <= 0) return GREEN_PROB_TABLE[0];
    if (step >= GREEN_PROB_TABLE.length - 1) return GREEN_PROB_TABLE[GREEN_PROB_TABLE.length - 1];
    const idx = Math.floor(step);
    const frac = step - idx;
    return GREEN_PROB_TABLE[idx] + (GREEN_PROB_TABLE[idx + 1] - GREEN_PROB_TABLE[idx]) * frac;
  }

  function selectPowerupByColor(color) {
    const weights = color === 'verde' ? GREEN_WEIGHTS : RED_WEIGHTS;
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (const [key, weight] of Object.entries(weights)) {
      r -= weight;
      if (r <= 0) return key;
    }
    return Object.keys(weights)[0];
  }

  function isSaturated(typeKey) {
    switch (typeKey) {
      case 'PALA_GRANDE': return paddleSizeMultiplier > 1;
      case 'PALA_MINI': return paddleSizeMultiplier < 1;
      case 'DUREZA': return ballDurability === 3;
      case 'FLAQUESA': return ballDurability === 1;
      case 'MULTIBOLA': return balls.length >= 3;
      case 'BOLA_NIEBLA': return nieblaLevel === 3;
      default: return false;
    }
  }

  function getAvailableTypes(color) {
    const types = color === 'verde' ? Object.keys(GREEN_WEIGHTS) : Object.keys(RED_WEIGHTS);
    return types.filter(t => !isSaturated(t) && !activePowerupTypes.has(t));
  }

  function getAlternativeType(color, currentType) {
    const available = getAvailableTypes(color);
    if (!isSaturated(currentType) && !activePowerupTypes.has(currentType)) return currentType;
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  }

  function spawnPowerup(brick) {
    if (ladrillosRotos <= 36) return;
    if (powerupsInAir >= 2) return;

    const now = performance.now();
    const sinceLast = lastPowerupTime === 0 ? Infinity : now - lastPowerupTime;

    if (sinceLast < POWERUP_MIN_GAP_MS) return;

    const forced = sinceLast >= POWERUP_PITY_GAP_MS;

    if (!forced) {
      let prob = 0;
      if (brick.type === BRICK_TYPES.CLAY) prob = POWERUP_PROBS.CLAY;
      else if (brick.type === BRICK_TYPES.WOOD) prob = POWERUP_PROBS.WOOD;
      else if (brick.type === BRICK_TYPES.IRON) prob = POWERUP_PROBS.IRON;
      if (Math.random() >= prob) return;
    }

    let elapsed = 0;
    if (gameTimeActive && gameStartTime > 0) {
      elapsed = (now - gameStartTime - pausedTime) / 60000;
    }
    const minutes = Math.max(0, elapsed);
    const greenProb = getGreenProbability(minutes);
    const color = Math.random() * 100 < greenProb ? 'verde' : 'rojo';
    let typeKey = selectPowerupByColor(color);

    const alternative = getAlternativeType(color, typeKey);
    if (alternative === null) return;
    typeKey = alternative;

    activePowerupTypes.add(typeKey);
    powerupsInAir++;
    lastPowerupTime = now;

    // NO sonido al aparecer (solo al recoger)

    const isGreen = color === 'verde';
    const size = isGreen ? 24 : 36;
    const speed = isGreen ? 120 : 40;

    const cx = brick.x + brick.w / 2;
    const cy = brick.y + brick.h / 2;

    const el = document.createElement('div');
    el.style.cssText = `
      position: absolute;
      width: ${size}px; height: ${size}px;
      border-radius: 50%;
      background: ${isGreen ? 'rgba(46, 204, 113, 0.7)' : 'rgba(231, 76, 60, 0.7)'};
      border: 3px solid ${isGreen ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,0,0.8)'};
      box-shadow: 0 0 20px rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: bold; font-size: ${size * 0.5}px;
      pointer-events: none; z-index: 15;
      transform: translate(-50%, -50%);
      text-shadow: 0 0 6px rgba(0,0,0,0.8);
    `;
    el.textContent = POWERUP_SYMBOLS[typeKey] || '?';
    inner.appendChild(el);

    powerups.push({
      x: cx, y: cy, vx: 0, vy: speed,
      size: size, color: color, type: typeKey,
      el: el, alive: true
    });
  }

  function spawnBlueBall() {
    if (blueBallActive) return;
    blueBallActive = true;
    const size = 22;
    const speed = 60;
    const x = Math.random() * (STAGE_W - size) + size/2;
    const y = 10;

    const el = document.createElement('div');
    el.style.cssText = `
      position: absolute;
      width: ${size}px; height: ${size}px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, #fff4a0, #ffd700 50%, #b8860b);
      border: 3px solid #fff8dc;
      box-shadow: 0 0 40px rgba(255,215,0,0.9), 0 0 80px rgba(255,215,0,0.4);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: bold; font-size: 16px;
      pointer-events: none; z-index: 26;
      transform: translate(-50%, -50%);
      text-shadow: 0 0 10px rgba(0,0,0,0.8);
      animation: goldenGlow 1s ease-in-out infinite alternate;
    `;
    el.textContent = '★';
    inner.appendChild(el);

    // Añadir keyframe si no existe
    if (!document.querySelector('#golden-glow')) {
      const style = document.createElement('style');
      style.id = 'golden-glow';
      style.textContent = `
        @keyframes goldenGlow {
          0% { box-shadow: 0 0 30px rgba(255,215,0,0.6), 0 0 60px rgba(255,215,0,0.3); transform: translate(-50%, -50%) scale(1); }
          100% { box-shadow: 0 0 60px rgba(255,215,0,1), 0 0 120px rgba(255,215,0,0.5); transform: translate(-50%, -50%) scale(1.1); }
        }
      `;
      document.head.appendChild(style);
    }

    powerups.push({
      x: x, y: y, vy: speed, size: size,
      type: 'BOLA_AZUL', el: el, alive: true, isBlue: true
    });
    powerupsInAir++;
    // No sonido al aparecer, solo al recoger
  }

  function applyBlueBall() {
    playerScore += 2000;
    soundBlueBall();
    showFloatingMessage('+2000', '#ffd700', 1500);
    nieblaLevel = 0;
    updateNiebla();
    if (paddleSizeMultiplier < 1) paddleSizeMultiplier = 1;
    if (ballDurability < 1) ballDurability = 1;
    const positiveTypes = ['MULTIBOLA', 'PALA_GRANDE', 'DUREZA'];
    const available = positiveTypes.filter(t => !isSaturated(t));
    if (available.length > 0) {
      const selected = available[Math.floor(Math.random() * available.length)];
      switch (selected) {
        case 'MULTIBOLA': {
          const count = balls.length;
          if (count >= 1 && count <= 3) {
            const newCount = Math.min(9, count * 3);
            const extra = newCount - count;
            for (let i = 0; i < extra; i++) {
              const src = balls[Math.floor(Math.random() * balls.length)];
              const angle = (Math.random() - 0.5) * 1.2;
              const speed = Math.sqrt(src.vx * src.vx + src.vy * src.vy) || BALL_SPEED;
              const vx = Math.sin(angle) * speed;
              const vy = -Math.cos(angle) * speed;
              balls.push({ x: src.x + (Math.random() - 0.5) * 10, y: src.y + (Math.random() - 0.5) * 10, vx: vx, vy: vy });
            }
          }
          break;
        }
        case 'PALA_GRANDE':
          if (paddleSizeMultiplier < 1) paddleSizeMultiplier = 1;
          paddleSizeMultiplier = 1.35;
          break;
        case 'DUREZA':
          if (ballDurability < 3) ballDurability++;
          updateDurabilityVisual();
          break;
      }
    }
    updateUI();
    blueBallActive = false;
    draw();
  }

  function launchBall() {
    if (launched) return;
    const speed = getCurrentBallSpeed();
    for (const b of balls) {
      if (b.vx === 0 && b.vy === 0) {
        const dir = Math.random() < 0.5 ? -1 : 1;
        const angle = (Math.random() - 0.5) * 0.8;
        b.vx = Math.sin(angle) * speed * dir;
        b.vy = -Math.cos(angle) * speed;
      }
    }
    launched = true;
    if (!gameTimeActive && gameStartTime > 0) {
      gameTimeActive = true;
      if (paused) gameTimeActive = false;
    }
  }

  function cleanGameState() {
    inner.querySelectorAll('.brick').forEach(b => b.remove());
    powerups.forEach(p => p.el.remove());
    powerups = [];
    activePowerupTypes.clear();
    powerupsInAir = 0;
    inner.querySelectorAll('[style*="floatMsg"]').forEach(el => el.remove());
    bricks = [];
    balls = [];
    paddle.x = (STAGE_W - PADDLE_W_BASE) / 2;
    paddleSizeMultiplier = 1;
    paddleWidth = PADDLE_W_BASE;
    ballDurability = 1;
    nieblaLevel = 0;
    prevNieblaLevel = 0;
    updateNiebla();
    lives = 3;
    playerScore = 0;
    gamePoints = 0;
    pendingRegeneration = false;
    ladrillosRotos = 0;
    lastPowerupTime = 0;
    pendingBlueBall = false;
    comboCount = 0;
    goldenBrickRef = null;
    lastScoreMilestone = 0;
    blueBallActive = false;
    gameTimeActive = false;
    launched = false;
    running = false;
    gameOver = false;
    paused = false;
    pauseBtn.textContent = '⏸️';
    livesEl.style.display = 'none';
    scoreEl.style.display = 'none';
    pauseBtn.style.display = 'none';
    menuBtn.style.display = 'none';
    msgEl.classList.remove('show');
    updateUI();
    draw();
  }

  function resetGameState() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    running = false;
    launched = false;
    paused = false;
    gameOver = false;
    pauseBtn.textContent = '⏸️';
    pausedTime = 0;
    pauseStartTime = 0;
    bricks = [];
    powerups = [];
    activePowerupTypes.clear();
    powerupsInAir = 0;
    balls = [];
    paddle.x = (STAGE_W - PADDLE_W_BASE) / 2;
    paddleSizeMultiplier = 1;
    paddleWidth = PADDLE_W_BASE;
    ballDurability = 1;
    nieblaLevel = 0;
    prevNieblaLevel = 0;
    updateNiebla();
    lives = 3;
    playerScore = 0;
    gamePoints = 0;
    pendingRegeneration = false;
    ladrillosRotos = 0;
    lastPowerupTime = 0;
    pendingBlueBall = false;
    comboCount = 0;
    goldenBrickRef = null;
    lastScoreMilestone = 0;
    blueBallActive = false;
    keys.left = keys.right = false;
    touchActive = false;
    touchX = 0;
    mouseActive = false;
    mouseX = 0;
    gameStartTime = 0;
    lastTime = 0;
    gameTimeActive = false;

    inner.querySelectorAll('.brick').forEach(b => b.remove());
    powerups.forEach(p => p.el.remove());
    powerups = [];
    inner.querySelectorAll('[style*="floatMsg"]').forEach(el => el.remove());

    const initialX = paddle.x + paddleWidth / 2;
    const initialY = STAGE_H - 14 - BALL_R;
    balls.push({ x: initialX, y: initialY, vx: 0, vy: 0 });
    launched = false;

    msgEl.classList.remove('show');
    updateUI();
    updateDurabilityVisual();
    draw();
  }

  function updateLivesUI() {
    let heartsHtml = '';
    for (let i = 0; i < lives; i++) {
      heartsHtml += `<span class="heart-icon" style="color:#ff0000; text-shadow:0 0 10px #ff0000;">♥</span>`;
    }
    livesEl.innerHTML = heartsHtml || '—';
  }

  function animateHeartLoss() {
    const hearts = livesEl.querySelectorAll('.heart-icon');
    if (hearts.length > 0) {
      const lastHeart = hearts[hearts.length - 1];
      lastHeart.classList.add('heart-fade');
      setTimeout(() => updateLivesUI(), 600);
    } else {
      updateLivesUI();
    }
  }

  function loseLife() {
    lives--;
    soundLose();
    animateHeartLoss();
    gameTimeActive = false;
    comboCount = 0;

    launched = false;
    balls = [];
    powerups.forEach(p => p.el.remove());
    powerups = [];
    activePowerupTypes.clear();
    powerupsInAir = 0;
    paddleSizeMultiplier = 1;
    paddleWidth = PADDLE_W_BASE;
    ballDurability = 1;
    nieblaLevel = 0;
    prevNieblaLevel = 0;
    updateNiebla();
    updateDurabilityVisual();
    updateUI();
    draw();

    if (lives <= 0) {
      soundGameOver();
      setTimeout(() => endGame(), 400);
      return;
    }

    setTimeout(() => {
      const newX = paddle.x + paddleWidth / 2;
      const newY = STAGE_H - 14 - BALL_R;
      balls = [{ x: newX, y: newY, vx: 0, vy: 0 }];
      launched = false;
      powerups.forEach(p => p.el.remove());
      powerups = [];
      activePowerupTypes.clear();
      powerupsInAir = 0;
      updateUI();
      draw();
    }, 300);
  }

  function endGame() {
    running = false;
    gameOver = true;
    gameTimeActive = false;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    soundGameOver();
    showMenu(true, playerScore);
    livesEl.style.display = 'none';
    scoreEl.style.display = 'none';
    pauseBtn.style.display = 'none';
    menuBtn.style.display = 'none';
    soundLose();
  }

  function startGame() {
    resetGameState();
    const clayValues = new Array(BRICK_ROWS * BRICK_COLS).fill(1);
    inner.querySelectorAll('.brick').forEach(b => b.remove());
    bricks = [];
    gamePoints = 0;
    placeBricks(clayValues);

    paddle.x = (STAGE_W - paddleWidth) / 2;
    launched = false;
    const newX = paddle.x + paddleWidth / 2;
    const newY = STAGE_H - 14 - BALL_R;
    balls = [{ x: newX, y: newY, vx: 0, vy: 0 }];
    msgEl.classList.remove('show');
    running = true;
    gameOver = false;
    gameStartTime = performance.now();
    pausedTime = 0;
    pauseStartTime = 0;
    gameTimeActive = false;
    layoutStage();
    livesEl.style.display = 'block';
    scoreEl.style.display = 'block';
    pauseBtn.style.display = 'block';
    menuBtn.style.display = 'block';
    updateUI();
    updateDurabilityVisual();
    draw();
    lastTime = 0;
    uiCounter = 0;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(gameLoop);
  }

  function updateUI() {
    updateLivesUI();
    scoreEl.textContent = `${playerScore}`;

    const milestone = Math.floor(playerScore / SCORE_PER_LIFE);
    if (milestone > lastScoreMilestone && milestone > 0) {
      lastScoreMilestone = milestone;

      if (lives < MAX_LIVES) {
        lives++;
        soundExtraLife();
        showFloatingMessage('+1 VIDA ❤️', '#ff4444', 1500);
        updateLivesUI();
      } else {
        if (!blueBallActive) pendingBlueBall = true;
      }
    }

    if (pendingBlueBall && !blueBallActive && powerupsInAir <= 1) {
      pendingBlueBall = false;
      spawnBlueBall();
    }
  }

  function updateDurabilityVisual() {
    const ballElements = inner.querySelectorAll('.ball-dynamic');
    for (const el of ballElements) updateBallStyle(el);
  }

  function updateBallStyle(el) {
    let bg, border, shadow;
    switch (ballDurability) {
      case 1:
        bg = 'radial-gradient(circle at 35% 30%, #b0b0b0, #606060 60%, #303030)';
        border = '2px solid #888';
        shadow = '0 0 10px rgba(100,100,100,0.5)';
        break;
      case 2:
        bg = 'radial-gradient(circle at 35% 30%, #ffaa00, #ff3300 60%, #990000)';
        border = '2px solid #ff6600';
        shadow = '0 0 20px rgba(255,100,0,0.8)';
        break;
      case 3:
        bg = 'radial-gradient(circle at 35% 30%, #88ddff, #0066ff 60%, #0000aa)';
        border = '2px solid #00ccff';
        shadow = '0 0 25px rgba(0,150,255,0.9)';
        break;
    }
    el.style.background = bg;
    el.style.border = border;
    el.style.boxShadow = shadow;
  }

  function getNieblaBoundary() {
    return NIEBLA_HEIGHTS[nieblaLevel] || 0;
  }

  function updateNiebla() {
    const boundary = getNieblaBoundary();
    const totalHeight = boundary > 0 ? boundary + NIEBLA_FEATHER : 0;
    nieblaEl.style.height = totalHeight + 'px';
    nieblaEl.style.opacity = boundary > 0 ? 1 : 0;
    
    // Sonidos de niebla
    if (nieblaLevel > prevNieblaLevel) {
      soundFogAppear();
    } else if (nieblaLevel < prevNieblaLevel && nieblaLevel === 0) {
      soundFogDisappear();
    }
    prevNieblaLevel = nieblaLevel;
  }

  function draw() {
    paddleWidth = PADDLE_W_BASE * paddleSizeMultiplier;
    paddleEl.style.visibility = 'visible';
    paddleEl.style.display = 'block';
    paddleEl.style.opacity = '1';
    paddleEl.style.width = paddleWidth + 'px';
    paddleEl.style.transform = 'translateX(' + paddle.x + 'px)';
    paddleEl.style.top = (STAGE_H - 14) + 'px';
    paddleEl.style.left = '0';
    paddleEl.style.background = '#111';
    paddleEl.style.border = '2px solid #d4af37';
    paddleEl.style.boxShadow = '0 0 25px rgba(212,175,55,0.3)';
    paddleEl.style.borderRadius = '8px';
    paddleEl.style.height = PADDLE_H + 'px';
    paddleEl.style.zIndex = '100';

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

  function gameLoop(timestamp) {
    if (!running) {
      animFrameId = requestAnimationFrame(gameLoop);
      return;
    }
    if (paused) {
      draw();
      animFrameId = requestAnimationFrame(gameLoop);
      return;
    }

    const delta = lastTime ? Math.min((timestamp - lastTime) / 1000, MAX_DELTA) : 0.016;
    lastTime = timestamp;

    uiCounter++;
    if (uiCounter % 2 === 0) {
      updateUI();
    }

    let paddleMoved = false;
    if (keys.left) {
      paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * delta);
      paddleMoved = true;
    }
    if (keys.right) {
      paddle.x = Math.min(STAGE_W - paddleWidth, paddle.x + PADDLE_SPEED * delta);
      paddleMoved = true;
    }
    if (touchActive) {
      paddle.x = Math.max(0, Math.min(STAGE_W - paddleWidth, touchX));
      paddleMoved = true;
    }
    if (mouseActive) {
      paddle.x = Math.max(0, Math.min(STAGE_W - paddleWidth, mouseX));
      paddleMoved = true;
    }

    if (!launched) {
      if (balls.length > 0) {
        const b = balls[0];
        b.x = paddle.x + paddleWidth / 2;
        b.y = STAGE_H - 14 - BALL_R;
      }
      if (paddleMoved) launchBall();
      draw();
      animFrameId = requestAnimationFrame(gameLoop);
      return;
    }

    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      b.x += b.vx * delta;
      b.y += b.vy * delta;

      if (b.x - BALL_R < 0) { 
        b.x = BALL_R; 
        b.vx = Math.abs(b.vx); 
        soundWallHit();
      }
      if (b.x + BALL_R > STAGE_W) { 
        b.x = STAGE_W - BALL_R; 
        b.vx = -Math.abs(b.vx); 
        soundWallHit();
      }
      if (b.y - BALL_R < 0) { 
        b.y = BALL_R; 
        b.vy = Math.abs(b.vy); 
        soundWallHit();
      }

      const py = STAGE_H - 14;
      if (b.vy > 0 && b.y + BALL_R >= py && b.y + BALL_R <= py + 10 &&
          b.x >= paddle.x - BALL_R && b.x <= paddle.x + paddleWidth + BALL_R) {
        b.y = py - BALL_R;
        soundPaddleHit();
        let hit = (b.x - (paddle.x + paddleWidth / 2)) / (paddleWidth / 2);
        hit = Math.max(-0.85, Math.min(0.85, hit));
        const angle = hit * 0.7;
        const speed = getCurrentBallSpeed();
        b.vx = Math.sin(angle) * speed;
        b.vy = -Math.cos(angle) * speed;
        comboCount = 0;
      }

      for (const br of bricks) {
        if (!br.alive) continue;
        if (b.x + BALL_R > br.x && b.x - BALL_R < br.x + br.w &&
            b.y + BALL_R > br.y && b.y - BALL_R < br.y + br.h) {

          const overlapX = Math.min(b.x + BALL_R - br.x, br.x + br.w - (b.x - BALL_R));
          const overlapY = Math.min(b.y + BALL_R - br.y, br.y + br.h - (b.y - BALL_R));
          if (overlapX < overlapY) {
            if (b.x < br.x + br.w / 2) b.x = br.x - BALL_R;
            else b.x = br.x + br.w + BALL_R;
            b.vx = -b.vx;
          } else {
            if (b.y < br.y + br.h / 2) b.y = br.y - BALL_R;
            else b.y = br.y + br.h + BALL_R;
            b.vy = -b.vy;
          }

          const damage = ballDurability;
          br.hits -= damage;
          soundBrick(); // sonido de impacto general
          if (br.hits <= 0) {
            br.alive = false;
            br.el.classList.add('gone');
            if (br.isGolden && goldenBrickRef === br) goldenBrickRef = null;
            comboCount++;
            const comboMult = 1 + Math.min(comboCount * COMBO_BONUS_PER_HIT, COMBO_BONUS_CAP);
            const basePoints = br.isGolden ? br.playerPoints * 3 : br.playerPoints;
            playerScore += Math.round(basePoints * comboMult);
            gamePoints -= br.value;
            ladrillosRotos++;
            
            // Sonido de destrucción según material
            switch (br.type) {
              case BRICK_TYPES.CLAY: soundClay(); break;
              case BRICK_TYPES.WOOD: soundWood(); break;
              case BRICK_TYPES.IRON: soundIron(); break;
            }
            
            if (uiCounter % 2 === 0) updateUI();
            spawnPowerup(br);
            if (gamePoints <= REGEN_THRESHOLD) requestRegeneration();
          } else {
            updateBrickCrack(br);
          }
          break;
        }
      }

      if (b.y - BALL_R > STAGE_H) {
        balls.splice(i, 1);
        soundLose();
        if (balls.length === 0) {
          loseLife();
          if (lives <= 0) {
            draw();
            animFrameId = requestAnimationFrame(gameLoop);
            return;
          }
        }
      }
    }

    for (let i = powerups.length - 1; i >= 0; i--) {
      const pu = powerups[i];
      pu.y += pu.vy * delta;

      const px = paddle.x;
      const py2 = STAGE_H - 14 - PADDLE_H / 2;
      if (pu.y + pu.size / 2 > py2 - PADDLE_H / 2 &&
          pu.y - pu.size / 2 < py2 + PADDLE_H / 2 &&
          pu.x + pu.size / 2 > px &&
          pu.x - pu.size / 2 < px + paddleWidth) {
        if (pu.isBlue) {
          applyBlueBall();
        } else {
          // Sonido al recoger power-up (solo aquí)
          if (pu.color === 'verde') {
            soundPowerupGood();
          } else {
            soundPowerupBad();
          }
          applyPowerup(pu);
        }
        pu.el.remove();
        powerups.splice(i, 1);
        powerupsInAir--;
        soundTap();
        updateDurabilityVisual();
        draw();
        continue;
      }

      if (pu.y - pu.size / 2 > STAGE_H) {
        pu.el.remove();
        powerups.splice(i, 1);
        powerupsInAir--;
        if (pu.isBlue) blueBallActive = false;
        else activePowerupTypes.delete(pu.type);
        continue;
      }

      pu.el.style.left = pu.x + 'px';
      pu.el.style.top = pu.y + 'px';
    }

    checkGoldenExpiry();
    if (pendingRegeneration) checkAndRegenerate();

    draw();
    animFrameId = requestAnimationFrame(gameLoop);
  }

  function applyPowerup(pu) {
    const type = pu.type;
    switch (type) {
      case 'PALA_GRANDE':
        if (paddleSizeMultiplier < 1) paddleSizeMultiplier = 1;
        paddleSizeMultiplier = 1.35;
        break;
      case 'PALA_MINI':
        if (paddleSizeMultiplier > 1) paddleSizeMultiplier = 1;
        paddleSizeMultiplier = 0.65;
        break;
      case 'MULTIBOLA': {
        const count = balls.length;
        if (count >= 1 && count <= 3) {
          const newCount = Math.min(9, count * 3);
          const extra = newCount - count;
          for (let i = 0; i < extra; i++) {
            const src = balls[Math.floor(Math.random() * balls.length)];
            const angle = (Math.random() - 0.5) * 1.2;
            const speed = Math.sqrt(src.vx * src.vx + src.vy * src.vy) || BALL_SPEED;
            const vx = Math.sin(angle) * speed;
            const vy = -Math.cos(angle) * speed;
            balls.push({ x: src.x + (Math.random() - 0.5) * 10, y: src.y + (Math.random() - 0.5) * 10, vx: vx, vy: vy });
          }
        }
        break;
      }
      case 'DUREZA':
        if (ballDurability < 3) ballDurability++;
        updateDurabilityVisual();
        break;
      case 'FLAQUESA':
        if (ballDurability > 1) ballDurability--;
        updateDurabilityVisual();
        break;
      case 'BOLA_NIEBLA':
        if (nieblaLevel < MAX_NIEBLA) nieblaLevel++;
        updateNiebla();
        break;
    }
    activePowerupTypes.delete(type);
    draw();
  }

  function openGame() {
    cleanGameState();
    overlay.classList.add('open');
    gameIsOpen = true;
    showMenu(false);
    layoutStage();
    updateUI();
    updateDurabilityVisual();
    livesEl.style.display = 'none';
    scoreEl.style.display = 'none';
    pauseBtn.style.display = 'none';
    menuBtn.style.display = 'none';
    running = false;
    gameOver = false;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    draw();
  }

  function closeGame() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    running = false;
    paused = false;
    gameOver = false;
    gameTimeActive = false;
    pauseBtn.textContent = '⏸️';
    overlay.classList.remove('open');
    cleanGameState();
    gameIsOpen = false;
    soundClose();
    console.log('🧹 Juego cerrado y limpiado');
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

  // ========== EVENTOS ==========
  stage.addEventListener('mousedown', (e) => {
    if (e.target.closest('#game-menu')) return;
    if (!running || paused || gameOver) return;
    const rect = stage.getBoundingClientRect();
    const localX = (e.clientX - rect.left) / scale;
    mouseX = Math.min(Math.max(localX - paddleWidth / 2, 0), STAGE_W - paddleWidth);
    mouseActive = true;
    if (!launched) launchBall();
  });

  document.addEventListener('mousemove', (e) => {
    if (!running || !mouseActive || paused || gameOver) return;
    const rect = stage.getBoundingClientRect();
    const localX = (e.clientX - rect.left) / scale;
    mouseX = Math.min(Math.max(localX - paddleWidth / 2, 0), STAGE_W - paddleWidth);
  });
  document.addEventListener('mouseup', () => { mouseActive = false; });

  stage.addEventListener('click', (e) => {
    if (e.target.closest('#game-menu')) return;
    if (running && !launched && !paused && !gameOver) launchBall();
  });

  document.addEventListener('keydown', (e) => {
    if (!running || paused || gameOver) return;
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') { keys.left = true; e.preventDefault(); }
    else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') { keys.right = true; e.preventDefault(); }
  });
  document.addEventListener('keyup', (e) => {
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') { keys.left = false; e.preventDefault(); }
    else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') { keys.right = false; e.preventDefault(); }
  });

  stage.addEventListener('touchstart', (e) => {
    if (e.target.closest('#game-menu')) return;
    if (!running || paused || gameOver) return;
    const touch = e.touches[0];
    if (touch) {
      const rect = stage.getBoundingClientRect();
      const localX = (touch.clientX - rect.left) / scale;
      touchX = Math.min(Math.max(localX - paddleWidth / 2, 0), STAGE_W - paddleWidth);
      touchActive = true;
      if (!launched) launchBall();
    }
  }, { passive: true });
  stage.addEventListener('touchmove', (e) => {
    if (!running || paused || gameOver) return;
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) {
      const rect = stage.getBoundingClientRect();
      const localX = (touch.clientX - rect.left) / scale;
      touchX = Math.min(Math.max(localX - paddleWidth / 2, 0), STAGE_W - paddleWidth);
      touchActive = true;
    }
  }, { passive: false });
  stage.addEventListener('touchend', () => { touchActive = false; }, { passive: true });
  stage.addEventListener('touchcancel', () => { touchActive = false; }, { passive: true });

  window.addEventListener('resize', () => { layoutStage(); draw(); });
  layoutStage();
  console.log('✅ Juego inicializado con sonidos y mejoras');
}
