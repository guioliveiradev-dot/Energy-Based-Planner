// Home mais leve (faixa de situação, 2 passos, atalhos de tempo) e menu com a nova página Metas.
import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><head><title>Base</title></head><body><div id="app"></div><div id="toasts"></div></body></html>', { url: 'http://localhost/' });
const w = dom.window;
for (const k of ['window', 'document', 'location', 'navigator']) Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });

const base = new URL('../js/', import.meta.url).href;
const auth = await import(base + 'auth.js');
const db = await import(base + 'db.js');
const T = await import(base + 'themes.js');
const { renderHome } = await import(base + 'pages/home.js');
const wait = (ms = 60) => new Promise((r) => setTimeout(r, ms));
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };

// ---------- menu ----------
const app = readFileSync(new URL('app.js', base), 'utf8');
const navPaths = [...app.match(/const NAV = \[([\s\S]*?)\];/)[1].matchAll(/path: '([^']+)'/g)].map((m) => m[1]);
const routePaths = [...app.match(/const ROUTES = \{([\s\S]*?)\};/)[1].matchAll(/'([^']+)':/g)].map((m) => m[1]);
ok(navPaths.join() === '/,/tasks,/routine,/goals,/shop,/profile', 'Menu: Home, Tarefas, Rotina, Metas, Loja, Perfil (Metas entre Rotina e Loja)');
ok(navPaths.every((p) => routePaths.includes(p)), 'Menu: todo item do menu tem uma página');
const nav = [...app.matchAll(/label: '([^']+)'/g)].map((m) => m[1]);
ok(nav.includes('Metas') && nav.every((l) => l.length <= 7), 'Menu: rótulos curtos (até 7 letras) para caber 6 itens em telas pequenas');

// ---------- Home ----------
await auth.register('Ana', 'ana@x.com', 'segredo1');
const uid = auth.state.user.id;
T.setActivePetStorage(uid, null);
const mk = (id, o = {}) => ({ id, userId: uid, title: id, energyCost: 5, durationMinutes: 30, deadline: null, category: 'work', completed: false, completedAt: null, startedAt: null, pausedAt: null, pauseOffset: 0, createdAt: Date.now(), ...o });
await db.createTask(mk('Tarefa de 30 min'));
await db.createTask(mk('Tarefa de 90 min', { durationMinutes: 90 }));
const root = document.getElementById('app');
const cleanup = await renderHome(root); await wait(150);

const order = ['#chips-slot', '#step-energy', '#step-time', '#generate', '#result', '#goal-slot', '#pet-slot'].map((s) => root.querySelector(s));
const pos = (a, b) => !!(a.compareDocumentPosition(b) & 4);   // b vem depois de a
ok(order.every(Boolean) && order.every((el, i) => i === 0 || pos(order[i - 1], el)), 'Home: ordem faixa, passo 1, passo 2, botão, resultado, meta e pet');
ok(!root.querySelector('.points-card') && !root.querySelector('.progress-card') && !root.querySelector('.streak-card'), 'Home: sem os cartões grandes de pontos, nível e sequência');
ok(/1/.test(root.querySelector('#step-energy .step-n').textContent) && /2/.test(root.querySelector('#step-time .step-n').textContent) && /Sua energia agora/.test(root.querySelector('#step-energy').textContent) && /Quanto tempo você tem\?/.test(root.querySelector('#step-time').textContent), 'Home: dois passos numerados (energia e tempo)');
ok(!!root.querySelector('#xp') && root.querySelector('#xp').textContent === (auth.state.user.xp || 0).toLocaleString('pt-BR'), 'Home: os pontos aparecem na faixa (id xp) e acompanham o saldo');

// atalhos de tempo
const chip = (k) => root.querySelector(`[data-time="${k}"]`);
const fields = root.querySelector('#time-fields');
ok(root.querySelectorAll('.quick [data-time]').length === 5 && ['15 min', '30 min', '1 h', '2 h', 'Outro'].join() === [...root.querySelectorAll('.quick [data-time]')].map((b) => b.textContent.trim()).join(), 'Tempo: atalhos 15 min, 30 min, 1 h, 2 h e Outro');
ok(chip(2).getAttribute('aria-pressed') === 'true' && root.querySelector('#hours').value === '1' && root.querySelector('#minutes').value === '0' && fields.hidden, 'Tempo: começa em 1 h, com os campos de horas e minutos escondidos');
ok(root.querySelector('.quick').getAttribute('role') === 'group' && !!root.querySelector('.quick').getAttribute('aria-label') && [...root.querySelectorAll('#time-fields label')].every((l) => document.getElementById(l.getAttribute('for'))), 'Acessibilidade: o grupo de atalhos tem nome e os campos têm rótulo');
chip(1).click();
ok(chip(1).getAttribute('aria-pressed') === 'true' && chip(2).getAttribute('aria-pressed') === 'false' && root.querySelector('#hours').value === '0' && root.querySelector('#minutes').value === '30', 'Tempo: "30 min" marca só ele e preenche 0 h 30 min');
root.querySelector('#generate').click(); await wait(150);
ok(/Tarefa de 30 min/.test(root.querySelector('#result').textContent) && !/Tarefa de 90 min/.test(root.querySelector('#result').textContent), 'Tempo: com 30 min a missão é a tarefa de 30 min');
chip(0).click();
root.querySelector('#generate').click(); await wait(150);
ok(!/Tarefa de 30 min/.test(root.querySelector('#result').textContent), 'Tempo: com 15 min a tarefa de 30 min não é sugerida');
chip('other').click();
ok(!fields.hidden && chip('other').getAttribute('aria-pressed') === 'true' && chip(0).getAttribute('aria-pressed') === 'false' && document.activeElement === root.querySelector('#hours'), 'Tempo: "Outro" mostra horas e minutos e leva o foco para as horas');
root.querySelector('#hours').value = '2'; root.querySelector('#hours').dispatchEvent(new w.Event('input'));
root.querySelector('#generate').click(); await wait(150);
ok(/Tarefa de (30|90) min/.test(root.querySelector('#result').textContent), 'Tempo: em "Outro", 2 h digitadas funcionam como antes');
chip(3).click();
ok(fields.hidden && root.querySelector('#hours').value === '2' && root.querySelector('#minutes').value === '0' && !root.querySelector('#generate').disabled, 'Tempo: "2 h" esconde os campos de novo');
cleanup?.();
