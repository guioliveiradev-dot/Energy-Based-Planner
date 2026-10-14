// Tela de Rotina semanal. Porte de Routine.tsx.

import * as auth from '../auth.js';
import { getUserRoutineBlocks, createRoutineBlock, deleteRoutineBlock } from '../db.js';
import { icon } from '../icons.js';
import { escapeHtml, toast } from '../ui.js';
import { createModal } from '../components/modal.js';

const DAYS = [
  { value: 1, label: 'Seg' }, { value: 2, label: 'Ter' }, { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' }, { value: 5, label: 'Sex' }, { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i));
const MINS = ['0', '15', '30', '45'];

const hourOptions = (selected) => HOURS.map((h) => `<option value="${h}" ${h === selected ? 'selected' : ''}>${h.padStart(2, '0')}h</option>`).join('');
const minOptions = (selected) => MINS.map((m) => `<option value="${m}" ${m === selected ? 'selected' : ''}>${m.padStart(2, '0')}</option>`).join('');

export async function renderRoutine(container) {
  const user = auth.state.user;
  let blocks = [];
  let selectedDay = DAYS[0].value;

  container.innerHTML = `
    <section class="page" style="gap:1rem">
      <h1 style="font-size:1.125rem;font-weight:700">Rotina Semanal</h1>
      <div class="chips" id="days">
        ${DAYS.map((d) => `<button class="day-pill" data-day="${d.value}">${d.label}</button>`).join('')}
      </div>
      <div id="list" class="stack" style="gap:1rem"></div>
      <button class="fab btn-neon" id="fab" aria-label="Novo bloco">${icon('plus', 28)}</button>
    </section>`;

  const listEl = container.querySelector('#list');
  const dayLabel = () => DAYS.find((d) => d.value === selectedDay)?.label;

  // ---------- Janela "Novo Bloco" ----------
  const dialog = createModal();
  dialog.panel.innerHTML = `
    <button class="modal-close" data-role="close" aria-label="Fechar">${icon('x', 18)}</button>
    <h2 class="modal-title" id="b-heading"></h2>
    <div class="stack" style="gap:1rem;padding-top:0.5rem">
      <div>
        <label class="label muted xs" for="b-label">Nome do Compromisso</label>
        <input class="input" id="b-label" placeholder="Ex: Escola" maxlength="50">
      </div>
      <div class="row" style="gap:0.75rem;align-items:flex-start">
        <div style="flex:1">
          <label class="label muted xs">Início</label>
          <div class="row" style="gap:0.375rem">
            <select class="input" id="b-sh" aria-label="Hora de início">${hourOptions('7')}</select>
            <select class="input" id="b-sm" aria-label="Minuto de início" style="width:5rem">${minOptions('0')}</select>
          </div>
        </div>
        <div style="flex:1">
          <label class="label muted xs">Fim</label>
          <div class="row" style="gap:0.375rem">
            <select class="input" id="b-eh" aria-label="Hora de fim">${hourOptions('12')}</select>
            <select class="input" id="b-em" aria-label="Minuto de fim" style="width:5rem">${minOptions('0')}</select>
          </div>
        </div>
      </div>
      <button class="btn-neon btn-block" id="b-create" disabled>Adicionar Bloco</button>
    </div>`;

  const f = (id) => dialog.panel.querySelector(id);
  const labelEl = f('#b-label'), createBtn = f('#b-create');
  labelEl.addEventListener('input', () => { createBtn.disabled = !labelEl.value.trim(); });
  dialog.panel.querySelector('[data-role="close"]').addEventListener('click', () => dialog.close());

  createBtn.addEventListener('click', async () => {
    const label = labelEl.value.trim();
    if (!label) return;
    const st = `${f('#b-sh').value.padStart(2, '0')}:${f('#b-sm').value.padStart(2, '0')}`;
    const et = `${f('#b-eh').value.padStart(2, '0')}:${f('#b-em').value.padStart(2, '0')}`;
    if (st >= et) { toast('Horário final deve ser depois do inicial.', 'error'); return; }

    await createRoutineBlock({
      id: crypto.randomUUID(),
      userId: user.id,
      dayOfWeek: selectedDay,
      startTime: st,
      endTime: et,
      label,
    });
    labelEl.value = '';
    createBtn.disabled = true;
    dialog.close();
    toast('Bloco adicionado!', 'success');
    load();
  });

  container.querySelector('#fab').addEventListener('click', () => {
    f('#b-heading').textContent = `Novo Bloco — ${dayLabel()}`;
    dialog.open();
    labelEl.focus();
  });

  // ---------- Lista ----------
  function renderList() {
    container.querySelectorAll('.day-pill').forEach((b) => {
      const on = Number(b.dataset.day) === selectedDay;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });

    const dayBlocks = blocks
      .filter((b) => b.dayOfWeek === selectedDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (dayBlocks.length === 0) {
      listEl.innerHTML = `<div class="center muted small" style="padding:2rem 0">Nenhum bloco para ${dayLabel()}. Toque em + para adicionar.</div>`;
      return;
    }
    listEl.innerHTML = dayBlocks.map((b) => `
      <div class="glass-card pad row-between">
        <div class="row" style="gap:0.75rem">
          <div class="icon-tile primary">${icon('clock', 18)}</div>
          <div>
            <p style="font-weight:600;font-size:0.875rem">${escapeHtml(b.label)}</p>
            <p class="muted xs">${b.startTime} — ${b.endTime}</p>
          </div>
        </div>
        <button class="icon-btn destructive" data-action="delete" data-id="${b.id}" aria-label="Excluir bloco ${escapeHtml(b.label)}">${icon('trash', 14)}</button>
      </div>`).join('');
  }

  async function load() {
    blocks = await getUserRoutineBlocks(user.id);
    renderList();
  }

  container.querySelector('#days').addEventListener('click', (e) => {
    const pill = e.target.closest('[data-day]');
    if (!pill) return;
    selectedDay = Number(pill.dataset.day);
    renderList();
  });

  listEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="delete"]');
    if (!btn) return;
    const removed = blocks.find((b) => b.id === btn.dataset.id);
    await deleteRoutineBlock(btn.dataset.id);
    toast('Bloco removido.', 'info', undefined, removed && {
      label: 'Desfazer',
      onClick: async () => { await createRoutineBlock(removed); load(); },
    });
    load();
  });

  await load();
  return () => dialog.close();
}
