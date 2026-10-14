import 'fake-indexeddb/auto';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html lang="pt-BR"><head><title>Base</title></head><body><div id="app"></div><div id="toasts"></div><div id="route-announcer"></div></body></html>', { url: 'http://localhost/' });
const w = dom.window;
for (const k of ['window','document','location','navigator']) Object.defineProperty(globalThis, k, { value: k==='window'? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });
const calls = { vibrate: 0, audio: 0 };
w.navigator.vibrate = () => { calls.vibrate++; return true; };
w.AudioContext = class { constructor() { calls.audio++; this.state = 'running'; this.currentTime = 0; this.destination = {}; }
  createOscillator() { return { frequency: {}, connect: (n) => n, start() {}, stop() {} }; }
  createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: (n) => n }; }
  close() {} resume() {} };

const base = new URL('../js/', import.meta.url).href;
const auth = await import(base + 'auth.js');
const db = await import(base + 'db.js');
const { createModal } = await import(base + 'components/modal.js');
const { renderHome } = await import(base + 'pages/home.js');
const { renderTasks } = await import(base + 'pages/tasks.js');
const { renderRoutine } = await import(base + 'pages/routine.js');
const { renderShop } = await import(base + 'pages/shop.js');
const { renderProfile } = await import(base + 'pages/profile.js');
const { renderLogin } = await import(base + 'pages/login.js');
const { startRouter, stopRouter } = await import(base + 'router.js');
const { createTaskTimer } = await import(base + 'components/task-timer.js');
const { notifyTimerDone } = await import(base + 'alerts.js');
const { getSetting, setSetting } = await import(base + 'settings.js');
const { toast } = await import(base + 'ui.js');
const wait = (ms=40) => new Promise(r => setTimeout(r, ms));
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const root = document.getElementById('app');
const ev = (t) => new w.Event(t, { bubbles: true });
const key = (k, extra = {}) => document.dispatchEvent(new w.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...extra }));

// ---------- Login acessível ----------
renderLogin(root);
ok(root.querySelector('label[for="email"]')?.textContent === 'Email' && root.querySelector('label[for="password"]')?.textContent.includes('Senha'), 'A11y: campos do login têm rótulo');
ok(root.querySelector('[data-tab="login"]').getAttribute('aria-selected') === 'true', 'A11y: aba Login selecionada');
root.querySelector('[data-tab="register"]').click();
ok(root.querySelector('[data-tab="register"]').getAttribute('aria-selected') === 'true' && root.querySelector('[data-tab="login"]').getAttribute('aria-selected') === 'false', 'A11y: aria-selected troca com a aba');
root.querySelector('#toggle-pw').click();
ok(root.querySelector('#toggle-pw').getAttribute('aria-pressed') === 'true', 'A11y: botão de senha com aria-pressed');
root.innerHTML = '';

await auth.register('Ana', 'ana@x.com', 'segredo1');
const uid = auth.state.user.id;
const mk = (o) => ({ id: crypto.randomUUID(), userId: uid, title: 't', energyCost: 5, durationMinutes: 30, deadline: null, category: 'work', completed: false, completedAt: null, startedAt: null, createdAt: Date.now(), ...o });

// ---------- Janela: foco, inert, Esc, Tab ----------
const opener = document.createElement('button'); opener.textContent = 'abrir'; root.appendChild(opener); opener.focus();
const m1 = createModal();
m1.panel.innerHTML = '<h2 class="modal-title">Janela 1</h2><button class="modal-close">x</button><input id="a"><button id="b">ok</button>';
m1.open();
ok(root.hasAttribute('inert'), 'Janela: fundo fica inert');
ok(m1.panel.getAttribute('aria-labelledby') && document.getElementById(m1.panel.getAttribute('aria-labelledby')).textContent === 'Janela 1', 'Janela: aria-labelledby aponta para o título');
ok(document.activeElement.id === 'a', 'Janela: foco inicial no 1º campo (não no "fechar")');
document.getElementById('b').focus(); key('Tab');
ok(document.activeElement.classList.contains('modal-close'), 'Janela: Tab no último volta ao primeiro (foco preso)');
key('Tab', { shiftKey: true });
ok(document.activeElement.id === 'b', 'Janela: Shift+Tab no primeiro vai ao último');
// janela de cima
const m2 = createModal(); m2.panel.innerHTML = '<h2>Janela 2</h2><button id="c">c</button>'; m2.open();
key('Escape');
ok(!m2.isOpen && m1.isOpen, 'Janela: Esc fecha só a de cima');
ok(root.hasAttribute('inert'), 'Janela: fundo continua inert com 1 aberta');
key('Escape');
ok(!m1.isOpen && !root.hasAttribute('inert'), 'Janela: fundo liberado ao fechar todas');
ok(document.activeElement === opener, 'Janela: foco volta ao botão que abriu');
opener.remove();

// ---------- Home: "Outra missão" ----------
await db.createTask(mk({ id: 'm1', title: 'Primeira', energyCost: 5, durationMinutes: 20, deadline: Date.now() + 1e6 }));
await db.createTask(mk({ id: 'm2', title: 'Segunda', energyCost: 4, durationMinutes: 20, deadline: Date.now() + 2e6 }));
await db.createTask(mk({ id: 'm3', title: 'Terceira', energyCost: 3, durationMinutes: 20, deadline: Date.now() + 3e6 }));
let cleanup = await renderHome(root);
ok(!root.querySelector('[data-action="next"]'), 'Home: sem missão, sem botão "Outra"');
root.querySelector('#generate').click(); await wait(80);
const title = () => root.querySelector('.mission-title')?.textContent;
ok(title() === 'Primeira' && root.textContent.includes('1 de 3'), 'Home: 1ª missão e contador "1 de 3"');
root.querySelector('[data-action="next"]').click();
ok(title() === 'Segunda' && root.textContent.includes('2 de 3'), 'Home: "Outra missão" -> 2ª');
ok(document.activeElement === root.querySelector('[data-action="next"]'), 'Home: foco permanece no botão');
root.querySelector('[data-action="next"]').click(); root.querySelector('[data-action="next"]').click();
ok(title() === 'Primeira' && root.textContent.includes('1 de 3'), 'Home: volta à 1ª depois da última');
root.querySelector('[data-action="start"]').click(); await wait(80);
ok(!root.querySelector('[data-action="next"]'), 'Home: depois de iniciar, não oferece outra missão');
document.querySelectorAll('.modal-overlay').forEach(n => n.remove());
cleanup(); root.innerHTML = '';
// uma só compatível -> sem botão
for (const id of ['m1','m2']) await db.deleteTask(id);
cleanup = await renderHome(root);
root.querySelector('#generate').click(); await wait(80);
ok(title() === 'Terceira' && !root.querySelector('[data-action="next"]'), 'Home: com 1 compatível não mostra "Outra missão"');
cleanup(); root.innerHTML = '';

// ---------- Tarefas: editar + desfazer ----------
await db.createTask(mk({ id: 'e1', title: 'Editar <b>eu</b>', energyCost: 6, durationMinutes: 90, category: 'study', deadline: new Date(2026, 11, 25).getTime(), createdAt: Date.now() + 10 }));
await db.createTask(mk({ id: 'e2', title: 'Já iniciada', startedAt: Date.now(), createdAt: Date.now() + 20 }));
cleanup = await renderTasks(root);
ok(root.querySelector('[data-action="edit"][data-id="e1"]') && !root.querySelector('[data-action="edit"][data-id="e2"]'), 'Tarefas: editar só em tarefa não iniciada');
ok(root.querySelector('[data-action="edit"][data-id="e1"]').getAttribute('aria-label').startsWith('Editar Editar'), 'A11y: botão de editar nomeado');
root.querySelector('[data-action="edit"][data-id="e1"]').click();
let dlg = document.querySelector('.modal-panel');
ok(dlg.querySelector('#t-heading').textContent === 'Editar Tarefa' && dlg.querySelector('#t-create').textContent === 'Salvar', 'Editar: título e botão "Salvar"');
ok(dlg.querySelector('#t-title').value === 'Editar <b>eu</b>' && dlg.querySelector('#t-hours').value === '1' && dlg.querySelector('#t-minutes').value === '30' && dlg.querySelector('#t-energy').value === '6' && dlg.querySelector('#t-deadline').value === '2026-12-25' && dlg.querySelector('#t-category').value === 'study', 'Editar: campos preenchidos (1h30, energia 6, prazo, categoria)');
ok(!dlg.querySelector('#t-create').disabled, 'Editar: botão Salvar habilitado');
dlg.querySelector('#t-title').value = 'Novo nome'; dlg.querySelector('#t-title').dispatchEvent(ev('input'));
dlg.querySelector('#t-hours').value = '2'; dlg.querySelector('#t-hours').dispatchEvent(ev('input'));
dlg.querySelector('#t-minutes').value = '15'; dlg.querySelector('#t-minutes').dispatchEvent(ev('input'));
dlg.querySelector('#t-category').value = 'health';
dlg.querySelector('#t-deadline').value = '';
dlg.querySelector('#t-create').click(); await wait(100);
let e1 = (await db.getUserTasks(uid)).find(t => t.id === 'e1');
ok(e1.title === 'Novo nome' && e1.durationMinutes === 135 && e1.category === 'health' && e1.deadline === null, 'Editar: salva mudanças');
ok(e1.userId === uid && e1.createdAt && e1.completed === false, 'Editar: mantém id, dono e demais campos');
ok((await db.getUserTasks(uid)).filter(t => t.id === 'e1').length === 1, 'Editar: não duplica');
ok(!document.querySelector('.modal-panel') && root.textContent.includes('Novo nome'), 'Editar: fecha e atualiza a lista');
// depois de editar, "nova tarefa" volta ao modo criar
root.querySelector('#fab').click(); dlg = document.querySelector('.modal-panel');
ok(dlg.querySelector('#t-heading').textContent === 'Nova Tarefa' && dlg.querySelector('#t-title').value === '' && dlg.querySelector('#t-create').textContent === 'Criar Tarefa', 'Editar: FAB volta ao modo "Nova Tarefa" limpo');
dlg.querySelector('[data-role="close"]').click();

// desfazer exclusão
root.querySelector('[data-action="delete"][data-id="e1"]').click(); await wait(80);
ok(!(await db.getUserTasks(uid)).some(t => t.id === 'e1'), 'Desfazer: tarefa excluída');
const undo = [...document.querySelectorAll('.toast .toast-action')].find(b => b.textContent === 'Desfazer');
ok(!!undo, 'Desfazer: aviso com botão');
undo.click(); await wait(80);
const back = (await db.getUserTasks(uid)).find(t => t.id === 'e1');
ok(back && back.title === 'Novo nome' && back.durationMinutes === 135, 'Desfazer: tarefa volta idêntica');
ok(root.textContent.includes('Novo nome'), 'Desfazer: lista atualizada');
cleanup(); root.innerHTML = '';

// ---------- Rotina e Loja: desfazer ----------
await db.createRoutineBlock({ id: 'rb1', userId: uid, dayOfWeek: 1, startTime: '08:00', endTime: '09:00', label: 'Aula' });
cleanup = await renderRoutine(root);
ok(root.querySelector('[data-day="1"]').getAttribute('aria-pressed') === 'true' && root.querySelector('[data-day="2"]').getAttribute('aria-pressed') === 'false', 'A11y: dias com aria-pressed');
root.querySelector('[data-action="delete"]').click(); await wait(80);
document.querySelectorAll('.toast .toast-action').forEach(b => b.textContent === 'Desfazer' && b.click()); await wait(80);
ok((await db.getUserRoutineBlocks(uid)).some(b => b.id === 'rb1'), 'Desfazer: bloco de rotina volta');
cleanup(); root.innerHTML = '';

await db.createReward({ id: 'rw1', userId: uid, title: 'Sorvete', cost: 100, createdAt: Date.now() });
cleanup = await renderShop(root);
ok(root.querySelector('[data-action="delete-reward"][data-id="rw1"]')?.getAttribute('aria-label') === 'Excluir recompensa Sorvete', 'Loja: botão excluir recompensa nomeado');
ok(root.querySelector('[data-tab="rewards"]').getAttribute('aria-selected') === 'true', 'A11y: aba da Loja com aria-selected');
root.querySelector('[data-tab="store"]').click();
ok(root.querySelector('[data-tab="store"]').getAttribute('aria-selected') === 'true' && root.querySelector('[data-tab="rewards"]').getAttribute('aria-selected') === 'false', 'A11y: aria-selected troca na Loja');
root.querySelector('[data-tab="rewards"]').click();
root.querySelector('[data-action="delete-reward"]').click(); await wait(80);
ok((await db.getUserRewards(uid)).length === 0, 'Loja: recompensa excluída sem resgatar');
ok((await db.getUserRedemptionHistory(uid)).length === 0, 'Loja: excluir não vai para o histórico');
[...document.querySelectorAll('.toast .toast-action')].find(b => b.textContent === 'Desfazer').click(); await wait(80);
ok((await db.getUserRewards(uid)).some(r => r.id === 'rw1'), 'Desfazer: recompensa volta');
cleanup(); root.innerHTML = '';

// ---------- Preferência + alerta ----------
ok(getSetting('alerts') === true, 'Config: som/vibração ligado por padrão');
cleanup = await renderProfile(root);
const sw = root.querySelector('#pref-alerts');
ok(sw && sw.checked && sw.getAttribute('role') === 'switch', 'Config: chave no Perfil, ligada, com role=switch');
sw.checked = false; sw.dispatchEvent(ev('change'));
ok(getSetting('alerts') === false && JSON.parse(localStorage.getItem('energy-planner-settings')).alerts === false, 'Config: desligar persiste');
notifyTimerDone();
ok(calls.vibrate === 0 && calls.audio === 0, 'Alerta: desligado não vibra nem toca');
sw.checked = true; sw.dispatchEvent(ev('change'));
notifyTimerDone();
ok(calls.vibrate === 1 && calls.audio === 1, 'Alerta: ligado vibra e toca');
ok(root.querySelector('svg[role="img"]').getAttribute('aria-label').startsWith('Tarefas concluídas nesta semana: Seg ') && !root.querySelector('svg[role="img"] [fill*="var("]'), 'A11y: gráfico com resumo em texto e sem var() em atributo');
cleanup(); root.innerHTML = '';

// ---------- Cronômetro: alerta e título ----------
document.title = 'Home · Energy Planner';
calls.vibrate = 0;
let fired = 0; const t0 = createTaskTimer({ userId: uid, taskTitle: 'Ler', durationMinutes: 10, startedAt: Date.now(), onComplete() {} });
t0.open();
ok(/^\d\d:\d\d · Ler$/.test(document.title) || /^\d\d:\d\d \(pausado\)/.test(document.title) === false, `Cronômetro: tempo no título (${document.title})`);
t0.close();
ok(document.title === 'Home · Energy Planner', 'Cronômetro: título restaurado ao fechar');
const t1 = createTaskTimer({ userId: uid, taskTitle: 'Acabou', durationMinutes: 1, startedAt: Date.now() - 5 * 60000, onComplete() {} });
t1.open(); await wait(30);
ok(calls.vibrate === 1 && document.title.startsWith('✅ Tempo esgotado'), 'Cronômetro: terminou -> vibra e muda título');
t1.destroy();
ok(document.title === 'Home · Energy Planner', 'Cronômetro: destroy restaura título');

// ---------- Roteador: título/anúncio ----------
const outlet = document.createElement('div'); document.body.appendChild(outlet);
const seen = [];
location.hash = '#/a'; await wait(50);
startRouter({ routes: { '/a': async (el) => { el.textContent = 'A'; }, '/b': async (el) => { el.textContent = 'B'; } }, fallback: '/a', outlet, onRendered: (p, first) => seen.push([p, first]) });
await wait(50);
location.hash = '#/b'; await wait(80);
ok(JSON.stringify(seen) === '[["/a",true],["/b",false]]', `Roteador: onRendered (${JSON.stringify(seen)})`);
stopRouter();

// ---------- toast ----------
document.querySelectorAll('.toast').forEach(t => t.remove());
toast('simples');
ok(document.querySelectorAll('.toast .toast-action').length === 0 && document.querySelector('.toast').textContent === 'simples', 'Toast: sem ação continua simples');
process.exit(process.exitCode || 0);
