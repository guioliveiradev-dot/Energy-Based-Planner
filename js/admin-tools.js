// Ferramentas do painel admin para testar na prática (pontos, vínculo, sequência e poderes dos pets).
// Tudo que cria tarefas marca testData: true, e "Limpar tarefas de teste" apaga só essas.

import { createTask, getUserTasks, deleteTask, addPetBond, getUserPetBonds } from './db.js';
import { getActivePet } from './themes.js';
import { clearPetState, getPetState, savePetState } from './pet-state.js';
import { BOND_THRESHOLDS, MAX_BOND_LEVEL } from './pets.js';

// Cenários da sequência. endsDaysAgo: quantos dias atrás termina a sequência (1 = ontem).
export const STREAK_SCENARIOS = {
  alive:  { days: 5, endsDaysAgo: 1, title: 'Sequência de 5 dias (até ontem)', sub: 'Sequência viva: conclua uma tarefa hoje para ver ela subir para 6.' },
  shield: { days: 5, endsDaysAgo: 2, title: 'Perdi ontem (testa o Cão Guardião)', sub: '5 dias seguidos e um dia perdido. Com o Cão ativo, abra a Home: o escudo protege.' },
  broken: { days: 7, endsDaysAgo: 3, title: 'Sequência quebrada (testa a Fênix)', sub: '7 dias seguidos e 2 dias perdidos. Com a Fênix ativa, conclua uma tarefa: ela reacende parte.' },
};

const atNoon = (now, daysAgo) => {
  const d = new Date(now);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.getTime();
};

const base = (userId, now, over) => ({
  id: crypto.randomUUID(), userId, title: '[Teste]', energyCost: 3, durationMinutes: 20, deadline: null, category: 'personal',
  completed: false, completedAt: null, startedAt: null, pausedAt: null, pauseOffset: 0, createdAt: now, testData: true, ...over,
});

export async function clearTestTasks(userId) {
  const tests = (await getUserTasks(userId)).filter((t) => t.testData);
  for (const t of tests) await deleteTask(t.id);
  return tests.length;
}

// Apaga as tarefas de teste anteriores e cria `days` dias seguidos de tarefas concluídas.
export async function createTestStreak(userId, scenario, now = Date.now()) {
  const { days, endsDaysAgo } = STREAK_SCENARIOS[scenario];
  await clearTestTasks(userId);
  for (let i = 0; i < days; i++) {
    const at = atNoon(now, endsDaysAgo + i);
    await createTask(base(userId, now, { title: `[Teste] Dia ${days - i}`, completed: true, completedAt: at, startedAt: at - 20 * 60000 }));
  }
  return days;
}

// 3 tarefas pendentes já com o tempo cumprido (o botão "Coletar pontos" aparece na hora): energia 3, 5 e 9.
export async function createTestTasks(userId, now = Date.now()) {
  const specs = [['leve', 3, 15], ['média', 5, 30], ['pesada', 9, 45]];
  for (const [name, energy, minutes] of specs) {
    await createTask(base(userId, now, { title: `[Teste] Tarefa ${name} (energia ${energy})`, energyCost: energy, durationMinutes: minutes, startedAt: now - minutes * 2 * 60000 }));
  }
  return specs.length;
}

async function activeBond(userId, petId) {
  return ((await getUserPetBonds(userId)).find((b) => b.petId === petId) || { bond: 0 }).bond;
}

// Soma vínculo ao pet ativo. Devolve { petId, before, after } ou null se não há pet ativo.
export async function giveBond(userId, amount) {
  const petId = getActivePet(userId);
  if (!petId) return null;
  const before = await activeBond(userId, petId);
  const { after } = await addPetBond(userId, petId, amount);
  return { petId, before, after };
}
export async function giveMaxBond(userId) {
  const petId = getActivePet(userId);
  if (!petId) return null;
  const before = await activeBond(userId, petId);
  const target = BOND_THRESHOLDS[MAX_BOND_LEVEL - 1];
  const after = before >= target ? before : (await addPetBond(userId, petId, target - before)).after;
  return { petId, before, after };
}
export async function resetBond(userId) {
  const petId = getActivePet(userId);
  if (!petId) return null;
  const before = await activeBond(userId, petId);
  await addPetBond(userId, petId, -before);
  return { petId, before, after: 0 };
}

export const resetPetPowers = (userId) => clearPetState(userId);       // escudos, baú, Fênix e missão do Robô
export async function releaseTodayChest(userId) {                      // libera o baú do Unicórnio de novo hoje
  const state = await getPetState(userId);
  await savePetState(userId, { ...state, chestDate: null });
}
