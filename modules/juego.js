console.log('📦 juego.js - Implementación completa ABSCIOD BONUS ARACDE v8.1');

import { soundTap, soundBrick, soundWin, soundLose, soundClose } from './sonidos.js';

// ============================================================
// CONSTANTES Y CONFIGURACIÓN
// ============================================================

const ROWS = 6;
const COLS = 6;
const BRICK_COUNT = ROWS * COLS; // 36
const PADDLE_W_BASE = 60;
const PADDLE_H = 10;
const BALL_R = 6;
const STAGE_W = 300;
const STAGE_H = 420;
const TOP_OFFSET = 30;
const BALL_SPEED_BASE = 220; // px/s (velocidad inicial)
const SPEED_INCREMENT_PER_SECOND = 0.5; // px/s por segundo
const MAX_SPEED = 800; // límite físico

// Tipos de ladrillos (dureza y valor)
const CLAY = { dureza: 1, valor: 1, nombre: 'Arcilla' };
const WOOD = { dureza: 2, valor: 2, nombre: 'Madera' };
const IRON = { dureza: 3, valor: 3, nombre: 'Hierro' };

// Puntos base por destruir
const PUNTOS_BASE = {
  1: 100, // Arcilla
  2: 200, // Madera
  3: 300  // Hierro
};

// Probabilidades de soltar objeto por tipo
const PROB_OBJETO = {
  1: 0.05, // Arcilla 5%
  2: 0.10, // Madera 10%
  3: 0.20  // Hierro 20%
};

// Tabla de probabilidades Verde vs Rojo por minuto
const PROB_VERDE = [
  50.000, 46.875, 43.750, 40.625, 37.500, 34.375, 31.250, 28.125,
  25.000, 21.875, 18.750, 15.625, 12.500, 9.375, 6.250, 3.125, 0.000
];
const PROB_ROJO = PROB_VERDE.map(v => 100 - v);

// Pesos internos
const PESOS_VERDES = {
  'multibola': 15,
  'pala_grande': 35,
  'dureza': 50
};
const PESOS_ROJOS = {
  'niebla': 10,
  'pala_mini': 35,
  'flaqueza': 55
};

// Umbral de recarga
const UMBRAL_RECARGA = 12;

// Umbral de vida extra
const UMBRAL_VIDA_EXTRA = 3000;

// ============================================================
// ESTADO DEL JUEGO
// ============================================================

export function initJuego(config) {
  console.log('🎮 Iniciando juego con diseño ABSCIOD v8.1');

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
  const scoreEl = document.getElementById('score');
  const comboEl = document.getElementById('combo-display');
  const restartBtn = document.getElementById('game-restart');
  const fogLayer = document.getElementById('fog-layer');

  // Variables de estado
  let scale = 1;
  let bricks = [];
  let paddle = { x: (STAGE_W - PADDLE_W_BASE) / 2, w: PADDLE_W_BASE };
  let balls = []; // array de bolas {x, y, vx, vy}
  let lives = 3;
  let score = 0;
  let combo = 0;
  let comboData = []; // para registrar durezas durante el combo
  let comboActive = false;
  let comboBonus = 0;
  let gameRunning = false;
  let animFrameId = null;
  let countdownInterval = null;
  let startTime = 0;
  let gameTime = 0; // segundos transcurridos
  let currentSpeed = BALL_SPEED_BASE;
  let lastTimestamp = 0;

  // Objetos en pantalla (power-ups/downgrades cayendo)
  let objects = [];

  // Estado de poderes
  let powerups = {
    pala_grande: false,
    dureza_mejora: false, // se aplica al tocar un ladrillo
    multibola: false,
    pala_mini: false,
    flaqueza: false,
    niebla_nivel: 0,
    niebla_timer: 0,
    niebla_visible: true,
    pelota_azul_disponible: false
  };

  // Control de teclado/táctil
  const keys = { left: false, right: false };
  let touchActive = false;
  let touchX = 0;

  // ============================================================
  // FUNCIONES AUXILIARES
  // ============================================================

  function getTipoPorDureza(d) {
    if (d === 1) return CLAY;
    if (d === 2) return WOOD;
    if (d === 3) return IRON;
    return CLAY;
  }

  function sumarPuntosLadrillos() {
    let s = 0;
    for (const b of bricks) {
      if (!b.alive) continue;
      s += b.valor;
    }
    return s;
  }

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function distanciaEntrePuntos(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  }

  // ============================================================
  // SISTEMA DE RECARGA DE LADRILLOS
  // ============================================================

  function recargarLadrillos() {
    const S = sumarPuntosLadrillos();
    if (S > UMBRAL_RECARGA) return;

    // Generar combinación de ladrillos cuya suma de valores sea exactamente 12
    const combinaciones = [];
    for (let a = 0; a <= 12; a++) {
      for (let m = 0; m <= 6; m++) {
        for (let h = 0; h <= 4; h++) {
          if (a * 1 + m * 2 + h * 3 === 12) {
            combinaciones.push({ arcilla: a, madera: m, hierro: h });
          }
        }
      }
    }
    const combo = combinaciones[Math.floor(Math.random() * combinaciones.length)];
    const nuevos = [];
    for (let i = 0; i < combo.arcilla; i++) nuevos.push({ dureza: 1, valor: 1, nombre: 'Arcilla' });
    for (let i = 0; i < combo.madera; i++) nuevos.push({ dureza: 2, valor: 2, nombre: 'Madera' });
    for (let i = 0; i < combo.hierro; i++) nuevos.push({ dureza: 3, valor: 3, nombre: 'Hierro' });

    // Mezclar para que sea aleatorio
    for (let i = nuevos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nuevos[i], nuevos[j]] = [nuevos[j], nuevos[i]];
    }

    // Obtener posiciones libres (lejos de la trayectoria de la bola)
    const posicionesLibres = [];
    const ocupadas = new Set();
    for (const b of bricks) {
      if (b.alive) {
        const key = `${b.gridX},${b.gridY}`;
        ocupadas.add(key);
      }
    }

    // Calcular trayectoria de la bola (solo la primera bola)
    const bola = balls.length > 0 ? balls[0] : null;
    let trayectoria = [];
    if (bola) {
      // Simular 30 pasos
      let x = bola.x, y = bola.y, vx = bola.vx, vy = bola.vy;
      for (let i = 0; i < 30; i++) {
        x += vx * 0.02;
        y += vy * 0.02;
        if (x < 0 || x > STAGE_W) vx = -vx;
        if (y < 0) vy = -vy;
        trayectoria.push({ x, y });
      }
    }

    const gridCols = 6;
    const gridRows = 6;
    const brickW = 38;
    const brickH = 16;
    const gap = 3;
    const totalWidth = gridCols * (brickW + gap) - gap;
    const startX = (STAGE_W - totalWidth) / 2;
    const startY = TOP_OFFSET;

    // Buscar posiciones vacías
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const key = `${c},${r}`;
        if (!ocupadas.has(key)) {
          const x = startX + c * (brickW + gap);
          const y = startY + r * (brickH + gap);
          // Verificar distancia a la trayectoria (mínimo 3 casillas)
          let lejos = true;
          if (bola) {
            for (const p of trayectoria) {
              const dist = distanciaEntrePuntos(x + brickW/2, y + brickH/2, p.x, p.y);
              if (dist < 60) { // 3 casillas aprox
                lejos = false;
                break;
              }
            }
          }
          if (lejos) {
            posicionesLibres.push({ x, y, c, r });
          }
        }
      }
    }

    // Mezclar posiciones
    for (let i = posicionesLibres.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [posicionesLibres[i], posicionesLibres[j]] = [posicionesLibres[j], posicionesLibres[i]];
    }

    // Colocar nuevos ladrillos
    let colocados = 0;
    for (const tipo of nuevos) {
      if (colocados >= posicionesLibres.length) break;
      const pos = posicionesLibres[colocados];
      const el = document.createElement('div');
      el.className = `brick dureza-${tipo.dureza}`;
      el.style.left = pos.x + 'px';
      el.style.top = pos.y + 'px';
      el.style.width = brickW + 'px';
      el.style.height = brickH + 'px';
      el.style.borderRadius = '4px';
      el.style.color = '#fff';
      el.style.fontWeight = 'bold';
      el.style.textShadow = '0 1px 2px rgba(0,0,0,0.5)';
      el.style.border = '1px solid rgba(255,255,255,0.2)';
      inner.appendChild(el);

      bricks.push({
        x: pos.x, y: pos.y, w: brickW, h: brickH,
        gridX: pos.c, gridY: pos.r,
        dureza: tipo.dureza,
        valor: tipo.valor,
        nombre: tipo.nombre,
        el: el,
        alive: true,
        // Para combo
        durezaInicial: tipo.dureza,
        durezaFinal: tipo.dureza,
        fueGolpeado: false
      });
      colocados++;
    }
  }

  // ============================================================
  // SISTEMA DE COMBO
  // ============================================================

  function iniciarCombo() {
    combo = 0;
    comboData = [];
    comboActive = true;
    comboBonus = 0;
    for (const b of bricks) {
      if (b.alive) {
        b.durezaInicial = b.dureza;
        b.durezaFinal = b.dureza;
        b.fueGolpeado = false;
      }
    }
    actualizarComboDisplay();
  }

  function registrarGolpeLadrillo(brick) {
    if (!comboActive) return;
    if (!brick.alive) return;
    if (!brick.fueGolpeado) {
      brick.fueGolpeado = true;
      brick.durezaInicial = brick.dureza; // en el primer golpe
    }
    brick.durezaFinal = brick.dureza; // actualizar cada vez
  }

  function finalizarCombo() {
    if (!comboActive) return;
    comboActive = false;
    // Calcular bonificación
    let bote = 0;
    for (const b of bricks) {
      if (!b.fueGolpeado) continue;
      const inicial = b.durezaInicial;
      const final = b.durezaFinal;
      if (final === 0) { // destruido
        const tipo = getTipoPorDureza(inicial);
        if (inicial === 1 && tipo.nombre === 'Arcilla') bote += 25;
        else if (inicial === 1 && tipo.nombre === 'Madera') bote += 125;
        else if (inicial === 2) bote += 200;
        else if (inicial === 1 && tipo.nombre === 'Hierro') bote += 150;
        else if (inicial === 2) bote += 300;
        else if (inicial === 3) bote += 450;
      } else { // no destruido
        const tipo = getTipoPorDureza(final);
        if (tipo.nombre === 'Madera') bote += 75;
        else if (tipo.nombre === 'Hierro') bote += 75;
        // Arcilla no da bonificación
      }
    }
    // Añadir bote al marcador
    score += bote;
    actualizarScoreDisplay();
    comboBonus = bote;
    // Reiniciar combo
    combo = 0;
    actualizarComboDisplay();
  }

  // ============================================================
  // GENERACIÓN DE OBJETOS
  // ============================================================

  function generarObjeto(brick) {
    const prob = PROB_OBJETO[brick.dureza] || 0;
    if (Math.random() > prob) return;

    const minuto = Math.floor(gameTime / 60);
    const idx = Math.min(minuto, 16);
    const pVerde = PROB_VERDE[idx] / 100;
    const pRojo = PROB_ROJO[idx] / 100;
    let esVerde = false;
    if (Math.random() < pVerde) esVerde = true;
    else if (Math.random() < pRojo) esVerde = false;
    else return; // no suelta nada

    let objeto = null;
    if (esVerde) {
      // Seleccionar verde con pesos, comprobar bloqueos
      const disponibles = [];
      if (!powerups.pala_grande) disponibles.push('pala_grande');
      // Multibola: si ya hay 9 bolas, bloqueado
      if (balls.length < 9) disponibles.push('multibola');
      // Dureza: si ya está activo, bloqueado
      if (!powerups.dureza_mejora) disponibles.push('dureza');
      if (disponibles.length === 0) return;
      // Selección con pesos
      let total = 0;
      for (const d of disponibles) total += PESOS_VERDES[d];
      let r = Math.random() * total;
      for (const d of disponibles) {
        r -= PESOS_VERDES[d];
        if (r <= 0) { objeto = d; break; }
      }
      if (!objeto) objeto = disponibles[0];
      // Crear objeto verde
      crearObjetoVisual(brick.x + brick.w/2, brick.y, 'green', objeto);
      // Aplicar efecto inmediato o almacenar para caída
    } else {
      // Seleccionar rojo con pesos y bloqueos
      const disponibles = [];
      if (powerups.niebla_nivel < 3) disponibles.push('niebla');
      if (!powerups.pala_mini) disponibles.push('pala_mini');
      if (!powerups.flaqueza) disponibles.push('flaqueza');
      if (disponibles.length === 0) return;
      let total = 0;
      for (const d of disponibles) total += PESOS_ROJOS[d];
      let r = Math.random() * total;
      let objetoRojo = null;
      for (const d of disponibles) {
        r -= PESOS_ROJOS[d];
        if (r <= 0) { objetoRojo = d; break; }
      }
      if (!objetoRojo) objetoRojo = disponibles[0];
      crearObjetoVisual(brick.x + brick.w/2, brick.y, 'red', objetoRojo);
    }
  }

  function crearObjetoVisual(x, y, color, tipo) {
    const el = document.createElement('div');
    el.className = `game-object ${color}`;
    el.style.left = (x - 10) + 'px';
    el.style.top = y + 'px';
    const label = document.createElement('span');
    label.className = 'obj-label';
    let abrev = '';
    if (tipo === 'pala_grande') abrev = 'PG';
    else if (tipo === 'dureza') abrev = 'DU';
    else if (tipo === 'multibola') abrev = 'MB';
    else if (tipo === 'pala_mini') abrev = 'PM';
    else if (tipo === 'flaqueza') abrev = 'FL';
    else if (tipo === 'niebla') abrev = 'NB';
    label.textContent = abrev;
    el.appendChild(label);
    inner.appendChild(el);
    // Velocidad de caída: Verde rápida, Rojo lenta, Azul intermedia
    let velocidad = 0;
    if (color === 'green') velocidad = 120 + Math.random() * 60;
    else if (color === 'red') velocidad = 40 + Math.random() * 30;
    else velocidad = 80 + Math.random() * 40;
    objects.push({
      el: el,
      x: x - 10,
      y: y,
      velocidad: velocidad,
      color: color,
      tipo: tipo,
      activo: true
    });
  }

  // ============================================================
  // APLICACIÓN DE OBJETOS AL ATRAPARLOS
  // ============================================================

  function atraparObjeto(obj) {
    if (!obj.activo) return;
    obj.activo = false;
    obj.el.remove();

    if (obj.color === 'green') {
      switch (obj.tipo) {
        case 'pala_grande':
          powerups.pala_grande = true;
          paddle.w = PADDLE_W_BASE * 1.3;
          actualizarPaddle();
          break;
        case 'dureza':
          powerups.dureza_mejora = true;
          // Mejorar un ladrillo al azar (arcilla→madera→hierro)
          const vivos = bricks.filter(b => b.alive && b.dureza < 3);
          if (vivos.length > 0) {
            const target = vivos[Math.floor(Math.random() * vivos.length)];
            target.dureza++;
            target.valor++;
            target.nombre = getTipoPorDureza(target.dureza).nombre;
            target.el.className = `brick dureza-${target.dureza}`;
          }
          break;
        case 'multibola':
          // Multiplicar bolas ×3 hasta máximo 9
          const nuevas = [];
          for (let i = 0; i < balls.length; i++) {
            if (balls.length >= 9) break;
            const b = balls[i];
            const ang = (Math.random() - 0.5) * 1.2;
            const spd = Math.hypot(b.vx, b.vy);
            const newVx = Math.sin(ang) * spd;
            const newVy = -Math.cos(ang) * spd;
            nuevas.push({
              x: b.x + (Math.random() - 0.5) * 10,
              y: b.y + (Math.random() - 0.5) * 10,
              vx: newVx,
              vy: newVy
            });
          }
          balls.push(...nuevas);
          break;
      }
    } else if (obj.color === 'red') {
      switch (obj.tipo) {
        case 'pala_mini':
          powerups.pala_mini = true;
          paddle.w = PADDLE_W_BASE * 0.7;
          actualizarPaddle();
          break;
        case 'flaqueza':
          powerups.flaqueza = true;
          // Degradar un ladrillo al azar (hierro→madera→arcilla)
          const vivos = bricks.filter(b => b.alive && b.dureza > 1);
          if (vivos.length > 0) {
            const target = vivos[Math.floor(Math.random() * vivos.length)];
            target.dureza--;
            target.valor--;
            target.nombre = getTipoPorDureza(target.dureza).nombre;
            target.el.className = `brick dureza-${target.dureza}`;
          }
          break;
        case 'niebla':
          powerups.niebla_nivel = Math.min(3, powerups.niebla_nivel + 1);
          actualizarNiebla();
          break;
      }
    } else if (obj.color === 'blue') {
      // Pelota Azul: elimina downgrades, da power-up aleatorio y 500 pts
      powerups.pala_mini = false;
      powerups.flaqueza = false;
      powerups.niebla_nivel = 0;
      actualizarNiebla();
      if (paddle.w < PADDLE_W_BASE) {
        paddle.w = PADDLE_W_BASE;
        actualizarPaddle();
      }
      // Dar power-up aleatorio (verde) que esté disponible
      const verdes = ['pala_grande', 'dureza', 'multibola'];
      const disponibles = verdes.filter(v => {
        if (v === 'pala_grande' && powerups.pala_grande) return false;
        if (v === 'dureza' && powerups.dureza_mejora) return false;
        if (v === 'multibola' && balls.length >= 9) return false;
        return true;
      });
      if (disponibles.length > 0) {
        const elegido = disponibles[Math.floor(Math.random() * disponibles.length)];
        // Simular que se atrapa ese verde
        const objFalso = { color: 'green', tipo: elegido, activo: true };
        atraparObjeto(objFalso);
      }
      score += 500;
      actualizarScoreDisplay();
    }
  }

  function actualizarPaddle() {
    const el = document.getElementById('paddle');
    if (el) el.style.width = paddle.w + 'px';
  }

  function actualizarNiebla() {
    const nivel = powerups.niebla_nivel;
    const fog = document.getElementById('fog-layer');
    if (nivel > 0) {
      fog.classList.add('active');
      fog.className = `active level-${nivel}`;
      if (nivel === 1) {
        // Niebla constante
        powerups.niebla_visible = false;
      } else if (nivel === 2) {
        // Invisible 1s, visible 3s
        powerups.niebla_timer = 0;
        powerups.niebla_visible = false;
      } else if (nivel === 3) {
        // Invisible 2s, visible 3s
        powerups.niebla_timer = 0;
        powerups.niebla_visible = false;
      }
    } else {
      fog.classList.remove('active');
      fog.className = '';
      powerups.niebla_visible = true;
    }
  }

  // ============================================================
  // SISTEMA DE VIDAS Y PELOTA AZUL
  // ============================================================

  function perderVida() {
    // Entregar bote del combo antes de resetear
    if (comboActive) finalizarCombo();
    lives--;
    if (lives <= 0) {
      endGame(false);
      return;
    }
    // Resetear poderes (excepto velocidad base)
    powerups.pala_grande = false;
    powerups.pala_mini = false;
    powerups.dureza_mejora = false;
    powerups.flaqueza = false;
    powerups.niebla_nivel = 0;
    powerups.niebla_visible = true;
    paddle.w = PADDLE_W_BASE;
    actualizarPaddle();
    actualizarNiebla();
    // Resetear bolas a 1
    const bola = balls[0] || { x: STAGE_W/2, y: STAGE_H - 38 };
    balls = [{
      x: STAGE_W/2,
      y: STAGE_H - 38,
      vx: (Math.random() - 0.5) * 2 * currentSpeed,
      vy: -Math.sqrt(currentSpeed*currentSpeed - (Math.random()-0.5)**2 * 4)
    }];
    actualizarVidasDisplay();
  }

  function actualizarVidasDisplay() {
    livesEl.textContent = '♥ '.repeat(Math.max(lives, 0)).trim() || '—';
  }

  function actualizarScoreDisplay() {
    scoreEl.textContent = Math.floor(score);
    // Verificar umbral de vida extra
    const vidasExtra = Math.floor(score / UMBRAL_VIDA_EXTRA);
    if (vidasExtra > 0) {
      if (lives < 3) {
        lives = Math.min(3, lives + 1);
        actualizarVidasDisplay();
        // Resetear contador de vidas extra para no repetir
        score = score % UMBRAL_VIDA_EXTRA;
        actualizarScoreDisplay();
      } else {
        // Ya tiene 3 vidas: aparece Pelota Azul
        if (!powerups.pelota_azul_disponible) {
          powerups.pelota_azul_disponible = true;
          // Aparecerá en la siguiente colisión
        }
      }
    }
  }

  function actualizarComboDisplay() {
    comboEl.textContent = `Combo: ${combo}`;
  }

  // ============================================================
  // INICIALIZACIÓN DEL TABLERO
  // ============================================================

  function initBoard() {
    const brickW = 38;
    const brickH = 16;
    const gap = 3;
    const totalWidth = COLS * (brickW + gap) - gap;
    const startX = (STAGE_W - totalWidth) / 2;
    const startY = TOP_OFFSET;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = startX + c * (brickW + gap);
        const y = startY + r * (brickH + gap);
        const el = document.createElement('div');
        el.className = 'brick dureza-1';
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.width = brickW + 'px';
        el.style.height = brickH + 'px';
        el.style.borderRadius = '4px';
        el.style.color = '#fff';
        el.style.fontWeight = 'bold';
        el.style.textShadow = '0 1px 2px rgba(0,0,0,0.5)';
        el.style.border = '1px solid rgba(255,255,255,0.2)';
        inner.appendChild(el);
        bricks.push({
          x: x, y: y, w: brickW, h: brickH,
          gridX: c, gridY: r,
          dureza: 1,
          valor: 1,
          nombre: 'Arcilla',
          el: el,
          alive: true,
          durezaInicial: 1,
          durezaFinal: 1,
          fueGolpeado: false
        });
      }
    }
  }

  // ============================================================
  // FUNCIONES DE DIBUJO Y LAYOUT
  // ============================================================

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

  function draw() {
    // Paddle
    const paddleEl = document.getElementById('paddle');
    paddleEl.style.left = paddle.x + 'px';
    paddleEl.style.top = (STAGE_H - 16) + 'px';
    paddleEl.style.width = paddle.w + 'px';
    // Bolas
    const ballEls = document.querySelectorAll('.ball-instance');
    ballEls.forEach(el => el.remove());
    for (const b of balls) {
      const el = document.createElement('div');
      el.className = 'ball-instance';
      el.style.position = 'absolute';
      el.style.width = (BALL_R * 2) + 'px';
      el.style.height = (BALL_R * 2) + 'px';
      el.style.borderRadius = '50%';
      el.style.background = 'radial-gradient(circle at 35% 30%, #fff, #ff6b6b, #cc1122)';
      el.style.boxShadow = '0 0 20px #ff4444, 0 0 40px rgba(255, 50, 50, 0.6)';
      el.style.left = (b.x - BALL_R) + 'px';
      el.style.top = (b.y - BALL_R) + 'px';
      el.style.zIndex = '10';
      inner.appendChild(el);
    }
  }

  // ============================================================
  // LÓGICA PRINCIPAL DEL JUEGO (LOOP CON DELTA TIME)
  // ============================================================

  let lastTime = 0;

  function gameLoop(timestamp) {
    if (!gameRunning) return;

    const delta = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0.016;
    lastTime = timestamp;

    // Actualizar tiempo de juego
    gameTime += delta;
    // Actualizar velocidad base
    currentSpeed = Math.min(MAX_SPEED, BALL_SPEED_BASE + gameTime * SPEED_INCREMENT_PER_SECOND);

    // Movimiento de la paleta
    if (keys.left) paddle.x = Math.max(0, paddle.x - 5);
    if (keys.right) paddle.x = Math.min(STAGE_W - paddle.w, paddle.x + 5);
    if (touchActive) {
      paddle.x = Math.max(0, Math.min(STAGE_W - paddle.w, touchX));
    }

    // Movimiento de bolas
    for (const b of balls) {
      b.x += b.vx * delta;
      b.y += b.vy * delta;

      // Rebotes en paredes
      if (b.x - BALL_R < 0) { b.x = BALL_R; b.vx = Math.abs(b.vx); }
      if (b.x + BALL_R > STAGE_W) { b.x = STAGE_W - BALL_R; b.vx = -Math.abs(b.vx); }
      if (b.y - BALL_R < 0) { b.y = BALL_R; b.vy = Math.abs(b.vy); }

      // Rebote en paleta
      const py = STAGE_H - 16;
      if (b.vy > 0 && b.y + BALL_R >= py && b.y + BALL_R <= py + 12 &&
          b.x >= paddle.x - BALL_R && b.x <= paddle.x + paddle.w + BALL_R) {
        b.y = py - BALL_R;
        let hit = (b.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
        hit = Math.max(-0.85, Math.min(0.85, hit));
        const angle = hit * 0.7;
        const spd = currentSpeed;
        b.vx = Math.sin(angle) * spd;
        b.vy = -Math.cos(angle) * spd;
        // Comprobar si el rebote fue vacío (no golpeó ladrillo)
        // Esto se maneja más abajo con un flag
        // Si no golpea ningún ladrillo en este fotograma, se considera rebote vacío
        let golpeo = false;
        // Colisión con ladrillos
        for (const brick of bricks) {
          if (!brick.alive) continue;
          if (b.x + BALL_R > brick.x && b.x - BALL_R < brick.x + brick.w &&
              b.y + BALL_R > brick.y && b.y - BALL_R < brick.y + brick.h) {
            // Golpeó un ladrillo
            golpeo = true;
            // Registrar para combo
            if (comboActive) {
              registrarGolpeLadrillo(brick);
              combo++;
              actualizarComboDisplay();
            } else {
              iniciarCombo();
              combo++;
              actualizarComboDisplay();
            }
            // Dañar ladrillo (reducir dureza en 1)
            brick.dureza--;
            brick.valor--;
            if (brick.dureza <= 0) {
              // Destruido
              brick.alive = false;
              brick.el.classList.add('gone');
              // Sumar puntos base
              const puntosBase = PUNTOS_BASE[brick.durezaInicial] || 0;
              score += puntosBase;
              actualizarScoreDisplay();
              // Generar objeto
              generarObjeto(brick);
              // Comprobar recarga
              recargarLadrillos();
            } else {
              brick.nombre = getTipoPorDureza(brick.dureza).nombre;
              brick.el.className = `brick dureza-${brick.dureza}`;
            }
            // Rebote de la bola
            const cx = brick.x + brick.w / 2, cy = brick.y + brick.h / 2;
            const dx = b.x - cx, dy = b.y - cy;
            const overlapX = (BALL_R + brick.w / 2) - Math.abs(dx);
            const overlapY = (BALL_R + brick.h / 2) - Math.abs(dy);
            if (overlapX < overlapY) b.vx = -b.vx;
            else b.vy = -b.vy;
            break;
          }
        }
        // Si no golpeó ningún ladrillo y el combo estaba activo, finalizar combo
        if (!golpeo && comboActive) {
          finalizarCombo();
        }
      }

      // Si la bola cae abajo
      if (b.y - BALL_R > STAGE_H) {
        // Eliminar esta bola
        b.active = false;
      }
    }

    // Eliminar bolas caídas
    balls = balls.filter(b => b.active !== false);
    if (balls.length === 0) {
      perderVida();
      return;
    }

    // Actualizar objetos cayendo
    for (const obj of objects) {
      if (!obj.activo) continue;
      obj.y += obj.velocidad * delta;
      obj.el.style.top = obj.y + 'px';
      // Colisión con la paleta
      const py = STAGE_H - 16;
      if (obj.y + 10 >= py && obj.y - 10 <= py + 12 &&
          obj.x + 10 >= paddle.x && obj.x - 10 <= paddle.x + paddle.w) {
        atraparObjeto(obj);
      }
      // Si cae fuera
      if (obj.y > STAGE_H + 20) {
        obj.activo = false;
        obj.el.remove();
      }
    }
    objects = objects.filter(o => o.activo);

    // Actualizar niebla (cambios de visibilidad)
    if (powerups.niebla_nivel >= 2) {
      const ciclo = powerups.niebla_nivel === 2 ? 4 : 5; // 4s para nivel2, 5s para nivel3
      const invisible = powerups.niebla_nivel === 2 ? 1 : 2;
      powerups.niebla_timer += delta;
      if (powerups.niebla_timer > ciclo) {
        powerups.niebla_timer = 0;
        powerups.niebla_visible = !powerups.niebla_visible;
        // Aplicar visibilidad a ladrillos y objetos
        const visible = powerups.niebla_visible;
        for (const b of bricks) {
          if (b.alive) {
            b.el.style.opacity = visible ? 1 : 0.1;
          }
        }
        for (const o of objects) {
          if (o.activo) {
            o.el.style.opacity = visible ? 1 : 0.1;
          }
        }
        // La pelota azul siempre visible
        // (se maneja aparte)
      }
    }

    // Comprobar Pelota Azul (si está disponible y hay 3 vidas)
    if (powerups.pelota_azul_disponible && lives === 3) {
      // Aparecer en una posición aleatoria cerca de la paleta
      const x = paddle.x + Math.random() * paddle.w;
      const y = STAGE_H - 40 - Math.random() * 20;
      crearObjetoVisual(x, y, 'blue', 'pelota_azul');
      powerups.pelota_azul_disponible = false;
    }

    // Dibujar todo
    draw();

    // Continuar loop
    animFrameId = requestAnimationFrame(gameLoop);
  }

  // ============================================================
  // CONTROL DE JUEGO (INICIO, FIN, REINICIO)
  // ============================================================

  function startGame() {
    resetGameState();
    startTime = performance.now();
    gameTime = 0;
    currentSpeed = BALL_SPEED_BASE;
    lives = 3;
    score = 0;
    combo = 0;
    comboActive = false;
    powerups = {
      pala_grande: false,
      dureza_mejora: false,
      multibola: false,
      pala_mini: false,
      flaqueza: false,
      niebla_nivel: 0,
      niebla_timer: 0,
      niebla_visible: true,
      pelota_azul_disponible: false
    };
    paddle.w = PADDLE_W_BASE;
    paddle.x = (STAGE_W - paddle.w) / 2;
    balls = [{
      x: STAGE_W/2,
      y: STAGE_H - 38,
      vx: (Math.random() - 0.5) * 2 * currentSpeed,
      vy: -Math.sqrt(currentSpeed*currentSpeed - (Math.random()-0.5)**2 * 4)
    }];
    objects = [];
    actualizarVidasDisplay();
    actualizarScoreDisplay();
    actualizarComboDisplay();
    actualizarPaddle();
    actualizarNiebla();
    msgEl.classList.remove('show');
    gameRunning = true;
    layoutStage();
    draw();
    lastTime = 0;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(gameLoop);
  }

  function resetGameState() {
    gameRunning = false;
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
    // Limpiar ladrillos
    inner.querySelectorAll('.brick').forEach(b => b.remove());
    inner.querySelectorAll('.game-object').forEach(o => o.remove());
    inner.querySelectorAll('.ball-instance').forEach(b => b.remove());
    bricks = [];
    objects = [];
    balls = [];
    paddle.x = (STAGE_W - PADDLE_W_BASE) / 2;
    paddle.w = PADDLE_W_BASE;
    actualizarPaddle();
    msgEl.classList.remove('show');
    restartBtn.style.display = 'none';
  }

  function endGame(win) {
    gameRunning = false;
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    restartBtn.style.display = 'inline-block';

    let message = '';
    if (win) {
      message = `👑 ¡${config.nombre} ha roto el hechizo!\n✨ Puntuación: ${Math.floor(score)} pts`;
      soundWin();
    } else {
      message = `🎩 ¡${config.nombre} ha perdido!\n💔 Puntuación final: ${Math.floor(score)} pts`;
      soundLose();
    }
    msgText.textContent = message;
    msgEl.classList.add('show');
  }

  function openGame() {
    resetGameState();
    overlay.classList.add('open');
    // Inicializar tablero
    initBoard();
    // Recarga inicial (siempre se ejecuta)
    recargarLadrillos();

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
    console.log('🔚 Juego cerrado');
  }

  // ============================================================
  // EVENTOS Y CONTROLES
  // ============================================================

  document.getElementById('game-close').addEventListener('click', closeGame);
  restartBtn.addEventListener('click', () => { soundTap(); openGame(); });
  overlay.addEventListener('click', e => { if (e.target === overlay) closeGame(); });

  document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
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
    if (!gameRunning) return;
    const touch = e.touches[0];
    if (touch) {
      const rect = stage.getBoundingClientRect();
      const localX = (touch.clientX - rect.left) / scale;
      touchX = Math.min(Math.max(localX - paddle.w / 2, 0), STAGE_W - paddle.w);
      touchActive = true;
    }
  }, { passive: true });
  stage.addEventListener('touchmove', (e) => {
    if (!gameRunning) return;
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) {
      const rect = stage.getBoundingClientRect();
      const localX = (touch.clientX - rect.left) / scale;
      touchX = Math.min(Math.max(localX - paddle.w / 2, 0), STAGE_W - paddle.w);
      touchActive = true;
    }
  }, { passive: false });
  stage.addEventListener('touchend', () => { touchActive = false; }, { passive: true });
  stage.addEventListener('touchcancel', () => { touchActive = false; }, { passive: true });

  window.addEventListener('resize', () => { layoutStage(); draw(); });
  layoutStage();
  resetGameState();
  console.log('✅ Juego ABSCIOD v8.1 implementado');
}
