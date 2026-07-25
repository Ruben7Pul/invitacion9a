// sonidos.js - Efectos de audio con Web Audio API
let audioCtx = null;

export function ensureAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function chime(freqs, dur) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  try {
    const ctx = ensureAudioCtx();
    const now = ctx.currentTime;
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0, now + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.09, now + i * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.05 + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + dur + 0.05);
    });
  } catch (e) {}
}

export const soundOpen = () => chime([880, 1318, 1760], 0.5);
export const soundClose = () => chime([1318, 880], 0.35);
export const soundTap = () => chime([1046, 1568], 0.3);
export const soundBrick = () => chime([1200 + Math.random() * 400], 0.18);
export const soundWin = () => chime([784, 988, 1175, 1568], 0.7);
export const soundLose = () => chime([392, 330], 0.5);

export function initSonidos() {
  // Solo inicializa el contexto cuando el usuario interactúa
  document.addEventListener('click', () => ensureAudioCtx(), { once: true });
}
