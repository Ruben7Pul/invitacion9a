// ============================================================
// juego.js – VERSIÓN FINAL CON TODAS LAS CORRECCIONES
// ============================================================
console.log('📦 juego.js (final corregido)');

import { 
  soundBrick, 
  soundLose, 
  soundGameOver,
  soundExtraLife,
  soundPowerupGood,
  soundPowerupBad
} from './sonidos.js';

// ========== CONSTANTES ==========
const MAX_DELTA = 0.03;
const PADDLE_W_BASE = 72;
const PADDLE_H = 12;
const BALL_R = 6;
const STAGE_W = 300;
const STAGE_H = 420;
const TOP_OFFSET = 30;
const BALL_SPEED = 264;
const PADDLE_SPEED = 300;
const BRICK_ROWS = 4;   // 4 filas x 6 columnas = 24 ladrillos
const BRICK_COLS = 6;
const TARGET_GAME_POINTS = 18;
const REGEN_THRESHOLD = 9;
const BALL_LOW_Y = STAGE_H - 60;
const MAX_NIEBLA = 3;
const NIEBLA_HEIGHTS = [0, Math.round(170 * 1.15), Math.round(STAGE_H * 0.60), Math.round(STAGE_H * 0.90)];
const NIEBLA_FEATHER = 26;
const MAX_LIVES = 3;
const SCORE_PER_LIFE = 10000;
const TOP_SCORES_COUNT = 3;

// ========== TIPOS DE LADRILLOS ==========
const BRICK_TYPES = {
  CLAY:   { value: 1, playerPoints: 100, hits: 1, color: '#d9534f' },
  WOOD:   { value: 2, playerPoints: 200, hits: 2, color: '#8b5a2b' },
  IRON:   { value: 3, playerPoints: 300, hits: 3, color: '#7a8a9a' }
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

// ========== PATRONES ==========
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

// ========== LADRILLO ESPECIAL (reemplaza al dorado) ==========
const SPECIAL_BRICK_CHANCE = 0.08;      // misma probabilidad que antes
const SPECIAL_BRICK_DURATION_MS = 7000; // 7 segundos

// ========== PROBABILIDAD POWER-UP VERDE ==========
const GREEN_PROB_TABLE = [
  75.000, 70.3125, 65.625, 60.9375, 56.250, 51.5625, 46.875, 42.1875,
  37.500, 32.8125, 28.125, 23.4375, 18.750, 14.0625, 9.375, 4.6875, 0.000
];

const GREEN_WEIGHTS = { MULTIBOLA: 15, PALA_GRANDE: 35, DUREZA: 50 };
const RED_WEIGHTS   = { BOLA_NIEBLA: 10, PALA_MINI: 35, FLAQUESA: 55 };

const POWERUP_SYMBOLS = {
  MULTIBOLA: 'x3',
  PALA_GRANDE: '<>',
  DUREZA: '↑',
  BOLA_NIEBLA: '🌫️',
  PALA_MINI: '><',
  FLAQUESA: '↓'
};

// ========== PUNTUACIONES (TOP 3) ==========
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
  console.log('🎮 Iniciando juego (Canvas corregido)');

  // ========== ELEMENTOS ==========
  const stage = document.getElementById('game-stage');
  const inner = document.getElementById('game-inner');
  
  const canvas = document.createElement('canvas');
  canvas.width = STAGE_W;
  canvas.height = STAGE_H;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  canvas.style.imageRendering = 'pixelated';
  
  if (inner) {
    inner.innerHTML = '';
    inner.appendChild(canvas);
  } else {
    stage.innerHTML = '';
    stage.appendChild(canvas);
  }
  const ctx = canvas.getContext('2d');

  const livesEl = document.getElementById('lives');
  const scoreEl = document.getElementById('game-score');
  const pauseBtn = document.getElementById('pause-btn');
  const menuEl = document.getElementById('game-menu');
  const menuGameover = document.getElementById('menu-gameover');
  const gameoverScore = document.getElementById('gameover-score');
  const gameoverThemeMsg = document.getElementById('gameover-theme-msg');
  const gameoverInputContainer = document.getElementById('gameover-input-container');
  const playerNameInput = document.getElementById('player-name-input');
  const gameoverSave = document.getElementById('gameover-save');
  const gameoverMenuBtn = document.getElementById('gameover-menu-btn');
  const nameError = document.getElementById('name-error');

  // Estilos UI
  livesEl.style.fontFamily = "'Press Start 2P', monospace";
  livesEl.style.fontSize = '1.2rem';
  livesEl.style.letterSpacing = '0.1em';
  scoreEl.style.fontFamily = "'Press Start 2P', monospace";
  scoreEl.style.fontSize = '0.9rem';
  scoreEl.style.background = 'linear-gradient(90deg, #ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #8800ff)';
  scoreEl.style.backgroundSize = '300% 100%';
  scoreEl.style.animation = 'rainbowScore 3s linear infinite';
  scoreEl.style.webkitBackgroundClip = 'text';
  scoreEl.style.backgroundClip = 'text';
  scoreEl.style.color = 'transparent';

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
  let specialBrickRef = null;      // reemplaza a goldenBrickRef
  let lastScoreMilestone = 0;
  let blueBallActive = false;
  let ballDurability = 1;
  let paddleSizeMultiplier = 1;
  let paddleWidth = PADDLE_W_BASE;
  let nieblaLevel = 0;
  let prevNieblaLevel = 0;

  let difficultyTime = 0;
  let lastDifficultyUpdate = 0;
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

  // Imágenes para grietas
  const crackImages = {};
  let imagesLoaded = 0;
  const totalImages = 2;

  function loadCrackImages(callback) {
    const names = ['griet1.png', 'griet2.png'];
    names.forEach(name => {
      const img = new Image();
      img.onload = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) callback();
      };
      img.onerror = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) callback();
      };
      img.src = `../archivos/${name}`;
      crackImages[name] = img;
    });
  }

  // ========== MODAL DE PAUSA ==========
  let pauseModal = null;
  let pauseModalOverlay = null;

  function createPauseModal() {
    if (document.querySelector('.pause-modal-overlay')) return;
    const overlayEl = document.createElement('div');
    overlayEl.className = 'pause-modal-overlay';
    overlayEl.id = 'pause-modal-overlay';
    const card = document.createElement('div');
    card.className = 'pause-modal-card';
    card.innerHTML = `
      <h2>⏸ Pausa</h2>
      <div class="pause-ranking" id="pause-ranking">
        <div style="text-align:center; margin-bottom:0.5rem; font-size:0.8rem; color:#d4af37;">🏆 MEJORES PUNTUACIONES</div>
        <div id="pause-rank-list"></div>
      </div>
      <div class="pause-buttons">
        <button class="game-btn" id="pause-resume-btn">▶ Reanudar</button>
        <button class="game-btn mute-btn pause-mute-btn" id="pause-mute-btn">🔊 Silenciar</button>
        <button class="game-btn exit-btn" id="pause-exit-btn">🚪 Salir</button>
      </div>
    `;
    overlayEl.appendChild(card);
    const stageEl = document.getElementById('game-stage');
    if (stageEl) stageEl.appendChild(overlayEl);
    pauseModalOverlay = overlayEl;
    pauseModal = card;

    document.getElementById('pause-resume-btn').addEventListener('click', (e) => {
      e.stopPropagation(); // 🔥 Evita que el clic se propague al stage
      closePauseModal();
    });
    document.getElementById('pause-mute-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.toggleMusic) window.toggleMusic();
      const btn = document.getElementById('pause-mute-btn');
      if (btn) {
        if (window.isMusicMuted && window.isMusicMuted()) {
          btn.innerHTML = '🔇 Silenciado';
        } else {
          btn.innerHTML = '🔊 Silenciar';
        }
      }
    });
    document.getElementById('pause-exit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      closePauseModal();
      if (animFrameId) cancelAnimationFrame(animFrameId);
      running = false;
      gameOver = true;
      window.location.href = '../index.html?volver=1';
    });
  }

  function openPauseModal() {
    if (!pauseModalOverlay) createPauseModal();
    updatePauseModal();
    const muteBtn = document.getElementById('pause-mute-btn');
    if (muteBtn) {
      if (window.isMusicMuted && window.isMusicMuted()) {
        muteBtn.innerHTML = '🔇 Silenciado';
      } else {
        muteBtn.innerHTML = '🔊 Silenciar';
      }
    }
    pauseModalOverlay.classList.add('open');
    if (!paused) {
      paused = true;
      pauseBtn.textContent = '▶️';
      gameTimeActive = false;
    }
  }

  function closePauseModal() {
    if (pauseModalOverlay) pauseModalOverlay.classList.remove('open');
    if (paused) {
      paused = false;
      pauseBtn.textContent = '⏸️';
      if (launched) {
        gameTimeActive = true;
        lastDifficultyUpdate = performance.now();
      }
      lastTime = 0;
    }
  }

  function updatePauseModal() {
    const rankList = document.getElementById('pause-rank-list');
    if (rankList) {
      const scores = getHighScores();
      const displayScores = [];
      for (let i = 0; i < 3; i++) {
        if (i < scores.length) {
          displayScores.push(scores[i]);
        } else {
          displayScores.push({ name: '--', score: '--' });
        }
      }
      rankList.innerHTML = '';
      displayScores.forEach((s, i) => {
        const div = document.createElement('div');
        div.className = 'rank-item';
        div.innerHTML = `
          <span><span class="pos">#${i+1}</span> ${s.name}</span>
          <span>${s.score} pts</span>
        `;
        rankList.appendChild(div);
      });
    }
  }

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

      const brick = {
        x, y, w: brickW, h: brickH,
        alive: true,
        hits: type.hits,
        maxHits: type.hits,
        value: type.value,
        playerPoints: type.playerPoints,
        cell: cell,
        type: type,
        originalType: type,
        originalHits: type.hits,
        isSpecial: false,
        specialExpiresAt: 0
      };
      bricks.push(brick);
      gamePoints += type.value;
    }
  }

  function requestRegeneration() {
    if (pendingRegeneration) return;
    if (getFreeCells().size === 0) return;
    pendingRegeneration = true;
  }

  // ===== LADRILLO ESPECIAL (reemplaza al dorado) =====
  function maybeSpawnSpecialBrick(fromIndex) {
    if (specialBrickRef && specialBrickRef.alive) return;
    if (Math.random() >= SPECIAL_BRICK_CHANCE) return;
    const recent = bricks.slice(fromIndex);
    if (recent.length === 0) return;
    const chosen = recent[Math.floor(Math.random() * recent.length)];
    chosen.isSpecial = true;
    chosen.specialExpiresAt = performance.now() + SPECIAL_BRICK_DURATION_MS;
    specialBrickRef = chosen;
    // Lo marcamos visualmente más adelante en draw()
  }

  function checkSpecialExpiry() {
    if (!specialBrickRef) return;
    if (!specialBrickRef.alive) { specialBrickRef = null; return; }
    if (performance.now() >= specialBrickRef.specialExpiresAt) {
      specialBrickRef.isSpecial = false;
      specialBrickRef = null;
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
      maybeSpawnSpecialBrick(before);
      pendingRegeneration = false;
      return;
    }
    if (launched && balls.some(b => b.y < BALL_LOW_Y)) {
      const values = generateBrickValues();
      const before = bricks.length;
      placeBricks(values, undefined, preferredCells);
      maybeSpawnSpecialBrick(before);
      pendingRegeneration = false;
    }
  }

  // ========== DIFICULTAD ==========
  function getElapsedMinutes() {
    if (!gameTimeActive || !launched) return 0;
    return difficultyTime / 60;
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
    // ❌ Eliminado el límite de 36 ladrillos rotos
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

    const minutes = getElapsedMinutes();
    const greenProb = getGreenProbability(minutes);
    const color = Math.random() * 100 < greenProb ? 'verde' : 'rojo';
    let typeKey = selectPowerupByColor(color);
    const alternative = getAlternativeType(color, typeKey);
    if (alternative === null) return;
    typeKey = alternative;

    activePowerupTypes.add(typeKey);
    powerupsInAir++;
    lastPowerupTime = now;

    const isGreen = color === 'verde';
    const size = isGreen ? 24 : 36;
    const speed = isGreen ? 120 : 40;

    const cx = brick.x + brick.w / 2;
    const cy = brick.y + brick.h / 2;

    powerups.push({
      x: cx, y: cy, vx: 0, vy: speed,
      size: size, color: color, type: typeKey,
      alive: true, isBlue: false
    });
  }

  function spawnBlueBall() {
    if (blueBallActive) return;
    blueBallActive = true;
    const size = 22;
    const speed = 60;
    const x = Math.random() * (STAGE_W - size) + size/2;
    const y = 10;

    powerups.push({
      x: x, y: y, vy: speed, size: size,
      type: 'BOLA_AZUL', alive: true, isBlue: true
    });
    powerupsInAir++;
  }

  function applyBlueBall() {
    playerScore += 2000;
    soundPowerupGood();
    showFloatingMessage('+2000', '#ffd700', 1500);
    nieblaLevel = 0;
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
          break;
      }
    }
    updateUI();
    blueBallActive = false;
  }

  // Mensajes flotantes
  let floatingMessages = [];

  function showFloatingMessage(text, color = '#fff', duration = 1500) {
    const start = performance.now();
    floatingMessages.push({ text, color, start, duration });
  }

  function drawFloatingMessages(ctx2) {
    const now = performance.now();
    for (let i = floatingMessages.length - 1; i >= 0; i--) {
      const msg = floatingMessages[i];
      const elapsed = now - msg.start;
      if (elapsed > msg.duration) {
        floatingMessages.splice(i, 1);
        continue;
      }
      const progress = elapsed / msg.duration;
      const alpha = progress < 0.2 ? progress / 0.2 : (progress > 0.8 ? 1 - (progress - 0.8) / 0.2 : 1);
      const yOffset = -progress * 40;
      ctx2.save();
      ctx2.globalAlpha = alpha;
      ctx2.textAlign = 'center';
      ctx2.textBaseline = 'middle';
      ctx2.font = 'bold 20px "Press Start 2P", monospace';
      const w = ctx2.measureText(msg.text).width + 40;
      const h = 40;
      const x = STAGE_W/2;
      const y = STAGE_H/2 + yOffset;
      ctx2.shadowColor = 'rgba(0,0,0,0.8)';
      ctx2.shadowBlur = 15;
      ctx2.fillStyle = 'rgba(0,0,0,0.5)';
      if (ctx2.roundRect) {
        ctx2.beginPath();
        ctx2.roundRect(x - w/2, y - h/2, w, h, 20);
        ctx2.fill();
      } else {
        ctx2.fillRect(x - w/2, y - h/2, w, h);
      }
      ctx2.shadowBlur = 0;
      ctx2.fillStyle = msg.color;
      ctx2.shadowColor = msg.color;
      ctx2.shadowBlur = 10;
      ctx2.fillText(msg.text, x, y);
      ctx2.restore();
    }
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
    if (!gameTimeActive) {
      gameTimeActive = true;
      lastDifficultyUpdate = performance.now();
    }
  }

  function cleanGameState() {
    bricks = [];
    balls = [];
    powerups = [];
    activePowerupTypes.clear();
    powerupsInAir = 0;
    floatingMessages = [];
    paddle.x = (STAGE_W - PADDLE_W_BASE) / 2;
    paddleSizeMultiplier = 1;
    paddleWidth = PADDLE_W_BASE;
    ballDurability = 1;
    nieblaLevel = 0;
    prevNieblaLevel = 0;
    lives = 3;
    playerScore = 0;
    gamePoints = 0;
    pendingRegeneration = false;
    ladrillosRotos = 0;
    lastPowerupTime = 0;
    pendingBlueBall = false;
    comboCount = 0;
    specialBrickRef = null;
    lastScoreMilestone = 0;
    blueBallActive = false;
    launched = false;
    running = false;
    gameOver = false;
    paused = false;
    pauseBtn.textContent = '⏸️';
    gameTimeActive = false;
    difficultyTime = 0;
    livesEl.style.display = 'block';
    scoreEl.style.display = 'block';
    lastTime = 0;
    updateUI();
  }

  function resetGameState() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    running = false;
    launched = false;
    paused = false;
    gameOver = false;
    pauseBtn.textContent = '⏸️';
    gameTimeActive = false;
    difficultyTime = 0;
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
    lives = 3;
    playerScore = 0;
    gamePoints = 0;
    pendingRegeneration = false;
    ladrillosRotos = 0;
    lastPowerupTime = 0;
    pendingBlueBall = false;
    comboCount = 0;
    specialBrickRef = null;
    lastScoreMilestone = 0;
    blueBallActive = false;
    keys.left = keys.right = false;
    touchActive = false;
    touchX = 0;
    mouseActive = false;
    mouseX = 0;
    lastTime = 0;
    floatingMessages = [];

    const initialX = paddle.x + paddleWidth / 2;
    const initialY = STAGE_H - 14 - BALL_R;
    balls.push({ x: initialX, y: initialY, vx: 0, vy: 0 });

    launched = false;
    updateUI();
  }

  // UI optimizada
  let lastLivesString = '';
  let lastScoreValue = -1;

  function updateLivesUI() {
    let heartsHtml = '';
    for (let i = 0; i < lives; i++) {
      heartsHtml += `<span class="heart-icon" style="color:#ff0000; text-shadow:0 0 10px #ff0000;">♥</span>`;
    }
    const newStr = heartsHtml || '—';
    if (newStr !== lastLivesString) {
      livesEl.innerHTML = newStr;
      lastLivesString = newStr;
    }
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
    powerups = [];
    activePowerupTypes.clear();
    powerupsInAir = 0;
    paddleSizeMultiplier = 1;
    paddleWidth = PADDLE_W_BASE;
    ballDurability = 1;
    nieblaLevel = 0;
    prevNieblaLevel = 0;
    updateUI();

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
      gameTimeActive = false;
      powerups = [];
      activePowerupTypes.clear();
      powerupsInAir = 0;
      updateUI();
    }, 300);
  }

  // ========== GAME OVER ==========
  function endGame() {
    running = false;
    gameOver = true;
    gameTimeActive = false;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    soundGameOver();
    if (menuGameover) {
      gameoverScore.textContent = `Puntuación: ${playerScore}`;
      if (gameoverThemeMsg) gameoverThemeMsg.textContent = getThemeMessage(playerScore);
      const isTop = isHighScore(playerScore) && playerScore > 0;
      if (isTop) {
        pendingHighScore = true;
        gameoverInputContainer.style.display = 'block';
        const label = gameoverInputContainer.querySelector('p');
        if (label) label.textContent = '¡Top 3!';
        playerNameInput.value = '';
        playerNameInput.focus();
        gameoverMenuBtn.style.display = 'none';
        nameError.style.display = 'none';
      } else {
        pendingHighScore = false;
        gameoverInputContainer.style.display = 'none';
        gameoverMenuBtn.style.display = 'block';
        gameoverMenuBtn.textContent = '🔄 Nueva partida';
        gameoverMenuBtn.style.marginLeft = 'auto';
        gameoverMenuBtn.style.marginRight = 'auto';
        gameoverMenuBtn.style.display = 'block';
        gameoverMenuBtn.onclick = () => {
          menuEl.style.display = 'none';
          cleanGameState();
          startGame();
        };
      }
      menuEl.style.display = 'flex';
      menuGameover.style.display = 'block';
    }
    livesEl.style.display = 'none';
    scoreEl.style.display = 'none';
    pauseBtn.style.display = 'none';
  }

  // ========== INICIO DE PARTIDA ==========
  function startGame() {
    resetGameState();
    gameTimeActive = false;
    difficultyTime = 0;
    lastDifficultyUpdate = performance.now();

    const clayValues = new Array(BRICK_ROWS * BRICK_COLS).fill(1);
    bricks = [];
    gamePoints = 0;
    placeBricks(clayValues);

    paddle.x = (STAGE_W - paddleWidth) / 2;
    launched = false;
    const newX = paddle.x + paddleWidth / 2;
    const newY = STAGE_H - 14 - BALL_R;
    balls = [{ x: newX, y: newY, vx: 0, vy: 0 }];

    running = true;
    gameOver = false;
    layoutStage();
    livesEl.style.display = 'block';
    scoreEl.style.display = 'block';
    pauseBtn.style.display = 'block';
    updateUI();
    lastTime = 0;
    uiCounter = 0;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(gameLoop);
  }

  function updateUI() {
    updateLivesUI();
    if (playerScore !== lastScoreValue) {
      scoreEl.textContent = `${playerScore}`;
      lastScoreValue = playerScore;
    }

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

  // ========== RENDERIZADO CON CANVAS ==========
  function draw() {
    ctx.clearRect(0, 0, STAGE_W, STAGE_H);

    // ---- Fondo ----
    if (!draw.bgImage) {
      draw.bgImage = new Image();
      draw.bgImage.src = '../archivos/jueg1.png';
    }
    const bg = draw.bgImage;
    if (bg.complete && bg.naturalWidth > 0) {
      const imgAspect = bg.naturalWidth / bg.naturalHeight;
      const canvasAspect = STAGE_W / STAGE_H;
      let drawW, drawH, dx, dy;
      if (imgAspect > canvasAspect) {
        drawH = STAGE_H;
        drawW = STAGE_H * imgAspect;
        dx = (STAGE_W - drawW) / 2;
        dy = 0;
      } else {
        drawW = STAGE_W;
        drawH = STAGE_W / imgAspect;
        dx = 0;
        dy = (STAGE_H - drawH) / 2;
      }
      ctx.drawImage(bg, dx, dy, drawW, drawH);
    } else {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    }

    // ---- Ladrillos (con brillo y bordes redondeados) ----
    for (const br of bricks) {
      if (!br.alive) continue;
      const x = br.x, y = br.y, w = br.w, h = br.h;
      const radius = 4;
      let color = br.type.color;
      // Si es especial, usamos un color dorado brillante
      if (br.isSpecial) color = '#ffd700';
      
      // Degradado con brillo
      const grad = ctx.createLinearGradient(x, y, x + w, y + h);
      const lighter = adjustColor(color, 30);
      const darker = adjustColor(color, -20);
      grad.addColorStop(0, lighter);
      grad.addColorStop(0.5, color);
      grad.addColorStop(1, darker);
      
      ctx.shadowColor = br.isSpecial ? 'rgba(255,215,0,0.9)' : 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = br.isSpecial ? 25 : 6;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Borde: más brillante si es especial
      ctx.strokeStyle = br.isSpecial ? '#fff8dc' : 'rgba(0,0,0,0.25)';
      ctx.lineWidth = br.isSpecial ? 2 : 1;
      ctx.shadowColor = br.isSpecial ? 'rgba(255,215,0,0.6)' : 'transparent';
      ctx.shadowBlur = br.isSpecial ? 15 : 0;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Grietas (sin números)
      const crackSrc = getCrackImageSrc(br);
      if (crackSrc) {
        const img = crackImages[crackSrc.split('/').pop()];
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, x + w*0.1, y + h*0.1, w*0.8, h*0.8);
        }
      }
      // Ya no dibujamos números
    }

    // ---- Niebla (opaca, dibujada ANTES de bolas y power-ups) ----
    const boundary = NIEBLA_HEIGHTS[nieblaLevel] || 0;
    if (boundary > 0) {
      // Gradiente opaco (sin transparencia)
      const gradNiebla = ctx.createLinearGradient(0, 0, 0, boundary);
      gradNiebla.addColorStop(0, '#e8edf5');
      gradNiebla.addColorStop(0.7, '#d5dde8');
      gradNiebla.addColorStop(1, '#c5d0df');
      ctx.fillStyle = gradNiebla;
      ctx.fillRect(0, 0, STAGE_W, boundary);
      // Pluma inferior para difuminar
      const feather = NIEBLA_FEATHER;
      const gradFeather = ctx.createLinearGradient(0, boundary - feather, 0, boundary);
      gradFeather.addColorStop(0, 'rgba(255,255,255,0)');
      gradFeather.addColorStop(1, 'rgba(255,255,255,0.4)');
      ctx.fillStyle = gradFeather;
      ctx.fillRect(0, boundary - feather, STAGE_W, feather);
    }

    // ---- Power-ups (incluida la estrella, siempre encima de la niebla) ----
    for (const pu of powerups) {
      const x = pu.x, y = pu.y, size = pu.size;
      const isGreen = pu.color === 'verde';
      const isBlue = pu.isBlue;
      let color;
      if (isBlue) color = '#ffd700';
      else color = isGreen ? 'rgba(46, 204, 113, 0.7)' : 'rgba(231, 76, 60, 0.7)';
      ctx.beginPath();
      ctx.arc(x, y, size/2, 0, Math.PI*2);
      ctx.fillStyle = color;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = isBlue ? '#fff8dc' : (isGreen ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,0,0.8)');
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = `${size * 0.5}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;
      let symbol = isBlue ? '★' : POWERUP_SYMBOLS[pu.type] || '?';
      ctx.fillText(symbol, x, y);
      ctx.shadowBlur = 0;
    }

    // ---- Bolas ----
    for (const b of balls) {
      const x = b.x, y = b.y;
      let grad;
      switch (ballDurability) {
        case 1: // gris metálico
          grad = ctx.createRadialGradient(x-2, y-2, 2, x, y, BALL_R);
          grad.addColorStop(0, '#e0e0e0');
          grad.addColorStop(0.5, '#909090');
          grad.addColorStop(1, '#404040');
          break;
        case 2: // rojo fuego
          grad = ctx.createRadialGradient(x-3, y-3, 2, x, y, BALL_R+2);
          grad.addColorStop(0, '#fff5b0');
          grad.addColorStop(0.3, '#ff8800');
          grad.addColorStop(0.7, '#ff2200');
          grad.addColorStop(1, '#880000');
          ctx.shadowColor = '#ff4400';
          ctx.shadowBlur = 20;
          break;
        case 3: // azul plasma
          grad = ctx.createRadialGradient(x-3, y-3, 2, x, y, BALL_R+2);
          grad.addColorStop(0, '#c8ffff');
          grad.addColorStop(0.3, '#00aaff');
          grad.addColorStop(0.7, '#0044ff');
          grad.addColorStop(1, '#000088');
          ctx.shadowColor = '#00aaff';
          ctx.shadowBlur = 25;
          break;
      }
      ctx.beginPath();
      ctx.arc(x, y, BALL_R, 0, Math.PI*2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.shadowBlur = 0;
      if (ballDurability >= 2) {
        ctx.beginPath();
        ctx.arc(x-2, y-3, 2, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fill();
      }
    }

    // ---- Paleta (encima de todo) ----
    const px = paddle.x, py = STAGE_H - 14;
    const pw = paddleWidth, ph = PADDLE_H;
    const radiusP = 8;
    ctx.shadowColor = 'rgba(212,175,55,0.3)';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, radiusP);
    ctx.fillStyle = '#111';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, radiusP);
    ctx.stroke();

    // ---- Mensajes flotantes (al final) ----
    drawFloatingMessages(ctx);
  }

  // ========== BUCLE PRINCIPAL ==========
  function gameLoop(timestamp) {
    if (!running) {
      draw();
      animFrameId = requestAnimationFrame(gameLoop);
      return;
    }
    if (paused) {
      draw();
      animFrameId = requestAnimationFrame(gameLoop);
      return;
    }

    if (gameTimeActive && launched) {
      const now = performance.now();
      if (lastDifficultyUpdate === 0) lastDifficultyUpdate = now;
      difficultyTime += (now - lastDifficultyUpdate) / 1000;
      lastDifficultyUpdate = now;
    } else {
      lastDifficultyUpdate = performance.now();
    }

    const delta = lastTime ? Math.min((timestamp - lastTime) / 1000, MAX_DELTA) : 0.016;
    lastTime = timestamp;

    uiCounter++;
    if (uiCounter % 2 === 0) updateUI();

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

    // ---- Actualizar bolas ----
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      b.x += b.vx * delta;
      b.y += b.vy * delta;

      if (b.x - BALL_R < 0) { b.x = BALL_R; b.vx = Math.abs(b.vx); }
      if (b.x + BALL_R > STAGE_W) { b.x = STAGE_W - BALL_R; b.vx = -Math.abs(b.vx); }
      if (b.y - BALL_R < 0) { b.y = BALL_R; b.vy = Math.abs(b.vy); }

      const py = STAGE_H - 14;
      if (b.vy > 0 && b.y + BALL_R >= py && b.y + BALL_R <= py + 10 &&
          b.x >= paddle.x - BALL_R && b.x <= paddle.x + paddleWidth + BALL_R) {
        b.y = py - BALL_R;
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
          if (br.hits <= 0) {
            soundBrick();
            br.alive = false;
            if (br.isSpecial && specialBrickRef === br) specialBrickRef = null;
            comboCount++;
            const comboMult = 1 + Math.min(comboCount * COMBO_BONUS_PER_HIT, COMBO_BONUS_CAP);
            // Si es especial, da 500 puntos (sin multiplicar por combo? o sí? lo dejo con combo)
            const basePoints = br.isSpecial ? 500 : br.playerPoints;
            playerScore += Math.round(basePoints * comboMult);
            gamePoints -= br.value;
            ladrillosRotos++;
            if (uiCounter % 2 === 0) updateUI();
            spawnPowerup(br);
            if (gamePoints <= REGEN_THRESHOLD) requestRegeneration();
          }
          break;
        }
      }

      if (b.y - BALL_R > STAGE_H) {
        balls.splice(i, 1);
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

    // ---- Actualizar power-ups ----
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
          if (pu.color === 'verde') soundPowerupGood();
          else soundPowerupBad();
          applyPowerup(pu);
        }
        powerups.splice(i, 1);
        powerupsInAir--;
        continue;
      }

      if (pu.y - pu.size / 2 > STAGE_H) {
        powerups.splice(i, 1);
        powerupsInAir--;
        if (pu.isBlue) blueBallActive = false;
        else activePowerupTypes.delete(pu.type);
        continue;
      }
    }

    checkSpecialExpiry();
    if (pendingRegeneration) checkAndRegenerate();

    draw();
    animFrameId = requestAnimationFrame(gameLoop);
  }

  // ===== NUEVA LÓGICA DE POWER-UPS DE PALA =====
  function applyPowerup(pu) {
    const type = pu.type;
    switch (type) {
      case 'PALA_GRANDE':
        // Si ya es grande, se mantiene; si es mini, vuelve a normal; si es normal, se vuelve grande
        if (paddleSizeMultiplier === 0.65) {
          paddleSizeMultiplier = 1;        // mini + grande = normal
        } else if (paddleSizeMultiplier === 1) {
          paddleSizeMultiplier = 1.35;     // normal + grande = grande
        }
        // si ya es 1.35, se queda igual
        break;
      case 'PALA_MINI':
        if (paddleSizeMultiplier === 1.35) {
          paddleSizeMultiplier = 1;        // grande + mini = normal
        } else if (paddleSizeMultiplier === 1) {
          paddleSizeMultiplier = 0.65;     // normal + mini = mini
        }
        // si ya es 0.65, se queda igual
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
        break;
      case 'FLAQUESA':
        if (ballDurability > 1) ballDurability--;
        break;
      case 'BOLA_NIEBLA':
        if (nieblaLevel < MAX_NIEBLA) nieblaLevel++;
        break;
    }
    activePowerupTypes.delete(type);
    paddleWidth = PADDLE_W_BASE * paddleSizeMultiplier;
  }

  function getThemeMessage(score) {
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
    const tier = Math.min(Math.floor(Math.max(score, 0) / 10000), THEME_MESSAGES.length - 1);
    return THEME_MESSAGES[tier];
  }

  function layoutStage() {
    const availW = Math.min(window.innerWidth * 0.92, 450);
    const availH = Math.min(window.innerHeight * 0.72, 560);
    scale = Math.min(availW / STAGE_W, availH / STAGE_H);
    stage.style.width = (STAGE_W * scale) + 'px';
    stage.style.height = (STAGE_H * scale) + 'px';
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

  // ========== BOTÓN DE PAUSA ==========
  pauseBtn.addEventListener('click', () => {
    if (!running || gameOver) return;
    if (paused) {
      closePauseModal();
    } else {
      openPauseModal();
    }
  });

  function handleSpacePause(e) {
    if (e.key === ' ' || e.key === 'Space') {
      e.preventDefault();
      if (!running || gameOver) return;
      if (!launched) {
        launchBall();
        return;
      }
      if (paused) {
        closePauseModal();
      } else {
        openPauseModal();
      }
    }
  }
  document.addEventListener('keydown', handleSpacePause);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (running && !paused && !gameOver && launched) {
        openPauseModal();
      }
    }
  });

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
    menuEl.style.display = 'none';
    cleanGameState();
    startGame();
  });

  function isValidName(name) {
    return /^[A-Za-záéíóúÁÉÍÓÚñÑ\s]+$/.test(name);
  }

  // ========== INICIO ==========
  loadCrackImages(() => {
    createPauseModal();
    startGame();
    layoutStage();
    console.log('✅ Juego canvas final iniciado correctamente');
  });
}
