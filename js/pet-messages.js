// Mensagem do dia do pet na Home. Tom gentil e sem culpa: nunca cobra, nunca compara, nunca ameaça a sequência.
// A mensagem muda a cada dia (e com a hora e o que você já fez), mas é a mesma durante o dia inteiro.

const DONE = [
  'Você já fez uma tarefa hoje. Isso já é muito!',
  'Mais um passo dado. Respire e aproveite.',
  'Tarefa feita! Se ainda tiver energia, ótimo; se não, descansar também é produtivo.',
  'Olha só o que você fez hoje. Estou orgulhoso(a) de você.',
];
const MORNING = [
  'Bom dia! Comece pelo que combina com a sua energia de agora.',
  'Uma tarefa de cada vez. Sem pressa.',
  'Respire fundo. O dia é longo e você não precisa fazer tudo.',
  'Que tal começar por algo pequeno?',
];
const AFTERNOON = [
  'Boa tarde! Como está a sua energia agora?',
  'Se o cansaço bateu, escolha uma tarefa leve.',
  'Uma pausa para beber água também conta.',
  'Ainda dá tempo de fazer algo simples, se você quiser.',
];
const EVENING = [
  'Boa noite! Hoje foi o dia que deu para ser, e está tudo bem.',
  'Se sobrou energia, uma tarefa curta fecha o dia bem.',
  'Amanhã tem um novo começo.',
  'Desacelere. Você merece descansar.',
];
const NIGHT = [
  'Está tarde. Que tal descansar? As tarefas esperam.',
  'Dormir bem é a melhor tarefa de agora.',
  'Zzz... Amanhã a gente continua, tá?',
];
const STREAK = [
  (n) => `Você está há ${n} dias seguidos! Uma tarefa hoje mantém a chama acesa.`,
  (n) => `${n} dias seguidos. Que constância bonita!`,
];

function hash(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}
const choose = (list, seed) => list[hash(seed) % list.length];

// seed: algo que muda por dia e por usuário (ex.: "2026-10-17:abc"). streak: sequência atual.
export function dailyMessage({ hour = 12, doneToday = false, streak = 0, seed = '' }) {
  if (doneToday) return choose(DONE, seed);
  if (streak >= 3 && hash(seed + 's') % 2 === 0) return choose(STREAK, seed)(streak);
  if (hour >= 22 || hour < 5) return choose(NIGHT, seed);
  if (hour < 12) return choose(MORNING, seed);
  if (hour < 18) return choose(AFTERNOON, seed);
  return choose(EVENING, seed);
}
export const ALL_MESSAGES = [...DONE, ...MORNING, ...AFTERNOON, ...EVENING, ...NIGHT];
