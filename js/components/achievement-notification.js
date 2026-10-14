// Aviso de "Conquista Desbloqueada". Porte de AchievementNotification.tsx.
// Confere as conquistas a cada 3 s; quando aparece uma nova, mostra o aviso 2 s depois
// (para não atropelar a janela de parabéns).
//
// Uso: const stop = startAchievementWatcher(); ... stop();

import { getUserTasks, getUserRedemptionHistory } from '../db.js';
import * as auth from '../auth.js';
import { ACHIEVEMENTS, getUnlocked } from '../achievements.js';
import { createModal } from './modal.js';
import { icon } from '../icons.js';
import { confettiBurst } from '../confetti.js';

export function startAchievementWatcher({ pollMs = 3000, delayMs = 2000 } = {}) {
  let previous = null;       // null = ainda não fez a primeira leitura
  let modal = null;
  let stopped = false;
  const timeouts = new Set();

  function showPopup(ach) {
    if (stopped) return;
    if (modal) modal.close();
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
    confettiBurst({ particleCount: 80, spread: 70, origin: { y: 0.5 }, colors: ['#ffd700', '#ff6b6b', '#00e5ff', '#8b5cf6'] });
  }

  async function check() {
    const user = auth.state.user;
    if (!user || stopped) return;
    const [tasks, history] = await Promise.all([getUserTasks(user.id), getUserRedemptionHistory(user.id)]);
    if (stopped) return;
    const current = new Set(getUnlocked(tasks, history).map((a) => a.id));

    if (previous === null) { previous = current; return; }   // primeira leitura: só memoriza

    const fresh = ACHIEVEMENTS.find((a) => current.has(a.id) && !previous.has(a.id));
    previous = current;
    if (fresh) {
      const id = setTimeout(() => { timeouts.delete(id); showPopup(fresh); }, delayMs);
      timeouts.add(id);
    }
  }

  check();
  const interval = setInterval(check, pollMs);

  return () => {
    stopped = true;
    clearInterval(interval);
    timeouts.forEach(clearTimeout);
    timeouts.clear();
    if (modal) modal.close();
  };
}
