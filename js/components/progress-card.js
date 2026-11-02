// Cartão da sequência de dias (com os últimos 7 dias) + cartão de nível (usados na Home e no Perfil).
// Uso: element.innerHTML = progressCardHTML(levelInfo(pontos), streakInfo(tarefas));

import { icon } from '../icons.js';

const days = (n) => `${n} ${n === 1 ? 'dia' : 'dias'}`;
const LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];   // domingo a sábado

function streakCardHTML(streak) {
  let title, hint;
  if (streak.current === 0) { title = 'Sua sequência'; hint = 'Conclua uma tarefa hoje para iniciar uma sequência'; }
  else {
    title = `${days(streak.current)} seguidos`;
    hint = streak.doneToday ? 'Você já fez uma tarefa hoje' : 'Conclua uma tarefa hoje para manter';
    if (streak.best > streak.current) hint += ` · recorde: ${days(streak.best)}`;
  }
  const recent = streak.recent || [];
  const dots = recent.map((d, i) => {
    const today = i === recent.length - 1;
    return `<div><i class="${d.done ? 'done' : ''}${today ? ' today' : ''}" aria-hidden="true">${d.done ? icon('check', 14, 'ico') : ''}</i><span>${today ? '<b>Hoje</b>' : LETTERS[d.weekday]}</span></div>`;
  }).join('');
  const feitos = recent.filter((d) => d.done).length;
  return `
    <div class="glass-card pad-lg streak-card">
      <div class="streak-top">
        <span class="streak-flame ${streak.alive ? '' : 'off'}" aria-hidden="true">${icon('flame', 28, 'ico')}</span>
        <div style="min-width:0"><p class="streak-big">${title}</p><p class="streak-hint">${hint}</p></div>
      </div>
      ${recent.length ? `<div class="week-dots" role="img" aria-label="Últimos 7 dias: tarefas concluídas em ${feitos} deles.">${dots}</div>` : ''}
    </div>`;
}

export function progressCardHTML(level, streak) {
  return `
    <div class="stack" style="gap:0.75rem">
      ${streakCardHTML(streak)}
      <div class="glass-card pad-lg stack progress-card" style="gap:0.75rem">
        <div class="row" style="gap:0.75rem">
          <span class="level-badge" aria-hidden="true">${level.level}</span>
          <div style="min-width:0">
            <p class="level-title">Nível ${level.level} · ${level.title}</p>
            <p class="muted xs">${level.into} / ${level.needed} pontos para o nível ${level.level + 1}</p>
          </div>
        </div>
        <div class="progress" role="progressbar" aria-label="Progresso para o próximo nível" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${level.percent}">
          <div class="progress-bar" style="width:${level.percent}%"></div>
        </div>
      </div>
    </div>`;
}
