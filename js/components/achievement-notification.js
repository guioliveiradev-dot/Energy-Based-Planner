// Aviso de "Conquista Desbloqueada". Porte de AchievementNotification.tsx.
// Confere as conquistas a cada 3 s. Quando aparece uma nova, entra numa FILA e só é mostrada quando não houver
// nenhuma outra janela aberta (parabéns, subida de nível do pet, painel admin...): nunca uma por cima da outra.
// Várias conquistas ao mesmo tempo aparecem uma depois da outra.
//
// Uso: const stop = startAchievementWatcher(); ... stop();

import { getUserTasks, getUserRedemptionHistory } from '../db.js';
import * as auth from '../auth.js';
import { ACHIEVEMENTS, getUnlocked, loadPetContext } from '../achievements.js';
import { createModal, isModalOpen, whenModalsClosed } from './modal.js';
import { icon } from '../icons.js';
import { celebrate } from '../celebrate.js';

// delayMs: espera depois de detectar (a janela de parabéns costuma abrir nesse intervalo)
// settleMs: pausa depois que a janela anterior fecha, antes de mostrar a conquista
export function startAchievementWatcher({ pollMs = 3000, delayMs = 1200, settleMs = 700 } = {}) {
  let previous = null;       // null = ainda não fez a primeira leitura
  let modal = null;
  let stopped = false;
  let pumping = false;
  const queue = [];
  const timeouts = new Set();

  const later = (fn, ms) => {
    const id = setTimeout(() => { timeouts.delete(id); fn(); }, ms);
    timeouts.add(id);
  };

  function showPopup(ach) {
    modal = createModal({ className: 'achv-panel neon-glow', overlayClass: 'soft top' });
    modal.panel.innerHTML = `
      <div class="achv-icon" style="background:radial-gradient(circle, color-mix(in srgb, ${ach.color} 19%, transparent), transparent);box-shadow:0 0 40px color-mix(in srgb, ${ach.color} 25%, transparent);color:${ach.color}">${icon(ach.icon, 36)}</div>
      <div class="stack" style="gap:0.5rem">
        <p class="achv-kicker" style="color:${ach.color}">🏆 Conquista Desbloqueada!</p>
        <h3 style="font-size:1.25rem;font-weight:700">${ach.title}</h3>
        <p class="muted small">${ach.description}</p>
      </div>
      <button class="btn-neon btn-block" data-role="ok">Incrível! ✨</button>`;
    modal.panel.querySelector('[data-role="ok"]').addEventListener('click', () => modal.close());
    modal.open();
    modal.panel.querySelector('[data-role="ok"]').focus();
    celebrate('achievement', { origin: { x: 0.5, y: 0.45 } });
  }

  // Mostra a próxima da fila, se não houver outra janela aberta; senão espera ela fechar.
  function pump() {
    if (stopped || pumping || queue.length === 0) return;
    pumping = true;
    const tryShow = () => {
      if (stopped) { pumping = false; return; }
      if (isModalOpen()) { whenModalsClosed(() => later(tryShow, settleMs)); return; }
      showPopup(queue.shift());
      pumping = false;
      whenModalsClosed(() => later(pump, settleMs));    // quando esta fechar, vem a próxima
    };
    later(tryShow, delayMs);
  }

  async function check() {
    const user = auth.state.user;
    if (!user || stopped) return;
    const [tasks, history, pets] = await Promise.all([getUserTasks(user.id), getUserRedemptionHistory(user.id), loadPetContext(user.id)]);
    if (stopped) return;
    const current = new Set(getUnlocked(tasks, history, pets).map((a) => a.id));

    if (previous === null) { previous = current; return; }   // primeira leitura: só memoriza

    const fresh = ACHIEVEMENTS.filter((a) => current.has(a.id) && !previous.has(a.id));
    previous = current;
    queue.push(...fresh);
    pump();
  }

  check();
  const interval = setInterval(check, pollMs);

  return () => {
    stopped = true;
    clearInterval(interval);
    timeouts.forEach(clearTimeout);
    timeouts.clear();
    queue.length = 0;
    if (modal) modal.close();
  };
}
