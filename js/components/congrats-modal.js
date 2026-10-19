// Janela de parabéns, com a comemoração de fagulhas (js/celebrate.js). Porte de CongratulationsModal.tsx.

import { createModal } from './modal.js';
import { escapeHtml } from '../ui.js';
import { petLevelUpHTML, levelUpInfo } from './pet-levelup.js';
import { celebrate } from '../celebrate.js';

// levelUp (opcional): { level, title } quando a tarefa fez o nível subir
// streak (opcional): sequência de dias atual, mostrada se for 1 ou mais
// petBonus (opcional): { petName, amount } quando o poder do pet deu pontos extras
// petBonus: { message } quando o poder do pet deu pontos extras. petNote: frase extra (ex.: Fênix reacendeu a sequência).
// petLevelUp: { petId, before, after } quando o vínculo do pet subiu de nível com esta tarefa
export function showCongratsModal({ taskTitle, points, petBonus = null, petNote = null, petLevelUp = null, levelUp = null, streak = 0 }) {
  const petUp = levelUpInfo(petLevelUp);
  const modal = createModal({ className: 'congrats-panel neon-glow', overlayClass: 'soft' });
  modal.panel.innerHTML = `
    <div class="congrats-emoji">🎉</div>
    <h2 class="neon-text" style="font-size:1.5rem;font-weight:700">Parabéns!</h2>
    <p class="muted small">Você completou:</p>
    <p style="font-size:1.125rem;font-weight:700">${escapeHtml(taskTitle)}</p>
    <p class="congrats-points">+${points} Pontos Planner</p>
    ${petBonus ? `<p class="congrats-pet small" role="status">✨ ${escapeHtml(petBonus.message)}</p>` : ''}
    ${petNote ? `<p class="congrats-pet small" role="status">🔥 ${escapeHtml(petNote)}</p>` : ''}
    ${petUp ? `<div class="levelup-inline">${petLevelUpHTML(petUp, { size: 84 })}</div>` : ''}
    ${levelUp ? `<p class="congrats-levelup">⬆️ Nível ${levelUp.level}: ${levelUp.title}!</p>` : ''}
    ${streak > 0 ? `<p class="muted small">🔥 ${streak} ${streak === 1 ? 'dia' : 'dias'} seguidos</p>` : ''}
    <button class="btn-neon btn-block" data-role="ok" style="margin-top:1rem">Continuar</button>`;
  modal.panel.querySelector('[data-role="ok"]').addEventListener('click', () => modal.close());
  modal.open();
  modal.panel.querySelector('[data-role="ok"]').focus();
  celebrate('task');
  return modal;
}
