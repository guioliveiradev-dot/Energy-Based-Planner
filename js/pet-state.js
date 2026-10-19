// Estado dos poderes dos pets, por usuário (guardado na tabela 'meta' do banco, sem mudar a versão do banco).
//   shields:  dias ("2026-10-16") que o escudo do Cão protegeu. Também serve de registro para o limite semanal.
//   bonuses:  [{ start, extra }] dias que a Fênix reacendeu na sequência que começou em `start`
//   phoenix:  dias em que a Fênix foi usada (limite: 1 vez a cada 30 dias)
//   chestDate: último dia em que o Unicórnio abriu o baú
//   robot:    { date, taskId } missão do dia escolhida pelo Robô
// Entra no backup e na importação (união: nunca perde o que a conta já tem).

import { getMeta, setMeta, deleteMeta } from './db.js';

const key = (userId) => `petstate:${userId}`;
const emptyState = () => ({ shields: [], bonuses: [], phoenix: [], chestDate: null, robot: null });

export async function getPetState(userId) {
  return { ...emptyState(), ...((await getMeta(key(userId))) || {}) };
}
export const savePetState = (userId, state) => setMeta(key(userId), state);
export const clearPetState = (userId) => deleteMeta(key(userId));

const isKey = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const uniq = (arr) => [...new Set(arr)].sort();

// Aceita só o formato esperado (arquivo de backup pode vir de qualquer lugar).
export function cleanPetState(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const bonuses = (Array.isArray(r.bonuses) ? r.bonuses : [])
    .filter((b) => b && isKey(b.start) && Number.isFinite(b.extra) && b.extra > 0)
    .map((b) => ({ start: b.start, extra: Math.min(1000, Math.floor(b.extra)) }));
  const robot = r.robot && isKey(r.robot.date) && typeof r.robot.taskId === 'string' ? { date: r.robot.date, taskId: r.robot.taskId } : null;
  return {
    shields: uniq((Array.isArray(r.shields) ? r.shields : []).filter(isKey)),
    phoenix: uniq((Array.isArray(r.phoenix) ? r.phoenix : []).filter(isKey)),
    bonuses: bonuses.filter((b, i) => bonuses.findIndex((x) => x.start === b.start) === i),
    chestDate: isKey(r.chestDate) ? r.chestDate : null,
    robot,
  };
}

export function mergePetState(a, b) {
  const x = cleanPetState(a), y = cleanPetState(b);
  const bonuses = [...x.bonuses];
  for (const bo of y.bonuses) {
    const i = bonuses.findIndex((z) => z.start === bo.start);
    if (i < 0) bonuses.push(bo); else bonuses[i] = { start: bo.start, extra: Math.max(bonuses[i].extra, bo.extra) };
  }
  return {
    shields: uniq([...x.shields, ...y.shields]),
    phoenix: uniq([...x.phoenix, ...y.phoenix]),
    bonuses,
    chestDate: [x.chestDate, y.chestDate].filter(Boolean).sort().pop() || null,
    robot: [x.robot, y.robot].filter(Boolean).sort((p, q) => p.date.localeCompare(q.date)).pop() || null,
  };
}

export async function importPetState(userId, raw) {
  if (!raw) return;
  await savePetState(userId, mergePetState(await getPetState(userId), raw));
}
