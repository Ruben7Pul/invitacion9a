console.log('📦 sonidos optimizados (buffers)');

let audioCtx = null;
let soundBuffers = {};
let soundEnabled = true;

export function ensureAudioCtx() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (e) {
    console.warn('⚠️ No se pudo crear AudioContext:', e);
    soundEnabled = false;
    return null;
  }
}

function createSoundBuffer(ctx, freqs, dur, vol = 0.5) {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * dur * 1.5);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  const totalFreqs = freqs.length;
  for (let i = 0; i < length; i++) {
    let t = i / sampleRate;
    let value = 0;
    for (let f = 0; f < totalFreqs; f++) {
      const freq = freqs[f];
      const startDelay = f * 0.04;
      if (t >= startDelay) {
        const envelope = Math.exp(-6 * (t - startDelay) / dur) * 0.3;
        value += Math.sin(2 * Math.PI * freq * (t - startDelay)) * envelope;
      }
    }
    data[i] = (value / totalFreqs) * vol;
  }
  return buffer;
}

function preloadSounds() {
  const ctx = ensureAudioCtx();
  if (!ctx) return;
  
  const soundDefs = {
    // Sonidos existentes (ajustados)
    tap: { freqs: [1046, 1568], dur: 0.25, vol: 0.4 },
    brick: { freqs: [1200], dur: 0.12, vol: 0.3 },
    lose: { freqs: [392, 330], dur: 0.35, vol: 0.5 },
    open: { freqs: [880, 1318, 1760], dur: 0.4, vol: 0.4 },
    close: { freqs: [1318, 880], dur: 0.3, vol: 0.4 },
    win: { freqs: [784, 988, 1175, 1568], dur: 0.6, vol: 0.5 },
    clay: { freqs: [600, 800], dur: 0.12, vol: 0.3 },
    wood: { freqs: [400, 500, 300], dur: 0.2, vol: 0.35 },
    iron: { freqs: [200, 250, 300, 350], dur: 0.25, vol: 0.4 },
    
    // Power-ups (solo al recoger)
    powerup_good: { freqs: [988, 1318, 1760], dur: 0.35, vol: 0.5 },
    powerup_bad: { freqs: [440, 370, 330], dur: 0.4, vol: 0.5 },
    blue_ball: { freqs: [523, 659, 784, 988, 1175], dur: 0.5, vol: 0.6 },
    
    // Vida extra (más alto)
    extra_life: { freqs: [880, 1175, 1568, 2093], dur: 0.5, vol: 0.8 },
    
    // Rebotes (más finos y suaves)
    wall_hit: { freqs: [880, 660], dur: 0.06, vol: 0.2 },
    paddle_hit: { freqs: [1200, 900], dur: 0.05, vol: 0.25 },
    
    // Game Over (más largo, tipo arcade)
    game_over: { freqs: [440, 370, 330, 294, 262], dur: 0.9, vol: 0.6 },
    
    // Niebla (viento)
    fog_appear: { freqs: [200, 150, 100], dur: 0.8, vol: 0.3 },
    fog_disappear: { freqs: [100, 150, 200], dur: 0.6, vol: 0.25 }
  };
  
  for (const [name, def] of Object.entries(soundDefs)) {
    soundBuffers[name] = createSoundBuffer(ctx, def.freqs, def.dur, def.vol);
  }
  console.log('✅ Sonidos precargados:', Object.keys(soundBuffers).length);
}

function playSound(name) {
  if (!soundEnabled) return;
  try {
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    let buffer = soundBuffers[name];
    if (!buffer) {
      // Si no existe, crearlo sobre la marcha
      const defs = {
        tap: { freqs: [1046, 1568], dur: 0.25, vol: 0.4 },
        brick: { freqs: [1200], dur: 0.12, vol: 0.3 },
        lose: { freqs: [392, 330], dur: 0.35, vol: 0.5 },
        open: { freqs: [880, 1318, 1760], dur: 0.4, vol: 0.4 },
        close: { freqs: [1318, 880], dur: 0.3, vol: 0.4 },
        win: { freqs: [784, 988, 1175, 1568], dur: 0.6, vol: 0.5 },
        clay: { freqs: [600, 800], dur: 0.12, vol: 0.3 },
        wood: { freqs: [400, 500, 300], dur: 0.2, vol: 0.35 },
        iron: { freqs: [200, 250, 300, 350], dur: 0.25, vol: 0.4 },
        powerup_good: { freqs: [988, 1318, 1760], dur: 0.35, vol: 0.5 },
        powerup_bad: { freqs: [440, 370, 330], dur: 0.4, vol: 0.5 },
        blue_ball: { freqs: [523, 659, 784, 988, 1175], dur: 0.5, vol: 0.6 },
        extra_life: { freqs: [880, 1175, 1568, 2093], dur: 0.5, vol: 0.8 },
        wall_hit: { freqs: [880, 660], dur: 0.06, vol: 0.2 },
        paddle_hit: { freqs: [1200, 900], dur: 0.05, vol: 0.25 },
        game_over: { freqs: [440, 370, 330, 294, 262], dur: 0.9, vol: 0.6 },
        fog_appear: { freqs: [200, 150, 100], dur: 0.8, vol: 0.3 },
        fog_disappear: { freqs: [100, 150, 200], dur: 0.6, vol: 0.25 }
      };
      const def = defs[name];
      if (!def) return;
      soundBuffers[name] = createSoundBuffer(ctx, def.freqs, def.dur, def.vol);
      buffer = soundBuffers[name];
      if (!buffer) return;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.5;
    source.connect(gain).connect(ctx.destination);
    source.start();
  } catch (e) {
    console.warn('⚠️ Error reproduciendo sonido:', e);
    soundEnabled = false;
  }
}

// Exportar funciones
export const soundTap = () => playSound('tap');
export const soundBrick = () => playSound('brick');
export const soundLose = () => playSound('lose');
export const soundOpen = () => playSound('open');
export const soundClose = () => playSound('close');
export const soundWin = () => playSound('win');
export const soundClay = () => playSound('clay');
export const soundWood = () => playSound('wood');
export const soundIron = () => playSound('iron');
export const soundPowerupGood = () => playSound('powerup_good');
export const soundPowerupBad = () => playSound('powerup_bad');
export const soundBlueBall = () => playSound('blue_ball');
export const soundExtraLife = () => playSound('extra_life');
export const soundWallHit = () => playSound('wall_hit');
export const soundPaddleHit = () => playSound('paddle_hit');
export const soundGameOver = () => playSound('game_over');
export const soundFogAppear = () => playSound('fog_appear');
export const soundFogDisappear = () => playSound('fog_disappear');

export function initSonidos() {
  // Precargar inmediatamente
  setTimeout(preloadSounds, 100);
  // También al hacer clic (por si el contexto está suspendido)
  document.addEventListener('click', () => {
    const ctx = ensureAudioCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    if (Object.keys(soundBuffers).length === 0) preloadSounds();
  }, { once: true });
}
