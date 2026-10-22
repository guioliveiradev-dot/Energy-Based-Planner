// Regras da lista de tarefas: busca, ordenação e prazos. Sem tela aqui, para poder testar.
import { dayKey } from './progress.js';
import { CATEGORY_LABELS } from './categories.js';

export const SORTS = [
  { id: 'recent', label: 'Mais recentes' },
  { id: 'deadline', label: 'Prazo mais próximo' },
  { id: 'energy-asc', label: 'Menor energia primeiro' },
  { id: 'energy-desc', label: 'Maior energia primeiro' },
  { id: 'short', label: 'Mais rápidas primeiro' },
  { id: 'long', label: 'Mais longas primeiro' },
  { id: 'title', label: 'Nome (A a Z)' },
];
export const DEFAULT_SORT = 'recent';

// minúsculas e sem acento, para "acao" achar "Ação"
export const normalize = (text) => String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// A busca olha o título e o nome da categoria. Várias palavras: todas precisam aparecer.
export function matchesSearch(task, query) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalize(`${task.title} ${CATEGORY_LABELS[task.category] || ''}`);
  return words.every((w) => haystack.includes(w));
}

// "Prazo passou": o dia do prazo já terminou (o prazo é um dia, então hoje ainda não conta).
export const isOverdue = (task, now = Date.now()) => !task.completed && !!task.deadline && dayKey(task.deadline) < dayKey(now);
export const isDueToday = (task, now = Date.now()) => !task.completed && !!task.deadline && dayKey(task.deadline) === dayKey(now);

// Texto curto do prazo: "Prazo hoje", "Prazo passou há 3 dias", ou nada.
export function deadlineNote(task, now = Date.now()) {
  if (isDueToday(task, now)) return 'Prazo hoje';
  if (!isOverdue(task, now)) return '';
  const days = Math.round((Date.UTC(...dayKey(now).split('-').map((v, i) => (i === 1 ? v - 1 : +v))) - Date.UTC(...dayKey(task.deadline).split('-').map((v, i) => (i === 1 ? v - 1 : +v)))) / 86400000);
  return days === 1 ? 'Prazo passou ontem' : `Prazo passou há ${days} dias`;
}

const byRecent = (a, b) => (b.createdAt || 0) - (a.createdAt || 0);
const COMPARATORS = {
  recent: byRecent,
  deadline: (a, b) => (a.deadline && b.deadline ? a.deadline - b.deadline || byRecent(a, b) : a.deadline ? -1 : b.deadline ? 1 : byRecent(a, b)),
  'energy-asc': (a, b) => a.energyCost - b.energyCost || byRecent(a, b),
  'energy-desc': (a, b) => b.energyCost - a.energyCost || byRecent(a, b),
  short: (a, b) => a.durationMinutes - b.durationMinutes || byRecent(a, b),
  long: (a, b) => b.durationMinutes - a.durationMinutes || byRecent(a, b),
  title: (a, b) => a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' }) || byRecent(a, b),
};

// Devolve uma cópia ordenada (não mexe na lista original).
export const sortTasks = (list, sortId = DEFAULT_SORT) => [...list].sort(COMPARATORS[sortId] || COMPARATORS[DEFAULT_SORT]);
export const isSortId = (id) => SORTS.some((s) => s.id === id);
