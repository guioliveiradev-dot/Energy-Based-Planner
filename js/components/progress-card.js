// Cartão de nível + sequência de dias (usado na Home e no Perfil).
// Uso: element.innerHTML = progressCardHTML(levelInfo(pontos), streakInfo(tarefas));

const days = (n) => `${n} ${n === 1 ? 'dia' : 'dias'}`;

export function progressCardHTML(level, streak) {
  let streakText;
  if (streak.current === 0) streakText = 'Conclua uma tarefa hoje para iniciar uma sequência';
  else if (streak.doneToday) streakText = `${days(streak.current)} seguidos`;
  else streakText = `${days(streak.current)} seguidos · conclua uma tarefa hoje para manter`;

  return `
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
      <p class="streak-line ${streak.alive ? 'on' : ''}">
        <span aria-hidden="true">🔥</span>
        <span>${streakText}</span>
        ${streak.best > streak.current ? `<span class="muted xs">(recorde: ${days(streak.best)})</span>` : ''}
      </p>
    </div>`;
}