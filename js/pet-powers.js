// Poderes dos pets (B5). Cada pet tem um poder que cresce com o vínculo (níveis 1 a 5, veja js/pets.js).
//
// Regras gerais:
//  - Só o pet ATIVO usa o poder. Sem pet, ou com a regra não cumprida, nada muda (sem punição).
//  - Bônus de pontos entram no saldo (Pontos Planner), mas NÃO no nível do usuário: o nível vem só dos pontos-base.
//  - Poderes de sequência (Cão e Fênix) usam o estado guardado em js/pet-state.js.
//
//  Fagulha  : +% em toda tarefa                       Gato    : +% em tarefa sem pausar o cronômetro
//  Dragão   : +% em tarefa de energia 8 ou mais       Robô    : +% na tarefa da "missão do dia"
//  Unicórnio: baú de pontos na 1ª tarefa do dia       Cão     : escudos semanais que protegem a sequência
//  Fênix    : reacende parte da sequência quebrada (1 vez a cada 30 dias)

import { getUserPetBonds } from './db.js';
import { getActivePet, ALL_PETS } from './themes.js';
import { bondLevel, BOND_THRESHOLDS } from './pets.js';
import { dayKey, keyToIndex } from './progress.js';
import { getPetState, savePetState } from './pet-state.js';
import { isAvailable } from './recurrence.js';

export const SHIELD_WINDOW_DAYS = 7;
export const PHOENIX_EVERY_DAYS = 30;

export const PET_POWERS = {
  fagulha: { title: 'Brilho extra', kind: 'percent', rule: 'always', pct: [8, 9, 10, 11, 12],
    how: 'Dá pontos extras em toda tarefa que você concluir. Cresce e muda de forma (Faísca, Chama, Aura) quanto mais vocês trabalham juntos.' },
  cat: { title: 'Foco', kind: 'percent', rule: 'noPause', pct: [25, 28, 31, 35, 40],
    how: 'Dá pontos extras quando você conclui uma tarefa sem pausar o cronômetro. Se pausar, não tem problema: a tarefa vale os pontos de sempre.' },
  dragon: { title: 'Fogo da energia alta', kind: 'percent', rule: 'highEnergy', minEnergy: 8, pct: [40, 45, 50, 55, 60],
    how: 'Dá pontos extras nas tarefas pesadas, de energia 8 ou mais. Nas leves, a tarefa vale os pontos de sempre.' },
  dog: { title: 'Escudo da sequência', kind: 'shield', per: [1, 1, 1, 2, 2],
    how: 'Protege a sua sequência de dias. Se você perder um dia, o escudo entra sozinho e a sequência continua. Só protege quando a sequência já tem pelo menos 2 dias.' },
  phoenix: { title: 'Renascimento', kind: 'phoenix', pct: [50, 55, 60, 65, 70],
    how: 'Se a sua sequência quebrar, a Fênix reacende parte dela quando você concluir a próxima tarefa. Vale uma vez a cada 30 dias.' },
  unicorn: { title: 'Baú-surpresa', kind: 'chest', min: [10, 10, 15, 15, 20], max: [40, 45, 50, 55, 60],
    how: 'Todo dia, ao concluir a primeira tarefa, abre um baú-surpresa com pontos extras. O valor é sorteado e cresce com o vínculo.' },
  robot: { title: 'Missão do dia', kind: 'mission', pct: [30, 35, 40, 45, 50],
    how: 'Escolhe uma das suas tarefas pendentes como missão do dia (aparece na Home). Concluir essa tarefa dá pontos extras. Se não der hoje, amanhã tem outra, sem cobrança.' },
};

const RULE_TEXT = {
  always: (p) => `+${p}% de pontos em toda tarefa`,
  noPause: (p) => `+${p}% em tarefas concluídas sem pausar o cronômetro`,
  highEnergy: (p, power) => `+${p}% em tarefas de energia ${power.minEnergy} ou mais`,
};
const RULES = {
  always: () => true,
  noPause: (task) => !task.pausedAt && !(task.pauseOffset > 0),
  highEnergy: (task, power) => task.energyCost >= power.minEnergy,
};
const pick = (arr, level) => arr[Math.min(Math.max(level, 1), arr.length) - 1];

export const hasPower = (petId) => !!PET_POWERS[petId];
export const powerHow = (petId) => PET_POWERS[petId]?.how ?? '';

// Percentual do pet no nível dado (Fagulha, Gato, Dragão, Fênix e Robô). null para os outros.
export const powerPct = (petId, level) => (PET_POWERS[petId] && PET_POWERS[petId].pct ? pick(PET_POWERS[petId].pct, level) : null);
export const shieldsPerWeek = (level) => pick(PET_POWERS.dog.per, level);
export const chestRange = (level) => ({ min: pick(PET_POWERS.unicorn.min, level), max: pick(PET_POWERS.unicorn.max, level) });

// Texto do poder em cada nível (Perfil, Loja e descrição).
export function levelText(petId, level = 1) {
  const power = PET_POWERS[petId];
  if (!power) return 'em breve';
  switch (power.kind) {
    case 'percent': return RULE_TEXT[power.rule](pick(power.pct, level), power);
    case 'shield': {
      const n = pick(power.per, level);
      return `${n} ${n === 1 ? 'escudo' : 'escudos'} por semana (protege ${n === 1 ? 'um dia perdido' : 'até 2 dias perdidos'})`;
    }
    case 'phoenix': return `reacende ${pick(power.pct, level)}% da sequência perdida (1 vez a cada ${PHOENIX_EVERY_DAYS} dias)`;
    case 'chest': { const r = chestRange(level); return `baú de ${r.min} a ${r.max} pontos na 1ª tarefa do dia`; }
    default: return `+${pick(power.pct, level)}% na tarefa da missão do dia`;
  }
}
export const powerLevels = (petId) => [1, 2, 3, 4, 5].map((l) => levelText(petId, l));
export const powerText = (petId, level = 1) => (PET_POWERS[petId] ? `${PET_POWERS[petId].title}: ${levelText(petId, level)}` : 'Poder: em breve');
export const powerSummary = (petId) => (PET_POWERS[petId] ? `${PET_POWERS[petId].title}: ${levelText(petId, 1)} (cresce com o vínculo)` : 'Poder: em breve');

const petName = (petId) => ALL_PETS.find((p) => p.id === petId)?.name ?? 'Seu pet';
const pontos = (n) => (n === 1 ? 'ponto' : 'pontos');
const bondFromLevel = (level) => BOND_THRESHOLDS[level - 1];

// Bônus percentual de uma tarefa (Fagulha, Gato, Dragão e Robô). null se não há bônus.
export function bonusFor(petId, bond, task, basePoints, ctx = {}) {
  const power = PET_POWERS[petId];
  if (!power || !power.pct) return null;
  if (power.kind === 'mission') { if (ctx.robotTaskId !== task.id) return null; }
  else if (power.kind !== 'percent' || !RULES[power.rule](task, power)) return null;
  const level = bondLevel(bond);
  const pct = pick(power.pct, level);
  const amount = Math.round((basePoints * pct) / 100);
  if (amount < 1) return null;
  const name = petName(petId);
  const message = power.kind === 'mission' ? `${name} cumpriu a missão do dia com você: +${amount} ${pontos(amount)}` : `${name} ajudou: +${amount} ${pontos(amount)}`;
  return { amount, pct, petId, petName: name, level, message };
}

// ---------- calendário ----------
const realDays = (tasks) => new Set(tasks.filter((t) => t.completed && t.completedAt).map((t) => keyToIndex(dayKey(t.completedAt))));
function chainEndingAt(days, end, bonuses = []) {
  let n = 0, d = end;
  while (days.has(d)) { n++; d--; }
  const extra = bonuses.find((b) => keyToIndex(b.start) === d + 1);
  return n + (extra ? extra.extra : 0);
}
const keyOfIndex = (idx) => dayKey(idx * 86400000 + 12 * 3600000);

async function bondOf(userId, petId) {
  const bonds = await getUserPetBonds(userId);
  return (bonds.find((b) => b.petId === petId) || { bond: 0 }).bond;
}

// Dados extras da sequência (dias protegidos e reacendidos) para streakInfo().
export async function getStreakExtra(userId) {
  const s = await getPetState(userId);
  return { covered: s.shields, bonuses: s.bonuses };
}

// ---------- Cão Guardião: escudo ----------
// Chame ao abrir a Home. Se um dia perdido quebraria a sequência e há escudo, protege.
// Devolve { petName, days } quando protegeu, senão null.
export async function applyShield(userId, tasks, now = Date.now()) {
  if (getActivePet(userId) !== 'dog') return null;
  const state = await getPetState(userId);
  const days = realDays(tasks);
  for (const k of state.shields) days.add(keyToIndex(k));
  const today = keyToIndex(dayKey(now));
  const past = [...days].filter((d) => d < today);
  if (past.length === 0) return null;
  const last = Math.max(...past);
  const missed = [];
  for (let d = last + 1; d < today; d++) missed.push(d);
  if (missed.length === 0) return null;
  if (chainEndingAt(days, last, state.bonuses) < 2) return null;            // não gasta escudo à toa
  const level = bondLevel(await bondOf(userId, 'dog'));
  const used = state.shields.filter((k) => today - keyToIndex(k) < SHIELD_WINDOW_DAYS).length;
  if (missed.length > shieldsPerWeek(level) - used) return null;            // não dá para salvar: não gasta
  const keys = missed.map(keyOfIndex);
  await savePetState(userId, { ...state, shields: [...state.shields, ...keys].sort() });
  return { petName: petName('dog'), days: keys };
}

// ---------- Robô Quântico: missão do dia ----------
// Devolve { task, pct, done } ou null. Escolhe uma vez por dia (prazo mais perto primeiro, depois a mais antiga).
export async function robotMission(userId, tasks, now = Date.now()) {
  if (getActivePet(userId) !== 'robot') return null;
  const today = dayKey(now);
  const state = await getPetState(userId);
  const pct = powerPct('robot', bondLevel(await bondOf(userId, 'robot')));
  if (state.robot && state.robot.date === today) {
    const task = tasks.find((t) => t.id === state.robot.taskId);
    if (task) return { task, pct, done: !!task.completed };
  }
  const pending = tasks.filter((t) => !t.completed && isAvailable(t, now))
    .sort((a, b) => (a.deadline && b.deadline ? a.deadline - b.deadline : a.deadline ? -1 : b.deadline ? 1 : (a.createdAt || 0) - (b.createdAt || 0)));
  if (pending.length === 0) return null;
  await savePetState(userId, { ...state, robot: { date: today, taskId: pending[0].id } });
  return { task: pending[0], pct, done: false };
}

// ---------- ao concluir uma tarefa ----------
// tasksBefore: as tarefas ANTES de concluir esta. Devolve { bonus, note }:
//   bonus: { amount, petName, message } pontos extras (ou null)
//   note:  frase extra para a janela de parabéns, como a da Fênix (ou null)
export async function applyPetPowers({ userId, task, basePoints, tasksBefore, completedAt = Date.now(), rng = Math.random }) {
  const none = { bonus: null, note: null };
  const petId = getActivePet(userId);
  const power = PET_POWERS[petId];
  if (!power) return none;
  const level = bondLevel(await bondOf(userId, petId));
  const today = dayKey(completedAt);
  const state = await getPetState(userId);
  const others = tasksBefore.filter((t) => t.id !== task.id);
  const firstToday = !realDays(others).has(keyToIndex(today));

  if (power.kind === 'percent') return { bonus: bonusFor(petId, bondFromLevel(level), task, basePoints), note: null };

  if (power.kind === 'mission') {
    const robotTaskId = state.robot && state.robot.date === today ? state.robot.taskId : null;
    return { bonus: bonusFor(petId, bondFromLevel(level), task, basePoints, { robotTaskId }), note: null };
  }

  if (power.kind === 'chest') {
    if (!firstToday || state.chestDate === today) return none;
    const { min, max } = chestRange(level);
    const amount = min + Math.floor(rng() * (max - min + 1));
    await savePetState(userId, { ...state, chestDate: today });
    return { bonus: { amount, petId, petName: petName(petId), level, message: `${petName(petId)} abriu um baú-surpresa: +${amount} ${pontos(amount)}` }, note: null };
  }

  if (power.kind === 'phoenix') {
    if (!firstToday) return none;
    const days = realDays(others);
    for (const k of state.shields) days.add(keyToIndex(k));
    const todayIdx = keyToIndex(today);
    const past = [...days].filter((d) => d < todayIdx);
    if (past.length === 0) return none;
    const last = Math.max(...past);
    if (todayIdx - last - 1 < 1) return none;                                 // ontem teve tarefa: a sequência não quebrou
    const lost = chainEndingAt(days, last, state.bonuses);
    const regained = Math.floor((lost * pick(power.pct, level)) / 100);
    if (lost < 2 || regained < 1) return none;
    if (state.phoenix.some((k) => todayIdx - keyToIndex(k) < PHOENIX_EVERY_DAYS)) return none;
    await savePetState(userId, { ...state, phoenix: [...state.phoenix, today], bonuses: [...state.bonuses, { start: today, extra: regained }] });
    return { bonus: null, note: `${petName(petId)} reacendeu ${regained} ${regained === 1 ? 'dia' : 'dias'} da sua sequência!` };
  }
  return none;   // Cão: age ao abrir a Home (applyShield)
}
