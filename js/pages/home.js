// Tela Home: nível de energia, tempo disponível e missão sugerida. Porte de Home.tsx.

import * as auth from '../auth.js';
import { getUserTasks, getUserRoutineBlocks, updateTask, createTask } from '../db.js';
import { icon } from '../icons.js';
import { escapeHtml, formatDuration, toast } from '../ui.js';
import { recordTaskForPet } from '../pets.js';
import { onDataChanged } from '../events.js';
import { applyPetPowers, applyShield, getStreakExtra } from '../pet-powers.js';
import { mountPetHome } from '../components/pet-home.js';
import { CATEGORY_LABELS } from '../categories.js';
import { createEnergySlider } from '../components/energy-slider.js';
import { progressCardHTML } from '../components/progress-card.js';
import { pointsForTask, totalPoints, levelInfo, streakInfo } from '../progress.js';
import { isAvailable, nextInstance } from '../recurrence.js';
import { createTaskTimer } from '../components/task-timer.js';
import { showCongratsModal } from '../components/congrats-modal.js';
import { mountBackupReminder } from '../components/backup-reminder.js';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export async function renderHome(container) {
  const user = auth.state.user;

  // Estado da tela
  let energy = 5;
  let mission = null;
  let blocked = false;
  let noTasks = false;
  let timer = null;
  let candidates = [];     // todas as tarefas compatíveis, em ordem de prioridade
  let missionIndex = 0;    // qual delas está sendo sugerida

  container.innerHTML = `
    <section class="page">
      <div>
        <p class="muted small">${getGreeting()},</p>
        <h1 class="page-title">${escapeHtml(user.name || 'Usuário')}</h1>
      </div>

      <div id="backup-slot"></div>

      <div id="pet-slot"></div>

      <div class="glass-card points-card">
        <div class="row" style="gap:0.75rem">
          <div class="icon-tile">${icon('trophy', 20)}</div>
          <div>
            <p class="muted xs">Pontos Planner</p>
            <p class="points-value text-accent" id="xp">${user.xp || 0}</p>
          </div>
        </div>
        <span class="text-accent" style="opacity:0.5">${icon('sparkles', 18)}</span>
      </div>

      <div id="progress-slot"></div>

      <div class="glass-card pad-lg" id="slider-slot"></div>

      <div class="glass-card pad-lg stack">
        <div class="row text-medium"><span class="text-primary">${icon('clock', 18)}</span> Tempo Disponível</div>
        <div class="row" style="gap:0.75rem;align-items:flex-start">
          <div style="flex:1">
            <label class="label muted xs" for="hours">Horas (0-24)</label>
            <input class="input" id="hours" type="number" min="0" max="24" value="1">
          </div>
          <div style="flex:1">
            <label class="label muted xs" for="minutes">Minutos (0-59)</label>
            <input class="input" id="minutes" type="number" min="0" max="59" value="0">
          </div>
        </div>
      </div>

      <button class="btn-neon btn-block row-center" id="generate" style="justify-content:center;font-weight:700">
        ${icon('zap', 18)} Gerar Missão ${icon('chevron-right', 16)}
      </button>

      <div id="result" aria-live="polite"></div>
    </section>`;

  const $ = (sel) => container.querySelector(sel);
  const hoursEl = $('#hours');
  const minutesEl = $('#minutes');
  const generateBtn = $('#generate');
  const resultEl = $('#result');

  $('#slider-slot').appendChild(createEnergySlider({ value: energy, onChange: (v) => { energy = v; } }));

  mountBackupReminder($('#backup-slot'), user.id);

  // ---------- Nível e sequência de dias ----------
  const progressSlot = $('#progress-slot');
  async function refreshProgress(list) {
    const all = list || await getUserTasks(user.id);
    progressSlot.innerHTML = progressCardHTML(levelInfo(totalPoints(all)), streakInfo(all, Date.now(), await getStreakExtra(user.id)));
  }
  // Ao abrir: o Cão protege a sequência se preciso, depois o cartão do pet e a missão do Robô
  (async () => {
    const list = await getUserTasks(user.id);
    const shield = await applyShield(user.id, list).catch(() => null);
    if (shield) toast(`${shield.petName} protegeu a sua sequência!`, 'success', 5000);
    await refreshProgress(list);
    await mountPetHome($('#pet-slot'), user.id, list);
  })().catch((e) => console.error(e));

  // ---------- Tempo disponível ----------
  const availableMinutes = () => (parseInt(hoursEl.value) || 0) * 60 + (parseInt(minutesEl.value) || 0);

  hoursEl.addEventListener('input', () => {
    const num = Math.max(0, Math.min(24, parseInt(hoursEl.value) || 0));
    hoursEl.value = String(num);
    if (num === 24) minutesEl.value = '0';
    minutesEl.disabled = num === 24;
    generateBtn.disabled = availableMinutes() === 0;
  });
  minutesEl.addEventListener('input', () => {
    if (hoursEl.value === '24') return;
    minutesEl.value = String(Math.max(0, Math.min(59, parseInt(minutesEl.value) || 0)));
    generateBtn.disabled = availableMinutes() === 0;
  });

  // ---------- Missão ----------
  function resetTimer() {
    if (timer) timer.destroy();
    timer = null;
  }

  // Guarda pausa/continuar na tarefa (assim a pausa sobrevive a trocar de tela ou recarregar)
  async function saveTimes(times) {
    if (!mission) return;
    mission = { ...mission, pausedAt: times.pausedAt, pauseOffset: times.pauseOffset };
    candidates[missionIndex] = mission;
    await updateTask(mission);
  }

  function ensureTimer() {
    if (!timer) {
      timer = createTaskTimer({
        userId: user.id,
        taskTitle: mission.title,
        durationMinutes: mission.durationMinutes,
        startedAt: mission.startedAt,
        pausedAt: mission.pausedAt ?? null,
        pauseOffset: mission.pauseOffset || 0,
        onUpdate: saveTimes,
        onComplete: handleCollect,
      });
    }
    return timer;
  }

  async function generateMission(bypass = false) {
    mission = null;
    candidates = [];
    missionIndex = 0;
    blocked = false;
    noTasks = false;
    resetTimer();

    if (!bypass) {
      const now = new Date();
      const currentDay = now.getDay();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const blocks = await getUserRoutineBlocks(user.id);
      const isBlocked = blocks.some(
        (b) => b.dayOfWeek === currentDay && b.startTime <= currentTime && b.endTime > currentTime
      );
      if (isBlocked) { blocked = true; renderResult(); return; }
    }

    const minutes = availableMinutes();
    const tasks = await getUserTasks(user.id);
    const compatible = tasks
      .filter((t) => !t.completed && isAvailable(t) && t.energyCost <= energy && t.durationMinutes <= minutes)
      .sort((a, b) => {
        if (a.deadline && b.deadline) return a.deadline - b.deadline;
        if (a.deadline) return -1;
        if (b.deadline) return 1;
        return Math.abs(b.energyCost - energy) - Math.abs(a.energyCost - energy);
      });

    if (compatible.length === 0) noTasks = true;
    else { candidates = compatible; missionIndex = 0; mission = compatible[0]; }
    renderResult();
  }

  async function handleStart() {
    mission = { ...mission, startedAt: Date.now(), pausedAt: null, pauseOffset: 0 };
    candidates[missionIndex] = mission;
    await updateTask(mission);
    renderResult();
    ensureTimer().open();
  }

  async function handleCollect() {
    const done = mission;
    const points = pointsForTask(done);
    const tasksBefore = await getUserTasks(user.id);
    const levelBefore = levelInfo(totalPoints(tasksBefore)).level;
    const completedAt = Date.now();
    await updateTask({ ...done, completed: true, completedAt });
    const next = nextInstance(done, completedAt);        // tarefa recorrente: agenda a próxima
    if (next) await createTask(next);
    const fx = await applyPetPowers({ userId: user.id, task: done, basePoints: points, tasksBefore, completedAt }).catch(() => ({ bonus: null, note: null }));   // poder do pet ativo
    const petBonus = fx.bonus;
    await auth.addXP(points + (petBonus ? petBonus.amount : 0));
    const bond = await recordTaskForPet(user.id).catch(() => null);   // vínculo do pet ativo
    resetTimer();
    mission = null;
    candidates = [];
    renderResult();

    const all = await getUserTasks(user.id);
    const levelNow = levelInfo(totalPoints(all));
    showCongratsModal({
      taskTitle: done.title,
      points,
      petBonus,
      petNote: fx.note,
      petLevelUp: bond,
      levelUp: levelNow.level > levelBefore ? { level: levelNow.level, title: levelNow.title } : null,
      streak: streakInfo(all, Date.now(), await getStreakExtra(user.id)).current,
    });
    refreshProgress(all);
    mountPetHome($('#pet-slot'), user.id, all);
  }

  function nextMission() {
    if (candidates.length < 2) return;
    resetTimer();
    missionIndex = (missionIndex + 1) % candidates.length;
    mission = candidates[missionIndex];
    renderResult();
    resultEl.querySelector('[data-action="next"]')?.focus();   // mantém o foco no botão
  }

  function renderResult() {
    if (blocked) {
      resultEl.innerHTML = `
        <div class="glass-card pad warning-card">
          <div class="row text-warning" style="margin-bottom:0.5rem">${icon('alert-triangle', 18)}<strong class="small">Horário Bloqueado</strong></div>
          <p class="muted xs" style="margin-bottom:0.75rem">Você está em horário de compromisso fixo! Verifique sua rotina.</p>
          <button class="btn-warning btn-block" data-action="bypass">⚠️ Gerar mesmo assim</button>
        </div>`;
    } else if (noTasks) {
      resultEl.innerHTML = `
        <div class="glass-card pad center">
          <p class="muted small">Nenhuma tarefa compatível encontrada. Ajuste sua energia ou tempo, ou adicione novas tarefas.</p>
        </div>`;
    } else if (mission) {
      resultEl.innerHTML = `
        <div class="glass-card pad-lg neon-glow stack">
          <div class="row text-primary">${icon('sparkles', 16)}<span class="mission-label">Missão Sugerida</span>
            ${candidates.length > 1 ? `<span class="muted xs" style="margin-left:auto">${missionIndex + 1} de ${candidates.length}</span>` : ''}</div>
          <h3 class="mission-title">${escapeHtml(mission.title)}</h3>
          <div class="row muted xs" style="gap:0.75rem">
            <span class="badge category-${mission.category}">${CATEGORY_LABELS[mission.category] || ''}</span>
            <span>⚡ ${mission.energyCost}</span>
            <span>🕐 ${formatDuration(mission.durationMinutes)}</span>
          </div>
          <button class="btn-neon btn-block row-center" data-action="${mission.startedAt ? 'continue' : 'start'}" style="justify-content:center">
            ${icon('play', 16)} ${mission.startedAt ? 'Continuar Missão' : 'Iniciar Missão'}
          </button>
          ${candidates.length > 1 && !mission.startedAt
            ? `<button class="btn btn-block row-center" data-action="next" style="justify-content:center">${icon('refresh-cw', 16)} Outra missão</button>` : ''}
        </div>`;
    } else {
      resultEl.innerHTML = '';
    }
  }

  resultEl.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'bypass') generateMission(true);
    else if (action === 'start') handleStart();
    else if (action === 'continue') ensureTimer().open();
    else if (action === 'next') nextMission();
  });
  generateBtn.addEventListener('click', () => generateMission(false));

  // Atualiza os pontos quando o XP muda
  const unsubscribe = auth.subscribe((s) => {
    const xpEl = container.querySelector('#xp');
    if (xpEl && s.user) xpEl.textContent = s.user.xp || 0;
  });

  // Quando o painel admin (ou outra parte) muda vínculo, sequência ou tarefas: atualiza o cartão do pet e o nível sem trocar de aba
  const offData = onDataChanged(async () => {
    try {
      const slot = $('#pet-slot');
      if (!slot || !slot.isConnected) return;   // a tela já foi fechada
      const list = await getUserTasks(user.id);
      await refreshProgress(list);
      await mountPetHome(slot, user.id, list);
    } catch (e) { console.error(e); }
  });

  // Ao sair da tela
  return () => { unsubscribe(); offData(); resetTimer(); };
}
