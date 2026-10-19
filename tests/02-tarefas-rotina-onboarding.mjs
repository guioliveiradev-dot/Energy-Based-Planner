import 'fake-indexeddb/auto';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><body><div id="app"></div><div id="toasts"></div></body>', { url: 'http://localhost/' });
const w = dom.window;
for (const k of ['window','document','location']) Object.defineProperty(globalThis, k, { value: k==='window'? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });
let frames = 0; globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);

const base = new URL('../js/', import.meta.url).href;
const auth = await import(base + 'auth.js');
const db = await import(base + 'db.js');
const { renderTasks } = await import(base + 'pages/tasks.js');
const { renderRoutine } = await import(base + 'pages/routine.js');
const { renderHome } = await import(base + 'pages/home.js');
const { showOnboarding } = await import(base + 'components/onboarding.js');
const wait = (ms=40) => new Promise(r => setTimeout(r, ms));
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const root = document.getElementById('app');
const ev = (t) => new w.Event(t, { bubbles: true });
const type = (el, v) => { el.value = v; el.dispatchEvent(ev('input')); };

await auth.register('Ana', 'ana@x.com', 'segredo1');
const uid = auth.state.user.id;

// ---------- Tarefas ----------
let cleanup = await renderTasks(root);
ok(root.textContent.includes('Nenhuma tarefa pendente'), 'Tarefas: estado vazio');
root.querySelector('#fab').click();
const dlg = document.querySelector('.modal-panel');
ok(!!dlg && dlg.querySelector('#t-create').disabled, 'Tarefas: abre diálogo, botão Criar desabilitado sem título');
type(dlg.querySelector('#t-title'), '  Estudar <i>React</i> ');
ok(!dlg.querySelector('#t-create').disabled, 'Tarefas: título habilita Criar');
type(dlg.querySelector('#t-energy'), '8');
ok(dlg.querySelector('#t-energy-label').textContent.endsWith('8'), 'Tarefas: slider atualiza rótulo');
type(dlg.querySelector('#t-hours'), '0'); type(dlg.querySelector('#t-minutes'), '0');
dlg.querySelector('#t-create').click(); await wait();
ok(document.querySelector('.toast.error')?.textContent.includes('Duração mínima'), 'Tarefas: duração 0 é recusada');
type(dlg.querySelector('#t-minutes'), '45');
dlg.querySelector('#t-deadline').value = '2026-12-25';
dlg.querySelector('#t-category').value = 'study';
dlg.querySelector('#t-create').click(); await wait(80);
let tasks = await db.getUserTasks(uid);
ok(tasks.length === 1 && tasks[0].title === 'Estudar <i>React</i>' && tasks[0].durationMinutes === 45 && tasks[0].energyCost === 8 && tasks[0].category === 'study', 'Tarefas: cria tarefa com os dados certos');
ok(new Date(tasks[0].deadline).getDate() === 25 && new Date(tasks[0].deadline).getMonth() === 11, 'Tarefas: prazo 25/12 salvo');
ok(!document.querySelector('.modal-panel'), 'Tarefas: diálogo fecha após criar');
ok(root.querySelector('.task-title')?.textContent === 'Estudar <i>React</i>' && !root.querySelector('.task-title i'), 'Tarefas: título escapado na lista');
ok(root.textContent.includes('📅 25/12') && root.textContent.includes('45min'), 'Tarefas: mostra prazo e duração');
ok(root.querySelector('.chips .chip') && root.textContent.includes('📚 Estudo'), 'Tarefas: filtro por categoria');

// segunda tarefa para testar filtro e exclusão
await db.createTask({ id: 'x2', userId: uid, title: 'Treinar', energyCost: 6, durationMinutes: 60, deadline: null, category: 'health', completed: false, completedAt: null, startedAt: null, createdAt: Date.now() + 5 });
cleanup(); root.innerHTML = ''; cleanup = await renderTasks(root);
root.querySelector('[data-filter="health"]').click();
ok(root.querySelectorAll('.task-title').length === 1 && root.querySelector('.task-title').textContent === 'Treinar', 'Tarefas: filtro Saúde mostra só 1');
root.querySelector('[data-filter="health"]').click();
ok(root.querySelectorAll('.task-title').length === 2, 'Tarefas: clicar de novo remove filtro');
root.querySelector('[data-action="delete"][data-id="x2"]').click(); await wait(80);
ok((await db.getUserTasks(uid)).length === 1, 'Tarefas: excluir funciona');

// iniciar -> cronômetro -> continuar
root.querySelector('[data-action="start"]').click(); await wait(80);
ok(!!document.querySelector('.timer-panel'), 'Tarefas: iniciar abre o cronômetro');
ok(!!root.querySelector('[data-action="continue"]'), 'Tarefas: botão vira "Continuar"');
document.querySelector('.timer-panel [data-role="close"]').click();
ok(!document.querySelector('.timer-panel'), 'Tarefas: fechar cronômetro');
root.querySelector('[data-action="continue"]').click();
ok(document.querySelector('.timer-panel [data-action="resume"]'), 'Tarefas: reabre pausado (estado preservado)');
document.querySelector('.timer-panel [data-role="close"]').click();

// tempo esgotado -> Coletar
const t = (await db.getUserTasks(uid))[0];
await db.updateTask({ ...t, startedAt: Date.now() - 46 * 60000 });
cleanup(); root.innerHTML = ''; cleanup = await renderTasks(root);
ok(!!root.querySelector('[data-action="collect"]'), 'Tarefas: tempo esgotado mostra Coletar');
root.querySelector('[data-action="collect"]').click(); await wait(120);
// 103 pontos-base + 10% da Fagulha (pet inicial, vínculo nível 1) = 113
ok(auth.state.user.xp === 103 + Math.round(103 * 0.08), `Tarefas: XP = 103 + bônus da Fagulha (veio ${auth.state.user.xp})`);
ok(document.querySelector('.congrats-panel')?.textContent.includes('+103 Pontos Planner') && document.querySelector('.congrats-panel')?.textContent.includes('Fagulha ajudou: +8 pontos'), 'Tarefas: modal de parabéns com o bônus da Fagulha');
document.querySelector('.congrats-panel [data-role="ok"]').click();
ok(root.textContent.includes('Concluídas (1)'), 'Tarefas: aparece em Concluídas');
cleanup(); root.innerHTML = '';

// ---------- Rotina ----------
cleanup = await renderRoutine(root);
ok(root.textContent.includes('Nenhum bloco para Seg'), 'Rotina: estado vazio (Seg)');
root.querySelector('#fab').click();
let d2 = document.querySelector('.modal-panel');
ok(d2.querySelector('#b-heading').textContent === 'Novo Bloco — Seg', 'Rotina: título do diálogo');
ok(d2.querySelector('#b-sh').value === '7' && d2.querySelector('#b-eh').value === '12', 'Rotina: padrões 07h–12h');
type(d2.querySelector('#b-label'), 'Escola');
d2.querySelector('#b-eh').value = '6';
d2.querySelector('#b-create').click(); await wait();
ok([...document.querySelectorAll('.toast.error')].some(t => t.textContent.includes('depois do inicial')), 'Rotina: fim antes do início é recusado');
d2.querySelector('#b-eh').value = '12';
d2.querySelector('#b-create').click(); await wait(80);
let blocks = await db.getUserRoutineBlocks(uid);
ok(blocks.length === 1 && blocks[0].startTime === '07:00' && blocks[0].endTime === '12:00' && blocks[0].dayOfWeek === 1, 'Rotina: bloco salvo (07:00–12:00, Seg)');
ok(root.textContent.includes('Escola') && root.textContent.includes('07:00 — 12:00'), 'Rotina: bloco na lista');
root.querySelector('[data-day="0"]').click();
ok(root.textContent.includes('Nenhum bloco para Dom'), 'Rotina: trocar para Dom');
root.querySelector('[data-day="1"]').click();
root.querySelector('[data-action="delete"]').click(); await wait(80);
ok((await db.getUserRoutineBlocks(uid)).length === 0, 'Rotina: excluir bloco');
cleanup(); root.innerHTML = '';

// Home respeita bloco de rotina
const now = new Date();
await db.createRoutineBlock({ id: 'rb', userId: uid, dayOfWeek: now.getDay(), startTime: '00:00', endTime: '23:59', label: 'Tudo', });
await db.createTask({ id: 'h1', userId: uid, title: 'Leve', energyCost: 2, durationMinutes: 10, deadline: null, category: 'personal', completed: false, completedAt: null, startedAt: null, createdAt: Date.now() });
cleanup = await renderHome(root);
root.querySelector('#generate').click(); await wait(80);
ok(root.textContent.includes('Horário Bloqueado'), 'Home: bloqueio pela rotina (integração Rotina→Home)');
root.querySelector('[data-action="bypass"]').click(); await wait(80);
ok(root.querySelector('.mission-title')?.textContent === 'Leve', 'Home: "Gerar mesmo assim" sugere a tarefa');
cleanup(); root.innerHTML = '';

// ---------- Onboarding ----------
let finished = false;
const onb = showOnboarding({ onComplete: () => { finished = true; } });
const o = () => document.querySelector('.onboarding');
ok(o().textContent.includes('Bem-vindo ao Energy Based Planner!') && !o().querySelector('[data-act="back"]'), 'Onboarding: passo 1, sem Voltar');
for (let i = 0; i < 5; i++) o().querySelector('[data-act="next"]').click();
ok(o().textContent.includes('Conquistas') && o().querySelector('[data-act="next"]').textContent.includes('Começar!'), 'Onboarding: passo 6 mostra "Começar!"');
o().querySelector('[data-act="back"]').click();
ok(o().textContent.includes('Loja'), 'Onboarding: Voltar');
o().querySelector('[data-act="finish"]').click();
ok(finished && !o(), 'Onboarding: pular conclui e fecha');
process.exit(process.exitCode || 0);
