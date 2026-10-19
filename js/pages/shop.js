// Loja: recompensas, temas e pets, conquistas e histórico. Porte de Shop.tsx.

import * as auth from '../auth.js';
import {
  getUserRewards, createReward, deleteReward, getUserTasks,
  getUserRedemptionHistory, addRedemptionRecord,
} from '../db.js';
import { icon } from '../icons.js';
import { escapeHtml, toast, formatDateTime } from '../ui.js';
import { SHOP_THEMES, SHOP_PETS, getInventory, addToInventory } from '../themes.js';
import { ACHIEVEMENTS, getUnlocked } from '../achievements.js';
import { celebrate } from '../celebrate.js';
import { createModal } from '../components/modal.js';
import { powerSummary } from '../pet-powers.js';
import { petInfoHTML } from '../components/pet-info.js';

const TABS = [
  { id: 'rewards', label: '🎁 Recompensas' },
  { id: 'store', label: '🛒 Loja' },
  { id: 'achievements', label: '🏆 Conquistas' },
  { id: 'history', label: '📜 Histórico' },
];

export async function renderShop(container) {
  const user = auth.state.user;
  const xp = () => auth.state.user?.xp || 0;

  let rewards = [], history = [], tasks = [], inventory = [];
  let activeTab = 'rewards';

  container.innerHTML = `
    <section class="page" style="gap:1rem">
      <h1 style="font-size:1.125rem;font-weight:700">Loja de Recompensas</h1>

      <div class="glass-card neon-glow pad-lg center">
        <span class="text-accent" style="display:inline-flex">${icon('trophy', 28)}</span>
        <p class="muted xs" style="margin-top:0.5rem">Seu Saldo</p>
        <p class="balance"><span id="balance">${xp()}</span> <span class="balance-unit">Pontos</span></p>
      </div>

      <div class="tabs tabs-4" role="tablist">
        ${TABS.map((t) => `<button class="tab ${t.id === activeTab ? 'active' : ''}" role="tab" aria-selected="${t.id === activeTab}" data-tab="${t.id}">${t.label}</button>`).join('')}
      </div>

      <div id="tab-content" class="stack"></div>

      <button class="fab btn-neon" id="fab" aria-label="Nova recompensa">${icon('plus', 28)}</button>
    </section>`;

  const content = container.querySelector('#tab-content');

  // ---------- Janela "Nova Recompensa" ----------
  const dialog = createModal();
  dialog.panel.innerHTML = `
    <button class="modal-close" data-role="close" aria-label="Fechar">${icon('x', 18)}</button>
    <h2 class="modal-title">Nova Recompensa</h2>
    <div class="stack" style="gap:1rem;padding-top:0.5rem">
      <div>
        <label class="label muted xs" for="r-title">Nome</label>
        <input class="input" id="r-title" placeholder="Ex: Jogar Videogame" maxlength="50">
      </div>
      <div>
        <label class="label muted xs" for="r-cost">Custo (Pontos)</label>
        <input class="input" id="r-cost" type="number" min="1" placeholder="Ex: 500">
      </div>
      <button class="btn-neon btn-block" id="r-create" disabled>Criar Recompensa</button>
    </div>`;
  const titleEl = dialog.panel.querySelector('#r-title');
  const costEl = dialog.panel.querySelector('#r-cost');
  const createBtn = dialog.panel.querySelector('#r-create');
  const syncCreate = () => { createBtn.disabled = !titleEl.value.trim() || !costEl.value; };
  titleEl.addEventListener('input', syncCreate);
  costEl.addEventListener('input', syncCreate);
  dialog.panel.querySelector('[data-role="close"]').addEventListener('click', () => dialog.close());

  createBtn.addEventListener('click', async () => {
    const title = titleEl.value.trim();
    const cost = parseInt(costEl.value);
    if (!title || !costEl.value) return;
    if (isNaN(cost) || cost <= 0) { toast('Custo inválido.', 'error'); return; }
    await createReward({ id: crypto.randomUUID(), userId: user.id, title, cost, createdAt: Date.now() });
    titleEl.value = ''; costEl.value = ''; createBtn.disabled = true;
    dialog.close();
    toast('Recompensa criada!', 'success');
    load();
  });
  container.querySelector('#fab').addEventListener('click', () => { dialog.open(); titleEl.focus(); });

  // ---------- Abas ----------
  const buyButton = (kind, id, cost) => xp() >= cost
    ? `<button class="btn-neon btn-sm" data-action="${kind}" data-id="${id}">${kind === 'redeem' ? 'Resgatar' : 'Comprar'}</button>`
    : `<button class="btn-disabled" disabled>${kind === 'redeem' ? 'Resgatar' : 'Comprar'}</button>`;

  function renderTab() {
    if (activeTab === 'rewards') {
      content.innerHTML = rewards.length === 0
        ? `<div class="center muted small" style="padding:2rem 0"><span style="display:inline-flex;opacity:0.5;margin-bottom:0.5rem">${icon('sparkles', 24)}</span><br>Crie recompensas para se motivar!</div>`
        : rewards.map((r) => `
          <div class="glass-card pad row-between">
            <div class="row" style="gap:0.75rem">
              <div class="icon-tile">${icon('gift', 18)}</div>
              <div>
                <p style="font-weight:600;font-size:0.875rem">${escapeHtml(r.title)}</p>
                <p class="xs text-accent display">${r.cost} Pontos</p>
              </div>
            </div>
            <div class="row" style="gap:0.5rem">
              ${buyButton('redeem', r.id, r.cost)}
              <button class="icon-btn destructive" data-action="delete-reward" data-id="${r.id}" aria-label="Excluir recompensa ${escapeHtml(r.title)}">${icon('trash', 14)}</button>
            </div>
          </div>`).join('');
    }

    else if (activeTab === 'store') {
      const owned = (id) => inventory.includes(id);
      const action = (item) => owned(item.id)
        ? '<span class="xs text-success" style="font-weight:600">✓ Obtido</span>'
        : buyButton('buy', item.id, item.cost);

      content.innerHTML = `
        <div class="stack" style="gap:0.5rem">
          <h3 class="section-title row" style="gap:0.25rem">${icon('palette', 12)} Temas</h3>
          ${SHOP_THEMES.map((t) => `
            <div class="glass-card pad row-between">
              <div class="row" style="gap:0.75rem">
                <div class="theme-swatch" style="background:${t.preview}"></div>
                <div>
                  <p style="font-weight:600;font-size:0.875rem">${t.name}</p>
                  <p class="xs text-accent display">${t.cost} Pontos</p>
                </div>
              </div>
              ${action(t)}
            </div>`).join('')}
        </div>
        <div class="stack" style="gap:0.5rem">
          <h3 class="section-title row" style="gap:0.25rem">${icon('paw-print', 12)} Pets</h3>
          ${SHOP_PETS.map((p) => `
            <div class="glass-card pad stack" style="gap:0.25rem">
              <div class="row-between">
              <div class="row" style="gap:0.75rem">
                <div class="icon-tile" style="font-size:1.5rem;background:hsl(var(--accent) / 0.1)">${p.emoji}</div>
                <div>
                  <p style="font-weight:600;font-size:0.875rem">${p.name}</p>
                  <p class="muted tiny">${p.description}</p>
                  <p class="muted tiny">${powerSummary(p.id)}</p>
                  <p class="xs text-accent display">${p.cost} Pontos</p>
                </div>
              </div>
              ${action(p)}
              </div>
              ${petInfoHTML(p.id)}
            </div>`).join('')}
        </div>`;
    }

    else if (activeTab === 'achievements') {
      const unlockedIds = new Set(getUnlocked(tasks, history).map((a) => a.id));
      content.innerHTML = `
        <p class="muted xs center">${unlockedIds.size}/${ACHIEVEMENTS.length} desbloqueadas</p>
        ${ACHIEVEMENTS.map((a) => {
          const on = unlockedIds.has(a.id);
          return `
          <div class="glass-card pad row ${on ? '' : 'locked'}" style="gap:0.75rem">
            <div class="achv-tile" style="${on ? `background:color-mix(in srgb, ${a.color} 13%, transparent);color:${a.color}` : ''}">${icon(a.icon, 20)}</div>
            <div style="flex:1;min-width:0">
              <p style="font-weight:600;font-size:0.875rem">${a.title}</p>
              <p class="muted xs">${a.description}</p>
            </div>
            ${on ? '<span class="badge-ok">✓</span>' : ''}
          </div>`;
        }).join('')}`;
    }

    else if (activeTab === 'history') {
      content.innerHTML = history.length === 0
        ? `<div class="center muted small" style="padding:2rem 0"><span style="display:inline-flex;opacity:0.5;margin-bottom:0.5rem">${icon('clock', 24)}</span><br>Nenhum resgate realizado ainda.</div>`
        : history.map((h) => `
          <div class="glass-card pad row" style="gap:0.75rem">
            <div class="icon-tile" style="background:hsl(var(--accent) / 0.1)">${icon('gift', 16)}</div>
            <div style="flex:1;min-width:0">
              <p class="task-title" style="font-weight:500">${escapeHtml(h.rewardTitle)}</p>
              <p class="muted tiny">${formatDateTime(h.redeemedAt)} · -${h.cost} Pontos</p>
            </div>
          </div>`).join('');
    }
  }

  async function load() {
    [rewards, history, tasks] = await Promise.all([
      getUserRewards(user.id), getUserRedemptionHistory(user.id), getUserTasks(user.id),
    ]);
    history.sort((a, b) => b.redeemedAt - a.redeemedAt);
    inventory = getInventory(user.id);
    renderTab();
  }

  // ---------- Ações ----------
  async function handleDeleteReward(id) {
    const removed = rewards.find((r) => r.id === id);
    if (!removed) return;
    await deleteReward(id);
    toast('Recompensa removida.', 'info', undefined, {
      label: 'Desfazer',
      onClick: async () => { await createReward(removed); load(); },
    });
    load();
  }

  async function handleRedeem(id) {
    const reward = rewards.find((r) => r.id === id);
    if (!reward) return;
    if (xp() < reward.cost) { toast('Pontos insuficientes!', 'error'); return; }
    await auth.addXP(-reward.cost);
    await addRedemptionRecord({ id: crypto.randomUUID(), userId: user.id, rewardTitle: reward.title, cost: reward.cost, redeemedAt: Date.now() });
    await deleteReward(reward.id);
    celebrate('reward');
    toast(`🎉 ${reward.title} resgatado!`, 'success');
    load();
  }

  async function handleBuy(id) {
    const item = [...SHOP_THEMES, ...SHOP_PETS].find((i) => i.id === id);
    if (!item || inventory.includes(id)) return;
    if (xp() < item.cost) { toast('Pontos insuficientes!', 'error'); return; }
    await auth.addXP(-item.cost);
    addToInventory(user.id, item.id);
    celebrate('reward');
    toast(`🎉 ${item.name} comprado!`, 'success');
    load();
  }

  container.querySelector('.tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab]');
    if (!tab) return;
    activeTab = tab.dataset.tab;
    container.querySelectorAll('.tabs .tab').forEach((b) => {
      b.classList.toggle('active', b === tab);
      b.setAttribute('aria-selected', String(b === tab));
    });
    renderTab();
  });

  content.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'redeem') handleRedeem(btn.dataset.id);
    else if (btn.dataset.action === 'buy') handleBuy(btn.dataset.id);
    else if (btn.dataset.action === 'delete-reward') handleDeleteReward(btn.dataset.id);
  });

  // Saldo e botões habilitados acompanham o XP
  const unsubscribe = auth.subscribe((s) => {
    const el = container.querySelector('#balance');
    if (el && s.user) el.textContent = s.user.xp || 0;
  });

  await load();
  return () => { unsubscribe(); dialog.close(); };
}
