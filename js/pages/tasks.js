// Tela de Tarefas. Porte de Tasks.tsx.

import * as auth from '../auth.js';
import { getUserTasks, createTask, updateTask, deleteTask } from '../db.js';
import { icon } from '../icons.js';
import { escapeHtml, toast, formatDuration } from '../ui.js';
import { CATEGORY_LABELS, CATEGORY_EMOJI } from '../categories.js';
import { energyBadge } from '../components/energy-slider.js';
import { createTaskTimer } from '../components/task-timer.js';
import { showCongratsModal } from '../components/congrats-modal.js';
import { createModal } from '../components/modal.js';
import { remainingSeconds } from '../task-time.js';
import { pointsForTask, totalPoints, levelInfo, streakInfo } from '../progress.js';

const pad2 = (n) => String(n).padStart(2, '0');

function getTaskStatus(task) {
  if (!task.startedAt) return 'idle';
  return remainingSeconds(task) <= 0 ? 'done' : 'running';     // pausada conta como "em andamento"
}

const energyColor = (v) => (v <= 3 ? 'hsl(0,85%,55%)' : v <= 7 ? 'hsl(45,100%,55%)' : 'hsl(150,100%,50%)');

export async function renderTasks(container) {
  const user = auth.state.user;

  let tasks = [];
  let filterCategory = null;
  const timers = new Map(); // id da tarefa -> cronômetro (guarda o estado de pausa)

  container.innerHTML = `
    <section class="page" style="gap:1rem">
      <div class="row-between">
        <h1 style="font-size:1.125rem;font-weight:700">Tarefas</h1>
        <span class="muted xs" id="count"></span>
      </div>
      <div id="list" class="stack" style="gap:1rem"></div>
      <button class="fab btn-neon" id="fab" aria-label="Nova tarefa">${icon('plus', 28)}</button>
    </section>`;

  const listEl = container.querySelector('#list');
  const countEl = container.querySelector('#count');

  // ---------- Janela "Nova Tarefa" ----------
  const dialog = createModal();
  dialog.panel.innerHTML = `
    <button class="modal-close" data-role="close" aria-label="Fechar">${icon('x', 18)}</button>
    <h2 class="modal-title" id="t-heading">Nova Tarefa</h2>
    <div class="stack" style="gap:1rem;padding-top:0.5rem">
      <div>
        <label class="label muted xs" for="t-title">Título</label>
        <input class="input" id="t-title" placeholder="Ex: Estudar React" maxlength="100">
      </div>
      <div>
        <label class="label muted xs" for="t-energy" id="t-energy-label">Custo de Energia: 5</label>
        <input class="energy-slider" id="t-energy" type="range" min="1" max="10" step="1" value="5">
      </div>
      <div class="row" style="gap:0.75rem;align-items:flex-start">
        <div style="flex:1">
          <label class="label muted xs" for="t-hours">Horas (0-24)</label>
          <input class="input" id="t-hours" type="number" min="0" max="24" value="1">
        </div>
        <div style="flex:1">
          <label class="label muted xs" for="t-minutes">Minutos (0-59)</label>
          <input class="input" id="t-minutes" type="number" min="0" max="59" value="0">
        </div>
      </div>
      <div>
        <label class="label muted xs" for="t-deadline">Prazo (opcional)</label>
        <input class="input" id="t-deadline" type="date">
      </div>
      <div>
        <label class="label muted xs" for="t-category">Categoria</label>
        <select class="input" id="t-category">
          ${Object.keys(CATEGORY_LABELS).map((c) => `<option value="${c}">${CATEGORY_EMOJI[c]} ${CATEGORY_LABELS[c]}</option>`).join('')}
        </select>
      </div>
      <button class="btn-neon btn-block" id="t-create" disabled>Criar Tarefa</button>
    </div>`;

  const f = (id) => dialog.panel.querySelector(id);
  const titleEl = f('#t-title'), energyEl = f('#t-energy'), energyLabel = f('#t-energy-label');
  const hoursEl = f('#t-hours'), minutesEl = f('#t-minutes');
  const deadlineEl = f('#t-deadline'), categoryEl = f('#t-category'), createBtn = f('#t-create');

  function paintEnergy() {
    const v = Number(energyEl.value);
    energyLabel.textContent = `Custo de Energia: ${v}`;
    energyEl.style.setProperty('--energy-color', energyColor(v));
    energyEl.style.setProperty('--energy-color-dim', 'transparent');
    energyEl.style.setProperty('--energy-percent', `${((v - 1) / 9) * 100}%`);
  }
  function resetForm() {
    titleEl.value = ''; energyEl.value = '5'; hoursEl.value = '1'; minutesEl.value = '0';
    minutesEl.disabled = false; deadlineEl.value = ''; categoryEl.value = 'work';
    createBtn.disabled = true;
    paintEnergy();
  }
  paintEnergy();

  // Mesma janela para criar e para editar
  let editingId = null;
  const heading = f('#t-heading');
  const toDateInput = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };

  function openDialog(task = null) {
    editingId = task ? task.id : null;
    if (task) {
      titleEl.value = task.title;
      energyEl.value = String(task.energyCost);
      hoursEl.value = String(Math.floor(task.durationMinutes / 60));
      minutesEl.value = String(task.durationMinutes % 60);
      minutesEl.disabled = hoursEl.value === '24';
      deadlineEl.value = task.deadline ? toDateInput(task.deadline) : '';
      categoryEl.value = task.category;
      heading.textContent = 'Editar Tarefa';
      createBtn.textContent = 'Salvar';
      createBtn.disabled = false;
      paintEnergy();
    } else {
      resetForm();
      heading.textContent = 'Nova Tarefa';
      createBtn.textContent = 'Criar Tarefa';
    }
    dialog.open();
    titleEl.focus();
  }

  titleEl.addEventListener('input', () => { createBtn.disabled = !titleEl.value.trim(); });
  energyEl.addEventListener('input', paintEnergy);
  hoursEl.addEventListener('input', () => {
    const n = Math.max(0, Math.min(24, parseInt(hoursEl.value) || 0));
    hoursEl.value = String(n);
    if (n === 24) minutesEl.value = '0';
    minutesEl.disabled = n === 24;
  });
  minutesEl.addEventListener('input', () => {
    if (hoursEl.value === '24') return;
    minutesEl.value = String(Math.max(0, Math.min(59, parseInt(minutesEl.value) || 0)));
  });
  dialog.panel.querySelector('[data-role="close"]').addEventListener('click', () => dialog.close());

  createBtn.addEventListener('click', async () => {
    const title = titleEl.value.trim();
    if (!title) return;
    const dur = (parseInt(hoursEl.value) || 0) * 60 + (parseInt(minutesEl.value) || 0);
    if (dur === 0) { toast('Duração mínima: 1 minuto.', 'error'); return; }

    let deadline = null;
    if (deadlineEl.value) {
      const [y, m, d] = deadlineEl.value.split('-').map(Number);
      deadline = new Date(y, m - 1, d).getTime();   // meia-noite no horário local
    }
    const fields = { title, energyCost: Number(energyEl.value), durationMinutes: dur, deadline, category: categoryEl.value };
    const existing = editingId && tasks.find((t) => t.id === editingId);
    if (existing) {
      await updateTask({ ...existing, ...fields });
      toast('Tarefa atualizada!', 'success');
    } else {
      await createTask({
        id: crypto.randomUUID(),
        userId: user.id,
        ...fields,
        completed: false,
        completedAt: null,
        startedAt: null,
        createdAt: Date.now(),
      });
      toast('Tarefa criada!', 'success');
    }
    editingId = null;
    resetForm();
    dialog.close();
    load();
  });

  container.querySelector('#fab').addEventListener('click', () => openDialog());

  // ---------- Lista ----------
  function renderList() {
    const pending = tasks.filter((t) => !t.completed);
    const done = tasks.filter((t) => t.completed);

    if (filterCategory && !pending.some((t) => t.category === filterCategory)) filterCategory = null;
    const categories = [...new Set(pending.map((t) => t.category))];
    const shown = filterCategory ? pending.filter((t) => t.category === filterCategory) : pending;

    countEl.textContent = `${pending.length} pendentes`;

    const chips = pending.length > 0 ? `
      <div class="chips">
        <button class="chip ${!filterCategory ? 'active' : ''}" data-filter="" aria-pressed="${!filterCategory}">Todas</button>
        ${categories.map((c) => `<button class="chip ${filterCategory === c ? `category-${c}` : ''}" data-filter="${c}" aria-pressed="${filterCategory === c}">${CATEGORY_EMOJI[c]} ${CATEGORY_LABELS[c]}</button>`).join('')}
      </div>` : '';

    const cards = shown.map((task) => {
      const status = getTaskStatus(task);
      let action = '';
      const edit = status === 'idle'
        ? `<button class="icon-btn neutral" data-action="edit" data-id="${task.id}" aria-label="Editar ${escapeHtml(task.title)}">${icon('pencil', 14)}</button>` : '';
      if (status === 'idle') action = `<button class="icon-btn primary" data-action="start" data-id="${task.id}" aria-label="Iniciar ${escapeHtml(task.title)}">${icon('play', 14)}</button>`;
      else if (status === 'running') action = `<button class="pill-btn primary" data-action="continue" data-id="${task.id}">⏱ Continuar</button>`;
      else action = `<button class="pill-btn success" data-action="collect" data-id="${task.id}">${icon('gift', 12)} Coletar</button>`;

      return `
        <div class="glass-card pad stack" style="gap:0.5rem">
          <div class="row-between" style="align-items:flex-start">
            <div style="flex:1;min-width:0">
              <h3 class="task-title">${escapeHtml(task.title)}</h3>
              <div class="row task-meta">
                <span class="badge category-${task.category}">${CATEGORY_LABELS[task.category] || ''}</span>
                ${energyBadge(task.energyCost)}
                <span class="muted tiny">${formatDuration(task.durationMinutes)}</span>
                ${task.deadline ? `<span class="muted tiny">📅 ${pad2(new Date(task.deadline).getDate())}/${pad2(new Date(task.deadline).getMonth() + 1)}</span>` : ''}
              </div>
            </div>
            <div class="row" style="gap:0.375rem;flex-shrink:0">
              ${edit}${action}
              <button class="icon-btn destructive" data-action="delete" data-id="${task.id}" aria-label="Excluir ${escapeHtml(task.title)}">${icon('trash', 14)}</button>
            </div>
          </div>
        </div>`;
    }).join('');

    const empty = pending.length === 0
      ? '<div class="center muted small" style="padding:2rem 0">Nenhuma tarefa pendente. Toque em + para criar.</div>' : '';

    const doneList = done.length > 0 ? `
      <div class="stack" style="gap:0.5rem;padding-top:1rem">
        <h2 class="section-title">Concluídas (${done.length})</h2>
        ${done.slice(0, 5).map((t) => `<div class="glass-card done-card"><span class="small" style="text-decoration:line-through;color:hsl(var(--muted-foreground))">${escapeHtml(t.title)}</span></div>`).join('')}
      </div>` : '';

    listEl.innerHTML = chips + cards + empty + doneList;
  }

  async function load() {
    tasks = (await getUserTasks(user.id)).sort((a, b) => b.createdAt - a.createdAt);
    renderList();
  }

  function getTimer(task) {
    let t = timers.get(task.id);
    if (!t) {
      t = createTaskTimer({
        userId: user.id,
        taskTitle: task.title,
        durationMinutes: task.durationMinutes,
        startedAt: task.startedAt,
        pausedAt: task.pausedAt ?? null,
        pauseOffset: task.pauseOffset || 0,
        onUpdate: (times) => saveTimes(task.id, times),
        onComplete: () => handleCollect(task.id),
      });
      timers.set(task.id, t);
    }
    return t;
  }
  // Guarda pausa/continuar na tarefa (assim a pausa sobrevive a trocar de tela ou recarregar)
  async function saveTimes(id, times) {
    const current = tasks.find((t) => t.id === id);
    if (!current || current.completed) return;
    const updated = { ...current, pausedAt: times.pausedAt, pauseOffset: times.pauseOffset };
    tasks = tasks.map((t) => (t.id === id ? updated : t));
    await updateTask(updated);
  }

  function dropTimer(id) {
    timers.get(id)?.destroy();
    timers.delete(id);
  }

  async function handleStart(task) {
    const updated = { ...task, startedAt: Date.now(), pausedAt: null, pauseOffset: 0 };
    await updateTask(updated);
    tasks = tasks.map((t) => (t.id === updated.id ? updated : t));
    renderList();
    getTimer(updated).open();
  }

  async function handleCollect(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task || task.completed) return;
    const points = pointsForTask(task);
    const completedAt = Date.now();
    const afterTasks = tasks.map((t) => (t.id === id ? { ...t, completed: true, completedAt } : t));
    const levelBefore = levelInfo(totalPoints(tasks));
    const levelNow = levelInfo(totalPoints(afterTasks));
    await updateTask({ ...task, completed: true, completedAt });
    await auth.addXP(points);
    dropTimer(id);
    showCongratsModal({
      taskTitle: task.title,
      points,
      levelUp: levelNow.level > levelBefore.level ? { level: levelNow.level, title: levelNow.title } : null,
      streak: streakInfo(afterTasks, completedAt).current,
    });
    load();
  }

  async function handleDelete(id) {
    const removed = tasks.find((t) => t.id === id);
    await deleteTask(id);
    dropTimer(id);
    toast('Tarefa removida.', 'info', undefined, removed && {
      label: 'Desfazer',
      onClick: async () => { await createTask(removed); load(); },
    });
    load();
  }

  listEl.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-filter]');
    if (chip) {
      const cat = chip.dataset.filter || null;
      filterCategory = cat === filterCategory ? null : cat;
      renderList();
      return;
    }
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const task = tasks.find((t) => t.id === btn.dataset.id);
    if (!task) return;
    const action = btn.dataset.action;
    if (action === 'start') handleStart(task);
    else if (action === 'edit') openDialog(task);
    else if (action === 'continue') getTimer(task).open();
    else if (action === 'collect') handleCollect(task.id);
    else if (action === 'delete') handleDelete(task.id);
  });

  // Atualiza o estado (Continuar/Coletar) das tarefas em andamento.
  const interval = setInterval(() => {
    if (tasks.some((t) => !t.completed && t.startedAt && !t.pausedAt && getTaskStatus(t) === 'running')) renderList();
  }, 5000);

  await load();

  return () => {
    clearInterval(interval);
    dialog.close();
    for (const id of [...timers.keys()]) dropTimer(id);
  };
}