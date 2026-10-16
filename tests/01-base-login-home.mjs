import 'fake-indexeddb/auto';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><body><div id="app"></div><div id="toasts"></div></body>', { url: 'http://localhost/' });
const w = dom.window;
for (const k of ['window','document','location']) Object.defineProperty(globalThis, k, { value: k==='window'? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });

const base = new URL('../js/', import.meta.url).href;
const auth = await import(base + 'auth.js');
const db = await import(base + 'db.js');
const { renderLogin } = await import(base + 'pages/login.js');
const { renderHome } = await import(base + 'pages/home.js');
const themes = await import(base + 'themes.js');

const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };

// login UI
const root = document.getElementById('app');
renderLogin(root);
ok(!!root.querySelector('#auth-form'), 'tela de login renderiza');
root.querySelector('[data-tab="register"]').click();
ok(root.querySelector('#name-wrap').dataset.open === 'true' && !root.querySelector('#name-wrap').hasAttribute('inert'), 'aba Cadastro mostra campo de nome');
root.querySelector('#email').value = 'a@b.com';
root.querySelector('#password').value = '123';
root.querySelector('#auth-form').dispatchEvent(new w.Event('submit', { cancelable: true }));
await new Promise(r => setTimeout(r, 20));
ok(root.querySelector('#auth-error').textContent.includes('nome'), 'valida nome vazio');

// registro / login / sessão
let r = await auth.register('Ana', 'ana@x.com', 'segredo1');
ok(r.success && auth.state.user.name === 'Ana', 'registro funciona');
r = await auth.register('Outra', 'ana@x.com', 'segredo1');
ok(!r.success && r.error.includes('cadastrado'), 'email duplicado é recusado');
await auth.logout();
r = await auth.login('ana@x.com', 'errada1');
ok(!r.success, 'senha errada recusada');
r = await auth.login('ana@x.com', 'segredo1');
ok(r.success, 'login correto');
const uid = auth.state.user.id;

// tarefas + Home
await db.createTask({ id: 't1', userId: uid, title: 'Estudar <b>JS</b>', energyCost: 4, durationMinutes: 30, deadline: null, category: 'study', completed: false, completedAt: null, startedAt: null, createdAt: Date.now() });
await db.createTask({ id: 't2', userId: uid, title: 'Tarefa pesada', energyCost: 9, durationMinutes: 30, deadline: null, category: 'work', completed: false, completedAt: null, startedAt: null, createdAt: Date.now() });
root.innerHTML = '';
const cleanup = await renderHome(root);
root.querySelector('#generate').click();
await new Promise(r => setTimeout(r, 50));
ok(root.querySelector('.mission-title')?.textContent === 'Estudar <b>JS</b>', 'missão compatível aparece (e HTML é escapado)');
ok(!root.querySelector('.mission-title b'), 'título do usuário não vira HTML');

// slider de energia baixa -> nenhuma tarefa
const slider = root.querySelector('.energy-slider');
slider.value = '2'; slider.dispatchEvent(new w.Event('input'));
root.querySelector('#generate').click();
await new Promise(r => setTimeout(r, 50));
ok(root.textContent.includes('Nenhuma tarefa compatível'), 'energia 2 -> nenhuma tarefa');
slider.value = '5'; slider.dispatchEvent(new w.Event('input'));
root.querySelector('#generate').click();
await new Promise(r => setTimeout(r, 50));

// iniciar missão -> cronômetro
themes.addToInventory(uid, 'cat'); themes.setActivePetStorage(uid, 'cat');
root.querySelector('[data-action="start"]').click();
await new Promise(r => setTimeout(r, 50));
const modal = document.querySelector('.timer-panel');
ok(!!modal, 'cronômetro abre');
ok(modal.querySelector('[data-role="time"]').textContent === '30:00' || modal.querySelector('[data-role="time"]').textContent === '29:59', 'tempo inicial ~30:00');
ok(!!modal.querySelector('.pet-face'), 'pet ativo aparece');
modal.querySelector('[data-action="pause"]').click();
ok(modal.querySelector('[data-action="resume"]'), 'pausar troca o botão para Continuar');
ok(!modal.querySelector('[data-role="paused"]').hidden, 'mostra "Pausado"');
modal.querySelector('[data-action="resume"]').click();
ok(modal.querySelector('[data-action="pause"]'), 'continuar volta ao estado rodando');
ok((await db.getUserTasks(uid)).find(t => t.id === 't1').startedAt > 0, 'startedAt salvo no banco');

// concluir: força startedAt antigo
const t1 = (await db.getUserTasks(uid)).find(t => t.id === 't1');
await db.updateTask({ ...t1, startedAt: Date.now() - 31 * 60 * 1000 });
cleanup();
document.body.querySelectorAll('.modal-overlay').forEach(n => n.remove());
root.innerHTML = '';
const cleanup2 = await renderHome(root);
root.querySelector('#generate').click();
await new Promise(r => setTimeout(r, 50));
root.querySelector('[data-action="continue"]').click();
await new Promise(r => setTimeout(r, 50));
const m2 = document.querySelector('.timer-panel');
ok(m2.querySelector('[data-action="collect"]'), 'tempo esgotado mostra "Coletar Pontos"');
m2.querySelector('[data-action="collect"]').click();
await new Promise(r => setTimeout(r, 100));
ok(auth.state.user.xp === Math.round(4 * 10 + 30 * 0.5), `XP = 55 (veio ${auth.state.user.xp})`);
ok(!!document.querySelector('.modal-panel'), 'modal de parabéns aparece');
ok((await db.getUserTasks(uid)).find(t => t.id === 't1').completed, 'tarefa marcada como concluída');
cleanup2();
const exp = await db.exportAllData(uid);
ok(exp.tasks.length === 2 && exp.user.xp === 55, 'exportAllData ok');
process.exit(process.exitCode || 0);
