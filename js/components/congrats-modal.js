// Janela de parabéns da conclusão de tarefa. Porte de CongratulationsModal.tsx.
// Animação calma e rápida: o círculo e o "visto" se desenham, um anel de luz se abre uma vez,
// os pontos sobem contando e as linhas de bônus aparecem uma a uma. Quem pediu "menos movimento" vê tudo pronto.

import { createModal } from './modal.js';
import { escapeHtml } from '../ui.js';
import { petLevelUpHTML, levelUpInfo } from './pet-levelup.js';

const reducedMotion = () => typeof window !== 'undefined' && !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

// Conta de 0 até `target` no elemento. raf/now podem ser trocados (testes). Sem requestAnimationFrame, mostra o valor final.
export function countUp(el, target, { duration = 800, raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : null, now = () => performance.now() } = {}) {
  if (!raf || reducedMotion() || target <= 0) { el.textContent = String(target); return; }
  const start = now();
  el.textContent = '0';
  const step = () => {
    const t = Math.min(1, (now() - start) / duration);
    el.textContent = String(Math.round(target * (1 - (1 - t) ** 3)));     // começa rápido e desacelera
    if (t < 1) raf(step);
  };
  raf(step);
}

const CHECK = `
  <div class="congrats-check" aria-hidden="true">
    <svg viewBox="0 0 64 64" width="76" height="76" fill="none">
      <circle class="cc-fill" cx="32" cy="32" r="28"/>
      <circle class="cc-ring" cx="32" cy="32" r="28" pathLength="100"/>
      <path class="cc-tick" d="M19 33 L28 42 L45 23" pathLength="100"/>
    </svg>
    <span class="cc-pulse"></span>
  </div>`;

// levelUp (opcional): { level, title } quando a tarefa fez o nível subir
// streak (opcional): sequência de dias atual, mostrada se for 1 ou mais
// petBonus: { message } quando o poder do pet deu pontos extras. petNote: frase extra (ex.: Fênix reacendeu a sequência).
// petLevelUp: { petId, before, after } quando o vínculo do pet subiu de nível com esta tarefa
export function showCongratsModal({ taskTitle, points, petBonus = null, petNote = null, petLevelUp = null, levelUp = null, streak = 0 }) {
  const petUp = levelUpInfo(petLevelUp);
  const modal = createModal({ className: 'congrats-panel neon-glow', overlayClass: 'soft' });
  let n = 0;
  const reveal = () => `class="congrats-reveal" style="--i:${n++}"`;
  modal.panel.innerHTML = `
    ${CHECK}
    <h2 class="neon-text" style="font-size:1.5rem;font-weight:700">Parabéns!</h2>
    <p class="muted small">Você completou:</p>
    <p style="font-size:1.125rem;font-weight:700">${escapeHtml(taskTitle)}</p>
    <p class="congrats-points"><span aria-hidden="true">+<span data-count>${points}</span> Pontos Planner</span><span class="sr-only">+${points} Pontos Planner</span></p>
    ${petBonus ? `<p ${reveal()} role="status"><span class="congrats-pet small">✨ ${escapeHtml(petBonus.message)}</span></p>` : ''}
    ${petNote ? `<p ${reveal()} role="status"><span class="congrats-pet small">🔥 ${escapeHtml(petNote)}</span></p>` : ''}
    ${petUp ? `<div ${reveal()}><div class="levelup-inline">${petLevelUpHTML(petUp, { size: 84 })}</div></div>` : ''}
    ${levelUp ? `<p ${reveal()}><span class="congrats-levelup">⬆️ Nível ${levelUp.level}: ${levelUp.title}!</span></p>` : ''}
    ${streak > 0 ? `<p ${reveal()}><span class="muted small">🔥 ${streak} ${streak === 1 ? 'dia' : 'dias'} seguidos</span></p>` : ''}
    <button class="btn-neon btn-block" data-role="ok" style="margin-top:1rem">Continuar</button>`;
  modal.panel.querySelector('[data-role="ok"]').addEventListener('click', () => modal.close());
  modal.open();
  modal.panel.querySelector('[data-role="ok"]').focus();
  countUp(modal.panel.querySelector('[data-count]'), points);
  return modal;
}
