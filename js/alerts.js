// Aviso de fim do cronômetro: vibração + três bipes. Respeita a preferência "alerts".

import { getSetting } from './settings.js';

function beeps() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  if (ctx.state === 'suspended') ctx.resume();
  [0, 0.28, 0.56].forEach((delay, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = i === 2 ? 1046 : 784;
    const t = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.22);
  });
  setTimeout(() => ctx.close(), 1500);
}

export function notifyTimerDone() {
  if (!getSetting('alerts')) return;
  try { navigator.vibrate?.([200, 100, 200, 100, 400]); } catch { /* sem vibração */ }
  try { beeps(); } catch { /* sem áudio */ }
}
