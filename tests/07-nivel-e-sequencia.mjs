// Níveis de XP e sequência de dias.
import 'fake-indexeddb/auto';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><head><title>Base</title></head><body><div id="app"></div><div id="toasts"></div></body></html>', { url: 'http://localhost/' });
const w = dom.window;
for (const k of ['window', 'document', 'location', 'navigator']) Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });

const base = new URL('../js/', import.meta.url).href;
const auth = await import(base + 'auth.js');
const db = await import(base + 'db.js');
const P = await import(base + 'progress.js');
const { ACHIEVEMENTS, getUnlocked } = await import(base + 'achievements.js');
const { renderHome } = await import(base + 'pages/home.js');
const { renderTasks } = await import(base + 'pages/tasks.js');
const { renderProfile } = await import(base + 'pages/profile.js');
const wait = (ms = 40) => new Promise((r) => setTimeout(r, ms));
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const root = document.getElementById('app');
const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h).getTime();
const done = (ts, o = {}) => ({ id: crypto.randomUUID(), energyCost: 5, durationMinutes: 30, completed: true, completedAt: ts, ...o });

// ---------- pontos e níveis ----------
ok(P.pointsForTask({ energyCost: 8, durationMinutes: 45 }) === 103, 'Pontos: energia 8 + 45 min = 103');
ok([1, 2, 3, 4, 5, 6].map(P.levelThreshold).join() === '0,100,250,450,700,1000', 'Nível: marcos 0, 100, 250, 450, 700, 1000');
const l0 = P.levelInfo(0);
ok(l0.level === 1 && l0.into === 0 && l0.needed === 100 && l0.percent === 0 && l0.title === 'Novato', 'Nível: 0 pontos = nível 1, 0%');
ok(P.levelInfo(99).level === 1 && P.levelInfo(99).percent === 99, 'Nível: 99 pontos ainda é nível 1 (99%)');
ok(P.levelInfo(100).level === 2 && P.levelInfo(100).into === 0 && P.levelInfo(100).needed === 150, 'Nível: 100 pontos = nível 2 (pede 150)');
ok(P.levelInfo(249).level === 2 && P.levelInfo(250).level === 3, 'Nível: 249 é 2 e 250 é 3');
ok(P.levelInfo(250).toNext === 200 && P.levelInfo(300).toNext === 150, 'Nível: quanto falta para o próximo');
ok(P.levelInfo(-50).level === 1 && P.levelInfo(12.9).points === 12, 'Nível: valores estranhos são tratados');
ok(P.levelInfo(1_000_000).level > 100 && P.levelInfo(1_000_000).percent >= 0, 'Nível: números enormes funcionam');
ok(P.levelTitle(1) === 'Novato' && P.levelTitle(3) === 'Aprendiz' && P.levelTitle(5) === 'Focado' && P.levelTitle(8) === 'Veterano' && P.levelTitle(12) === 'Mestre' && P.levelTitle(40) === 'Lenda', 'Nível: títulos por faixa');
ok(P.totalPoints([done(1), { ...done(1), completed: false }]) === 65, 'Pontos: só conta tarefas concluídas');

// ---------- sequência ----------
const now = at(2026, 10, 14);
let s = P.streakInfo([done(at(2026, 10, 14)), done(at(2026, 10, 13)), done(at(2026, 10, 12))], now);
ok(s.current === 3 && s.doneToday && s.best === 3 && s.alive, 'Sequência: 3 dias seguidos incluindo hoje');
s = P.streakInfo([done(at(2026, 10, 13)), done(at(2026, 10, 12))], now);
ok(s.current === 2 && !s.doneToday && s.alive, 'Sequência: ainda viva se o último foi ontem (hoje ainda dá tempo)');
s = P.streakInfo([done(at(2026, 10, 12))], now);
ok(s.current === 0 && !s.alive && s.best === 1, 'Sequência: pulou um dia, volta a 0 (recorde 1)');
s = P.streakInfo([done(at(2026, 10, 1)), done(at(2026, 10, 2)), done(at(2026, 10, 3)), done(at(2026, 10, 10)), done(at(2026, 10, 11))], now);
ok(s.best === 3 && s.current === 0, 'Sequência: recorde guarda o maior período (3)');
s = P.streakInfo([done(at(2026, 10, 14, 8)), done(at(2026, 10, 14, 20)), done(at(2026, 10, 14, 23))], now);
ok(s.current === 1 && s.best === 1, 'Sequência: várias tarefas no mesmo dia contam 1');
s = P.streakInfo([done(at(2026, 9, 30)), done(at(2026, 10, 1))], at(2026, 10, 1));
ok(s.current === 2, 'Sequência: vira o mês sem quebrar (30/09 → 01/10)');
s = P.streakInfo([done(at(2026, 12, 31)), done(at(2027, 1, 1))], at(2027, 1, 1));
ok(s.current === 2, 'Sequência: vira o ano sem quebrar');
s = P.streakInfo([done(at(2026, 3, 7)), done(at(2026, 3, 8)), done(at(2026, 3, 9))], at(2026, 3, 9));
ok(s.current === 3, 'Sequência: não quebra em troca de horário');
s = P.streakInfo([{ ...done(at(2026, 10, 14)), completed: false }, { id: 'x', completed: true, completedAt: null }], now);
ok(s.current === 0 && s.best === 0, 'Sequência: ignora não concluídas e sem data');
ok(P.streakInfo([], now).best === 0, 'Sequência: sem tarefas = 0');
// 23:59 de um dia e 00:01 do outro são dias diferentes
s = P.streakInfo([done(at(2026, 10, 13, 23)), done(at(2026, 10, 14, 0))], at(2026, 10, 14, 0));
ok(s.current === 2, 'Sequência: 23h e 0h de dias seguidos contam 2');

// ---------- conquistas de sequência ----------
const t3 = [done(at(2026, 10, 14)), done(at(2026, 10, 13)), done(at(2026, 10, 12))];
const ids = (t) => getUnlocked(t, []).map((a) => a.id);
ok(ACHIEVEMENTS.some((a) => a.id === 'streak_3') && ids(t3).includes('streak_3') && !ids(t3).includes('streak_7'), 'Conquista: 3 dias seguidos libera "Em Chamas" (e não a de 7)');
const t7 = Array.from({ length: 7 }, (_, i) => done(at(2026, 9, 1 + i)));
ok(ids(t7).includes('streak_7') && !ids(t7).includes('streak_30'), 'Conquista: 7 dias seguidos (mesmo no passado) libera "Semana Perfeita"');
const t30 = Array.from({ length: 30 }, (_, i) => done(at(2026, 6, 1 + i)));
ok(ids(t30).includes('streak_30'), 'Conquista: 30 dias seguidos libera "Hábito de Aço"');
ok(!ids([done(at(2026, 10, 1)), done(at(2026, 10, 3)), done(at(2026, 10, 5))]).includes('streak_3'), 'Conquista: dias alternados NÃO contam como sequência');

// ---------- telas ----------
await auth.register('Ana', 'ana@x.com', 'segredo1');
const uid = auth.state.user.id;
const mk = (o) => ({ id: crypto.randomUUID(), userId: uid, title: 't', energyCost: 5, durationMinutes: 30, deadline: null, category: 'work', completed: false, completedAt: null, startedAt: null, createdAt: Date.now(), ...o });
const day = 86400000;

// histórico: concluiu há 3, 2 e 1 dia(s) -> 195 pontos (nível 2), sequência viva de 3 dias, ainda não fez hoje
for (const n of [1, 2, 3]) await db.createTask(mk({ id: 'h' + n, completed: true, completedAt: Date.now() - n * day }));   // 65 cada
await db.createTask(mk({ id: 'p1', title: 'Pendente', startedAt: Date.now() - 31 * 60000 }));                          // tempo já esgotado

let cleanup = await renderHome(root);
await wait(80);
let card = root.querySelector('.progress-card');
ok(!!card && card.textContent.includes('Nível 2 · Novato') && card.textContent.includes('95 / 150'), 'Home: cartão mostra nível 2 e 95/150 pontos (195 ganhos)');
ok(card.textContent.includes('3 dias seguidos') && card.textContent.includes('conclua uma tarefa hoje para manter'), 'Home: sequência de 3 dias, avisa para concluir hoje');
ok(card.querySelector('[role="progressbar"]').getAttribute('aria-valuenow') === '63' && card.querySelector('.progress-bar').style.width === '63%', 'Home: barra em 63% e acessível (aria-valuenow)');
root.querySelector('#generate').click(); await wait(80);
root.querySelector('[data-action="continue"]').click(); await wait(80);
document.querySelector('.timer-panel [data-action="collect"]').click(); await wait(250);
let modal = document.querySelector('.congrats-panel');
ok(modal && modal.textContent.includes('+65 Pontos Planner'), 'Home: modal mostra os pontos');
ok(modal.textContent.includes('Nível 3: Aprendiz!'), 'Home: 195 + 65 = 260 → modal avisa subida para o nível 3');
ok(modal.textContent.includes('🔥 4 dias seguidos'), 'Home: modal mostra sequência de 4 dias');
modal.querySelector('[data-role="ok"]').click();
card = root.querySelector('.progress-card');
ok(card.textContent.includes('Nível 3 · Aprendiz') && card.textContent.includes('10 / 200'), 'Home: cartão atualiza para nível 3 (10/200)');
ok(card.textContent.includes('4 dias seguidos') && !card.textContent.includes('conclua uma tarefa hoje'), 'Home: sequência 4 e não pede mais para concluir hoje');
cleanup(); root.innerHTML = '';

// Tarefas: concluir sem subir de nível, depois uma grande que sobe
await db.createTask(mk({ id: 't1', title: 'Pequena', energyCost: 3, durationMinutes: 20, startedAt: Date.now() - 25 * 60000, createdAt: Date.now() + 1 }));   // 40
await db.createTask(mk({ id: 't2', title: 'Grande', energyCost: 10, durationMinutes: 300, startedAt: Date.now() - 400 * 60000, createdAt: Date.now() + 2 })); // 250
cleanup = await renderTasks(root);
root.querySelector('[data-action="collect"][data-id="t1"]').click(); await wait(200);
modal = document.querySelector('.congrats-panel');
ok(modal.textContent.includes('+40 Pontos Planner') && !modal.querySelector('.congrats-levelup'), 'Tarefas: 260 + 40 = 300 continua no nível 3 (sem aviso de nível)');
ok(modal.textContent.includes('🔥 4 dias seguidos'), 'Tarefas: sequência continua 4 (já tinha feito hoje)');
modal.querySelector('[data-role="ok"]').click();
root.querySelector('[data-action="collect"][data-id="t2"]').click(); await wait(200);
modal = document.querySelector('.congrats-panel');
ok(modal.textContent.includes('+250 Pontos Planner') && modal.textContent.includes('Nível 4: Aprendiz!'), 'Tarefas: 300 + 250 = 550 → sobe para o nível 4');
modal.querySelector('[data-role="ok"]').click();
cleanup(); root.innerHTML = '';

// Perfil
cleanup = await renderProfile(root);
card = root.querySelector('.progress-card');
ok(card && card.textContent.includes('Nível 4 · Aprendiz') && card.textContent.includes('100 / 250') && card.textContent.includes('4 dias seguidos'), 'Perfil: cartão de nível 4 (100/250) e sequência de 4 dias');
ok(root.textContent.includes('550'), 'Perfil: "Pts Ganhos" = 550');
cleanup(); root.innerHTML = '';

// gastar pontos não derruba o nível
await db.updateUserXP(uid, -9999); await auth.refreshUser();
cleanup = await renderProfile(root);
ok(root.querySelector('.progress-card').textContent.includes('Nível 4'), 'Nível: gastar todos os pontos na Loja não faz o nível cair');
cleanup(); root.innerHTML = '';

// conquistas de sequência pelo estado real
const tasksNow = await db.getUserTasks(uid);
ok(getUnlocked(tasksNow, []).some((a) => a.id === 'streak_3') && !getUnlocked(tasksNow, []).some((a) => a.id === 'streak_7'), 'Conquista: 4 dias seguidos reais liberam "Em Chamas" e ainda não a de 7');
process.exit(process.exitCode || 0);
