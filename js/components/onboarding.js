// Tutorial inicial em 6 passos. Porte de Onboarding.tsx.
// Uso: showOnboarding({ onComplete }) -> { close() }

import { icon } from '../icons.js';
import { lockBackground, unlockBackground } from './modal.js';

const STEPS = [
  { icon: 'logo', title: 'Bem-vindo ao Energy Based Planner!',
    description: 'Gerencie suas tarefas com base no seu nível de energia, não apenas no horário.',
    tip: 'Deslize para ver como funciona →', color: 'hsl(190, 100%, 50%)' },
  { icon: 'zap', title: 'Home — Gerar Missão',
    description: 'Ajuste o slider de energia (1-10) e informe quanto tempo você tem. Toque em "Gerar Missão" e o app sugere a tarefa ideal para o momento.',
    tip: '💡 O app verifica se você está em horário bloqueado pela rotina.', color: 'hsl(190, 100%, 50%)' },
  { icon: 'list-todo', title: 'Tarefas — Organize Tudo',
    description: 'Crie tarefas com título, custo de energia (1-10), duração, prazo e categoria. Inicie o cronômetro e ganhe Pontos Planner ao concluir!',
    tip: '💡 Fórmula: Pontos = (Energia × 10) + (Minutos × 0.5)', color: 'hsl(150, 100%, 50%)' },
  { icon: 'calendar', title: 'Rotina — Bloqueie Horários',
    description: 'Adicione blocos fixos como escola, trabalho ou academia. O app não vai sugerir tarefas nesses horários.',
    tip: '💡 Cada dia da semana pode ter blocos diferentes.', color: 'hsl(45, 100%, 55%)' },
  { icon: 'shopping-bag', title: 'Loja — Recompensas, Temas & Pets',
    description: 'Crie recompensas personalizadas, compre temas de cores e pets que acompanham seu cronômetro! Tudo com Pontos Planner.',
    tip: '💡 Ex: "Jogar Videogame" por 500 Pontos.', color: 'hsl(265, 100%, 68%)' },
  { icon: 'trophy', title: 'Conquistas — Desbloqueie Todas!',
    description: 'Complete tarefas e resgate recompensas para desbloquear badges especiais. Quanto mais você produz, mais conquistas acumula!',
    tip: '🎯 Pronto para começar? Vamos lá!', color: 'hsl(45, 100%, 55%)' },
];

export function showOnboarding({ onComplete }) {
  let current = 0;
  const el = document.createElement('div');
  el.className = 'onboarding';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'onb-title');

  function draw() {
    const step = STEPS[current];
    const isLast = current === STEPS.length - 1;
    el.innerHTML = `
      <button class="onb-close" data-act="finish" aria-label="Pular introdução">${icon('x', 20)}</button>
      <div class="onb-step">
        <div class="onb-icon animate-float" style="background:linear-gradient(135deg, ${step.color}, hsl(265, 100%, 68%))">${step.icon === 'logo' ? '<span class="logo-mark" style="--s:3.25rem"></span>' : icon(step.icon, 36)}</div>
        <h2 class="onb-title" id="onb-title">${step.title}</h2>
        <p class="onb-desc">${step.description}</p>
        <div class="glass-card onb-tip">${step.tip}</div>
      </div>
      <div class="onb-dots">${STEPS.map((_, i) => `<span class="${i === current ? 'active' : ''}"></span>`).join('')}</div>
      <div class="onb-actions">
        ${current > 0 ? `<button class="glass-card onb-back" data-act="back">${icon('chevron-left', 16)} Voltar</button>` : ''}
        <button class="btn-neon onb-next" data-act="next">${isLast ? 'Começar!' : 'Próximo'}${isLast ? '' : icon('chevron-right', 16)}</button>
      </div>`;
    el.querySelector('[data-act="next"]').focus();
  }

  let open = true;
  function dismiss() {
    if (!open) return;
    open = false;
    el.remove();
    unlockBackground();
  }
  function finish() {
    dismiss();
    onComplete();
  }

  el.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'finish') finish();
    else if (act === 'back') { current--; draw(); }
    else if (act === 'next') {
      if (current === STEPS.length - 1) finish();
      else { current++; draw(); }
    }
  });

  draw();
  document.body.appendChild(el);
  lockBackground();
  return { close: dismiss };
}
