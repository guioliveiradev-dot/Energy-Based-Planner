// Tela de estatísticas (aba "Estatísticas" do Perfil). Recebe o resultado de computeStats() e devolve o HTML.
// Tom calmo: mostra o que você fez, nunca o que "faltou". Os números aparecem em texto, não só em cor.

import { escapeHtml } from '../ui.js';
import { icon } from '../icons.js';
import { categoryIcon } from '../categories.js';
import { WEEKDAY_NAMES, PERIODS, formatMinutes } from '../stats.js';
import { MIN_LOGS } from '../energy-log.js';

const WEEKDAY_PHRASE = ['nas segundas', 'nas terças', 'nas quartas', 'nas quintas', 'nas sextas', 'aos sábados', 'aos domingos'];
const PERIOD_NOUN = { morning: 'a manhã', afternoon: 'a tarde', evening: 'a noite', night: 'a madrugada' };
const PERIOD_PHRASE = { morning: 'de manhã', afternoon: 'à tarde', evening: 'à noite', night: 'de madrugada' };
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const bar = (pct) => `<span class="stat-track" aria-hidden="true"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></span>`;
const card = (id, title, body) => `<section class="glass-card pad stack" aria-labelledby="${id}"><h3 id="${id}" class="section-title">${title}</h3>${body}</section>`;

function tiles(s) {
  const streak = `${plural(s.streak.current, 'dia', 'dias')}`;
  return `
    <div class="stat-tiles">
      <div class="stat-tile"><span class="muted xs">Tarefas</span><strong class="stat-value">${s.completed}</strong></div>
      <div class="stat-tile"><span class="muted xs">Tempo focado</span><strong class="stat-value">${formatMinutes(s.focus.total)}</strong></div>
      <div class="stat-tile"><span class="muted xs">Sequência</span><strong class="stat-value">${streak}</strong>${s.streak.best > s.streak.current ? `<span class="muted xs">recorde: ${plural(s.streak.best, 'dia', 'dias')}</span>` : ''}</div>
    </div>`;
}

// Colunas "Esta semana": segunda a domingo. Dias que ainda não chegaram ficam apagados e sem número.
function week(w) {
  const label = `Tarefas concluídas por dia nesta semana: ${w.days.filter((d) => !d.future).map((d) => `${d.name} ${d.count}`).join(', ')}.`;
  const cols = w.days.map((d) => `<div class="${d.today ? 'today' : ''}${d.future ? ' future' : ''}">
      <b>${d.future ? '' : d.count}</b><i class="${d.count === 0 ? 'zero' : ''}" style="height:${d.count === 0 ? 4 : Math.max(8, (d.count / w.max) * 72)}%"></i><span>${d.letter}</span></div>`).join('');
  return card('st-week-now', 'Esta semana', `<div class="week-bars" role="img" aria-label="${label}">${cols}</div>
    <p class="muted xs">${w.total === 0 ? 'Nenhuma tarefa concluída nesta semana ainda.' : `${plural(w.total, 'tarefa concluída', 'tarefas concluídas')} nesta semana.`}</p>`);
}

// Semana a semana: as últimas 6 semanas (a rotulada com a data da segunda-feira; a última é a atual).
function weekly(x) {
  const label = `Tarefas concluídas por semana: ${x.weeks.map((w) => `semana de ${w.label}, ${w.count}`).join('; ')}.`;
  const cols = x.weeks.map((w) => `<div class="${w.current ? 'today' : ''}"><b>${w.count}</b><i class="${w.count === 0 ? 'zero' : ''}" style="height:${w.count === 0 ? 4 : Math.max(8, (w.count / x.max) * 72)}%"></i><span>${w.label}</span></div>`).join('');
  return card('st-weekly', 'Semana a semana', `<div class="week-bars weeks" role="img" aria-label="${label}">${cols}</div>
    <p class="muted xs">Cada coluna é uma semana, com a data da segunda-feira. A última é a semana atual.</p>`);
}

function insight(s) {
  const p = s.periods.best === null ? null : PERIOD_PHRASE[s.periods.best];
  const d = s.weekdays.best === null ? null : WEEKDAY_PHRASE[s.weekdays.best];
  if (!p && !d) return '';
  const text = p && d ? `Você costuma concluir mais tarefas <strong>${p}</strong>, principalmente <strong>${d}</strong>.` : `Você costuma concluir mais tarefas <strong>${p || d}</strong>.`;
  return `<section class="glass-card pad stack" aria-label="Seu melhor momento"><div class="insight">${icon('lightbulb', 18, 'ico')}<p class="small">${text}</p></div></section>`;
}

function focusLine(f) {
  return card('st-focus', 'Tempo focado', `<p class="small">Hoje <strong>${formatMinutes(f.today)}</strong> · 7 dias <strong>${formatMinutes(f.week)}</strong> · 30 dias <strong>${formatMinutes(f.month)}</strong></p>
    <p class="muted xs">Soma da duração das tarefas que você concluiu.</p>`);
}

function categories(list) {
  if (list.length === 0) return '';
  return card('st-cat', 'Tarefas por categoria', `<ul class="stat-list">${list.map((c) => `
    <li><span class="stat-label small">${categoryIcon(c.id)} ${escapeHtml(c.label)}</span>${bar(c.percent)}<span class="stat-num small">${c.count} (${c.percent}%)</span></li>`).join('')}</ul>`);
}

function weekdays(w) {
  const sentence = w.best === null ? '' : `<p class="small">Você conclui mais tarefas <strong>${WEEKDAY_PHRASE[w.best]}</strong> (${plural(w.max, 'tarefa', 'tarefas')}).</p>`;
  return card('st-week', 'Melhores dias da semana', `${sentence}<ul class="stat-list">${w.counts.map((n, i) => `
    <li${i === w.best ? ' class="best"' : ''}><span class="stat-label small">${WEEKDAY_NAMES[i]}${i === w.best ? ` ${icon('star', 12, 'ico')}` : ''}</span>${bar(w.max ? (n / w.max) * 100 : 0)}<span class="stat-num small">${n}</span></li>`).join('')}</ul>`);
}

function periods(p) {
  const sentence = p.best === null ? '' : `<p class="small">Você conclui mais tarefas <strong>${PERIOD_PHRASE[p.best]}</strong>.</p>`;
  return card('st-period', 'Melhor horário', `${sentence}<ul class="stat-list">${PERIODS.map((x) => `
    <li${x.id === p.best ? ' class="best"' : ''}><span class="stat-label small">${x.label} <span class="muted xs">(${x.range})</span></span>${bar(p.max ? (p.counts[x.id] / p.max) * 100 : 0)}<span class="stat-num small">${p.counts[x.id]}</span></li>`).join('')}</ul>`);
}

// Energia ao longo do dia (média de cada parte do dia, a partir do que foi registrado ao gerar missões)
function energy(e) {
  if (!e.enough) {
    return card('st-energy', 'Sua energia ao longo do dia', `<p class="muted small">Quando você gera uma missão, o app guarda como estava a sua energia. Com alguns registros, mostramos aqui em que parte do dia ela costuma ser mais alta.</p>
      <p class="muted xs">Registros até agora: ${Math.min(e.total, MIN_LOGS)} de ${MIN_LOGS}.</p>`);
  }
  const sentence = e.best === null
    ? '<p class="small">Sua energia costuma ser parecida ao longo do dia.</p>'
    : `<p class="small">Sua energia costuma ser mais alta <strong>${PERIOD_PHRASE[e.best]}</strong> e mais baixa <strong>${PERIOD_PHRASE[e.low]}</strong>.</p>
       <p class="muted xs">Uma ideia: deixe as tarefas mais pesadas para ${PERIOD_NOUN[e.best]}.</p>`;
  return card('st-energy', 'Sua energia ao longo do dia', `${sentence}<ul class="stat-list">${e.periods.map((x) => `
    <li${x.id === e.best ? ' class="best"' : ''}><span class="stat-label small">${x.label} <span class="muted xs">(${x.range})</span></span>${bar(x.avg === null ? 0 : x.avg * 10)}<span class="stat-num small">${x.avg === null ? '–' : `${String(x.avg).replace('.', ',')}/10`}</span></li>`).join('')}</ul>
    <p class="muted xs">Média da energia que você informou ao gerar missões. Partes do dia com poucos registros aparecem com "–".</p>`);
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

export const STATS_SECTIONS = [
  { id: 'resumo', label: 'Resumo' },
  { id: 'quando', label: 'Dias e horários' },
  { id: 'categorias', label: 'Categorias' },
  { id: 'habitos', label: 'Hábitos' },
];

// section: qual aba interna mostrar (o Perfil guarda a escolha e chama de novo ao clicar).
export function statsHTML(s, section = 'resumo') {
  if (s.completed === 0) {
    return card('st-empty', 'Estatísticas', '<p class="muted small">Conclua sua primeira tarefa para ver aqui a sua semana, o tempo focado e os seus melhores horários.</p>');
  }
  const id = STATS_SECTIONS.some((x) => x.id === section) ? section : 'resumo';
  const bodies = {
    resumo: () => tiles(s) + week(s.week) + insight(s) + weekly(s.weekly) + focusLine(s.focus),
    quando: () => weekdays(s.weekdays) + periods(s.periods) + (s.energy ? energy(s.energy) : ''),
    categorias: () => categories(s.categories),
    habitos: () => habits(s.habits),
  };
  return `
    <div class="tabs tabs-4 stats-tabs" role="tablist" aria-label="Estatísticas">
      ${STATS_SECTIONS.map((x) => `<button type="button" class="tab ${x.id === id ? 'active' : ''}" role="tab" id="stab-${x.id}" aria-selected="${x.id === id}" aria-controls="stats-panel" data-stats-tab="${x.id}">${x.label}</button>`).join('')}
    </div>
    <div id="stats-panel" class="stack" role="tabpanel" aria-labelledby="stab-${id}">${bodies[id]()}</div>`;
}
