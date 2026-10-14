// Painel admin escondido (8 toques em "Home" em 5 s). Porte de AdminPanel.tsx.
// A senha abaixo fica visível no código: serve só para esconder o painel, não é segurança.
// Troque aqui se quiser outra.

import * as auth from '../auth.js';
import { resetUserData, deleteUserAccount } from '../db.js';
import { clearUserInventory } from '../themes.js';
import { createModal } from './modal.js';
import { icon } from '../icons.js';
import { toast } from '../ui.js';

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
        <button class="glass-card card-btn" data-act="points"><span class="text-success">${icon('plus', 18)}</span>
          <span style="flex:1"><span class="card-title">+1000 Pontos Planner</span><span class="card-sub">Adicionar pontos à conta</span></span></button>
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

    if (name === 'points') {
      await auth.addXP(1000);
      toast('+1000 Pontos Planner adicionados!', 'success');
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
  }

  modal.panel.addEventListener('click', (e) => {
    const name = e.target.closest('[data-act]')?.dataset.act;
    if (name) act(name);
  });

  draw();
  modal.open();
  return { close };
}
