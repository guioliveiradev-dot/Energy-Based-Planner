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

// Chave do dia no calendário local ("2026-10-17") e o caminho de volta para o número do dia.
export const dayKey = (ts) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const keyToIndex = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
};

// current:   sequência atual. Continua "viva" até o fim do dia seguinte ao último dia com tarefa.
// best:      maior sequência de todos os tempos
// doneToday: já concluiu alguma tarefa hoje
// extra (poderes dos pets, opcional):
//   covered: dias ("2026-10-16") protegidos pelo escudo do Cão: contam como dias da sequência
//   bonuses: [{ start: "2026-10-17", extra: 4 }] dias reacendidos pela Fênix, somados à sequência que COMEÇA em start
export function streakInfo(tasks, now = Date.now(), extra = {}) {
  const real = new Set(tasks.filter((t) => t.completed && t.completedAt).map((t) => dayIndex(t.completedAt)));
  const days = new Set([...real, ...(extra.covered || []).map(keyToIndex)]);
  const bonusAt = new Map((extra.bonuses || []).map((b) => [keyToIndex(b.start), b.extra]));
  const today = dayIndex(now);
  const doneToday = real.has(today);

  let current = 0;
  let d = doneToday ? today : today - 1;
  while (days.has(d)) { current++; d--; }
  if (current > 0) current += bonusAt.get(d + 1) || 0;

  let best = 0, run = 0, prev = null, runStart = null;
  for (const day of [...days].sort((a, b) => a - b)) {
    if (prev !== null && day === prev + 1) run++;
    else { run = 1; runStart = day; }
    best = Math.max(best, run + (bonusAt.get(runStart) || 0));
    prev = day;
  }
  return { current, best, doneToday, alive: current > 0 };
}
