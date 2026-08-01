// ============================================================
// juego.js – arcade con sistema de vidas, bolas azules y velocidad progresiva
// ============================================================
console.log('📦 juego.js (arcade final)');

import { soundTap, soundBrick, soundWin, soundLose, soundClose } from './sonidos.js';

// Constantes
const PADDLE_W_BASE = 72;
const PADDLE_H = 10;
const BALL_R = 6;
const STAGE_W = 300;
const STAGE_H = 420;
const TOP_OFFSET = 30;
const BALL_SPEED_BASE = 264;
const PADDLE_SPEED = 300;
const TARGET_GAME_POINTS = 18;
const REGEN_THRESHOLD = 9;
const BALL_LOW_Y = STAGE_H - 60;
const MAX_NIEBLA = 3;
const MAX_LIVES = 3;
const POINTS_PER_LIFE = 15000;

// Tipos de ladrillos (arcilla rojo)
const BRICK_TYPES = {
  CLAY:   { value: 1, playerPoints: 100, hits: 1, color: '#cc3333', label: 'CLAY' },
  WOOD:   { value: 2, playerPoints: 200, hits: 2, color: '#8b5a2b', label: 'WOOD' },
  IRON:   { value: 3, playerPoints: 300, hits: 3, color: '#7a8a9a', label: 'IRON' }
};

const FRACTURE_SYMBOLS = {
  1: '|',
  2: '||',
  3: '|||'
};

// Probabilidades
const GREEN_PROB_TABLE = [
  50.000, 46.875, 43.750, 40.625, 37.500, 34.375, 31.250, 28.125,
  25.000, 21.875, 18.750, 15.625, 12.500, 9.375, 6.250, 3.125, 0.000
];

const GREEN_WEIGHTS = { MULTIBOLA: 15, PALA_GRANDE: 35, DUREZA: 50 };
const RED_WEIGHTS   = { BOLA_NIEBLA: 10, PALA_MINI: 35, FLAQUESA: 55 };

export function initJuego(config) {
  console.log('🎮 Iniciando juego arcade final');

  // Cargar fuente pixelada
  if (!document.querySelector('#pixel-font')) {
    const link = document.createElement('link');
    link.id = 'pixel-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    document.head.appendChild(link);
  }

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

  // Pala neón (sin líneas)
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

  // Estilo arcade para vidas y puntuación
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

  // Elemento para la niebla
  const nieblaEl = document.createElement('div');
  nieblaEl.id = 'niebla-overlay';
  nieblaEl.style.cssText = `
    position: absolute; inset: 0; pointer-events: none;
    background: rgba(20, 30, 50, 0.4); transition: opacity 0.5s;
    opacity: 0; border-radius: 12px; z-index: 20;
  `;
  stage.appendChild(nieblaEl);

  const timeEl = document.getElementById('game-time');
  if (timeEl) timeEl.style.display = 'none';

  restartBtn.style.display = 'none';

  // Variables de estado
  let scale = 1;
  let bricks = [];
  let balls = [];
  let powerups = [];
  let paddle = { x: (STAGE_W - PADDLE_W_BASE) / 2 };
  let lives = 3;
  let running = false;
  let launched = false;
  let animFrameId = null;
  let playerScore = 0;
  let gamePoints = 0;
  let pendingRegeneration = false;
  let nextLifeThreshold = POINTS_PER_LIFE; // próximo umbral para vida extra

  let ballDurability = 1;
  let paddleSizeMultiplier = 1;
  let paddleWidth = PADDLE_W_BASE;
  let nieblaLevel = 0;
  let gameStartTime = 0;

  let mouseActive = false;
  let mouseX = 0;
  const keys = { left: false, right: false };
  let touchActive = false;
  let touchX = 0;

  // Bandera para evitar regeneración simultánea
  let regenerating = false;

  window.closeGame = closeGame;

  // ------------------------------------------------------------
  // Funciones de ladrillos con textura
  // ------------------------------------------------------------
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
    el.style.boxShadow = 'inset 0 -3px 0 rgba(0,0,0,0.3), inset 0 3px 0 rgba(255,255,255,0.2)';
    el.textContent = FRACTURE_SYMBOLS[brick.hits] || '|';
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
    } else {
      return false;
    }
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
    } else {
      return false;
    }
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

  // ------------------------------------------------------------
  // Generación de ladrillos
  // ------------------------------------------------------------
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

  function placeBricks(values, excludeCells = new Set()) {
    const cols = 6, brickW = 38, brickH = 16, gap = 3;
    const totalWidth = cols * (brickW + gap) - gap;
    const startX = (STAGE_W - totalWidth) / 2;
    const startY = TOP_OFFSET;

    const freeCells = getFreeCells(excludeCells);
    if (freeCells.length === 0) return;

    const shuffled = freeCells.sort(() => Math.random() - 0.5);
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
      el.style.textShadow = '0 1px 2px rgba(0,0,0,0.5)';

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
        originalHits: type.hits
      };
      bricks.push(brick);
      gamePoints += type.value;
      updateBrickVisual(brick);
    }
  }

  function requestRegeneration() {
    if (pendingRegeneration || regenerating) return;
    if (getFreeCells().size === 0) return;
    pendingRegeneration = true;
  }

  function checkAndRegenerate() {
    if (!pendingRegeneration || !running || regenerating) return;

    // Si hay más de una bola, regenerar inmediatamente evitando celdas ocupadas
    if (balls.length > 1) {
      regenerating = true;
      const exclude = getCellsWithBalls();
      const values = generateBrickValues();
      placeBricks(values, exclude);
      pendingRegeneration = false;
      regenerating = false;
      return;
    }

    // Si solo hay una bola, esperar a que esté lejos
    if (launched && balls.some(b => b.y < BALL_LOW_Y)) {
      regenerating = true;
      const values = generateBrickValues();
      placeBricks(values);
      pendingRegeneration = false;
      regenerating = false;
    }
  }

  // ------------------------------------------------------------
  // Sistema de vidas y bola azul
  // ------------------------------------------------------------
  function checkLifeBonus() {
    if (playerScore >= nextLifeThreshold) {
      if (lives < MAX_LIVES) {
        lives++;
        nextLifeThreshold += POINTS_PER_LIFE;
        updateUI();
        // Efecto visual (se puede agregar un destello)
        soundTap();
      } else {
        // Si ya tiene 3 vidas, regalar una bola azul
        spawnBlueBall();
        nextLifeThreshold += POINTS_PER_LIFE;
      }
    }
  }

  function spawnBlueBall() {
    // Crea un objeto "bola azul" que cae desde arriba
    const size = 10; // tamaño intermedio
    const speed = 80; // velocidad de caída
    const x = 30 + Math.random() * (STAGE_W - 60);
    const y = -size;

    const el = document.createElement('div');
    el.style.cssText = `
      position: absolute;
      width: ${size}px; height: ${size}px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, #88ddff, #0066ff 60%, #0000aa);
      border: 2px solid #fff;
      box-shadow: 0 0 20px rgba(0,150,255,0.9);
      pointer-events: none;
      z-index: 16;
      transform: translate(-50%, -50%);
    `;
    inner.appendChild(el);

    // Añadir a la lista de powerups (con tipo especial)
    powerups.push({
      x: x,
      y: y,
      vx: 0,
      vy: speed,
      size: size,
      color: 'azul',
      type: 'BOLA_AZUL',
      el: el,
      alive: true
    });
  }

  function applyBlueBall() {
    // +2000 puntos
    playerScore += 2000;
    // Eliminar poderes negativos
    if (paddleSizeMultiplier < 1) paddleSizeMultiplier = 1;
    if (ballDurability < 1) ballDurability = 1; // ya no debería ser menor
    // Flaquesa no existe como estado, es ballDurability, ya la hemos reseteado
    nieblaLevel = 0;
    updateNiebla();

    // Dar un poder positivo aleatorio no poseído
    const positiveTypes = ['PALA_GRANDE', 'DUREZA', 'MULTIBOLA'];
    const available = positiveTypes.filter(type => {
      if (type === 'PALA_GRANDE' && paddleSizeMultiplier > 1) return false;
      if (type === 'DUREZA' && ballDurability >= 3) return false;
      if (type === 'MULTIBOLA' && balls.length >= 3) return false;
      return true;
    });
    if (available.length > 0) {
      const chosen = available[Math.floor(Math.random() * available.length)];
      // Aplicar el poder positivo
      switch (chosen) {
        case 'PALA_GRANDE':
          paddleSizeMultiplier = 1.3;
          break;
        case 'DUREZA':
          ballDurability = Math.min(3, ballDurability + 1);
          updateDurabilityVisual();
          break;
        case 'MULTIBOLA': {
          const count = balls.length;
          if (count >= 1 && count <= 3) {
            const newCount = Math.min(9, count * 3);
            const extra = newCount - count;
            for (let i = 0; i < extra; i++) {
              const src = balls[Math.floor(Math.random() * balls.length)];
              const angle = (Math.random() - 0.5) * 1.2;
              const speed = Math.sqrt(src.vx * src.vx + src.vy * src.vy) || BALL_SPEED_BASE;
              const vx = Math.sin(angle) * speed;
              const vy = -Math.cos(angle) * speed;
              balls.push({
                x: src.x + (Math.random() - 0.5) * 10,
                y: src.y + (Math.random() - 0.5) * 10,
                vx: vx,
                vy: vy
              });
            }
          }
          break;
        }
      }
    }
    soundTap();
  }

  // ------------------------------------------------------------
  // Power‑ups con lógica inteligente
  // ------------------------------------------------------------
  function getGreenProbability(minutes) {
    if (minutes < 0) return GREEN_PROB_TABLE[0];
    if (minutes >= GREEN_PROB_TABLE.length - 1) return GREEN_PROB_TABLE[GREEN_PROB_TABLE.length - 1];
    const idx = Math.floor(minutes);
    const frac = minutes - idx;
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
    return types.filter(t => !isSaturated(t));
  }

  function getAlternativeType(color, currentType) {
    const available = getAvailableTypes(color);
    if (!isSaturated(currentType)) return currentType;
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  }

  function spawnPowerup(brick) {
    let prob = 0;
    if (brick.type === BRICK_TYPES.CLAY) prob = 0.20;
    else if (brick.type === BRICK_TYPES.WOOD) prob = 0.30;
    else if (brick.type === BRICK_TYPES.IRON) prob = 0.50;
    if (Math.random() >= prob) return;

    const now = performance.now();
    const minutes = (now - gameStartTime) / 60000;
    const greenProb = getGreenProbability(minutes);
    const color = Math.random() * 100 < greenProb ? 'verde' : 'rojo';
    let typeKey = selectPowerupByColor(color);

    const alternative = getAlternativeType(color, typeKey);
    if (alternative === null) return;
    typeKey = alternative;

    const isGreen = color === 'verde';
    console.log(`⚡ Powerup generado: ${typeKey} (${color})`);

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
    let symbol = '';
    switch (typeKey) {
      case 'MULTIBOLA': symbol = '🌀'; break;
      case 'PALA_GRANDE': symbol = '📏'; break;
      case 'DUREZA': symbol = '⚡'; break;
      case 'BOLA_NIEBLA': symbol = '🌫️'; break;
      case 'PALA_MINI': symbol = '📐'; break;
      case 'FLAQUESA': symbol = '⬇️'; break;
    }
    el.textContent = symbol;
    inner.appendChild(el);

    powerups.push({
      x: cx,
      y: cy,
      vx: 0,
      vy: speed,
      size: size,
      color: color,
      type: typeKey,
      el: el,
      alive: true
    });
  }

  // ------------------------------------------------------------
  // Aplicar power‑up
  // ------------------------------------------------------------
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
      case 'MULTIBOLA': {
        const count = balls.length;
        if (count >= 1 && count <= 3) {
          const newCount = Math.min(9, count * 3);
          const extra = newCount - count;
          for (let i = 0; i < extra; i++) {
            const src = balls[Math.floor(Math.random() * balls.length)];
            const angle = (Math.random() - 0.5) * 1.2;
            const speed = Math.sqrt(src.vx * src.vx + src.vy * src.vy) || BALL_SPEED_BASE;
            const vx = Math.sin(angle) * speed;
            const vy = -Math.cos(angle) * speed;
            balls.push({
              x: src.x + (Math.random() - 0.5) * 10,
              y: src.y + (Math.random() - 0.5) * 10,
              vx: vx,
              vy: vy
            });
          }
        }
        break;
      }
      case 'DUREZA':
        if (ballDurability < 3) {
          ballDurability++;
          updateDurabilityVisual();
        }
        break;
      case 'FLAQUESA':
        if (ballDurability > 1) {
          ballDurability--;
          updateDurabilityVisual();
        }
        break;
      case 'BOLA_NIEBLA':
        if (nieblaLevel < MAX_NIEBLA) {
          nieblaLevel++;
          updateNiebla();
        }
        break;
      case 'BOLA_AZUL':
        applyBlueBall();
        break;
    }
  }

  // ------------------------------------------------------------
  // Visuales: dureza, niebla
  // ------------------------------------------------------------
  function updateDurabilityVisual() {
    const ballElements = inner.querySelectorAll('.ball-dynamic');
    for (const el of ballElements) {
      updateBallStyle(el);
    }
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

  function updateNiebla() {
    const opacity = nieblaLevel / MAX_NIEBLA * 0.5;
    nieblaEl.style.opacity = opacity;
  }

  // ------------------------------------------------------------
  // Funciones de bola y juego
  // ------------------------------------------------------------
  function launchBall() {
    if (launched) return;
    for (const b of balls) {
      if (b.vx === 0 && b.vy === 0) {
        const dir = Math.random() < 0.5 ? -1 : 1;
        const angle = (Math.random() - 0.5) * 0.8;
        b.vx = Math.sin(angle) * BALL_SPEED_BASE * dir;
        b.vy = -Math.cos(angle) * BALL_SPEED_BASE;
      }
    }
    launched = true;
  }

  function resetGameState() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    running = false;
    launched = false;
    bricks = [];
    powerups = [];
    balls = [];
    paddle.x = (STAGE_W - PADDLE_W_BASE) / 2;
    paddleSizeMultiplier = 1;
    paddleWidth = PADDLE_W_BASE;
    ballDurability = 1;
    nieblaLevel = 0;
    updateNiebla();
    lives = 3;
    playerScore = 0;
    gamePoints = 0;
    pendingRegeneration = false;
    regenerating = false;
    nextLifeThreshold = POINTS_PER_LIFE;
    keys.left = keys.right = false;
    touchActive = false;
    touchX = 0;
    mouseActive = false;
    mouseX = 0;
    gameStartTime = 0;

    inner.querySelectorAll('.brick').forEach(b => b.remove());
    powerups.forEach(p => p.el.remove());
    powerups = [];

    const initialX = paddle.x + paddleWidth / 2;
    const initialY = STAGE_H - 14 - BALL_R;
    balls.push({ x: initialX, y: initialY, vx: 0, vy: 0 });

    msgEl.classList.remove('show');
    restartBtn.style.display = 'none';
    updateUI();
    updateDurabilityVisual();
    draw();
  }

  function loseLife() {
    lives--;
    if (lives <= 0) {
      endGame();
      return;
    }
    paddleSizeMultiplier = 1;
    paddleWidth = PADDLE_W_BASE;
    ballDurability = 1;
    nieblaLevel = 0;
    updateNiebla();
    powerups.forEach(p => p.el.remove());
    powerups = [];
    const newX = paddle.x + paddleWidth / 2;
    const newY = STAGE_H - 14 - BALL_R;
    balls = [{ x: newX, y: newY, vx: 0, vy: 0 }];
    launched = false;
    updateDurabilityVisual();
    updateUI();
    draw();
  }

  function endGame() {
    running = false;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    restartBtn.style.display = 'inline-block';
    msgText.textContent = `Game Over\nPuntaje final: ${playerScore}`;
    msgEl.classList.add('show');
    soundLose();
  }

  function startGame() {
    // Reiniciar completamente
    resetGameState();
    // Colocar ladrillos iniciales (todos arcilla)
    const clayValues = new Array(36).fill(1);
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
    gameStartTime = performance.now();
    layoutStage();
    updateUI();
    updateDurabilityVisual();
    draw();
    lastTime = 0;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(gameLoop);
  }

  function updateUI() {
    // Vidas con colores alternos
    let hearts = '';
    for (let i = 0; i < lives; i++) {
      const colors = ['#ff0000', '#ffcc00', '#ff00ff', '#00ffcc'];
      const col = colors[i % colors.length];
      hearts += `<span style="color:${col}; text-shadow:0 0 8px ${col};">♥</span>`;
    }
    livesEl.innerHTML = hearts || '—';
    scoreEl.textContent = `Puntos: ${playerScore}`;
  }

  function draw() {
    paddleWidth = PADDLE_W_BASE * paddleSizeMultiplier;
    paddleEl.style.width = paddleWidth + 'px';
    paddleEl.style.transform = 'translateX(' + paddle.x + 'px)';

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

    // Dibujar powerups (incluyendo bola azul)
    for (const pu of powerups) {
      pu.el.style.left = pu.x + 'px';
      pu.el.style.top = pu.y + 'px';
    }
  }

  // ------------------------------------------------------------
  // Bucle principal con velocidad progresiva
  // ------------------------------------------------------------
  let lastTime = 0;

  function gameLoop(timestamp) {
    if (!running) return;

    const delta = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0.016;
    lastTime = timestamp;

    // Calcular multiplicador de velocidad según tiempo transcurrido
    const elapsedMinutes = (performance.now() - gameStartTime) / 60000;
    const speedMultiplier = 1 + Math.min(4, (elapsedMinutes / 15) ** 2);
    const currentBallSpeed = BALL_SPEED_BASE * speedMultiplier;

    updateUI();

    // Movimiento de la pala
    let paddleMoved = false;
    if (keys.left) { paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * delta); paddleMoved = true; }
    if (keys.right) { paddle.x = Math.min(STAGE_W - paddleWidth, paddle.x + PADDLE_SPEED * delta); paddleMoved = true; }
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

    // Movimiento de bolas (con velocidad ajustada)
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      // Velocidad actual basada en el multiplicador
      const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (speed > 0) {
        const ratio = currentBallSpeed / speed;
        b.vx *= ratio;
        b.vy *= ratio;
      }

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
        b.vx = Math.sin(angle) * currentBallSpeed;
        b.vy = -Math.cos(angle) * currentBallSpeed;
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
          soundBrick();
          if (br.hits <= 0) {
            br.alive = false;
            br.el.classList.add('gone');
            playerScore += br.playerPoints;
            gamePoints -= br.value;
            // Comprobar bonificación por puntos
            checkLifeBonus();
            updateUI();
            spawnPowerup(br);
            if (gamePoints <= REGEN_THRESHOLD) requestRegeneration();
          } else {
            br.el.textContent = FRACTURE_SYMBOLS[br.hits] || '|';
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
          const newX = paddle.x + paddleWidth / 2;
          const newY = STAGE_H - 14 - BALL_R;
          balls = [{ x: newX, y: newY, vx: 0, vy: 0 }];
          launched = false;
          updateUI();
          draw();
          animFrameId = requestAnimationFrame(gameLoop);
          return;
        }
      }
    }

    // Movimiento de powerups (incluyendo bola azul)
    for (let i = powerups.length - 1; i >= 0; i--) {
      const pu = powerups[i];
      pu.y += pu.vy * delta;

      const px = paddle.x;
      const py2 = STAGE_H - 14 - PADDLE_H / 2;
      if (pu.y + pu.size / 2 > py2 - PADDLE_H / 2 &&
          pu.y - pu.size / 2 < py2 + PADDLE_H / 2 &&
          pu.x + pu.size / 2 > px &&
          pu.x - pu.size / 2 < px + paddleWidth) {
        applyPowerup(pu);
        pu.el.remove();
        powerups.splice(i, 1);
        soundTap();
        updateDurabilityVisual();
        continue;
      }

      if (pu.y - pu.size / 2 > STAGE_H) {
        pu.el.remove();
        powerups.splice(i, 1);
        continue;
      }

      pu.el.style.left = pu.x + 'px';
      pu.el.style.top = pu.y + 'px';
    }

    if (pendingRegeneration) checkAndRegenerate();

    draw();
    animFrameId = requestAnimationFrame(gameLoop);
  }

  // ------------------------------------------------------------
  // Abrir / cerrar juego (sin countdown)
  // ------------------------------------------------------------
  function openGame() {
    // Reiniciar completamente
    resetGameState();
    overlay.classList.add('open');
    // Limpiar todo lo anterior
    inner.querySelectorAll('.brick').forEach(b => b.remove());
    bricks = [];
    powerups.forEach(p => p.el.remove());
    powerups = [];
    msgEl.classList.remove('show');
    restartBtn.style.display = 'none';
    draw();

    // Iniciar directamente sin cuenta atrás
    startGame();
  }

  function closeGame() {
    overlay.classList.remove('open');
    resetGameState();
    soundClose();
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

  // ------------------------------------------------------------
  // Eventos
  // ------------------------------------------------------------
  document.getElementById('game-close').addEventListener('click', closeGame);
  restartBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    soundTap();
    startGame();
  });
  overlay.addEventListener('click', e => { if (e.target === overlay) closeGame(); });

  stage.addEventListener('mousedown', (e) => {
    if (!running) return;
    const rect = stage.getBoundingClientRect();
    const localX = (e.clientX - rect.left) / scale;
    mouseX = Math.min(Math.max(localX - paddleWidth / 2, 0), STAGE_W - paddleWidth);
    mouseActive = true;
    if (!launched) launchBall();
  });
  document.addEventListener('mousemove', (e) => {
    if (!running || !mouseActive) return;
    const rect = stage.getBoundingClientRect();
    const localX = (e.clientX - rect.left) / scale;
    mouseX = Math.min(Math.max(localX - paddleWidth / 2, 0), STAGE_W - paddleWidth);
  });
  document.addEventListener('mouseup', () => { mouseActive = false; });

  stage.addEventListener('click', (e) => {
    if (running && !launched) launchBall();
  });

  document.addEventListener('keydown', (e) => {
    if (!running) return;
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') { keys.left = true; e.preventDefault(); }
    else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') { keys.right = true; e.preventDefault(); }
  });
  document.addEventListener('keyup', (e) => {
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') { keys.left = false; e.preventDefault(); }
    else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') { keys.right = false; e.preventDefault(); }
  });

  stage.addEventListener('touchstart', (e) => {
    if (!running) return;
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
    if (!running) return;
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
  resetGameState();
  console.log('✅ Juego arcade final listo');
}


