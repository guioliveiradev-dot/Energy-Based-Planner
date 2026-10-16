// Regressão: pausado NÃO pode deixar o tempo correr (nem ao fechar/reabrir, nem ao trocar de tela).
import 'fake-indexeddb/auto';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><head><title>Base</title></head><body><div id="app"></div><div id="toasts"></div></body></html>', { url: 'http://localhost/' });
const w = dom.window;
for (const k of ['window', 'document', 'location', 'navigator']) Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });

// Relógio falso: permite "passar o tempo" sem esperar
const realNow = Date.now.bind(Date);
let skew = 0;
Date.now = () => realNow() + skew;
const pass = (seconds) => { skew += seconds * 1000; };

const base = new URL('../js/', import.meta.url).href;
const auth = await import(base + 'auth.js');
const db = await import(base + 'db.js');
const { createTaskTimer } = await import(base + 'components/task-timer.js');
const { renderTasks } = await import(base + 'pages/tasks.js');
const { renderHome } = await import(base + 'pages/home.js');
const { remainingSeconds, elapsedMs, pausedTask, resumedTask } = await import(base + 'task-time.js');
const wait = (ms = 40) => new Promise((r) => setTimeout(r, ms));
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const root = document.getElementById('app');
const shown = () => document.querySelector('.timer-panel [data-role="time"]').textContent;
const click = (sel) => document.querySelector(sel).click();

await auth.register('Ana', 'ana@x.com', 'segredo1');
const uid = auth.state.user.id;

// ---------- contas de tempo (funções puras) ----------
const t0 = { startedAt: 1_000_000, durationMinutes: 10, pausedAt: null, pauseOffset: 0 };
ok(Math.round(remainingSeconds(t0, 1_060_000)) === 540, 'Tempo: 60 s depois de iniciar restam 540 s');
const p = pausedTask(t0, 1_060_000);
ok(Math.round(remainingSeconds(p, 1_060_000)) === 540 && Math.round(remainingSeconds(p, 9_999_999)) === 540, 'Tempo: pausada, o restante NÃO muda com o relógio');
const r = resumedTask(p, 1_160_000);
ok(r.pausedAt === null && r.pauseOffset === 100_000, 'Tempo: ao continuar, soma os 100 s parados');
ok(Math.round(remainingSeconds(r, 1_160_000)) === 540 && Math.round(remainingSeconds(r, 1_220_000)) === 480, 'Tempo: depois de continuar volta a contar do ponto onde parou');
ok(elapsedMs({ durationMinutes: 5 }) === 0, 'Tempo: tarefa não iniciada = 0');

// ---------- o bug das capturas: pausar, deixar o tempo passar, fechar e reabrir ----------
let saved = null;
const timer = createTaskTimer({ userId: uid, taskTitle: 'Teste', durationMinutes: 60, startedAt: Date.now(), onUpdate: (t) => { saved = t; }, onComplete() {} });
timer.open();
pass(5);
click('.timer-panel [data-action="pause"]');
const frozen = shown();
ok(document.querySelector('.timer-panel [data-action="resume"]') && !document.querySelector('.timer-panel [data-role="paused"]').hidden, 'Bug: pausou (botão Continuar e aviso "Pausado")');
ok(saved && typeof saved.pausedAt === 'number', 'Bug: pausa foi comunicada para ser guardada (onUpdate)');
pass(30);
timer.close(); pass(30);
timer.open();                                    // reabre (era aqui que o tempo andava)
ok(shown() === frozen, `Bug: reabrir pausado mantém ${frozen} (mostrou ${shown()})`);
pass(600); await wait(1100);                       // passa muito tempo e deixa o relógio interno rodar
ok(shown() === frozen, `Bug: 10 min depois, pausado continua em ${frozen} (mostrou ${shown()})`);
ok(document.title.includes('(pausado)') && document.title.startsWith(frozen), 'Bug: título da aba também congelado');
click('.timer-panel [data-action="resume"]');
ok(!!document.querySelector('.timer-panel [data-action="pause"]') && document.querySelector('.timer-panel [data-role="paused"]').hidden, 'Continuar: voltou ao estado rodando (botão Pausar)');
pass(10); await wait(1100);
const after = shown();
const secs = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
ok(secs(frozen) - secs(after) >= 9 && secs(frozen) - secs(after) <= 13, `Continuar: só descontou ~10 s (de ${frozen} para ${after})`);
timer.destroy();

// ---------- a pausa sobrevive a sair da tela / recarregar (guardada na tarefa) ----------
skew = 0;
await db.createTask({ id: 'k1', userId: uid, title: 'Persistente', energyCost: 5, durationMinutes: 30, deadline: null, category: 'work', completed: false, completedAt: null, startedAt: Date.now(), createdAt: Date.now() });
let cleanup = await renderTasks(root);
ok(!!root.querySelector('[data-action="continue"][data-id="k1"]'), 'Persistência: tarefa em andamento mostra "Continuar"');
root.querySelector('[data-action="continue"][data-id="k1"]').click();
pass(120);
click('.timer-panel [data-action="pause"]');
await wait(80);
const stored = (await db.getUserTasks(uid)).find((t) => t.id === 'k1');
ok(typeof stored.pausedAt === 'number', 'Persistência: pausa gravada no banco');
const frozen2 = shown();
// fecha, sai da tela (destrói tudo), passa 1 hora e volta
document.querySelector('.timer-panel [data-role="close"]').click();
cleanup(); root.innerHTML = '';
pass(3600);
cleanup = await renderTasks(root);
ok(!!root.querySelector('[data-action="continue"][data-id="k1"]') && !root.querySelector('[data-action="collect"][data-id="k1"]'), 'Persistência: 1 h depois, tarefa pausada NÃO vira "Coletar" (antes virava)');
root.querySelector('[data-action="continue"][data-id="k1"]').click();
ok(shown() === frozen2 && !!document.querySelector('.timer-panel [data-action="resume"]'), `Persistência: reabre pausado em ${frozen2} (mostrou ${shown()})`);
click('.timer-panel [data-action="resume"]');
await wait(80);
const stored2 = (await db.getUserTasks(uid)).find((t) => t.id === 'k1');
ok(stored2.pausedAt === null && stored2.pauseOffset >= 3600 * 1000, 'Persistência: ao continuar, grava o tempo parado (≥ 1 h)');
// terminar de verdade: avança além do restante
pass(31 * 60); await wait(1100);
ok(!!document.querySelector('.timer-panel [data-action="collect"]'), 'Persistência: depois de continuar e passar o tempo, aparece "Coletar Pontos"');
click('.timer-panel [data-action="collect"]'); await wait(120);
ok((await db.getUserTasks(uid)).find((t) => t.id === 'k1').completed === true, 'Persistência: coletar conclui a tarefa');
document.querySelectorAll('.modal-overlay').forEach((n) => n.remove());
cleanup(); root.innerHTML = '';

// ---------- Home: mesma regra ----------
skew = 0;
await db.createTask({ id: 'k2', userId: uid, title: 'Da Home', energyCost: 3, durationMinutes: 20, deadline: null, category: 'personal', completed: false, completedAt: null, startedAt: null, createdAt: Date.now() });
cleanup = await renderHome(root);
root.querySelector('#generate').click(); await wait(80);
root.querySelector('[data-action="start"]').click(); await wait(80);
pass(60);
click('.timer-panel [data-action="pause"]'); await wait(80);
const f3 = shown();
click('.timer-panel [data-role="close"]');
pass(1800);
root.querySelector('[data-action="continue"]').click();
ok(shown() === f3 && !!document.querySelector('.timer-panel [data-action="resume"]'), `Home: reabrir pausado mantém ${f3} (mostrou ${shown()})`);
ok(typeof (await db.getUserTasks(uid)).find((t) => t.id === 'k2').pausedAt === 'number', 'Home: pausa gravada no banco');
document.querySelectorAll('.modal-overlay').forEach((n) => n.remove());
cleanup(); root.innerHTML = '';
process.exit(process.exitCode || 0);
