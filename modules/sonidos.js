console.log('📦 sonidos optimizados (buffers)');

let audioCtx = null;
let soundBuffers = {};
let soundEnabled = true;

export function ensureAudioCtx() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  } catch (e) {
    soundEnabled = false;
    return null;
  }
}

function createSoundBuffer(ctx, freqs, dur) {
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
    data[i] = value / totalFreqs;
  }
  return buffer;
}

function preloadSounds() {
  const ctx = ensureAudioCtx();
  if (!ctx) return;
  const soundDefs = {
    tap: { freqs: [1046, 1568], dur: 0.25 },
    brick: { freqs: [1200 + Math.random()*400], dur: 0.15 },
    lose: { freqs: [392, 330], dur: 0.4 },
    open: { freqs: [880, 1318, 1760], dur: 0.4 },
    close: { freqs: [1318, 880], dur: 0.3 },
    win: { freqs: [784, 988, 1175, 1568], dur: 0.6 },
    clay: { freqs: [600, 800], dur: 0.15 },
    wood: { freqs: [400, 500, 300], dur: 0.25 },
    iron: { freqs: [200, 250, 300, 350], dur: 0.3 },
    powerup_good: { freqs: [988, 1318, 1760], dur: 0.3 },
    powerup_bad: { freqs: [440, 370, 330], dur: 0.4 },
    extra_life: { freqs: [880, 1175, 1568, 2093], dur: 0.5 },
    blue_ball: { freqs: [523, 659, 784, 988, 1175], dur: 0.6 },
    wall_hit: { freqs: [880, 660], dur: 0.1 },
    game_over: { freqs: [440, 370, 330, 294], dur: 0.6 },
    paddle_hit: { freqs: [1200, 900], dur: 0.08 }
  };
  for (const [name, def] of Object.entries(soundDefs)) {
    soundBuffers[name] = createSoundBuffer(ctx, def.freqs, def.dur);
  }
}

function playSound(name) {
  if (!soundEnabled) return;
  try {
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    const buffer = soundBuffers[name];
    if (!buffer) return;
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
export const soundExtraLife = () => playSound('extra_life');
export const soundBlueBall = () => playSound('blue_ball');
export const soundWallHit = () => playSound('wall_hit');
export const soundGameOver = () => playSound('game_over');
export const soundPaddleHit = () => playSound('paddle_hit');

export function initSonidos() {
  document.addEventListener('click', () => {
    const ctx = ensureAudioCtx();
    if (ctx && Object.keys(soundBuffers).length === 0) {
      preloadSounds();
    }
  }, { once: true });
}
