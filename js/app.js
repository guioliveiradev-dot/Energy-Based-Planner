// Ponto de entrada: decide entre carregando, login e app (com navegação).

import * as auth from './auth.js';
import { getDB, onDatabaseReplaced } from './db.js';
import { autoRequestPersistence } from './backup.js';
import { applyTheme, getActiveTheme, getLastTheme, migrateThemes } from './themes.js';
import { startRouter, stopRouter } from './router.js';
import { spinnerHTML } from './ui.js';
import { icon } from './icons.js';
import { showOnboarding } from './components/onboarding.js';
import { startAchievementWatcher } from './components/achievement-notification.js';
import { openAdminPanel } from './components/admin-panel.js';
import { isAdminAllowed } from './config.js';
import { renderLogin } from './pages/login.js';
import { renderHome } from './pages/home.js';
import { renderTasks } from './pages/tasks.js';
import { renderRoutine } from './pages/routine.js';
import { renderShop } from './pages/shop.js';
import { renderProfile } from './pages/profile.js';

const root = document.getElementById('app');

const ROUTES = {
  '/': renderHome,
  '/tasks': renderTasks,
  '/routine': renderRoutine,
  '/shop': renderShop,
  '/profile': renderProfile,
};

const NAV = [
  { path: '/',        label: 'Home',    icon: 'home' },
  { path: '/tasks',   label: 'Tarefas', icon: 'list-todo' },
  { path: '/routine', label: 'Rotina',  icon: 'calendar' },
  { path: '/shop',    label: 'Loja',    icon: 'shopping-bag' },
  { path: '/profile', label: 'Perfil',  icon: 'user' },
];

let mode = null;          // 'loading' | 'login' | 'app'
let mountedUserId = null;
let onboarding = null;
let stopAchievements = null;
let dbFailure = null;     // erro ao abrir o banco (versão mais nova, modo privado...)

function renderDbFailure() {
  mode = 'error';
  stopRouter();
  const replaced = dbFailure && dbFailure.code === 'DB_REPLACED';
  const tooNew = dbFailure && dbFailure.code === 'DB_TOO_NEW';
  const text = replaced
    ? 'O app foi atualizado em outra aba. Recarregue esta página para continuar.'
    : tooNew
      ? 'Seus dados foram criados por uma versão mais nova do app. Recarregue a página (Ctrl+Shift+R) para pegar a versão atual. Seus dados não foram apagados.'
      : 'O navegador não deixou abrir o banco de dados. Isso acontece em janelas privadas ou com o armazenamento bloqueado. Seus dados não foram apagados.';
  root.innerHTML = `
    <div class="screen-center"><div class="glass-card pad-lg stack center" role="alert" style="max-width:24rem">
      <h1 class="page-title">Não deu para abrir seus dados</h1>
      <p class="small">${text}</p>
      <button type="button" class="btn-neon" id="reload">Recarregar</button>
    </div></div>`;
  root.querySelector('#reload').addEventListener('click', () => location.reload());
}

function mountApp(user) {
  mode = 'app';
  mountedUserId = user.id;
  migrateThemes(user);
  applyTheme(getActiveTheme(user.id));
  autoRequestPersistence(user.id).catch(() => {});   // protege os dados (uma vez, quando já houver tarefas)

  if (stopAchievements) stopAchievements();
  stopAchievements = startAchievementWatcher();

  root.innerHTML = `
    <div class="app-shell">
      <main id="outlet"></main>
      <nav class="bottom-nav" aria-label="Navegação principal">
        <div class="bottom-nav-inner">
          ${NAV.map((n) => `<a class="nav-tab" href="#${n.path}" data-path="${n.path}"><i class="nav-indicator"></i>${icon(n.icon, 20)}<span>${n.label}</span></a>`).join('')}
        </div>
      </nav>
    </div>`;

  // Tutorial na primeira vez (mesma chave do app original)
  if (onboarding) onboarding.close();
  onboarding = null;
  if (!localStorage.getItem('energy-planner-onboarded')) {
    onboarding = showOnboarding({
      onComplete: () => { localStorage.setItem('energy-planner-onboarded', 'true'); onboarding = null; },
    });
  }

  // Painel admin escondido: 8 toques em "Home" em até 5 s (igual ao original)
  let homeClicks = [];
  root.querySelector('.nav-tab[data-path="/"]').addEventListener('click', () => {
    const now = Date.now();
    homeClicks = [...homeClicks, now].filter((t) => now - t < 5000);
    if (homeClicks.length >= 8) { homeClicks = []; if (isAdminAllowed()) openAdminPanel(); }   // só em localhost (js/config.js)
  });

  const links = root.querySelectorAll('.nav-tab');
  startRouter({
    routes: ROUTES,
    fallback: '/',
    outlet: root.querySelector('#outlet'),
    onRendered: (path, first) => {
      const label = NAV.find((n) => n.path === path)?.label || 'Home';
      document.title = `${label} · Energy Based Planner`;
      if (!first) document.getElementById('route-announcer').textContent = label;
    },
    onChange: (path) => links.forEach((a) => {
      const active = a.dataset.path === path;
      a.classList.toggle('active', active);
      active ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
    }),
  });
}

function update() {
  if (dbFailure) { if (mode !== 'error') renderDbFailure(); return; }
  if (auth.state.loading) {
    mode = 'loading';
    root.innerHTML = spinnerHTML;
    return;
  }
  const user = auth.state.user;
  if (!user) {
    if (mode !== 'login') {
      stopRouter();
      if (onboarding) onboarding.close();
      onboarding = null;
      if (stopAchievements) stopAchievements();
      stopAchievements = null;
      mountedUserId = null;
      applyTheme(getLastTheme());
      mode = 'login';
      renderLogin(root);
    }
    return;
  }
  if (mode !== 'app' || mountedUserId !== user.id) mountApp(user);
}

onDatabaseReplaced(() => { dbFailure = Object.assign(new Error('replaced'), { code: 'DB_REPLACED' }); update(); });
getDB().catch((e) => { dbFailure = e; update(); });
auth.subscribe(update);
update();
auth.init();

// App instalável + funciona sem internet (veja sw.js)
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service worker não registrado:', e));
  });
}
