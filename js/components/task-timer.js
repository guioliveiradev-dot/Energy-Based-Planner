// Cronômetro da missão, com o pet ativo. Porte de TaskTimer.tsx.
//
// Uso:
//   const timer = createTaskTimer({
//     userId, taskTitle, durationMinutes, startedAt,
//     pausedAt, pauseOffset,     // estado de pausa guardado na tarefa (veja task-time.js)
//     onUpdate: (times) => ...,  // chamado ao pausar/continuar: guarde times.pausedAt e times.pauseOffset
//     onComplete,                // chamado ao clicar em "Coletar Pontos"
//   });
//   timer.open();     // abre a janela
//   timer.destroy();  // fecha e limpa tudo
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
import { notifyTimerDone } from '../alerts.js';
import { remainingSeconds, pausedTask, resumedTask } from '../task-time.js';

const PET_MESSAGES = {
  cat:     ['Miau! Continue!', 'Purrfecto! 🐾', 'Foco, humano!', 'Ronron... ✨'],
  dog:     ['Au au! Vai lá!', 'Bom garoto! 🦴', 'Você consegue!', 'Woof! 💪'],
  dragon:  ['Fogo total! 🔥', 'Poder máximo!', 'Dracarys! ⚡', 'Imbatível!'],
  phoenix: ['Renasça! 🔥', 'Brilhe forte!', 'Asas ao alto!', 'Imortal! ✨'],
  robot:   ['Processando... ✅', 'Eficiência 100%!', 'Modo turbo! ⚡', 'Beep boop! 🤖'],
  unicorn: ['Magia pura! ✨', 'Arco-íris! 🌈', 'Brilhante!', 'Encantador! 💫'],
};
const CELEBRATE = ['⭐', '✨', '🎉', '💫', '🌟', '🔥', '💎', '🎊'];

const pad2 = (n) => String(n).padStart(2, '0');

function petHTML(pet) {
  const particles = [...Array(6)].map((_, i) => {
    const a = (i * Math.PI * 2) / 6;
    return `<span style="--dx:${Math.round(Math.cos(a) * 40)}px;--dy:${Math.round(Math.sin(a) * 40)}px;--delay:${(i * 0.4).toFixed(1)}s"></span>`;
  }).join('');
  const celebrate = CELEBRATE.map((c, i) => {
    const a = (i * Math.PI * 2) / 8;
    return `<span style="--dx:${Math.round(Math.cos(a) * 55)}px;--dy:${Math.round(Math.sin(a) * 55)}px;--delay:${(i * 0.2).toFixed(1)}s">${c}</span>`;
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

export function createTaskTimer({ userId, taskTitle, durationMinutes, startedAt, pausedAt = null, pauseOffset = 0, onUpdate = () => {}, onComplete }) {
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

  let focusOn = false;
  const modal = createModal({ className: 'timer-panel center stack', onRequestClose: () => { if (focusOn) setFocus(false); else close(); } });
  modal.panel.innerHTML = `
    <button class="modal-close" data-role="close" aria-label="Fechar">${icon('x', 18)}</button>
    <button class="timer-focus-btn" data-role="focus" aria-pressed="false" aria-label="Modo foco (tela cheia)">${icon('maximize-2', 18)}</button>
    <div class="stack" style="align-items:center;gap:0.5rem">
      <span class="text-primary">${icon('timer', 24)}</span>
      <h2 class="timer-title">${escapeHtml(taskTitle)}</h2>
    </div>
    <div class="stack" style="gap:1rem">
      <div class="timer-ring">
        <svg viewBox="0 0 120 120" role="progressbar" aria-label="Tempo da tarefa" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" data-role="ring">
          <circle class="ring-track" cx="60" cy="60" r="54" pathLength="100"/>
          <circle class="ring-arc" data-role="arc" cx="60" cy="60" r="54" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/>
        </svg>
        <p class="timer-time" data-role="time">00:00</p>
      </div>
      <p class="timer-paused" data-role="paused" hidden>⏸ Pausado</p>
    </div>
    ${pet ? petHTML(pet) : ''}
    <div data-role="actions"></div>`;

  const q = (role) => modal.panel.querySelector(`[data-role="${role}"]`);
  const timeEl = q('time');
  const ringEl = q('ring');
  const arcEl = q('arc');
  const focusBtn = q('focus');
  const pausedEl = q('paused');
  const actionsEl = q('actions');
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
      document.title = isDone ? `✅ Tempo esgotado · ${taskTitle}` : `${timeEl.textContent}${isPaused ? ' (pausado)' : ''} · ${taskTitle}`;
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
        ? `${pet.name} está comemorando! 🎉`
        : isPaused ? `${pet.name} está esperando... 💤`
        : `${pet.name} está te ajudando! ⚡`;
    }
  }

  function tick() {
    if (isPaused) { paint(); return; }       // pausado: o tempo NÃO anda
    remaining = computeRemaining();
    if (remaining <= 0 && !isDone) {
      isDone = true;
      stopTick();
      stopBubbles();
      notifyTimerDone();
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
  });

  return {
    open,
    close,
    get isOpen() { return modal.isOpen; },
    get focusMode() { return focusOn; },
    destroy() { stopTick(); stopBubbles(); setFocus(false); document.removeEventListener('fullscreenchange', onFullscreenChange); modal.close(); restoreTitle(); },
  };
}
