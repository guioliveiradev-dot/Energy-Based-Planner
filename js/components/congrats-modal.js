// Janela de parabéns com confete. Porte de CongratulationsModal.tsx.
// O confete vem da biblioteca canvas-confetti (carregada por <script> no index.html).
// Se ela não carregar (sem internet), a janela funciona normalmente, só sem confete.

import { createModal } from './modal.js';
import { escapeHtml } from '../ui.js';

function fireConfetti() {
  const confetti = window.confetti;
  if (typeof confetti !== 'function') return;
  const end = Date.now() + 2000;
  const colors = ['#00e5ff', '#8b5cf6', '#22c55e', '#f59e0b'];
  const fire = () => {
    confetti({ particleCount: 15, spread: 60, origin: { y: 0.6 }, colors });
    if (Date.now() < end) requestAnimationFrame(fire);
  };
  fire();
}

// levelUp (opcional): { level, title } quando a tarefa fez o nível subir
// streak (opcional): sequência de dias atual, mostrada se for 1 ou mais
export function showCongratsModal({ taskTitle, points, levelUp = null, streak = 0 }) {
  const modal = createModal({ className: 'congrats-panel neon-glow', overlayClass: 'soft' });
  modal.panel.innerHTML = `
    <div class="congrats-emoji">🎉</div>
    <h2 class="neon-text" style="font-size:1.5rem;font-weight:700">Parabéns!</h2>
    <p class="muted small">Você completou:</p>
    <p style="font-size:1.125rem;font-weight:700">${escapeHtml(taskTitle)}</p>
    <p class="congrats-points">+${points} Pontos Planner</p>
    ${levelUp ? `<p class="congrats-levelup">⬆️ Nível ${levelUp.level}: ${levelUp.title}!</p>` : ''}
    ${streak > 0 ? `<p class="muted small">🔥 ${streak} ${streak === 1 ? 'dia' : 'dias'} seguidos</p>` : ''}
    <button class="btn-neon btn-block" data-role="ok" style="margin-top:1rem">Continuar</button>`;
  modal.panel.querySelector('[data-role="ok"]').addEventListener('click', () => modal.close());
  modal.open();
  modal.panel.querySelector('[data-role="ok"]').focus();
  fireConfetti();
  return modal;
}