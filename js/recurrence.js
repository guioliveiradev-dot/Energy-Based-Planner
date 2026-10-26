// Tarefas que se repetem (hábitos). Funções puras: sem tela e sem banco de dados.
//
// Como funciona: ao CONCLUIR uma tarefa recorrente, ela fica no histórico (conta pontos, nível e sequência)
// e nasce uma nova cópia pendente, que só fica disponível no próximo dia da repetição (availableFrom).
// Campos novos da tarefa:
//   repeat:        null  ou  { days: [0..6] }   (0 = domingo ... 6 = sábado)
//   availableFrom: null  ou  momento (ms) a partir do qual ela aparece como tarefa de hoje
import { resetSubtasks } from './subtasks.js';


export const WEEKDAYS = [
  { value: 1, label: 'Seg' }, { value: 2, label: 'Ter' }, { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' }, { value: 5, label: 'Sex' }, { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
];

export const PRESETS = {
  daily: [0, 1, 2, 3, 4, 5, 6],
  weekdays: [1, 2, 3, 4, 5],
  weekend: [6, 0],
};

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

// Qual opção do formulário corresponde a esses dias: '', 'daily', 'weekdays', 'weekend' ou 'custom'
export function presetOf(days) {
  if (!days || days.length === 0) return '';
  for (const [name, list] of Object.entries(PRESETS)) if (sameSet(days, list)) return name;
  return 'custom';
}

export function repeatLabel(days) {
  const preset = presetOf(days);
  if (preset === 'daily') return 'Todos os dias';
  if (preset === 'weekdays') return 'Dias úteis';
  if (preset === 'weekend') return 'Fins de semana';
  return WEEKDAYS.filter((d) => days.includes(d.value)).map((d) => d.label).join(', ');
}

export const isRecurring = (task) => !!(task.repeat && Array.isArray(task.repeat.days) && task.repeat.days.length > 0);

// Tarefas agendadas para um dia futuro ainda não aparecem como "de hoje"
export const isAvailable = (task, now = Date.now()) => !task.availableFrom || task.availableFrom <= now;

// Meia-noite (horário local) do próximo dia da repetição, SEMPRE depois do dia de "from"
export function nextOccurrence(days, from = Date.now()) {
  const d = new Date(from);
  for (let i = 1; i <= 7; i++) {
    const candidate = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
    if (days.includes(candidate.getDay())) return candidate.getTime();
  }
  return null;
}

// A nova cópia pendente criada ao concluir uma tarefa recorrente (ou null se não repete)
export function nextInstance(task, completedAt = Date.now(), newId = () => crypto.randomUUID()) {
  if (!isRecurring(task)) return null;
  const availableFrom = nextOccurrence(task.repeat.days, completedAt);
  if (availableFrom === null) return null;
  return {
    id: newId(),
    userId: task.userId,
    title: task.title,
    energyCost: task.energyCost,
    durationMinutes: task.durationMinutes,
    deadline: null,                       // prazo não se repete
    category: task.category,
    completed: false,
    completedAt: null,
    startedAt: null,
    pausedAt: null,
    pauseOffset: 0,
    createdAt: Date.now(),
    repeat: { days: [...task.repeat.days] },
    availableFrom,
    notes: task.notes || '',                       // notas e etapas se repetem (etapas desmarcadas)
    subtasks: resetSubtasks(task.subtasks, newId),
  };
}

// "Volta amanhã" ou "Volta Seg 20/10"
export function comesBackLabel(task, now = Date.now()) {
  const n = new Date(now);
  const tomorrow = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1).getTime();
  if (task.availableFrom === tomorrow) return 'Volta amanhã';
  const d = new Date(task.availableFrom);
  const label = WEEKDAYS.find((w) => w.value === d.getDay()).label;
  const pad = (x) => String(x).padStart(2, '0');
  return `Volta ${label} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}
