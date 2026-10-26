// Tela de estatísticas (aba "Estatísticas" do Perfil). Recebe o resultado de computeStats() e devolve o HTML.
// Tom calmo: mostra o que você fez, nunca o que "faltou". Os números aparecem em texto, não só em cor.

import { escapeHtml } from '../ui.js';
import { CATEGORY_EMOJI } from '../categories.js';
import { WEEKDAY_NAMES, PERIODS, formatMinutes } from '../stats.js';

const WEEKDAY_PHRASE = ['nas segundas', 'nas terças', 'nas quartas', 'nas quintas', 'nas sextas', 'aos sábados', 'aos domingos'];
const PERIOD_PHRASE = { morning: 'de manhã', afternoon: 'à tarde', evening: 'à noite', night: 'de madrugada' };
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const dateLabel = (ts) => { const d = new Date(ts); return `${d.getDate()} ${['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][d.getMonth()]}`; };

const bar = (pct) => `<span class="stat-track" aria-hidden="true"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></span>`;
const card = (id, title, body) => `<section class="glass-card pad stack" aria-labelledby="${id}"><h3 id="${id}" class="section-title">${title}</h3>${body}</section>`;

function summary(s) {
  return `
    <div class="stat-grid">
      <div class="stat-tile"><span class="muted xs">Tarefas concluídas</span><strong class="stat-value">${s.completed}</strong></div>
      <div class="stat-tile"><span class="muted xs">Tempo focado</span><strong class="stat-value">${formatMinutes(s.focus.total)}</strong></div>
      <div class="stat-tile"><span class="muted xs">Sequência atual</span><strong class="stat-value">${plural(s.streak.current, 'dia', 'dias')}</strong><span class="muted xs">recorde: ${plural(s.streak.best, 'dia', 'dias')}</span></div>
      <div class="stat-tile"><span class="muted xs">Média nos dias ativos</span><strong class="stat-value">${String(s.perActiveDay).replace('.', ',')}</strong><span class="muted xs">tarefas por dia</span></div>
    </div>`;
}

function heat(h) {
  const cells = h.columns.map((col) => col.map((c) => {
    const label = c.future ? '' : `${dateLabel(c.date)}: ${c.count === 0 ? 'nenhuma tarefa' : plural(c.count, 'tarefa', 'tarefas')}`;
    return `<span class="heat-cell h${c.level}${c.today ? ' today' : ''}${c.future ? ' future' : ''}"${label ? ` title="${label}"` : ''}></span>`;
  }).join('')).join('');
  const text = h.total === 0
    ? 'Nenhuma tarefa nas últimas 16 semanas.'
    : `${plural(h.activeDays, 'dia com tarefas', 'dias com tarefas')} nas últimas 16 semanas${h.best.count ? `. Melhor dia: ${plural(h.best.count, 'tarefa', 'tarefas')} em ${dateLabel(new Date(h.best.key + 'T12:00:00').getTime())}` : ''}.`;
  return card('st-heat', 'Seus dias', `
    <p class="muted xs">${text}</p>
    <div class="heat-wrap">
      <div class="heat-months" aria-hidden="true">${h.months.map((m) => `<span>${m}</span>`).join('')}</div>
      <div class="heat" role="img" aria-label="Mapa de calor das últimas 16 semanas, uma coluna por semana. ${text}">${cells}</div>
    </div>
    <div class="heat-legend xs muted" aria-hidden="true">Menos ${[0, 1, 2, 3, 4].map((l) => `<span class="heat-cell h${l}"></span>`).join('')} Mais</div>`);
}

function focus(f) {
  const tile = (label, minutes) => `<div class="stat-tile"><span class="muted xs">${label}</span><strong class="stat-value">${formatMinutes(minutes)}</strong></div>`;
  return card('st-focus', 'Tempo focado', `<div class="stat-grid">${tile('Hoje', f.today)}${tile('Últimos 7 dias', f.week)}${tile('Últimos 30 dias', f.month)}${tile('Total', f.total)}</div>
    <p class="muted xs">Soma da duração das tarefas que você concluiu.</p>`);
}

function categories(list) {
  if (list.length === 0) return '';
  return card('st-cat', 'Tarefas por categoria', `<ul class="stat-list">${list.map((c) => `
    <li><span class="stat-label small">${CATEGORY_EMOJI[c.id] || ''} ${escapeHtml(c.label)}</span>${bar(c.percent)}<span class="stat-num small">${c.count} (${c.percent}%)</span></li>`).join('')}</ul>`);
}

function weekdays(w) {
  const sentence = w.best === null ? '' : `<p class="small">Você conclui mais tarefas <strong>${WEEKDAY_PHRASE[w.best]}</strong> (${plural(w.max, 'tarefa', 'tarefas')}).</p>`;
  return card('st-week', 'Melhores dias da semana', `${sentence}<ul class="stat-list">${w.counts.map((n, i) => `
    <li${i === w.best ? ' class="best"' : ''}><span class="stat-label small">${WEEKDAY_NAMES[i]}${i === w.best ? ' ★' : ''}</span>${bar(w.max ? (n / w.max) * 100 : 0)}<span class="stat-num small">${n}</span></li>`).join('')}</ul>`);
}

function periods(p) {
  const sentence = p.best === null ? '' : `<p class="small">Você rende mais <strong>${PERIOD_PHRASE[p.best]}</strong>.</p>`;
  return card('st-period', 'Melhor horário', `${sentence}<ul class="stat-list">${PERIODS.map((x) => `
    <li${x.id === p.best ? ' class="best"' : ''}><span class="stat-label small">${x.label} <span class="muted xs">(${x.range})</span></span>${bar(p.max ? (p.counts[x.id] / p.max) * 100 : 0)}<span class="stat-num small">${p.counts[x.id]}</span></li>`).join('')}</ul>`);
}

function habits(list) {
  const body = list.length === 0
    ? '<p class="muted small">Tarefas que se repetem aparecem aqui. Crie uma tarefa com repetição para acompanhar seu hábito semana a semana.</p>'
    : `<ul class="stat-list habits">${list.map((h) => {
      const last4 = h.weeks.reduce((a, b) => a + b, 0);
      const max = Math.max(...h.weeks, 1);
      return `<li><span class="stat-label small">${escapeHtml(h.title)}</span>
        <span class="habit-weeks" aria-hidden="true">${h.weeks.map((n) => `<i style="height:${Math.max(12, (n / max) * 100)}%"${n === 0 ? ' class="zero"' : ''}></i>`).join('')}</span>
        <span class="stat-num small">${plural(last4, 'vez', 'vezes')}</span>
        <span class="muted xs habit-note">Semana a semana (da mais antiga para a atual): ${h.weeks.join(', ')}</span></li>`;
    }).join('')}</ul>`;
  return card('st-habit', 'Histórico de hábitos', `${body}<p class="muted xs">Últimas 4 semanas.</p>`);
}

export function statsHTML(s) {
  if (s.completed === 0) {
    return card('st-empty', 'Estatísticas', '<p class="muted small">Conclua sua primeira tarefa para ver aqui o mapa dos seus dias, o tempo focado e os seus melhores horários.</p>');
  }
  return summary(s) + heat(s.heat) + focus(s.focus) + categories(s.categories) + weekdays(s.weekdays) + periods(s.periods) + habits(s.habits);
}
