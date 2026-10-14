// Perfil: dados da conta, estatísticas, gráfico semanal, inventário (equipar tema/pet),
// exportar e importar dados. Porte de Profile.tsx (+ importação de JSON).

import * as auth from '../auth.js';
import { getUserTasks, exportAllData, importUserData } from '../db.js';
import { icon } from '../icons.js';
import { escapeHtml, toast } from '../ui.js';
import { totalPointsEarned } from '../achievements.js';
import { parseImport } from '../data-import.js';
import { getSetting, setSetting } from '../settings.js';
import { createModal } from '../components/modal.js';
import {
  SHOP_THEMES, SHOP_PETS, getInventory, getActiveTheme, getActivePet,
  setActiveThemeStorage, setActivePetStorage, addToInventory,
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
        ${d.count > 0 ? `<rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="4" fill="hsl(${190 + i * 10}, 100%, 50%)" fill-opacity="0.7"/>
        <text x="${x + barW / 2}" y="${y - 4}" text-anchor="middle" font-size="10" style="fill:hsl(var(--foreground))">${d.count}</text>` : ''}
        <text x="${x + barW / 2}" y="${TOP + H + 18}" text-anchor="middle" font-size="11" style="fill:hsl(var(--muted-foreground))">${d.day}</text>
      </g>`;
  }).join('');
  return `<svg viewBox="0 0 ${slot * 7} ${TOP + H + 26}" width="100%" role="img" aria-label="Tarefas concluídas nesta semana: ${data.map((d) => `${d.day} ${d.count}`).join(', ')}">${bars}</svg>`;
}

export async function renderProfile(container) {
  const user = () => auth.state.user;
  let tasks = [], inventory = [], activeTheme = 'default', activePet = null;
  let activeTab = 'profile';

  container.innerHTML = `
    <section class="page" style="gap:1.25rem">
      <h1 style="font-size:1.125rem;font-weight:700">Perfil</h1>
      <div class="tabs" role="tablist">
        <button class="tab active" role="tab" aria-selected="true" data-tab="profile">👤 Perfil</button>
        <button class="tab" role="tab" aria-selected="false" data-tab="inventory">🎒 Inventário</button>
      </div>
      <div id="tab-content" class="stack" style="gap:1.25rem"></div>
      <input type="file" id="import-file" accept="application/json,.json" hidden>
    </section>`;

  const content = container.querySelector('#tab-content');
  const fileInput = container.querySelector('#import-file');

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
      </div>

      <label class="glass-card card-btn pref-row" for="pref-alerts">
        <span style="flex:1"><span class="card-title">Som e vibração ao terminar</span><span class="card-sub">Avisa quando o cronômetro chegar a zero</span></span>
        <input type="checkbox" class="switch" role="switch" id="pref-alerts" ${getSetting('alerts') ? 'checked' : ''}>
      </label>

      <div class="stack" style="padding-top:0.5rem">
        <button class="glass-card card-btn" data-act="tutorial"><span class="text-accent">${icon('book-open', 18)}</span>
          <span style="flex:1"><span class="card-title">Rever Tutorial</span><span class="card-sub">Veja novamente como usar o app</span></span></button>
        <button class="glass-card card-btn" data-act="export"><span class="text-primary">${icon('download', 18)}</span>
          <span style="flex:1"><span class="card-title">Exportar Dados</span><span class="card-sub">Baixar JSON com todos os seus dados</span></span></button>
        <button class="glass-card card-btn" data-act="import"><span class="text-success">${icon('upload', 18)}</span>
          <span style="flex:1"><span class="card-title">Importar Dados</span><span class="card-sub">Restaurar a partir de um arquivo JSON</span></span></button>
        <button class="glass-card card-btn danger" data-act="logout"><span style="color:hsl(var(--destructive))">${icon('log-out', 18)}</span>
          <span style="flex:1"><span class="card-title" style="color:hsl(var(--destructive))">Sair</span><span class="card-sub">Encerrar sessão atual</span></span></button>
      </div>`;
  }

  function renderInventoryTab() {
    const ownedThemes = SHOP_THEMES.filter((t) => inventory.includes(t.id));
    const ownedPets = SHOP_PETS.filter((p) => inventory.includes(p.id));
    const check = `<span class="text-success" style="display:inline-flex">${icon('check', 16)}</span>`;

    content.innerHTML = `
      <div class="stack" style="gap:0.5rem">
        <h3 class="section-title row" style="gap:0.25rem">${icon('palette', 12)} Temas</h3>
        <button class="glass-card card-btn between ${activeTheme === 'default' ? 'active' : ''}" data-theme-id="default">
          <span class="row" style="gap:0.75rem"><span class="theme-swatch" style="background:linear-gradient(135deg, hsl(190 100% 50%), hsl(265 100% 68%))"></span>
          <span class="card-title">Cyberpunk (Padrão)</span></span>${activeTheme === 'default' ? check : ''}
        </button>
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
          <button class="glass-card card-btn between ${activePet === p.id ? 'active' : ''}" data-pet="${p.id}">
            <span class="row" style="gap:0.75rem"><span style="font-size:1.5rem">${p.emoji}</span>
            <span><span class="card-title">${p.name}</span><span class="card-sub tiny">${p.description}</span></span></span>${activePet === p.id ? check : ''}
          </button>`).join('')}
        ${ownedPets.length === 0 ? '<p class="muted xs center" style="padding:1rem 0">Compre pets na Loja para acompanhar seu cronômetro!</p>' : ''}
      </div>`;
  }

  const renderTab = () => (activeTab === 'profile' ? renderProfileTab() : renderInventoryTab());

  async function load() {
    const u = user();
    tasks = await getUserTasks(u.id);
    inventory = getInventory(u.id);
    activeTheme = getActiveTheme(u.id);
    activePet = getActivePet(u.id);
    renderTab();
  }

  // ---------- Exportar ----------
  async function handleExport() {
    const u = user();
    const data = await exportAllData(u.id);
    // Além do que o app original exportava, guardamos inventário, tema e pet.
    data.inventory = getInventory(u.id);
    data.activeTheme = getActiveTheme(u.id);
    data.activePet = getActivePet(u.id);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `energy-planner-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Dados exportados!', 'success');
  }

  // ---------- Importar ----------
  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  function confirmImport(parsed) {
    const modal = createModal();
    const lines = [
      `${parsed.tasks.length} tarefa(s)`, `${parsed.routineBlocks.length} bloco(s) de rotina`,
      `${parsed.rewards.length} recompensa(s)`, `${parsed.redemptionHistory.length} resgate(s) no histórico`,
    ];
    if (parsed.inventory.length) lines.push(`${parsed.inventory.length} item(ns) de inventário`);
    modal.panel.innerHTML = `
      <h2 class="modal-title">Importar dados</h2>
      <div class="stack" style="padding-top:0.5rem">
        <p class="small">Encontrei no arquivo:</p>
        <ul class="import-list">${lines.map((l) => `<li>${l}</li>`).join('')}</ul>
        ${parsed.xp !== null ? `<p class="small">Seus pontos serão <strong>substituídos</strong> por <strong>${parsed.xp}</strong> (hoje: ${user().xp || 0}).</p>` : ''}
        <p class="muted xs">Os itens são adicionados aos que você já tem. Itens com o mesmo identificador são atualizados.${parsed.skipped ? ` ${parsed.skipped} registro(s) inválido(s) serão ignorados.` : ''}</p>
        <div class="row" style="gap:0.75rem">
          <button class="btn btn-block" data-act="cancel">Cancelar</button>
          <button class="btn-neon btn-block" data-act="confirm">Importar</button>
        </div>
      </div>`;
    modal.panel.addEventListener('click', async (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'cancel') modal.close();
      if (act === 'confirm') {
        modal.panel.querySelector('[data-act="confirm"]').disabled = true;
        await runImport(parsed);
        modal.close();
      }
    });
    modal.open();
  }

  async function runImport(parsed) {
    const u = user();
    try {
      const { counts, skipped } = await importUserData(u.id, parsed);
      parsed.inventory.forEach((id) => addToInventory(u.id, id));
      if (parsed.theme) setActiveThemeStorage(u.id, parsed.theme);
      if (parsed.pet) setActivePetStorage(u.id, parsed.pet);
      await auth.refreshUser();
      await load();
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      toast(`Importação concluída: ${total} registro(s).${skipped ? ` ${skipped} ignorado(s).` : ''}`, 'success', 4500);
    } catch (e) {
      console.error(e);
      toast('Não foi possível importar. Veja o Console (F12).', 'error');
    }
  }

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0];
    fileInput.value = '';
    if (!file) return;
    let text;
    try { text = await readFile(file); } catch { toast('Não consegui ler o arquivo.', 'error'); return; }
    const parsed = parseImport(text);
    if (parsed.error) { toast(parsed.error, 'error', 4500); return; }
    confirmImport(parsed);
  });

  // ---------- Eventos ----------
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

  content.addEventListener('change', (e) => {
    if (e.target.id === 'pref-alerts') {
      setSetting('alerts', e.target.checked);
      toast(e.target.checked ? 'Som e vibração ativados.' : 'Som e vibração desativados.');
    }
  });

  content.addEventListener('click', async (e) => {
    const themeBtn = e.target.closest('button[data-theme-id]');
    if (themeBtn) {
      const id = themeBtn.dataset.themeId;
      setActiveThemeStorage(user().id, id);
      activeTheme = id;
      toast(`Tema "${id === 'default' ? 'Padrão' : SHOP_THEMES.find((t) => t.id === id)?.name}" aplicado!`, 'success');
      renderTab();
      return;
    }
    const petBtn = e.target.closest('button[data-pet]');
    if (petBtn) {
      const id = petBtn.dataset.pet || null;
      setActivePetStorage(user().id, id);
      activePet = id;
      toast(id ? `Pet "${SHOP_PETS.find((p) => p.id === id)?.name}" ativado!` : 'Pet desativado.', 'success');
      renderTab();
      return;
    }
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'tutorial') { localStorage.removeItem('energy-planner-onboarded'); window.location.reload(); }
    else if (act === 'export') handleExport();
    else if (act === 'import') fileInput.click();
    else if (act === 'logout') { await auth.logout(); toast('Sessão encerrada.'); }
  });

  const unsubscribe = auth.subscribe((s) => { if (s.user && activeTab === 'profile') renderProfileTab(); });

  await load();
  return unsubscribe;
}
