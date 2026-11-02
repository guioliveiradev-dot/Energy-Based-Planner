// Registro de energia ao longo do dia. Cada vez que a pessoa gera uma missão, guardamos como estava a energia dela (1 a 10) e a hora.
// Com alguns registros, o app mostra em que parte do dia a energia costuma ser mais alta. Nada para preencher, nada é cobrado.
// Fica na tabela 'meta' do banco (sem mudar a versão), por usuário: lista compacta de [horário, energia].
import { getMeta, setMeta, deleteMeta } from './db.js';
import { PERIODS, periodOfHour } from './stats.js';

export const MAX_LOGS = 400;        // guarda os registros mais recentes
export const MERGE_MINUTES = 30;    // gerar várias missões em seguida conta como um registro só (vale o último)
export const MIN_LOGS = 6;          // quantos registros para começar a mostrar o padrão
export const MIN_PER_PERIOD = 2;    // quantos registros uma parte do dia precisa para entrar na comparação

const key = (userId) => `energy:${userId}`;

export function cleanEnergyLogs(raw) {
  const list = Array.isArray(raw) ? raw : [];
  const byTime = new Map();
  for (const item of list) {
    if (!Array.isArray(item)) continue;
    const [at, energy] = item;
    if (Number.isFinite(at) && at > 0 && Number.isInteger(energy) && energy >= 1 && energy <= 10) byTime.set(Math.floor(at), energy);
  }
  return [...byTime.entries()].sort((a, b) => a[0] - b[0]).slice(-MAX_LOGS);
}
export function mergeEnergyLogs(a, b) { return cleanEnergyLogs([...cleanEnergyLogs(a), ...cleanEnergyLogs(b)]); }

export async function getEnergyLogs(userId) { return cleanEnergyLogs(await getMeta(key(userId))); }
export const clearEnergyLogs = (userId) => deleteMeta(key(userId));
export async function importEnergyLogs(userId, raw) { if (raw && raw.length) await setMeta(key(userId), mergeEnergyLogs(await getEnergyLogs(userId), raw)); }

export async function addEnergyLog(userId, energy, now = Date.now()) {
  if (!Number.isInteger(energy) || energy < 1 || energy > 10) return null;
  const logs = await getEnergyLogs(userId);
  const last = logs[logs.length - 1];
  if (last && now - last[0] < MERGE_MINUTES * 60000 && now >= last[0]) logs[logs.length - 1] = [now, energy];
  else logs.push([now, energy]);
  const saved = cleanEnergyLogs(logs);
  await setMeta(key(userId), saved);
  return saved;
}

// Média da energia em cada parte do dia. `best`/`low` só aparecem com registros suficientes e uma diferença que valha a pena.
export function energyByPeriod(logs) {
  const sums = Object.fromEntries(PERIODS.map((p) => [p.id, { n: 0, sum: 0 }]));
  for (const [at, energy] of logs) { const s = sums[periodOfHour(new Date(at).getHours())]; s.n++; s.sum += energy; }
  const periods = PERIODS.map((p) => ({ ...p, count: sums[p.id].n, avg: sums[p.id].n >= MIN_PER_PERIOD ? Math.round((sums[p.id].sum / sums[p.id].n) * 10) / 10 : null }));
  const ranked = periods.filter((p) => p.avg !== null).sort((a, b) => b.avg - a.avg);
  const enough = logs.length >= MIN_LOGS && ranked.length >= 2;
  const spread = enough ? ranked[0].avg - ranked[ranked.length - 1].avg : 0;
  return { total: logs.length, periods, enough, best: enough && spread >= 1 ? ranked[0].id : null, low: enough && spread >= 1 ? ranked[ranked.length - 1].id : null };
}
