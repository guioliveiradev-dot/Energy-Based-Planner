// Tela de login / cadastro. Porte de Auth.tsx.

import * as auth from '../auth.js';
import { icon } from '../icons.js';

export function renderLogin(root) {
  root.innerHTML = `
    <div class="auth-page">
      <div class="auth-blob auth-blob-left"></div>
      <div class="auth-blob auth-blob-right"></div>

      <div class="auth-card">
        <div class="center" style="margin-bottom:2rem">
          <div class="logo-mark logo-hero animate-float" role="img" aria-label="Logo do Energy Based Planner"></div>
          <h1 class="neon-text" style="font-size:1.5rem;font-weight:700">Energy Based Planner</h1>
          <p class="muted small" style="margin-top:0.25rem">Gerencie tarefas pelo seu nível de energia</p>
        </div>

        <div class="tabs" role="tablist" data-mode="login" style="margin-bottom:1.5rem">
          <button type="button" class="tab active" role="tab" aria-selected="true" data-tab="login">Login</button>
          <button type="button" class="tab" role="tab" aria-selected="false" data-tab="register">Cadastro</button>
        </div>

        <form id="auth-form" class="stack" style="gap:1rem" novalidate>
          <div class="collapse" id="name-wrap" data-open="false" aria-hidden="true" inert>
            <div class="collapse-inner">
              <div class="field" id="name-field">
                <label class="sr-only" for="name">Nome</label>
                <span class="field-icon">${icon('user', 16)}</span>
                <input class="input" id="name" placeholder="Seu nome" maxlength="50" autocomplete="name">
              </div>
            </div>
          </div>

          <div class="field">
            <label class="sr-only" for="email">Email</label>
            <span class="field-icon">${icon('mail', 16)}</span>
            <input class="input" id="email" type="email" placeholder="Email" maxlength="100" autocomplete="email">
          </div>

          <div class="stack" style="gap:0.375rem">
            <div class="field">
              <label class="sr-only" for="password">Senha (mínimo 6 caracteres)</label>
              <span class="field-icon">${icon('lock', 16)}</span>
              <input class="input" id="password" type="password" placeholder="Senha (min. 6 caracteres)" maxlength="100" autocomplete="current-password" style="padding-right:2.5rem">
              <button type="button" class="field-toggle" id="toggle-pw" tabindex="-1" aria-label="Mostrar senha">${icon('eye', 16)}</button>
            </div>
            <div class="caps-warning" id="caps" hidden>${icon('alert-triangle', 12)}<span>Caps Lock está ativado</span></div>
          </div>

          <p class="error-text center" id="auth-error" role="alert"></p>

          <button type="submit" class="btn-neon btn-block row-center" id="submit" style="justify-content:center">
            <span id="submit-spinner" hidden>${icon('loader', 18, 'spin')}</span>
            <span id="submit-label">Entrar</span>
          </button>
        </form>
      </div>
    </div>`;

  let isLogin = true;
  const $ = (sel) => root.querySelector(sel);
  const nameWrap = $('#name-wrap');
  const tabs = $('.tabs');
  const errorEl = $('#auth-error');
  const passwordEl = $('#password');

  function setMode(login) {
    isLogin = login;
    root.querySelectorAll('.tab').forEach((t) => {
      const on = (t.dataset.tab === 'login') === login;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
    });
    tabs.dataset.mode = login ? 'login' : 'register';            // o indicador desliza (CSS)
    nameWrap.dataset.open = String(!login);                       // o campo de nome abre e fecha (CSS)
    nameWrap.toggleAttribute('inert', login);                     // fechado: sem foco e fora do leitor de tela
    nameWrap.setAttribute('aria-hidden', String(login));
    const label = $('#submit-label');
    label.textContent = login ? 'Entrar' : 'Criar Conta';
    label.animate?.([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'ease-out' });
    passwordEl.autocomplete = login ? 'current-password' : 'new-password';
    errorEl.textContent = '';
  }
  root.querySelectorAll('.tab').forEach((t) =>
    t.addEventListener('click', () => setMode(t.dataset.tab === 'login')));

  // Mostrar / ocultar senha
  $('#toggle-pw').addEventListener('click', () => {
    const show = passwordEl.type === 'password';
    passwordEl.type = show ? 'text' : 'password';
    $('#toggle-pw').innerHTML = icon(show ? 'eye-off' : 'eye', 16);
    $('#toggle-pw').setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
    $('#toggle-pw').setAttribute('aria-pressed', String(show));
  });

  // Aviso de Caps Lock
  const checkCaps = (e) => { $('#caps').hidden = !e.getModifierState('CapsLock'); };
  passwordEl.addEventListener('keydown', checkCaps);
  passwordEl.addEventListener('keyup', checkCaps);

  $('#auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    const name = $('#name').value;
    const email = $('#email').value;
    const password = passwordEl.value;

    if (!email.trim() || !password.trim()) { errorEl.textContent = 'Preencha todos os campos.'; return; }
    if (!isLogin && !name.trim()) { errorEl.textContent = 'Preencha seu nome.'; return; }
    if (password.length < 6) { errorEl.textContent = 'Senha deve ter pelo menos 6 caracteres.'; return; }

    const button = $('#submit');
    button.disabled = true;
    $('#submit-spinner').hidden = false;

    const cleanEmail = email.trim().toLowerCase();
    const result = isLogin
      ? await auth.login(cleanEmail, password)
      : await auth.register(name.trim(), cleanEmail, password);

    // Se deu certo, o app troca de tela sozinho (auth.subscribe em app.js).
    if (!result.success) {
      errorEl.textContent = result.error || 'Erro inesperado.';
      button.disabled = false;
      $('#submit-spinner').hidden = true;
    }
  });
}
