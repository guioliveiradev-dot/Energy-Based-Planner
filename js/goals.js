// Metas e desafios da semana (segunda a domingo). Tudo é calculado a partir das tarefas já concluídas;
// só o que a pessoa escolheu (a meta) e o que ela já recebeu ficam guardados, na tabela 'meta' do banco
// (sem mudar a versão do banco), por usuário. Entra no backup e na importação (união: nunca perde o que a conta já tem).
//   target:   quantas tarefas quer concluir na semana (ou null = sem meta)
//   claimed:  { "2026-10-12": { goal: true, ch: ["focus", ...] } }  o que já foi recebido em cada semana (chave = segunda-feira)
// Tom do app: sem culpa. Nada pune: quem não bate a meta só começa a semana nova do zero.

import { getMeta, setMeta, deleteMeta } from './db.js';
import { dayKey } from './progress.js';
import { CATEGORY_LABELS, CATEGORY_ICON } from './categories.js';

export const GOAL_TARGETS = [3, 5, 7, 10, 15];
export const GOAL_BONUS = 50;               // pontos ao bater a meta (entram no saldo, não no nível)
const KEEP_WEEKS = 12;                      // semanas antigas guardadas no estado

const key = (userId) => `goals:${userId}`;

// ---------- Semana ----------
export function weekStart(now = Date.now()) {
  const n = new Date(now);
  return new Date(n.getFullYear(), n.getMonth(), n.getDate() - ((n.getDay() + 6) % 7));
}
export const weekKey = (now = Date.now()) => dayKey(weekStart(now).getTime());
const nextWeekStart = (now) => { const s = weekStart(now); return new Date(s.getFullYear(), s.getMonth(), s.getDate() + 7).getTime(); };

// ---------- Desafios ----------
// measure(lista de tarefas concluídas na semana) devolve o progresso. Cada um tem n (o que precisa), bonus e um ícone do app.
const hourOf = (t) => new Date(t.completedAt).getHours();
const POOL = {
  high:    { icon: 'zap', title: 'Conclua 2 tarefas de energia 8 ou mais', n: 2, bonus: 30, measure: (l) => l.filter((t) => t.energyCost >= 8).length },
  gentle:  { icon: 'heart', title: 'Conclua 2 tarefas leves (energia até 3)', n: 2, bonus: 20, measure: (l) => l.filter((t) => t.energyCost <= 3).length },
  early:   { icon: 'clock', title: 'Conclua uma tarefa antes das 10h', n: 1, bonus: 20, measure: (l) => l.filter((t) => hourOf(t) < 10).length },
  late:    { icon: 'moon', title: 'Conclua uma tarefa depois das 18h', n: 1, bonus: 20, measure: (l) => l.filter((t) => hourOf(t) >= 18).length },
  focus:   { icon: 'timer', title: 'Fique 2 horas focado na semana', n: 120, unit: 'min', bonus: 40, measure: (l) => l.reduce((a, t) => a + (t.durationMinutes || 0), 0) },
  days3:   { icon: 'calendar', title: 'Conclua tarefas em 3 dias diferentes', n: 3, bonus: 30, measure: (l) => new Set(l.map((t) => dayKey(t.completedAt))).size },
  busy:    { icon: 'flame', title: 'Conclua 3 tarefas no mesmo dia', n: 3, bonus: 30, measure: (l) => { const m = new Map(); l.forEach((t) => m.set(dayKey(t.completedAt), (m.get(dayKey(t.completedAt)) || 0) + 1)); return Math.max(0, ...m.values()); } },
  mix:     { icon: 'palette', title: 'Conclua tarefas de 2 categorias diferentes', n: 2, bonus: 20, measure: (l) => new Set(l.map((t) => t.category)).size },
  weekend: { icon: 'calendar', title: 'Conclua uma tarefa no sábado ou domingo', n: 1, bonus: 20, measure: (l) => l.filter((t) => [0, 6].includes(new Date(t.completedAt).getDay())).length },
};
const CATEGORIES = Object.keys(CATEGORY_LABELS);
// Desafio de categoria: a categoria muda conforme o sorteio da semana. O id guarda a categoria ("cat:health").
function categoryChallenge(cat) {
  return { icon: CATEGORY_ICON[cat], title: `Conclua 3 tarefas de ${CATEGORY_LABELS[cat]}`, n: 3, bonus: 30, measure: (l) => l.filter((t) => t.category === cat).length };
}
const defOf = (id) => (id.startsWith('cat:') ? (CATEGORIES.includes(id.slice(4)) ? categoryChallenge(id.slice(4)) : null) : POOL[id] || null);

// Sorteio fixo por pessoa e semana: o mesmo usuário vê os mesmos desafios a semana toda (e em qualquer aparelho).
function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let a = seed; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function challengeIds(userId, now = Date.now()) {
  const rand = rng(hash(`${userId}|${weekKey(now)}`));
  const ids = [`cat:${CATEGORIES[Math.floor(rand() * CATEGORIES.length)]}`, ...Object.keys(POOL)];
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  return ids.slice(0, 3);
}

// ---------- Estado guardado ----------
const isWeek = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
export function cleanGoalState(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const claimed = {};
  const src = r.claimed && typeof r.claimed === 'object' ? r.claimed : {};
  for (const wk of Object.keys(src).filter(isWeek).sort().slice(-KEEP_WEEKS)) {
    const c = src[wk] || {};
    claimed[wk] = { goal: c.goal === true, ch: [...new Set((Array.isArray(c.ch) ? c.ch : []).filter((id) => typeof id === 'string' && defOf(id)))].sort() };
  }
  return { target: GOAL_TARGETS.includes(r.target) ? r.target : null, claimed };
}
export function mergeGoalState(a, b) {
  const x = cleanGoalState(a), y = cleanGoalState(b);
  const claimed = { ...x.claimed };
  for (const [wk, c] of Object.entries(y.claimed)) {
    const o = claimed[wk] || { goal: false, ch: [] };
    claimed[wk] = { goal: o.goal || c.goal, ch: [...new Set([...o.ch, ...c.ch])].sort() };
  }
  return cleanGoalState({ target: x.target ?? y.target, claimed });
}
export async function getGoalState(userId) { return cleanGoalState(await getMeta(key(userId))); }
export const saveGoalState = (userId, state) => setMeta(key(userId), cleanGoalState(state));
export const clearGoalState = (userId) => deleteMeta(key(userId));
export async function importGoalState(userId, raw) { if (raw) await saveGoalState(userId, mergeGoalState(await getGoalState(userId), raw)); }
export async function setGoalTarget(userId, target) {
  const state = await getGoalState(userId);
  await saveGoalState(userId, { ...state, target: GOAL_TARGETS.includes(target) ? target : null });
}

// ---------- Progresso da semana ----------
export function weekProgress({ tasks, state, userId, now = Date.now() }) {
  const wk = weekKey(now), from = weekStart(now).getTime(), to = nextWeekStart(now);
  const list = tasks.filter((t) => t.completed && t.completedAt >= from && t.completedAt < to);
  const got = state.claimed[wk] || { goal: false, ch: [] };
  const target = state.target;
  const goal = { target, done: list.length, reached: target !== null && list.length >= target, claimed: got.goal, extra: target !== null ? Math.max(0, list.length - target) : 0, bonus: GOAL_BONUS };
  const challenges = challengeIds(userId, now).map((id) => {
    const d = defOf(id);
    const v = d.measure(list);
    return { id, icon: d.icon, title: d.title, n: d.n, unit: d.unit || null, bonus: d.bonus, v: Math.min(v, d.n), done: v >= d.n, claimed: got.ch.includes(id) };
  });
  return { weekKey: wk, goal, challenges };
}

// Recebe o que foi conquistado e ainda não foi pago (chame depois de concluir uma tarefa ou de mudar a meta).
// Devolve { items: [{ kind, title, bonus }], total }; quem chama soma `total` ao saldo. Cada recompensa sai uma vez só por semana.
export async function claimWeekRewards({ userId, tasks, now = Date.now() }) {
  const state = await getGoalState(userId);
  const p = weekProgress({ tasks, state, userId, now });
  const items = [];
  if (p.goal.reached && !p.goal.claimed) items.push({ kind: 'goal', title: 'Meta da semana batida', bonus: GOAL_BONUS });
  for (const c of p.challenges) if (c.done && !c.claimed) items.push({ kind: 'challenge', id: c.id, title: c.title, bonus: c.bonus });
  if (!items.length) return { items, total: 0 };
  const got = state.claimed[p.weekKey] || { goal: false, ch: [] };
  const claimed = { ...state.claimed, [p.weekKey]: { goal: got.goal || items.some((i) => i.kind === 'goal'), ch: [...got.ch, ...items.filter((i) => i.kind === 'challenge').map((i) => i.id)] } };
  await saveGoalState(userId, { ...state, claimed });
  return { items, total: items.reduce((a, i) => a + i.bonus, 0) };
}

// Pedido para abrir o Perfil já na aba "Metas" (usado pelo botão da Home).
let requestedTab = null;
export const requestProfileTab = (tab) => { requestedTab = tab; };
export const takeRequestedProfileTab = () => { const t = requestedTab; requestedTab = null; return t; };
