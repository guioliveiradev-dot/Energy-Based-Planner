// Cronômetro da missão, com o pet ativo. Porte de TaskTimer.tsx.
//
// Uso:
//   const timer = createTaskTimer({
//     userId, taskTitle, durationMinutes, startedAt,
//     pausedAt, pauseOffset,     // estado de pausa guardado na tarefa (veja task-time.js)
//     onUpdate: (times) => ...,  // chamado ao pausar/continuar: guarde times.pausedAt e times.pauseOffset
//     onComplete,                // chamado ao clicar em "Coletar Pontos"
//     energyCost, category,      // (opcionais) aparecem na aba Detalhes; com energyCost mostra os pontos ao concluir
//     subtasks, notes,           // (opcionais) etapas e nota da tarefa: aba Etapas
//     onSubtasksChange,          // chamado ao marcar/desmarcar uma etapa, com a lista nova
//     cycle, onCycleChange,      // (opcional) ciclos de foco e descanso: { focus, rest } ou null (veja cycles.js)
//   });
//   timer.open();     // abre a janela
//   timer.destroy();  // fecha e limpa tudo
//
// A janela tem 3 abas: Foco (anel, ciclos, pet e pausa), Etapas (só se a tarefa tem etapas ou nota) e Detalhes
// (energia, categoria, tempos, pontos e escolha dos ciclos). Nas abas Etapas e Detalhes uma faixa no topo mantém
// o tempo e o botão de pausa sempre à vista.
//
// O tempo aparece dentro de um anel que se enche conforme o tempo passa. O botão no canto abre o MODO FOCO:
// o cronômetro ocupa a tela toda (e, se o navegador deixar, entra em tela cheia). Esc sai do modo foco primeiro.
//
// Fechar a janela com o tempo rodando pausa o cronômetro (igual ao original).
// As animações do pet estão em css/style.css, controladas por data-state.

import { createModal } from './modal.js';
import { icon } from '../icons.js';
import { escapeHtml } from '../ui.js';
import { ALL_PETS, getActivePet } from '../themes.js';
import { getUserPetBonds } from '../db.js';
import { petFaceHTML } from '../pets.js';
import { notifyTimerDone, notifyPhaseChange } from '../alerts.js';
import { remainingSeconds, pausedTask, resumedTask } from '../task-time.js';
import { pointsForTask } from '../progress.js';
import { CATEGORY_LABELS, categoryIcon } from '../categories.js';
import { CYCLE_OPTIONS, cleanCycle, sameCycle, cyclePhase } from '../cycles.js';
import { toggleSubtask, subtaskProgress } from '../subtasks.js';

const PET_MESSAGES = {
  cat:     ['Miau! Continue!', 'Purrfecto!', 'Foco, humano!', 'Ronron...'],
  dog:     ['Au au! Vai lá!', 'Bom garoto!', 'Você consegue!', 'Woof!'],
  dragon:  ['Fogo total!', 'Poder máximo!', 'Dracarys!', 'Imbatível!'],
  phoenix: ['Uhu! Foco!', 'Olho vivo!', 'Sabedoria!', 'Noite produtiva!'],
  robot:   ['Processando...', 'Eficiência 100%!', 'Modo turbo!', 'Beep boop!'],
  unicorn: ['Magia pura!', 'Arco-íris!', 'Brilhante!', 'Encantador!'],
};
const CELEBRATE = ['star', 'sparkles', 'gem', 'sparkles', 'star', 'flame', 'gem', 'sparkles'];   // ícones do app

const pad2 = (n) => String(n).padStart(2, '0');
const clock = (sec) => {
  const t = Math.max(0, Math.floor(sec));
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), r = t % 60;
  return h > 0 ? `${h}:${pad2(m)}:${pad2(r)}` : `${pad2(m)}:${pad2(r)}`;
};
const PHRASES = { running: 'Um passo de cada vez. Está indo bem.', paused: 'Sem pressa. Continue quando quiser.', done: 'Tempo concluído. Bom trabalho!' };

function petHTML(pet) {
  const particles = [...Array(6)].map((_, i) => {
    const a = (i * Math.PI * 2) / 6;
    return `<span style="--dx:${Math.round(Math.cos(a) * 40)}px;--dy:${Math.round(Math.sin(a) * 40)}px;--delay:${(i * 0.4).toFixed(1)}s"></span>`;
  }).join('');
  const celebrate = CELEBRATE.map((c, i) => {
    const a = (i * Math.PI * 2) / 8;
    return `<span style="--dx:${Math.round(Math.cos(a) * 55)}px;--dy:${Math.round(Math.sin(a) * 55)}px;--delay:${(i * 0.2).toFixed(1)}s">${icon(c, 14)}</span>`;
  }).join('');
  const zs = [0, 1, 2].map((i) =>
    `<span class="pet-z" style="--i:${i}">Z</span>`).join('');

  return `
    <div class="pet-stage" data-state="running" data-hot="false" data-particles="false">
      <div class="pet-wrap">
        <div class="pet-ring"></div>
        <div class="pet-particles">${particles}</div>
        <div class="pet-bubble" role="status"></div>
        <div class="pet-body">
          <div class="pet-glow"></div>
          <div class="pet-face">${petFaceHTML(pet, { bond: 0, pose: 'work', size: 76 })}</div>
          <div class="pet-timer-chip">${icon('timer', 14)}</div>
          ${zs}
          <div class="pet-celebrate">${celebrate}</div>
        </div>
      </div>
      <p class="pet-status"></p>
    </div>`;
}

export function createTaskTimer({
  userId, taskTitle, durationMinutes, startedAt, pausedAt = null, pauseOffset = 0, onUpdate = () => {}, onComplete,
  energyCost = null, category = null, subtasks = [], notes = '', onSubtasksChange = () => {}, cycle = null, onCycleChange = () => {},
}) {
  const total = durationMinutes * 60;
  const pet = ALL_PETS.find((p) => p.id === getActivePet(userId));

  // Dados de tempo. Ao pausar/continuar, onUpdate(times) é chamado para quem usa o cronômetro guardar na tarefa.
  let times = { startedAt, durationMinutes, pausedAt, pauseOffset };
  let remaining = remainingSeconds(times);
  let isPaused = !!times.pausedAt;
  let isDone = false;
  let tickId = null;
  let bubbleInterval = null;
  let bubbleFirst = null;
  let bubbleHide = null;
  let lastActionState = null;
  let savedTitle = null;   // título da aba antes de abrir o cronômetro
  let steps = Array.isArray(subtasks) ? subtasks.map((x) => ({ ...x })) : [];
  const noteText = typeof notes === 'string' ? notes.trim() : '';
  let curCycle = cleanCycle(cycle);
  let activeTab = 'focus';
  let lastPhaseKey = null;   // fase do ciclo na última batida do relógio (para avisar só quando troca)
  const hasSteps = () => steps.length > 0 || !!noteText;
  const planned = durationMinutes >= 60 && durationMinutes % 60 === 0 ? `${durationMinutes / 60} h` : `${durationMinutes} min`;

  let focusOn = false;
  const modal = createModal({ className: 'timer-panel center stack', onRequestClose: () => { if (focusOn) setFocus(false); else close(); } });
  modal.panel.innerHTML = `
    <button class="modal-close" data-role="close" aria-label="Fechar">${icon('x', 18)}</button>
    <button class="timer-focus-btn" data-role="focus" aria-pressed="false" aria-label="Modo foco (tela cheia)">${icon('maximize-2', 18)}</button>
    <div class="stack" style="align-items:center;gap:0.5rem">
      <span class="text-primary">${icon('timer', 24)}</span>
      <h2 class="timer-title">${escapeHtml(taskTitle)}</h2>
    </div>
    <div class="timer-panels">
      <div class="timer-tabpanel stack" id="tt-p-focus" role="tabpanel" aria-labelledby="tt-t-focus" data-panel="focus">
        <div data-role="phase"></div>
        <div class="stack" style="gap:1rem">
          <div class="timer-ring">
            <svg viewBox="0 0 120 120" role="progressbar" aria-label="Tempo da tarefa" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" data-role="ring">
              <circle class="ring-track" cx="60" cy="60" r="54" pathLength="100"/>
              <circle class="ring-arc" data-role="arc" cx="60" cy="60" r="54" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/>
            </svg>
            <p class="timer-time" data-role="time">00:00</p>
          </div>
          <p class="timer-paused" data-role="paused" hidden>${icon('pause', 12, 'ico')} Pausado</p>
          <div data-role="dots"></div>
        </div>
        <div class="tm-rest" data-role="rest" hidden>
          <div class="tm-breath" aria-hidden="true">Respire</div>
          <p class="tm-rest-time" data-role="rest-time">00:00</p>
          <p class="tm-sub">Hora de descansar. Inspire por 4, solte por 6. Sem pressa.</p>
          <p class="tm-sub">Faltam <b data-role="rest-total">00:00</b> no total.</p>
        </div>
        <div data-role="actions"></div>
        ${pet ? petHTML(pet) : ''}
      </div>
      <div class="timer-tabpanel stack" id="tt-p-steps" role="tabpanel" aria-labelledby="tt-t-steps" data-panel="steps" hidden>
        <div data-role="strip"></div>
        <div data-role="steps" class="stack" style="gap:0.5rem"></div>
      </div>
      <div class="timer-tabpanel stack" id="tt-p-details" role="tabpanel" aria-labelledby="tt-t-details" data-panel="details" hidden>
        <div data-role="strip"></div>
        <div data-role="details" class="stack" style="gap:0.75rem"></div>
      </div>
    </div>
    <div class="tabs timer-tabs" role="tablist" aria-label="Partes do cronômetro" data-role="tabs"></div>`;

  const q = (role) => modal.panel.querySelector(`[data-role="${role}"]`);
  const timeEl = q('time');
  const ringEl = q('ring');
  const arcEl = q('arc');
  const focusBtn = q('focus');
  const pausedEl = q('paused');
  const actionsEl = q('actions');
  const qa = (role) => [...modal.panel.querySelectorAll(`[data-role="${role}"]`)];
  const phaseEl = q('phase');
  const dotsEl = q('dots');
  const restEl = q('rest');
  const restTimeEl = q('rest-time');
  const restTotalEl = q('rest-total');
  const ringBoxEl = modal.panel.querySelector('.timer-ring');
  const tabsEl = q('tabs');
  const stepsEl = q('steps');
  const detailsEl = q('details');
  const stage = modal.panel.querySelector('.pet-stage');
  const bubble = modal.panel.querySelector('.pet-bubble');
  const status = modal.panel.querySelector('.pet-status');
  const faceEl = modal.panel.querySelector('.pet-face');
  let petBond = 0, facePose = 'work', faceBond = 0;   // a arte só é redesenhada quando a pose ou a forma mudam
  const POSE_BY_STATE = { running: 'work', paused: 'sleep', done: 'cheer' };
  function paintFace(state) {
    if (!faceEl || pet.id !== 'fagulha') return;
    const pose = POSE_BY_STATE[state];
    if (pose === facePose && petBond === faceBond) return;
    facePose = pose; faceBond = petBond;
    faceEl.innerHTML = petFaceHTML(pet, { bond: petBond, pose, size: 76 });
  }
  if (pet && pet.id === 'fagulha') {
    getUserPetBonds(userId).then((all) => { petBond = (all.find((b) => b.petId === 'fagulha') || { bond: 0 }).bond; paintFace(currentState()); }).catch(() => {});
  }

  const computeRemaining = () => remainingSeconds(times);
  const currentState = () => (isDone ? 'done' : isPaused ? 'paused' : 'running');

  function paintActions() {
    const state = currentState();
    if (state === lastActionState) return;
    lastActionState = state;
    if (state === 'done') {
      actionsEl.innerHTML = `<button class="btn-neon btn-block row-center" data-action="collect">${icon('sparkles', 18)} Coletar Pontos</button>`;
    } else if (state === 'paused') {
      actionsEl.innerHTML = `<button class="btn-neon btn-block row-center" data-action="resume">${icon('play', 18)} Continuar</button>`;
    } else {
      actionsEl.innerHTML = `<button class="btn-ghost btn-block row-center" data-action="pause">${icon('pause', 16)} Pausar</button>`;
    }
  }

  function paint() {
    const state = currentState();
    const shown = isPaused ? remaining : (isDone ? 0 : remaining);
    const progress = total > 0 ? Math.max(0, 1 - shown / total) : 1;

    timeEl.textContent = isDone ? '00:00' : `${pad2(Math.floor(shown / 60))}:${pad2(Math.floor(shown % 60))}`;
    timeEl.dataset.state = state;
    if (modal.isOpen) {
      document.title = isDone ? `Tempo esgotado · ${taskTitle}` : `${timeEl.textContent}${isPaused ? ' (pausado)' : ''} · ${taskTitle}`;
    }
    arcEl.style.strokeDashoffset = String(Math.round((1 - progress) * 1000) / 10);   // anel que se enche
    arcEl.dataset.state = state;
    ringEl.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
    pausedEl.hidden = !(isPaused && !isDone);
    paintActions();

    if (stage) {
      stage.dataset.state = state;
      paintFace(state);
      stage.dataset.hot = String(progress > 0.75 && !isDone);
      stage.dataset.particles = String((progress > 0.5 || isDone) && !isPaused);
      status.textContent = isDone
        ? `${pet.name} está comemorando!`
        : isPaused ? `${pet.name} está esperando...`
        : `${pet.name} está te ajudando!`;
    }

    // ciclos, faixa de tempo e detalhes
    const elapsed = isDone ? total : Math.max(0, total - shown);
    const info = cyclePhase(curCycle, elapsed, total);
    paintCycle(info, state);
    paintStrip(info, state);
    paintDetails(elapsed, state);
  }

  // Fase do ciclo (Foco 2 de 4 / Descanso 5 min), bolinhas e cartão de descanso. Só mexe no HTML quando muda.
  const cache = {};
  const put = (el, key, html) => { if (cache[key] !== html) { cache[key] = html; el.innerHTML = html; } };
  function paintCycle(info, state) {
    if (!info) {
      put(phaseEl, 'phase', ''); put(dotsEl, 'dots', '');
      restEl.hidden = true;
      ringBoxEl.hidden = false;
      if (stage) stage.hidden = false;
      return;
    }
    const rest = info.phase === 'rest';
    put(phaseEl, 'phase', `<div class="tm-seg" role="group" aria-label="Fase atual"><span class="${rest ? '' : 'on'}"${rest ? '' : ' aria-current="step"'}>Foco ${info.index} de ${info.count}</span><span class="${rest ? 'on' : ''}"${rest ? ' aria-current="step"' : ''}>Descanso ${info.restMinutes} min</span></div>`);
    put(dotsEl, 'dots', info.count <= 8
      ? `<div class="tm-dots" role="img" aria-label="Ciclo ${info.index} de ${info.count}">${[...Array(info.count)].map((_, i) => `<i class="${i < info.index ? 'on' : ''}${i === info.index - 1 ? ' now' : ''}"></i>`).join('')}</div>` : '');
    restEl.hidden = !rest;
    restEl.dataset.state = state;
    restTimeEl.textContent = clock(info.phaseRemaining);
    restTotalEl.textContent = timeEl.textContent;
    ringBoxEl.hidden = rest;   // no descanso o anel sai de cena: ficam só a respiração e o tempo do descanso
    if (stage) stage.hidden = rest;
  }

  // Faixa do topo das abas Etapas e Detalhes: tempo, fase e o botão de pausa.
  function paintStrip(info, state) {
    const sub = state === 'done' ? 'Tempo esgotado' : state === 'paused' ? 'Pausado' : info ? (info.phase === 'rest' ? 'Descanso' : `Foco ${info.index} de ${info.count}`) : 'Em andamento';
    const btn = state === 'done' ? ['collect', 'sparkles', 'Coletar Pontos', 'btn-neon'] : state === 'paused' ? ['resume', 'play', 'Continuar', 'btn-neon'] : ['pause', 'pause', 'Pausar', 'tm-mini'];
    const html = `<div class="tm-strip"><span><b>${timeEl.textContent}</b><small>${sub}</small></span><button type="button" class="${btn[3]}" data-role="strip-action" data-kind="${btn[0]}">${icon(btn[1], 14)} ${btn[2]}</button></div>`;
    qa('strip').forEach((el) => put(el, 'strip', html));
  }

  function paintDetails(elapsed, state) {
    const chips = [
      energyCost != null ? `<span class="tm-chip">${icon('battery-medium', 14, 'ico')} Energia ${energyCost}</span>` : '',
      CATEGORY_LABELS[category] ? `<span class="tm-chip">${categoryIcon(category, 14)} ${CATEGORY_LABELS[category]}</span>` : '',
    ].join('');
    const stats = [
      [clock(elapsed), 'já passou'],
      [planned, 'planejado'],
      ...(energyCost != null ? [[`+${pointsForTask({ energyCost, durationMinutes })}`, 'pontos ao concluir']] : []),
    ];
    const opts = [['', null, 'Sem ciclos'], ...CYCLE_OPTIONS.map((o) => [`${o.focus}-${o.rest}`, o, `${o.focus} + ${o.rest} min`])];
    put(detailsEl, 'details', `
      ${chips ? `<div class="tm-chips">${chips}</div>` : ''}
      <div class="tm-stats" style="--cols:${stats.length}">${stats.map(([v, l]) => `<div class="tm-stat"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
      <div class="stack" style="gap:0.375rem">
        <h3 class="tm-h" id="tt-cycle-h">Ciclos de foco e descanso</h3>
        <div class="tm-cycle" role="group" aria-labelledby="tt-cycle-h">${opts.map(([id, o, label]) => `<button type="button" class="tm-opt${sameCycle(curCycle, o) ? ' on' : ''}" data-cycle="${id}" aria-pressed="${sameCycle(curCycle, o)}">${label}</button>`).join('')}</div>
        <p class="tm-sub">Opcional. O descanso conta dentro do tempo da tarefa, e você pode ignorá-lo.</p>
      </div>
      <p class="tm-sub center">${PHRASES[state]}</p>`);
  }

  function renderSteps() {
    const { done, total } = subtaskProgress({ subtasks: steps });
    stepsEl.innerHTML = `
      ${total ? `<h3 class="tm-h">Etapas · ${done} de ${total}</h3>
      <div class="tm-steps">${steps.map((x) => `<label class="tm-step${x.done ? ' done' : ''}"><input type="checkbox" class="tm-check" data-step="${escapeHtml(x.id)}"${x.done ? ' checked' : ''}><span class="box" aria-hidden="true">${icon('check', 12)}</span><span class="txt">${escapeHtml(x.title)}</span></label>`).join('')}</div>` : ''}
      ${noteText ? `<p class="tm-note"><b>Nota:</b> ${escapeHtml(noteText)}</p>` : ''}`;
  }

  // Abas: Foco e Detalhes sempre; Etapas só se a tarefa tem etapas ou nota.
  function renderTabs() {
    const { done, total } = subtaskProgress({ subtasks: steps });
    const list = [
      ['focus', 'timer', 'Foco'],
      ...(hasSteps() ? [['steps', 'list-todo', total ? `Etapas ${done}/${total}` : 'Nota']] : []),
      ['details', 'sparkles', 'Detalhes'],
    ];
    tabsEl.innerHTML = list.map(([id, ic, label]) => `<button type="button" class="tab${id === activeTab ? ' active' : ''}" role="tab" id="tt-t-${id}" aria-selected="${id === activeTab}" aria-controls="tt-p-${id}" tabindex="${id === activeTab ? '0' : '-1'}" data-tabid="${id}">${icon(ic, 16, 'ico')} ${label}</button>`).join('');
  }

  function setTab(id, { focus = false } = {}) {
    activeTab = id;
    modal.panel.querySelectorAll('[data-panel]').forEach((el) => { el.hidden = el.dataset.panel !== id; });
    renderTabs();
    if (focus) tabsEl.querySelector(`[data-tabid="${id}"]`)?.focus();
  }

  function tick() {
    if (isPaused) { paint(); return; }       // pausado: o tempo NÃO anda
    remaining = computeRemaining();
    if (remaining <= 0 && !isDone) {
      isDone = true;
      stopTick();
      stopBubbles();
      notifyTimerDone();
    } else if (!isDone) {
      const info = cyclePhase(curCycle, total - remaining, total);
      const key = info ? `${info.phase}${info.index}` : null;
      if (lastPhaseKey && key && key !== lastPhaseKey) notifyPhaseChange();   // só avisa na troca de fase
      lastPhaseKey = key;
    }
    paint();
  }

  const startTick = () => { stopTick(); tickId = setInterval(tick, 1000); };
  const stopTick = () => { if (tickId) clearInterval(tickId); tickId = null; };

  // Balão de fala do pet: primeira vez em 1,5 s e depois a cada 6 s.
  function showBubble() {
    if (!pet) return;
    const msgs = PET_MESSAGES[pet.id] || PET_MESSAGES.cat;
    bubble.textContent = msgs[Math.floor(Math.random() * msgs.length)];
    bubble.classList.add('show');
    clearTimeout(bubbleHide);
    bubbleHide = setTimeout(() => bubble.classList.remove('show'), 2500);
  }
  function startBubbles() {
    if (!pet) return;
    stopBubbles();
    bubbleFirst = setTimeout(showBubble, 1500);
    bubbleInterval = setInterval(showBubble, 6000);
  }
  function stopBubbles() {
    clearTimeout(bubbleFirst);
    clearInterval(bubbleInterval);
    clearTimeout(bubbleHide);
    bubbleFirst = bubbleInterval = bubbleHide = null;
    if (bubble) bubble.classList.remove('show');
  }

  function pause() {
    if (isPaused || isDone) return;
    remaining = computeRemaining();
    times = pausedTask(times);
    isPaused = true;
    onUpdate({ ...times });
    stopTick();
    stopBubbles();
    paint();
  }

  function resume() {
    if (!isPaused) return;
    times = resumedTask(times);
    isPaused = false;
    onUpdate({ ...times });
    startTick();
    startBubbles();
    tick();
  }

  // Modo foco: o cronômetro ocupa a tela. Tenta a tela cheia do navegador (se ele não deixar, só ocupa a janela).
  function setFocus(on) {
    if (on === focusOn) return;
    focusOn = on;
    modal.panel.classList.toggle('focus-mode', on);
    modal.panel.parentElement?.classList.toggle('timer-focus', on);
    focusBtn.setAttribute('aria-pressed', String(on));
    focusBtn.setAttribute('aria-label', on ? 'Sair do modo foco' : 'Modo foco (tela cheia)');
    focusBtn.innerHTML = icon(on ? 'minimize-2' : 'maximize-2', 18);
    try {
      if (on && modal.panel.requestFullscreen) modal.panel.requestFullscreen().catch(() => {});
      else if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    } catch { /* sem tela cheia: segue só com o modo foco */ }
  }
  const onFullscreenChange = () => { if (focusOn && !document.fullscreenElement && modal.panel.requestFullscreen) setFocus(false); };
  document.addEventListener('fullscreenchange', onFullscreenChange);

  function restoreTitle() {
    if (savedTitle !== null) document.title = savedTitle;
    savedTitle = null;
  }

  function close() {
    pause();           // fechar com o tempo rodando pausa (igual ao original)
    stopTick();
    stopBubbles();
    setFocus(false);
    document.removeEventListener('fullscreenchange', onFullscreenChange);
    modal.close();
    restoreTitle();
  }

  function open() {
    if (modal.isOpen) return;
    savedTitle = document.title;
    lastPhaseKey = null;
    renderSteps();
    setTab('focus');
    modal.open();
    if (!isPaused && !isDone) {
      startTick();
      startBubbles();
    }
    tick();
  }

  modal.panel.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'pause') pause();
    else if (action === 'resume') resume();
    else if (action === 'collect') onComplete();
    else if (e.target.closest('[data-role="focus"]')) setFocus(!focusOn);
    else if (e.target.closest('[data-role="close"]')) close();
    else if (e.target.closest('[data-tabid]')) setTab(e.target.closest('[data-tabid]').dataset.tabid);
    else if (e.target.closest('[data-role="strip-action"]')) {
      const kind = e.target.closest('[data-role="strip-action"]').dataset.kind;
      if (kind === 'pause') pause(); else if (kind === 'resume') resume(); else onComplete();
    } else if (e.target.closest('[data-cycle]')) {
      const id = e.target.closest('[data-cycle]').dataset.cycle;
      const next = cleanCycle(CYCLE_OPTIONS.find((o) => `${o.focus}-${o.rest}` === id));
      if (sameCycle(next, curCycle)) return;
      curCycle = next;
      lastPhaseKey = null;
      onCycleChange(curCycle ? { ...curCycle } : null);
      paint();
      modal.panel.querySelector(`[data-cycle="${id}"]`)?.focus();
    }
  });

  // Marcar e desmarcar etapas (guarda na hora e mantém o foco no mesmo quadradinho)
  modal.panel.addEventListener('change', (e) => {
    const box = e.target.closest?.('[data-step]');
    if (!box) return;
    steps = toggleSubtask(steps, box.dataset.step);
    onSubtasksChange(steps.map((x) => ({ ...x })));
    renderSteps();
    renderTabs();
    stepsEl.querySelector(`[data-step="${box.dataset.step}"]`)?.focus();
  });

  // Setas do teclado nas abas
  tabsEl.addEventListener('keydown', (e) => {
    const items = [...tabsEl.querySelectorAll('[data-tabid]')];
    const i = items.indexOf(e.target.closest('[data-tabid]'));
    if (i < 0) return;
    const next = e.key === 'ArrowRight' ? items[(i + 1) % items.length] : e.key === 'ArrowLeft' ? items[(i - 1 + items.length) % items.length] : e.key === 'Home' ? items[0] : e.key === 'End' ? items[items.length - 1] : null;
    if (!next) return;
    e.preventDefault();
    setTab(next.dataset.tabid, { focus: true });
  });

  return {
    open,
    close,
    get isOpen() { return modal.isOpen; },
    get focusMode() { return focusOn; },
    destroy() { stopTick(); stopBubbles(); setFocus(false); document.removeEventListener('fullscreenchange', onFullscreenChange); modal.close(); restoreTitle(); },
  };
}
