// Perfil: dados da conta, estatísticas, gráfico semanal, inventário (equipar tema/pet),
// exportar e importar dados. Porte de Profile.tsx (+ importação de JSON).

import * as auth from '../auth.js';
import { getUserTasks, getUserPetBonds } from '../db.js';
import { bondProgress, petFaceHTML } from '../pets.js';
import { powerText, getStreakExtra } from '../pet-powers.js';
import { petInfoHTML } from '../components/pet-info.js';
import { getEnergyLogs, energyByPeriod } from '../energy-log.js';
import { onDataChanged } from '../events.js';
import { computeStats } from '../stats.js';
import { statsHTML } from '../components/stats-view.js';
import { icon } from '../icons.js';
import { escapeHtml, toast } from '../ui.js';
import { totalPointsEarned } from '../achievements.js';
import { settingsButtonHTML, settingsDrawerHTML, mountSettingsMenu } from '../components/settings-menu.js';
import { progressCardHTML } from '../components/progress-card.js';
import { totalPoints, levelInfo, streakInfo } from '../progress.js';
import {
  FREE_THEMES, DEFAULT_THEME, SHOP_THEMES, SHOP_PETS, FREE_PETS, ALL_PETS, getInventory, getActiveTheme, getActivePet,
  setActiveThemeStorage, setActivePetStorage,
} from '../themes.js';

const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

// Contagem de tarefas concluídas em cada dia da semana atual (semana começa na segunda).
function weekCounts(tasks) {
  const now = new Date();
  const offset = (now.getDay() + 6) % 7;                       // 0 = segunda
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
  return DAY_LABELS.map((day, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const count = tasks.filter((t) => {
      if (!t.completed || !t.completedAt) return false;
      const c = new Date(t.completedAt);
      return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth() && c.getDate() === d.getDate();
    }).length;
    return { day, count };
  });
}

function chartSVG(data) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const H = 100, TOP = 18, slot = 40, barW = 28;
  const bars = data.map((d, i) => {
    const h = (d.count / max) * H;
    const x = i * slot + (slot - barW) / 2;
    const y = TOP + H - h;
    return `
      <g>
        <title>${d.day}: ${d.count} concluída(s)</title>
        ${d.count > 0 ? `<rect x="${x}" y="${y}" width="${barW}" height="${h}" class="chart-bar" rx="4" fill="hsl(${190 + i * 10}, 100%, 50%)" fill-opacity="0.7"/>
        <text x="${x + barW / 2}" y="${y - 4}" text-anchor="middle" font-size="10" style="fill:hsl(var(--foreground))">${d.count}</text>` : ''}
        <text x="${x + barW / 2}" y="${TOP + H + 18}" text-anchor="middle" font-size="11" style="fill:hsl(var(--muted-foreground))">${d.day}</text>
      </g>`;
  }).join('');
  return `<svg viewBox="0 0 ${slot * 7} ${TOP + H + 26}" width="100%" role="img" aria-label="Tarefas concluídas nesta semana: ${data.map((d) => `${d.day} ${d.count}`).join(', ')}">${bars}</svg>`;
}

export async function renderProfile(container) {
  const user = () => auth.state.user;
  let tasks = [], inventory = [], activeTheme = DEFAULT_THEME, activePet = null;
  let petBonds = {}, streakExtra = {}, energyLogs = [];
  let activeTab = 'profile';
  let statsSection = 'resumo';

  container.innerHTML = `
    <section class="page" style="gap:1.25rem">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <h1 style="font-size:1.125rem;font-weight:700">Perfil</h1>
        ${settingsButtonHTML()}
      </div>
      <div class="tabs tabs-3 profile-tabs" role="tablist" data-roving="tabs">
        ${[['profile', 'user', 'Perfil'], ['stats', 'bar-chart-3', 'Estatísticas'], ['inventory', 'backpack', 'Inventário']].map(([id, ic, label]) => `<button class="tab ${id === activeTab ? 'active' : ''}" role="tab" aria-selected="${id === activeTab}" data-tab="${id}">${icon(ic, 16, 'ico')} ${label}</button>`).join('')}
      </div>
      <div id="tab-content" class="stack" style="gap:1.25rem"></div>
      ${settingsDrawerHTML()}
    </section>`;

  const content = container.querySelector('#tab-content');

  function bondText(bond) {
    const b = bondProgress(bond || 0);
    return b.max ? `Vínculo nível ${b.level} (máximo) · ${b.bond} tarefas` : `Vínculo nível ${b.level} · faltam ${b.remaining} tarefas para o nível ${b.level + 1}`;
  }

  function renderProfileTab() {
    const u = user();
    const completed = tasks.filter((t) => t.completed).length;
    const stats = [
      { icon: 'trophy', label: 'Pontos', value: u.xp || 0, cls: 'text-accent' },
      { icon: 'zap', label: 'Concluídas', value: completed, cls: 'text-primary' },
      { icon: 'zap', label: 'Pts Ganhos', value: totalPointsEarned(tasks), cls: 'text-success' },
    ];

    content.innerHTML = `
      <div class="glass-card pad-lg row" style="gap:1rem">
        <div class="avatar">${icon('user', 28)}</div>
        <div style="min-width:0">
          <h2 style="font-family:var(--font-sans);font-size:1rem;font-weight:700">${escapeHtml(u.name)}</h2>
          <p class="muted xs row" style="gap:0.25rem">${icon('mail', 12)} <span class="task-title" style="font-weight:400">${escapeHtml(u.email)}</span></p>
        </div>
      </div>

      ${progressCardHTML(levelInfo(totalPoints(tasks)), streakInfo(tasks, Date.now(), streakExtra))}

      <div class="grid-3">
        ${stats.map((s) => `
          <div class="glass-card" style="padding:0.75rem;text-align:center">
            <span class="${s.cls}" style="display:inline-flex;margin-bottom:0.25rem">${icon(s.icon, 18)}</span>
            <p class="stat-value ${s.cls}">${s.value}</p>
            <p class="muted tiny">${s.label}</p>
          </div>`).join('')}
      </div>

      <div class="glass-card pad stack">
        <h3 style="font-family:var(--font-sans);font-size:0.875rem;font-weight:600">Produtividade da Semana</h3>
        ${chartSVG(weekCounts(tasks))}
      </div>`;
  }

  function renderInventoryTab() {
    const ownedThemes = SHOP_THEMES.filter((t) => inventory.includes(t.id));
    const boughtPets = SHOP_PETS.filter((p) => inventory.includes(p.id));
    const ownedPets = [...FREE_PETS, ...boughtPets];   // a Fagulha é de todos
    const check = `<span class="text-success" style="display:inline-flex">${icon('check', 16)}</span>`;

    content.innerHTML = `
      <div class="stack" style="gap:0.5rem">
        <h3 class="section-title row" style="gap:0.25rem">${icon('palette', 12)} Temas</h3>
        ${FREE_THEMES.map((t) => `
          <button class="glass-card card-btn between ${activeTheme === t.id ? 'active' : ''}" data-theme-id="${t.id}">
            <span class="row" style="gap:0.75rem"><span class="theme-swatch" style="background:${t.preview}"></span>
            <span class="card-title">${t.name}</span></span>${activeTheme === t.id ? check : ''}
          </button>`).join('')}
        ${ownedThemes.map((t) => `
          <button class="glass-card card-btn between ${activeTheme === t.id ? 'active' : ''}" data-theme-id="${t.id}">
            <span class="row" style="gap:0.75rem"><span class="theme-swatch" style="background:${t.preview}"></span>
            <span class="card-title">${t.name}</span></span>${activeTheme === t.id ? check : ''}
          </button>`).join('')}
        ${ownedThemes.length === 0 ? '<p class="muted xs center" style="padding:1rem 0">Compre temas na Loja para personalizar o app!</p>' : ''}
      </div>

      <div class="stack" style="gap:0.5rem">
        <h3 class="section-title row" style="gap:0.25rem">${icon('paw-print', 12)} Pets</h3>
        <button class="glass-card card-btn between ${!activePet ? 'active' : ''}" data-pet="">
          <span class="card-title muted">Nenhum pet</span>${!activePet ? check : ''}
        </button>
        ${ownedPets.map((p) => `
          <div class="pet-entry">
          <button class="glass-card card-btn between ${activePet === p.id ? 'active' : ''}" data-pet="${p.id}">
            <span class="row" style="gap:0.75rem"><span class="pet-thumb">${petFaceHTML(p, { bond: petBonds[p.id] || 0, size: 48 })}</span>
            <span><span class="card-title">${p.name}</span><span class="card-sub tiny">${p.description}</span><span class="card-sub tiny">${bondText(petBonds[p.id])}</span><span class="card-sub tiny">${powerText(p.id, bondProgress(petBonds[p.id] || 0).level)}</span></span></span>${activePet === p.id ? check : ''}
          </button>
          ${petInfoHTML(p.id, bondProgress(petBonds[p.id] || 0).level, 'attached')}
          </div>`).join('')}
        ${boughtPets.length === 0 ? '<p class="muted xs center" style="padding:1rem 0">Compre mais pets na Loja para acompanhar seu cronômetro!</p>' : ''}
      </div>`;
  }

  function renderStatsTab() {
    content.innerHTML = statsHTML({ ...computeStats(tasks, Date.now(), streakExtra), energy: energyByPeriod(energyLogs) }, statsSection);
  }

  const renderTab = () => (activeTab === 'profile' ? renderProfileTab() : activeTab === 'stats' ? renderStatsTab() : renderInventoryTab());

  async function load() {
    const u = user();
    tasks = await getUserTasks(u.id);
    inventory = getInventory(u.id);
    activeTheme = getActiveTheme(u.id);
    activePet = getActivePet(u.id);
    streakExtra = await getStreakExtra(u.id);
    energyLogs = await getEnergyLogs(u.id);
    petBonds = Object.fromEntries((await getUserPetBonds(u.id)).map((b) => [b.petId, b.bond]));
    renderTab();
  }

  // ---------- Eventos ----------
  const mainTabs = container.querySelector('.tabs');
  mainTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab]');
    if (!tab) return;
    activeTab = tab.dataset.tab;
    mainTabs.querySelectorAll('.tab').forEach((b) => {
      b.classList.toggle('active', b === tab);
      b.setAttribute('aria-selected', String(b === tab));
    });
    renderTab();
  });

  content.addEventListener('click', async (e) => {
    const statsTab = e.target.closest('button[data-stats-tab]');
    if (statsTab) {
      statsSection = statsTab.dataset.statsTab;
      renderStatsTab();
      content.querySelector(`[data-stats-tab="${statsSection}"]`)?.focus();
      return;
    }
    const themeBtn = e.target.closest('button[data-theme-id]');
    if (themeBtn) {
      const id = themeBtn.dataset.themeId;
      setActiveThemeStorage(user().id, id);
      activeTheme = id;
      toast(`Tema "${[...FREE_THEMES, ...SHOP_THEMES].find((t) => t.id === id)?.name}" aplicado!`, 'success');
      renderTab();
      return;
    }
    const petBtn = e.target.closest('button[data-pet]');
    if (petBtn) {
      const id = petBtn.dataset.pet || null;
      setActivePetStorage(user().id, id);
      activePet = id;
      toast(id ? `Pet "${ALL_PETS.find((p) => p.id === id)?.name}" ativado!` : 'Pet desativado.', 'success');
      renderTab();
      return;
    }
  });

  const unsubscribe = auth.subscribe((s) => { if (s.user && activeTab === 'profile') renderProfileTab(); });

  const offData = onDataChanged(() => { load().catch((e) => console.error(e)); });   // vínculo/sequência alterados pelo painel admin

  const unmountSettings = await mountSettingsMenu(container, { onImported: load });
  await load();
  return () => { unsubscribe(); offData(); unmountSettings(); };
}
