// Meta da semana (anel) e desafios da semana (um cartão por desafio). Usado na Home (só a meta) e na aba "Metas" do Perfil (meta e desafios).
// Uso: mountGoals(elemento, { userId, awardXP, withChallenges, showLink }) — o próprio componente lê as tarefas, desenha e cuida dos cliques.
// Tom sem culpa: nunca mostra "falhou". Sem meta, só um convite. Os pontos entram no saldo, não no nível.

import { icon } from '../icons.js';
import { escapeHtml, toast } from '../ui.js';
import { getUserTasks } from '../db.js';
import { GOAL_TARGETS, GOAL_BONUS, getGoalState, setGoalTarget, weekProgress, claimWeekRewards, requestProfileTab } from '../goals.js';

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const bar = (p, label) => `<div class="progress" role="progressbar" aria-label="${escapeHtml(label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}"><div class="progress-bar" style="width:${p}%"></div></div>`;

function picker(selected) {
  return `<div class="goal-pick" role="group" aria-label="Quantas tarefas por semana">${GOAL_TARGETS.map((n) => `<button type="button" class="chip${n === selected ? ' active' : ''}" aria-pressed="${n === selected}" data-goal-pick="${n}">${n}</button>`).join('')}</div>`;
}

export function goalCardHTML(goal, { editing = false, pending = 5, showLink = false } = {}) {
  const head = (extra = '') => `<div class="goal-head"><span class="goal-ico ${goal.reached ? 'done' : ''}" aria-hidden="true">${icon(goal.reached ? 'check' : 'target', 22, 'ico')}</span><div class="grow"><h3 class="goal-title">Meta da semana</h3><p class="muted xs">De segunda a domingo</p></div>${extra}</div>`;
  if (goal.target === null || editing) {
    return `<div class="glass-card pad-lg stack goal-card">${head()}
      <p class="small">${goal.target === null ? 'Que tal uma meta para esta semana? Você escolhe quantas tarefas e pode mudar quando quiser.' : 'Quantas tarefas você quer concluir nesta semana?'}</p>
      ${picker(pending)}
      <div class="row" style="gap:0.5rem;flex-wrap:wrap">
        <button class="btn-neon btn-sm" type="button" data-goal-save>${goal.target === null ? 'Definir minha meta' : 'Salvar'}</button>
        ${goal.target !== null ? '<button class="btn btn-sm" type="button" data-goal-cancel>Cancelar</button><button class="btn btn-sm" type="button" data-goal-clear>Tirar a meta</button>' : ''}
      </div>
      <p class="goal-note">Ao bater a meta você ganha +${GOAL_BONUS} pontos, uma vez por semana.</p></div>`;
  }
  const p = Math.min(1, goal.done / goal.target), C = 2 * Math.PI * 34;
  const faltam = goal.target - goal.done;
  const note = goal.reached
    ? `Meta batida! +${GOAL_BONUS} pontos no seu saldo${goal.extra > 0 ? ` · ${goal.extra} a mais` : ''}`
    : `Mais ${plural(faltam, 'tarefa', 'tarefas')} para ganhar +${GOAL_BONUS} pontos`;
  return `<div class="glass-card pad-lg goal-card"><div class="goal-ring">
      <div class="ring" role="img" aria-label="${Math.min(goal.done, goal.target)} de ${goal.target} tarefas concluídas nesta semana">
        <svg class="r" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--muted))" stroke-width="8"/><circle cx="40" cy="40" r="34" fill="none" stroke="${goal.reached ? 'hsl(var(--success))' : 'hsl(var(--accent))'}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${(C * p).toFixed(1)} ${C.toFixed(1)}"/></svg>
        <span class="num" aria-hidden="true">${Math.min(goal.done, goal.target)}/${goal.target}</span></div>
      <div class="stack" style="gap:0.25rem;min-width:0"><h3 class="goal-title">Meta da semana</h3>
        <p class="goal-note ${goal.reached ? 'ok' : ''}">${goal.reached ? icon('sparkles', 14, 'ico') + ' ' : ''}${note}</p>
        <div class="row" style="gap:0.5rem;flex-wrap:wrap"><button class="btn btn-sm" type="button" data-goal-edit>Mudar</button>${showLink ? `<button class="btn btn-sm" type="button" data-goal-link>${icon('target', 14, 'ico')} Ver desafios</button>` : ''}</div></div>
    </div></div>`;
}

export function challengesHTML(challenges) {
  const cards = challenges.map((c) => {
    const frac = c.done ? 'Concluído' : `${c.v} de ${c.n}${c.unit ? ` ${c.unit}` : ''}`;
    return `<div class="glass-card pad ch-card"><div class="ch-row"><span class="ch-ico ${c.done ? 'done' : ''}" aria-hidden="true">${icon(c.done ? 'check' : c.icon, 20, 'ico')}</span>
      <div style="min-width:0"><h4 class="ch-title">${escapeHtml(c.title)}</h4><p class="muted xs">${frac}</p></div>
      <span class="ch-bonus ${c.claimed ? 'got' : ''}">${icon('gift', 12, 'ico')} +${c.bonus}</span></div>
      ${c.done ? '' : bar(Math.round((c.v / c.n) * 100), c.title)}</div>`;
  }).join('');
  return `<div class="stack" style="gap:0.75rem"><div><h3 class="section-title">Desafios da semana</h3><p class="muted xs">São opcionais e mudam toda segunda-feira. Cada um dá pontos para o seu saldo.</p></div>${cards}</div>`;
}

export async function mountGoals(el, { userId, awardXP, withChallenges = false, showLink = false, tasks = null }) {
  let editing = false, pending = 5;
  async function render(list) {
    const all = list || await getUserTasks(userId);
    const state = await getGoalState(userId);
    const p = weekProgress({ tasks: all, state, userId });
    if (state.target !== null && !editing) pending = state.target;
    el.innerHTML = goalCardHTML(p.goal, { editing, pending, showLink }) + (withChallenges ? challengesHTML(p.challenges) : '');
    el.classList.add('stack');
    return all;
  }
  async function claimAndSay() {
    const { items, total } = await claimWeekRewards({ userId, tasks: await getUserTasks(userId) });
    if (total > 0) {
      await awardXP(total);
      toast(items.length === 1 ? `${items[0].title}! +${total} pontos` : `Você conquistou ${items.length} recompensas! +${total} pontos`, 'success', 5000);
    }
  }
  el.onclick = async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.dataset.goalPick) { pending = Number(btn.dataset.goalPick); await render(); el.querySelector(`[data-goal-pick="${pending}"]`)?.focus(); }
    else if (btn.hasAttribute('data-goal-edit')) { editing = true; await render(); el.querySelector('.goal-pick .chip.active')?.focus(); }
    else if (btn.hasAttribute('data-goal-cancel')) { editing = false; await render(); }
    else if (btn.hasAttribute('data-goal-clear')) { await setGoalTarget(userId, null); editing = false; pending = 5; await render(); }
    else if (btn.hasAttribute('data-goal-save')) { await setGoalTarget(userId, pending); editing = false; await claimAndSay(); await render(); }
    else if (btn.hasAttribute('data-goal-link')) { requestProfileTab('goals'); location.hash = '#/profile'; }
  };
  return render(tasks);
}
