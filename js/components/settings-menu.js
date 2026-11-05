// Menu de configurações (sanduíche): uma gaveta com os ajustes do app, backup, importação,
// atualização e sair. Usado na Home e no Perfil (cada tela só põe o botão e chama mountSettingsMenu).

import * as auth from '../auth.js';
import { importUserData } from '../db.js';
import { importPetState } from '../pet-state.js';
import { importGoalState } from '../goals.js';
import { importEnergyLogs } from '../energy-log.js';
import { APP_VERSION } from '../version.js';
import { checkForUpdate, showUpdateBanner } from '../update-check.js';
import { icon } from '../icons.js';
import { toast } from '../ui.js';
import { parseImport } from '../data-import.js';
import {
  downloadBackup, getBackupState, lastBackupText,
  persistenceSupported, isPersisted, requestPersistence,
} from '../backup.js';
import { getSetting, setSetting, applyTextSize, TEXT_SIZES } from '../settings.js';
import { createModal } from './modal.js';
import { setActiveThemeStorage, setActivePetStorage, addToInventory } from '../themes.js';

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

// O botão do sanduíche (cada tela coloca no seu cabeçalho).
export const settingsButtonHTML = () =>
  `<button type="button" class="menu-btn" id="open-settings" aria-label="Configurações" aria-haspopup="dialog" aria-expanded="false" aria-controls="settings-drawer">${icon('menu', 22)}</button>`;

// A gaveta (fica escondida até o botão ser tocado) e o seletor de arquivo da importação.
export const settingsDrawerHTML = () => `
  <input type="file" id="import-file" accept="application/json,.json" hidden>
  <div class="drawer-overlay" id="settings-drawer-overlay" hidden>
    <aside class="drawer" id="settings-drawer" role="dialog" aria-modal="true" aria-labelledby="settings-title" tabindex="-1">
      <div class="drawer-head">
        <h2 id="settings-title" class="drawer-title">Configurações</h2>
        <button type="button" class="menu-btn" id="close-settings" aria-label="Fechar configurações">${icon('x', 22)}</button>
      </div>
      <div class="drawer-body stack" id="settings-body"></div>
    </aside>
  </div>`;

// Liga tudo. Devolve a função que desfaz (tirar o ouvinte do teclado).
// onImported: a tela chama quando uma importação termina, para se atualizar.
export async function mountSettingsMenu(container, { onImported } = {}) {
  const user = () => auth.state.user;
  let backupState = null, persisted = null;
  const fileInput = container.querySelector('#import-file');
  const drawerOverlay = container.querySelector('#settings-drawer-overlay');
  const drawer = container.querySelector('#settings-drawer');
  const settingsBody = container.querySelector('#settings-body');
  const openBtn = container.querySelector('#open-settings');

  async function refresh() {
    backupState = await getBackupState(user().id);
    persisted = await isPersisted();
    renderSettings();
  }

  function storageText() {
    if (persisted === true) return 'Protegido: o navegador não apaga seus dados sozinho quando faltar espaço. Mesmo assim, faça backup de vez em quando.';
    if (persisted === false) return 'Ainda não protegido: se faltar espaço no aparelho, o navegador pode apagar os dados deste site. O backup é a sua garantia.';
    return 'Seu navegador não informa se os dados estão protegidos. O backup é a sua garantia.';
  }

  function renderSettings() {
    settingsBody.innerHTML = `
      <label class="glass-card card-btn pref-row" for="pref-alerts">
        <span style="flex:1"><span class="card-title">Som e vibração ao terminar</span><span class="card-sub">Avisa quando o cronômetro chegar a zero</span></span>
        <input type="checkbox" class="switch" role="switch" id="pref-alerts" ${getSetting('alerts') ? 'checked' : ''}>
      </label>

      <div class="glass-card pad stack" id="text-size-card">
        <h3 style="font-family:var(--font-sans);font-size:0.875rem;font-weight:600">Tamanho do texto</h3>
        <p class="muted xs">Aumenta as letras do app inteiro.</p>
        <div class="goal-pick" role="group" aria-label="Tamanho do texto" data-roving="buttons">${TEXT_SIZES.map((t) => `<button type="button" class="chip${getSetting('textSize') === t.id ? ' active' : ''}" aria-pressed="${getSetting('textSize') === t.id}" data-text-size="${t.id}">${t.label}</button>`).join('')}</div>
      </div>

      <div class="glass-card pad stack" id="storage-card">
        <h3 style="font-family:var(--font-sans);font-size:0.875rem;font-weight:600">Proteção dos dados</h3>
        <p class="muted xs">${storageText()}</p>
        ${persistenceSupported() && persisted === false ? '<button type="button" class="btn btn-block" data-act="persist">Proteger armazenamento</button>' : ''}
      </div>

      <div class="stack" style="padding-top:0.5rem">
        <button class="glass-card card-btn" data-act="update"><span class="text-primary">${icon('rotate-ccw', 18)}</span>
          <span style="flex:1"><span class="card-title">Verificar atualização</span><span class="card-sub">Versão do app: ${APP_VERSION}</span></span></button>
        <button class="glass-card card-btn" data-act="tutorial"><span class="text-accent">${icon('book-open', 18)}</span>
          <span style="flex:1"><span class="card-title">Rever Tutorial</span><span class="card-sub">Veja novamente como usar o app</span></span></button>
        <button class="glass-card card-btn" data-act="export"><span class="text-primary">${icon('download', 18)}</span>
          <span style="flex:1"><span class="card-title">Exportar Dados (backup)</span><span class="card-sub">${lastBackupText(backupState)}. Baixa um JSON com tudo.</span></span></button>
        <button class="glass-card card-btn" data-act="import"><span class="text-success">${icon('upload', 18)}</span>
          <span style="flex:1"><span class="card-title">Importar Dados</span><span class="card-sub">Restaurar a partir de um arquivo JSON</span></span></button>
        <button class="glass-card card-btn danger" data-act="logout"><span style="color:hsl(var(--destructive))">${icon('log-out', 18)}</span>
          <span style="flex:1"><span class="card-title" style="color:hsl(var(--destructive))">Sair</span><span class="card-sub">Encerrar sessão atual</span></span></button>
      </div>`;
  }

  // ---------- Exportar ----------
  async function handleExport() {
    try {
      await downloadBackup(user().id);
      backupState = await getBackupState(user().id);
      toast('Backup salvo! Guarde o arquivo num lugar seguro.', 'success');
      renderSettings();
    } catch (e) {
      console.error(e);
      toast('Não foi possível exportar. Veja o Console (F12).', 'error');
    }
  }

  async function handleUpdateCheck() {
    const { status } = await checkForUpdate();
    if (status === 'new') showUpdateBanner();
    else toast(status === 'same' ? 'Você já está na versão mais recente.' : 'Não deu para verificar agora. Confira a internet e tente de novo.', status === 'same' ? 'success' : 'info');
  }

  async function handlePersist() {
    const granted = await requestPersistence();
    persisted = await isPersisted();
    toast(granted ? 'Armazenamento protegido!' : 'O navegador não liberou a proteção agora. O backup continua valendo.', granted ? 'success' : 'info', 4500);
    renderSettings();
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
      await importPetState(u.id, parsed.petState);   // escudos, baú e Coruja: união com o que a conta já tem
      await importGoalState(u.id, parsed.goalState); // meta da semana e recompensas recebidas: união
      await importEnergyLogs(u.id, parsed.energyLogs); // registros de energia: união
      parsed.inventory.forEach((id) => addToInventory(u.id, id));
      if (parsed.theme) setActiveThemeStorage(u.id, parsed.theme);
      if (parsed.pet) setActivePetStorage(u.id, parsed.pet);
      await auth.refreshUser();
      await refresh();
      if (onImported) await onImported();
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

  settingsBody.addEventListener('change', (e) => {
    if (e.target.id === 'pref-alerts') {
      setSetting('alerts', e.target.checked);
      toast(e.target.checked ? 'Som e vibração ativados.' : 'Som e vibração desativados.');
    }
  });


  settingsBody.addEventListener('click', async (e) => {
    const sizeBtn = e.target.closest('button[data-text-size]');
    if (sizeBtn) {
      setSetting('textSize', sizeBtn.dataset.textSize);
      applyTextSize(sizeBtn.dataset.textSize);
      settingsBody.querySelectorAll('button[data-text-size]').forEach((b) => {
        const on = b === sizeBtn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      return;
    }
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'tutorial') { localStorage.removeItem('energy-planner-onboarded'); window.location.reload(); }
    else if (act === 'export') handleExport();
    else if (act === 'persist') handlePersist();
    else if (act === 'update') handleUpdateCheck();
    else if (act === 'import') fileInput.click();
    else if (act === 'logout') { await auth.logout(); toast('Sessão encerrada.'); }
  });

  // ---------- Menu de configurações (sanduíche) ----------
  const drawerOpen = () => !drawerOverlay.hidden;
  function openDrawer() {
    if (drawerOpen()) return;
    renderSettings();
    refresh().catch(() => {});   // atualiza a data do backup e o estado da proteção
    drawerOverlay.hidden = false;
    openBtn.setAttribute('aria-expanded', 'true');
    container.querySelector('#close-settings').focus();
  }
  function closeDrawer() {
    if (!drawerOpen()) return;
    drawerOverlay.hidden = true;
    openBtn.setAttribute('aria-expanded', 'false');
    openBtn.focus();
  }
  openBtn.addEventListener('click', openDrawer);
  container.querySelector('#close-settings').addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('mousedown', (e) => { if (e.target === drawerOverlay) closeDrawer(); });
  const onDrawerKey = (e) => {
    if (!drawerOpen() || document.querySelector('.modal-overlay')) return;   // uma janela por cima (ex.: importar) cuida das próprias teclas
    if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); return; }
    if (e.key !== 'Tab') return;
    const items = [...drawer.querySelectorAll(FOCUSABLE)];
    if (!items.length) { e.preventDefault(); return; }
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || !drawer.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !drawer.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', onDrawerKey);

  await refresh();
  return () => document.removeEventListener('keydown', onDrawerKey);
}
