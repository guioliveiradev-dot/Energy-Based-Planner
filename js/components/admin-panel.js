// Painel admin escondido (8 toques em "Home" em 5 s). Porte de AdminPanel.tsx.
// A senha abaixo fica visível no código: serve só para esconder o painel, não é segurança.
// Troque aqui se quiser outra.

import * as auth from '../auth.js';
import { resetUserData, deleteUserAccount } from '../db.js';
import { clearUserInventory } from '../themes.js';
import { createModal } from './modal.js';
import { icon } from '../icons.js';
import { toast } from '../ui.js';
import { ALL_PETS, getActivePet } from '../themes.js';
import * as tools from '../admin-tools.js';
import { emitDataChanged } from '../events.js';
import { showPetLevelUp } from './pet-levelup.js';

const ADMIN_PASSWORD = 'zen123';
let current = null;   // evita abrir dois painéis

export function openAdminPanel() {
  if (current) return;

  let authenticated = false;
  let confirmReset = false;
  let confirmDelete = false;

  const modal = createModal({ onRequestClose: close });
  current = modal;

  function close() {
    modal.close();
    current = null;
  }

  function draw() {
    const activeId = auth.state.user ? getActivePet(auth.state.user.id) : null;
    const petLine = activeId ? `Pet ativo: ${ALL_PETS.find((p) => p.id === activeId)?.name}` : 'Escolha um pet ativo no Perfil';
    if (!authenticated) {
      modal.panel.innerHTML = `
        <button class="modal-close" data-act="close" aria-label="Fechar">${icon('x', 18)}</button>
        <h2 class="modal-title row"><span class="text-accent" style="display:inline-flex">${icon('shield', 20)}</span> Acesso Restrito</h2>
        <div class="stack" style="gap:1rem;padding-top:0.5rem">
          <input class="input" id="admin-pw" type="password" placeholder="Digite a senha" autocomplete="off">
          <button class="btn-neon btn-block" data-act="login">Entrar</button>
        </div>`;
      const pw = modal.panel.querySelector('#admin-pw');
      pw.addEventListener('keydown', (e) => { if (e.key === 'Enter') login(); });
      pw.focus();
      return;
    }
    modal.panel.innerHTML = `
      <button class="modal-close" data-act="close" aria-label="Fechar">${icon('x', 18)}</button>
      <h2 class="modal-title row"><span class="text-accent" style="display:inline-flex">${icon('shield', 20)}</span> Painel Admin</h2>
      <div class="stack" style="padding-top:0.5rem">
        <h3 class="section-title">Pontos e vínculo</h3>
        <button class="glass-card card-btn" data-act="xp100"><span class="text-success">${icon('plus', 18)}</span>
          <span style="flex:1"><span class="card-title">+100 Pontos Planner</span><span class="card-sub">Pontos na conta (não contam no nível)</span></span></button>
        <button class="glass-card card-btn" data-act="points"><span class="text-success">${icon('plus', 18)}</span>
          <span style="flex:1"><span class="card-title">+1000 Pontos Planner</span><span class="card-sub">Adicionar pontos à conta</span></span></button>
        <button class="glass-card card-btn" data-act="xp10000"><span class="text-success">${icon('plus', 18)}</span>
          <span style="flex:1"><span class="card-title">+10000 Pontos Planner</span><span class="card-sub">Para comprar tudo na Loja</span></span></button>
        <button class="glass-card card-btn" data-act="bond1"><span class="text-primary">${icon('paw-print', 18)}</span>
          <span style="flex:1"><span class="card-title">+1 de vínculo (pet ativo)</span><span class="card-sub">${petLine}</span></span></button>
        <button class="glass-card card-btn" data-act="bond5"><span class="text-primary">${icon('paw-print', 18)}</span>
          <span style="flex:1"><span class="card-title">+5 de vínculo (pet ativo)</span><span class="card-sub">Sobe o nível mais rápido</span></span></button>
        <button class="glass-card card-btn" data-act="bond20"><span class="text-primary">${icon('paw-print', 18)}</span>
          <span style="flex:1"><span class="card-title">+20 de vínculo (pet ativo)</span><span class="card-sub">Vai até o nível 4</span></span></button>
        <button class="glass-card card-btn" data-act="bondmax"><span class="text-primary">${icon('paw-print', 18)}</span>
          <span style="flex:1"><span class="card-title">Vínculo no máximo (pet ativo)</span><span class="card-sub">Nível 5, 70 tarefas</span></span></button>
        <button class="glass-card card-btn" data-act="bondreset"><span class="text-warning">${icon('rotate-ccw', 18)}</span>
          <span style="flex:1"><span class="card-title">Zerar vínculo (pet ativo)</span><span class="card-sub">Volta ao nível 1</span></span></button>
        <h3 class="section-title">Sequência e poderes</h3>
        <button class="glass-card card-btn" data-act="streak-alive"><span class="text-warning">${icon('flame', 18)}</span>
          <span style="flex:1"><span class="card-title">Sequência de 5 dias (até ontem)</span><span class="card-sub">Conclua uma tarefa hoje para ver ela subir</span></span></button>
        <button class="glass-card card-btn" data-act="streak-shield"><span class="text-primary">${icon('shield', 18)}</span>
          <span style="flex:1"><span class="card-title">Perdi ontem (testa o Cão Guardião)</span><span class="card-sub">5 dias e 1 dia perdido. Com o Cão ativo, abra a Home</span></span></button>
        <button class="glass-card card-btn" data-act="streak-broken"><span class="text-warning">${icon('flame', 18)}</span>
          <span style="flex:1"><span class="card-title">Sequência quebrada (testa a Fênix)</span><span class="card-sub">7 dias e 2 perdidos. Com a Fênix ativa, conclua uma tarefa</span></span></button>
        <button class="glass-card card-btn" data-act="tasks-test"><span class="text-success">${icon('plus', 18)}</span>
          <span style="flex:1"><span class="card-title">Criar 3 tarefas de teste</span><span class="card-sub">Energia 3, 5 e 9, prontas para coletar pontos</span></span></button>
        <button class="glass-card card-btn" data-act="tasks-clear"><span class="text-warning">${icon('trash', 18)}</span>
          <span style="flex:1"><span class="card-title">Limpar tarefas de teste</span><span class="card-sub">Apaga só as tarefas marcadas como teste</span></span></button>
        <button class="glass-card card-btn" data-act="chest-reset"><span class="text-primary">${icon('sparkles', 18)}</span>
          <span style="flex:1"><span class="card-title">Liberar o baú de hoje</span><span class="card-sub">Para o Unicórnio abrir outro baú</span></span></button>
        <button class="glass-card card-btn" data-act="powers-reset"><span class="text-warning">${icon('rotate-ccw', 18)}</span>
          <span style="flex:1"><span class="card-title">Zerar poderes dos pets</span><span class="card-sub">Escudos, baú, Fênix e missão do Robô</span></span></button>
        <h3 class="section-title">Conta</h3>
        <button class="glass-card card-btn" data-act="tutorial"><span class="text-primary">${icon('book-open', 18)}</span>
          <span style="flex:1"><span class="card-title">Resetar Tutorial</span><span class="card-sub">Ver o tutorial novamente</span></span></button>
        <button class="glass-card card-btn" data-act="reset"><span class="text-warning">${icon('rotate-ccw', 18)}</span>
          <span style="flex:1"><span class="card-title text-warning">${confirmReset ? '⚠️ Confirmar Reset?' : 'Resetar Conta'}</span><span class="card-sub">${confirmReset ? 'Toque novamente para confirmar' : 'Zerar dados, manter conta'}</span></span></button>
        <button class="glass-card card-btn" data-act="delete"><span style="color:hsl(var(--destructive))">${icon('trash', 18)}</span>
          <span style="flex:1"><span class="card-title" style="color:hsl(var(--destructive))">${confirmDelete ? '⚠️ Confirmar Exclusão?' : 'Apagar Conta'}</span><span class="card-sub">${confirmDelete ? 'Toque novamente para confirmar' : 'Remover tudo permanentemente'}</span></span></button>
      </div>`;
  }

  function login() {
    const pw = modal.panel.querySelector('#admin-pw').value;
    if (pw === ADMIN_PASSWORD) { authenticated = true; draw(); }
    else toast('Senha incorreta.', 'error');
  }

  async function act(name) {
    const user = auth.state.user;
    if (name === 'close') return close();
    if (name === 'login') return login();
    if (!user) return;
    let levelUpResult = null;

    if (name === 'points') {
      await auth.addXP(1000);
      toast('+1000 Pontos Planner adicionados!', 'success');
    } else if (name === 'xp100' || name === 'xp10000') {
      const n = name === 'xp100' ? 100 : 10000;
      await auth.addXP(n);
      toast(`+${n} Pontos Planner adicionados!`, 'success');
    } else if (['bond1', 'bond5', 'bond20', 'bondmax', 'bondreset'].includes(name)) {
      const r = name === 'bondmax' ? await tools.giveMaxBond(user.id)
        : name === 'bondreset' ? await tools.resetBond(user.id)
        : await tools.giveBond(user.id, name === 'bond1' ? 1 : name === 'bond5' ? 5 : 20);
      if (!r) toast('Escolha um pet ativo no Perfil primeiro.', 'error');
      else {
        toast(`${ALL_PETS.find((p) => p.id === r.petId)?.name}: vínculo ${r.before} → ${r.after}.`, 'success');
        levelUpResult = r;   // se o nível subiu, a comemoração abre depois que as telas se atualizarem
      }
    } else if (name.startsWith('streak-')) {
      const kind = name.slice(7);
      const days = await tools.createTestStreak(user.id, kind);
      toast(`${days} dias de teste criados. ${tools.STREAK_SCENARIOS[kind].sub}`, 'success', 7000);
    } else if (name === 'tasks-test') {
      toast(`${await tools.createTestTasks(user.id)} tarefas de teste criadas. Veja em Tarefas.`, 'success');
    } else if (name === 'tasks-clear') {
      toast(`${await tools.clearTestTasks(user.id)} tarefas de teste apagadas.`, 'success');
    } else if (name === 'chest-reset') {
      await tools.releaseTodayChest(user.id);
      toast('Baú de hoje liberado.', 'success');
    } else if (name === 'powers-reset') {
      await tools.resetPetPowers(user.id);
      toast('Poderes dos pets zerados (escudos, baú, Fênix e missão).', 'success');
    } else if (name === 'tutorial') {
      localStorage.removeItem('energy-planner-onboarded');
      toast('Tutorial resetado! Recarregue a página.', 'success');
    } else if (name === 'reset') {
      if (!confirmReset) { confirmReset = true; draw(); return; }
      await resetUserData(user.id);
      clearUserInventory(user.id);
      localStorage.removeItem('energy-planner-onboarded');
      await auth.refreshUser();
      confirmReset = false;
      draw();
      toast('Conta resetada! Dados zerados, conta mantida.', 'success');
    } else if (name === 'delete') {
      if (!confirmDelete) { confirmDelete = true; draw(); return; }
      clearUserInventory(user.id);
      localStorage.removeItem('energy-planner-onboarded');
      await deleteUserAccount(user.id);
      await auth.logout();
      toast('Conta apagada.', 'success');
      close();
    }

    // As telas abertas (Home, Perfil, Tarefas) se atualizam sozinhas; se o pet subiu de nível, comemora.
    emitDataChanged('admin');
    if (levelUpResult) showPetLevelUp(levelUpResult);
  }

  modal.panel.addEventListener('click', (e) => {
    const name = e.target.closest('[data-act]')?.dataset.act;
    if (name) act(name);
  });

  draw();
  modal.open();
  return { close };
}
