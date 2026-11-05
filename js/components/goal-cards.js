// Meta da semana (anel), sequência e desafios da semana (um cartão por desafio): tudo na página Metas. A Home só mostra a linha pequena (goalGlanceHTML).
// Uso: mountGoals(elemento, { userId, awardXP, withChallenges, withStreak }) — o próprio componente lê as tarefas, desenha e cuida dos cliques.
// Tom sem culpa: nunca mostra "falhou". Sem meta, só um convite. Os pontos entram no saldo, não no nível.

import { icon } from '../icons.js';
import { escapeHtml, toast } from '../ui.js';
import { getUserTasks } from '../db.js';
import { GOAL_TARGETS, GOAL_BONUS, GOAL_MAX, isValidTarget, getGoalState, setGoalTarget, weekProgress, claimWeekRewards } from '../goals.js';
import { streakCardHTML } from './progress-card.js';
import { streakInfo } from '../progress.js';
import { getStreakExtra } from '../pet-powers.js';

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const bar = (p, label) => `<div class="progress" role="progressbar" aria-label="${escapeHtml(label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}"><div class="progress-bar" style="width:${p}%"></div></div>`;

// Opções prontas e "Outro": com "Outro" aparece um campo para digitar qualquer número de 1 a GOAL_MAX.
function picker(selected, custom) {
  const chips = GOAL_TARGETS.map((n) => { const on = !custom && n === selected; return `<button type="button" class="chip${on ? ' active' : ''}" aria-pressed="${on}" data-goal-pick="${n}">${n}</button>`; }).join('');
  return `<div class="goal-pick" role="group" aria-label="Quantas tarefas por semana" data-roving="buttons">${chips}<button type="button" class="chip${custom ? ' active' : ''}" aria-pressed="${custom}" data-goal-pick="other">Outro</button></div>
    <div class="goal-custom" ${custom ? '' : 'hidden'}>
      <label class="label muted xs" for="goal-custom">Quantas tarefas por semana? (de 1 a ${GOAL_MAX})</label>
      <input class="input" id="goal-custom" type="number" inputmode="numeric" min="1" max="${GOAL_MAX}" value="${custom && isValidTarget(selected) ? selected : ''}" data-goal-custom aria-describedby="goal-error">
      <p class="goal-error" id="goal-error" role="alert" hidden>Escolha um número de 1 a ${GOAL_MAX}.</p>
    </div>`;
}

export function goalCardHTML(goal, { editing = false, pending = 5, custom = false } = {}) {
  const head = (extra = '') => `<div class="goal-head"><span class="goal-ico ${goal.reached ? 'done' : ''}" aria-hidden="true">${icon(goal.reached ? 'check' : 'target', 22, 'ico')}</span><div class="grow"><h3 class="goal-title">Meta da semana</h3><p class="muted xs">De segunda a domingo</p></div>${extra}</div>`;
  if (goal.target === null || editing) {
    return `<div class="glass-card pad-lg stack goal-card">${head()}
      <p class="small">${goal.target === null ? 'Que tal uma meta para esta semana? Você escolhe quantas tarefas e pode mudar quando quiser.' : 'Quantas tarefas você quer concluir nesta semana?'}</p>
      ${picker(pending, custom)}
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
        <div class="row" style="gap:0.5rem;flex-wrap:wrap"><button class="btn btn-sm" type="button" data-goal-edit>Mudar</button></div></div>
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

export async function mountGoals(el, { userId, awardXP, withChallenges = false, withStreak = false, tasks = null }) {
  let editing = false, pending = 5, custom = false;
  async function render(list) {
    const all = list || await getUserTasks(userId);
    const state = await getGoalState(userId);
    const p = weekProgress({ tasks: all, state, userId });
    if (state.target !== null && !editing) { pending = state.target; custom = !GOAL_TARGETS.includes(state.target); }
    const streak = withStreak ? streakCardHTML(streakInfo(all, Date.now(), await getStreakExtra(userId))) : '';
    el.innerHTML = goalCardHTML(p.goal, { editing, pending, custom }) + streak + (withChallenges ? challengesHTML(p.challenges) : '');
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
    if (btn.dataset.goalPick === 'other') { custom = true; await render(); el.querySelector('[data-goal-custom]')?.focus(); }
    else if (btn.dataset.goalPick) { pending = Number(btn.dataset.goalPick); custom = false; await render(); el.querySelector(`[data-goal-pick="${pending}"]`)?.focus(); }
    else if (btn.hasAttribute('data-goal-edit')) { editing = true; await render(); el.querySelector('.goal-pick .chip.active')?.focus(); }
    else if (btn.hasAttribute('data-goal-cancel')) { editing = false; await render(); }
    else if (btn.hasAttribute('data-goal-clear')) { await setGoalTarget(userId, null); editing = false; pending = 5; await render(); }
    else if (btn.hasAttribute('data-goal-save')) {
      if (!isValidTarget(pending)) { const err = el.querySelector('#goal-error'); if (err) err.hidden = false; el.querySelector('[data-goal-custom]')?.focus(); return; }
      await setGoalTarget(userId, pending); editing = false; await claimAndSay(); await render();
    }
  };
  // Enter no campo "Outro" salva a meta
  el.onkeydown = (e) => { if (e.key === 'Enter' && e.target.matches('[data-goal-custom]')) { e.preventDefault(); el.querySelector('[data-goal-save]')?.click(); } };
  // Digitando no campo "Outro": guarda o número sem redesenhar (para não perder o foco)
  el.oninput = (e) => {
    if (!e.target.matches('[data-goal-custom]')) return;
    const v = e.target.value.trim();
    pending = /^\d+$/.test(v) ? Number(v) : NaN;
    const err = el.querySelector('#goal-error');
    if (err) err.hidden = isValidTarget(pending) || v === '';
  };
  return render(tasks);
}

// Linha pequena da Home: leva para a página Metas. Sem meta definida, só um convite (nada de cobrança).
export function goalGlanceHTML(goal) {
  const go = icon('chevron-right', 16, 'ico');
  if (goal.target === null) {
    return `<a class="glance" href="#/goals" aria-label="Meta da semana: você ainda não definiu uma. Abrir Metas">${icon('target', 20, 'ico')}<span class="grow"><span class="t"><span>Meta da semana</span><span class="muted">Definir</span></span></span>${go}</a>`;
  }
  const n = Math.min(goal.done, goal.target);
  const pct = Math.round((n / goal.target) * 100);
  const txt = goal.reached ? 'Meta batida!' : `${n} de ${goal.target}`;
  return `<a class="glance" href="#/goals" aria-label="Meta da semana: ${goal.reached ? 'batida' : `${n} de ${goal.target} tarefas`}. Abrir Metas">${icon(goal.reached ? 'check' : 'target', 20, 'ico')}<span class="grow"><span class="t"><span>Meta da semana</span><span${goal.reached ? ' class="text-success"' : ''}>${txt}</span></span>${bar(pct, 'Meta da semana')}</span>${go}</a>`;
}

export async function mountGoalGlance(el, { userId, tasks = null }) {
  const all = tasks || await getUserTasks(userId);
  el.innerHTML = goalGlanceHTML(weekProgress({ tasks: all, state: await getGoalState(userId), userId }).goal);
}
