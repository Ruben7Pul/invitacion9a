console.log('📦 sonidos (fallback)');

let audioCtx = null;
let soundEnabled = true;

export function ensureAudioCtx() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    console.warn('⚠️ Web Audio no soportado, sonidos desactivados');
    soundEnabled = false;
    return null;
  }
}

function chime(freqs, dur) {
  if (!soundEnabled) return;
  try {
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0, now + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.04, now + i * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.05 + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + dur + 0.05);
    });
  } catch (e) {
    soundEnabled = false;
    console.warn('🔇 Sonidos desactivados por error');
  }
}

export const soundOpen = () => chime([880, 1318, 1760], 0.4);
export const soundClose = () => chime([1318, 880], 0.3);
export const soundTap = () => chime([1046, 1568], 0.25);
export const soundBrick = () => chime([1200 + Math.random()*400], 0.15);
export const soundWin = () => chime([784, 988, 1175, 1568], 0.6);
export const soundLose = () => chime([392, 330], 0.4);

export function initSonidos() {
  console.log('🔊 Sonidos listos (se activarán al hacer clic)');
  document.addEventListener('click', () => ensureAudioCtx(), { once: true });
}
