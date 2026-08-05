// sonidos.js – versión ligera (solo sonidos esenciales)
console.log('📦 sonidos optimizados (buffers)');

let audioCtx = null;
let soundBuffers = {};
let soundEnabled = true;

export function ensureAudioCtx() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  } catch (e) {
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
  if (ctx.state !== 'running') return;
  const soundDefs = {
    brick:        { freqs: [600, 800], dur: 0.15, vol: 0.4 },
    lose:         { freqs: [392, 330], dur: 0.35, vol: 0.5 },
    game_over:    { freqs: [440, 370, 330, 294, 262], dur: 0.9, vol: 0.6 },
    extra_life:   { freqs: [880, 1175, 1568, 2093], dur: 0.5, vol: 0.8 },
    powerup_good: { freqs: [988, 1318, 1760], dur: 0.35, vol: 0.5 },
    powerup_bad:  { freqs: [440, 370, 330], dur: 0.4, vol: 0.5 }
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
    if (ctx.state !== 'running') {
      ctx.resume().catch(() => {});
      return;
    }
    let buffer = soundBuffers[name];
    if (!buffer) {
      const defs = {
        brick:        { freqs: [600, 800], dur: 0.15, vol: 0.4 },
        lose:         { freqs: [392, 330], dur: 0.35, vol: 0.5 },
        game_over:    { freqs: [440, 370, 330, 294, 262], dur: 0.9, vol: 0.6 },
        extra_life:   { freqs: [880, 1175, 1568, 2093], dur: 0.5, vol: 0.8 },
        powerup_good: { freqs: [988, 1318, 1760], dur: 0.35, vol: 0.5 },
        powerup_bad:  { freqs: [440, 370, 330], dur: 0.4, vol: 0.5 }
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
    soundEnabled = false;
  }
}

export const soundBrick = () => playSound('brick');
export const soundLose = () => playSound('lose');
export const soundGameOver = () => playSound('game_over');
export const soundExtraLife = () => playSound('extra_life');
export const soundPowerupGood = () => playSound('powerup_good');
export const soundPowerupBad = () => playSound('powerup_bad');

export function initSonidos() {
  document.addEventListener('click', () => {
    const ctx = ensureAudioCtx();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
      if (Object.keys(soundBuffers).length === 0) {
        setTimeout(preloadSounds, 100);
      }
    }
  }, { once: true });
}
