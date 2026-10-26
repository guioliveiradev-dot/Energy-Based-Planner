// Estatísticas das tarefas concluídas (só contas, sem tela: a tela é js/components/stats-view.js).
// Tudo é calculado no navegador a partir das tarefas. Dia = dia do calendário local.

import { dayKey, keyToIndex, streakInfo, totalPoints } from './progress.js';
import { CATEGORY_LABELS } from './categories.js';
import { isRecurring } from './recurrence.js';

export const WEEKDAY_NAMES = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
export const WEEKDAY_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
export const MONTH_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const PERIODS = [
  { id: 'morning', label: 'Manhã', range: '5h às 12h' },
  { id: 'afternoon', label: 'Tarde', range: '12h às 18h' },
  { id: 'evening', label: 'Noite', range: '18h às 22h' },
  { id: 'night', label: 'Madrugada', range: '22h às 5h' },
];

const done = (tasks) => tasks.filter((t) => t.completed && t.completedAt);
const mondayIndex = (ts) => (new Date(ts).getDay() + 6) % 7;            // 0 = segunda

// "2 h 30 min", "45 min", "3 h"
export function formatMinutes(total) {
  const m = Math.max(0, Math.round(total || 0));
  const h = Math.floor(m / 60), r = m % 60;
  if (h === 0) return `${r} min`;
  return r === 0 ? `${h} h` : `${h} h ${r} min`;
}

const levelFor = (count) => (count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count <= 4 ? 3 : 4);

// Mapa de calor: `weeks` colunas (a mais antiga primeiro), cada uma com 7 dias de segunda a domingo.
export function heatmap(tasks, now = Date.now(), weeks = 16) {
  const counts = new Map();
  for (const t of done(tasks)) counts.set(dayKey(t.completedAt), (counts.get(dayKey(t.completedAt)) || 0) + 1);
  const n = new Date(now);
  const todayStart = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  const first = new Date(todayStart.getFullYear(), todayStart.getMonth(), todayStart.getDate() - mondayIndex(now) - (weeks - 1) * 7);
  const columns = [];
  let activeDays = 0, total = 0, best = { key: null, count: 0 };
  for (let w = 0; w < weeks; w++) {
    const col = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(first.getFullYear(), first.getMonth(), first.getDate() + w * 7 + i);
      const key = dayKey(date.getTime());
      const future = date.getTime() > todayStart.getTime();
      const count = future ? 0 : counts.get(key) || 0;
      if (count > 0) { activeDays++; total += count; if (count > best.count) best = { key, count }; }
      col.push({ key, date: date.getTime(), count, future, today: date.getTime() === todayStart.getTime(), level: levelFor(count) });
    }
    columns.push(col);
  }
  // nome do mês acima da coluna em que ele começa
  const months = columns.map((col, i) => {
    const m = new Date(col[0].date).getMonth();
    return i === 0 || m !== new Date(columns[i - 1][0].date).getMonth() ? MONTH_SHORT[m] : '';
  });
  return { columns, months, activeDays, total, best, weeks };
}

// Minutos focados (soma da duração das tarefas concluídas): hoje, 7 dias, 30 dias e total.
export function focusTime(tasks, now = Date.now()) {
  const today = keyToIndex(dayKey(now));
  const sum = { today: 0, week: 0, month: 0, total: 0 };
  for (const t of done(tasks)) {
    const ago = today - keyToIndex(dayKey(t.completedAt));
    const m = t.durationMinutes || 0;
    sum.total += m;
    if (ago >= 0 && ago < 30) sum.month += m;
    if (ago >= 0 && ago < 7) sum.week += m;
    if (ago === 0) sum.today += m;
  }
  return sum;
}

// Tarefas concluídas por categoria, da que mais tem para a que menos tem.
export function byCategory(tasks) {
  const counts = {};
  for (const t of done(tasks)) counts[t.category] = (counts[t.category] || 0) + 1;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return Object.entries(counts)
    .map(([id, count]) => ({ id, label: CATEGORY_LABELS[id] || id, count, percent: total ? Math.round((count / total) * 100) : 0 }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'pt-BR'));
}

// Tarefas concluídas em cada dia da semana (segunda a domingo) e o melhor dia.
export function weekdayStats(tasks) {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const t of done(tasks)) counts[mondayIndex(t.completedAt)]++;
  const max = Math.max(...counts);
  return { counts, max, best: max > 0 ? counts.indexOf(max) : null };
}

// Em que parte do dia você mais conclui.
export function periodStats(tasks) {
  const counts = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  for (const t of done(tasks)) {
    const h = new Date(t.completedAt).getHours();
    counts[h >= 5 && h < 12 ? 'morning' : h >= 12 && h < 18 ? 'afternoon' : h >= 18 && h < 22 ? 'evening' : 'night']++;
  }
  const max = Math.max(...Object.values(counts));
  return { counts, max, best: max > 0 ? PERIODS.find((p) => counts[p.id] === max).id : null };
}

// Hábitos (tarefas que se repetem): quantas vezes em cada uma das últimas 4 semanas (a 1ª é a mais antiga).
export function habitHistory(tasks, now = Date.now(), limit = 8) {
  const today = keyToIndex(dayKey(now));
  const map = new Map();
  for (const t of done(tasks).filter(isRecurring)) {
    const key = t.title.trim().toLowerCase();
    const h = map.get(key) || { title: t.title.trim(), total: 0, weeks: [0, 0, 0, 0], last: 0 };
    const ago = today - keyToIndex(dayKey(t.completedAt));
    h.total++;
    if (ago >= 0 && ago < 28) h.weeks[3 - Math.floor(ago / 7)]++;
    h.last = Math.max(h.last, t.completedAt);
    map.set(key, h);
  }
  return [...map.values()].sort((a, b) => b.weeks.reduce((x, y) => x + y, 0) - a.weeks.reduce((x, y) => x + y, 0) || b.total - a.total || b.last - a.last).slice(0, limit);
}

export function computeStats(tasks, now = Date.now(), streakExtra = {}) {
  const completed = done(tasks);
  const heat = heatmap(tasks, now);
  const allDays = new Set(completed.map((t) => dayKey(t.completedAt))).size;
  const streak = streakInfo(tasks, now, streakExtra);
  return {
    completed: completed.length,
    activeDays: allDays,
    perActiveDay: allDays ? Math.round((completed.length / allDays) * 10) / 10 : 0,
    points: totalPoints(tasks),
    streak,
    focus: focusTime(tasks, now),
    heat,
    categories: byCategory(tasks),
    weekdays: weekdayStats(tasks),
    periods: periodStats(tasks),
    habits: habitHistory(tasks, now),
  };
}
