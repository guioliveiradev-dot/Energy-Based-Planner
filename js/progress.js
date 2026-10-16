// Níveis e sequência de dias (streak). Funções puras: sem tela e sem banco de dados.
//
// Nível: vem dos pontos GANHOS no total (soma das tarefas concluídas). Gastar pontos na Loja
// não faz o nível cair, e os pontos extras do painel admin não contam.
// Sequência: dias seguidos com pelo menos 1 tarefa concluída.

// Pontos de uma tarefa concluída (mesma fórmula do app original)
export const pointsForTask = (t) => Math.round(t.energyCost * 10 + t.durationMinutes * 0.5);

export function totalPoints(tasks) {
  return tasks.filter((t) => t.completed).reduce((sum, t) => sum + pointsForTask(t), 0);
}

// ---------- Níveis ----------
// Pontos acumulados para ALCANÇAR o nível L: 0, 100, 250, 450, 700, 1000, ...
// (cada nível custa 50 pontos a mais que o anterior). Para mudar a dificuldade, mexa aqui.
export const levelThreshold = (L) => 25 * (L - 1) * (L + 2);

// A partir de qual nível cada título começa
const TITLES = [[1, 'Novato'], [3, 'Aprendiz'], [5, 'Focado'], [8, 'Veterano'], [12, 'Mestre'], [18, 'Lenda']];

export function levelTitle(level) {
  let title = TITLES[0][1];
  for (const [from, name] of TITLES) if (level >= from) title = name;
  return title;
}

export function levelInfo(points) {
  const p = Math.max(0, Math.floor(points));
  let level = 1;
  while (levelThreshold(level + 1) <= p) level++;
  const start = levelThreshold(level);
  const end = levelThreshold(level + 1);
  return {
    level,
    title: levelTitle(level),
    points: p,
    into: p - start,                 // pontos já feitos dentro deste nível
    needed: end - start,             // pontos que este nível pede
    toNext: end - p,                 // quanto falta para o próximo
    percent: Math.floor(((p - start) / (end - start)) * 100),
  };
}

// ---------- Sequência de dias ----------
// Número do dia no calendário LOCAL (não muda com horário de verão)
const dayIndex = (ts) => {
  const d = new Date(ts);
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
};

// current:   sequência atual. Continua "viva" até o fim do dia seguinte ao último dia com tarefa.
// best:      maior sequência de todos os tempos
// doneToday: já concluiu alguma tarefa hoje
export function streakInfo(tasks, now = Date.now()) {
  const days = new Set(tasks.filter((t) => t.completed && t.completedAt).map((t) => dayIndex(t.completedAt)));
  const today = dayIndex(now);
  const doneToday = days.has(today);

  let current = 0;
  for (let d = doneToday ? today : today - 1; days.has(d); d--) current++;

  let best = 0, run = 0, prev = null;
  for (const d of [...days].sort((a, b) => a - b)) {
    run = prev !== null && d === prev + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return { current, best, doneToday, alive: current > 0 };
}
