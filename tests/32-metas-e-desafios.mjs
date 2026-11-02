// Metas e desafios da semana: semana (segunda a domingo), sorteio fixo, progresso, recompensa única, estado, backup e telas.
import 'fake-indexeddb/auto';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><head><title>Base</title></head><body><div id="app"></div><div id="toasts"></div></body></html>', { url: 'http://localhost/' });
const w = dom.window;
for (const k of ['window', 'document', 'location', 'navigator']) Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });

const base = new URL('../js/', import.meta.url).href;
const auth = await import(base + 'auth.js');
const db = await import(base + 'db.js');
const G = await import(base + 'goals.js');
const T = await import(base + 'themes.js');
const { buildBackup } = await import(base + 'backup.js');
const { parseImport } = await import(base + 'data-import.js');
const { renderHome } = await import(base + 'pages/home.js');
const { renderTasks } = await import(base + 'pages/tasks.js');
const { renderProfile } = await import(base + 'pages/profile.js');
const wait = (ms = 60) => new Promise((r) => setTimeout(r, ms));
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h).getTime();
const done = (ts, o = {}) => ({ id: crypto.randomUUID(), energyCost: 5, durationMinutes: 30, category: 'work', completed: true, completedAt: ts, ...o });
const NOW = at(2026, 10, 17, 15);      // sábado; a semana começou na segunda 12/10

// ---------- a semana ----------
ok(G.weekKey(NOW) === '2026-10-12' && G.weekKey(at(2026, 10, 12, 0)) === '2026-10-12' && G.weekKey(at(2026, 10, 18, 23)) === '2026-10-12', 'Semana: de segunda 12/10 a domingo 18/10 é a mesma semana');
ok(G.weekKey(at(2026, 10, 19, 0)) === '2026-10-19' && G.weekKey(at(2026, 10, 11, 23)) === '2026-10-05', 'Semana: segunda-feira começa a semana nova; domingo ainda é da anterior');
ok(G.GOAL_TARGETS.join() === '3,5,7,10,15' && G.GOAL_BONUS === 50, 'Metas: 3, 5, 7, 10 ou 15 tarefas; bônus de 50 pontos');

// ---------- sorteio dos desafios ----------
const ids = G.challengeIds('ana', NOW);
ok(ids.length === 3 && new Set(ids).size === 3, 'Desafios: 3 por semana, todos diferentes');
ok(JSON.stringify(ids) === JSON.stringify(G.challengeIds('ana', at(2026, 10, 14))) && JSON.stringify(ids) === JSON.stringify(G.challengeIds('ana', at(2026, 10, 18, 23))), 'Desafios: os mesmos a semana toda');
const semanas = new Set([0, 1, 2, 3, 4, 5].map((i) => G.challengeIds('ana', at(2026, 10, 12 + 7 * i)).join()));
const pessoas = new Set(['a', 'b', 'c', 'd', 'e', 'f'].map((u) => G.challengeIds(u, NOW).join()));
ok(semanas.size > 1 && pessoas.size > 1, 'Desafios: mudam de semana para semana e de pessoa para pessoa');

// ---------- progresso ----------
const empty = { target: null, claimed: {} };
const semana = [done(at(2026, 10, 12, 9)), done(at(2026, 10, 13, 10)), done(at(2026, 10, 15, 20)), done(at(2026, 10, 17, 8))];
const fora = [done(at(2026, 10, 11, 12)), done(at(2026, 10, 19, 1)), { ...done(at(2026, 10, 16, 12)), completed: false, completedAt: null }];
let p = G.weekProgress({ tasks: [...semana, ...fora], state: { ...empty, target: 3 }, userId: 'ana', now: NOW });
ok(p.goal.done === 4 && p.goal.reached && p.goal.extra === 1 && p.goal.target === 3 && !p.goal.claimed, 'Meta 3: 4 tarefas na semana (a de domingo passado, a de segunda que vem e a pendente não contam)');
p = G.weekProgress({ tasks: semana, state: { ...empty, target: 7 }, userId: 'ana', now: NOW });
ok(!p.goal.reached && p.goal.done === 4 && p.goal.extra === 0, 'Meta 7: ainda não bateu (sem nenhuma cobrança)');
p = G.weekProgress({ tasks: semana, state: empty, userId: 'ana', now: NOW });
ok(p.goal.target === null && !p.goal.reached && p.challenges.length === 3, 'Sem meta definida: nada é cobrado e os desafios continuam');

// cada desafio mede o que diz: procura uma pessoa que tenha sorteado aquele desafio
const withChallenge = (id) => { for (let i = 0; i < 400; i++) { const u = 'u' + i; if (G.challengeIds(u, NOW).includes(id)) return u; } return null; };
const measure = (id, tasks) => { const u = withChallenge(id); const c = G.weekProgress({ tasks, state: empty, userId: u, now: NOW }).challenges.find((x) => x.id === id); return c; };
const D = (day, h, o = {}) => done(at(2026, 10, day, h), o);
let c = measure('focus', [D(12, 9, { durationMinutes: 60 }), D(13, 9, { durationMinutes: 45 })]);
ok(c && !c.done && c.v === 105 && c.n === 120 && c.unit === 'min' && c.bonus === 40, 'Desafio "2 horas focado": soma os minutos (105 de 120)');
c = measure('focus', [D(12, 9, { durationMinutes: 60 }), D(13, 9, { durationMinutes: 60 })]);
ok(c.done && c.v === 120, 'Desafio "2 horas focado": 120 minutos concluem');
c = measure('days3', [D(12, 9), D(12, 10), D(13, 9), D(15, 9)]);
ok(c.done && c.v === 3 && c.bonus === 30, 'Desafio "3 dias diferentes": conta dias, não tarefas');
c = measure('busy', [D(12, 9), D(12, 10), D(13, 9)]);
ok(!c.done && c.v === 2, 'Desafio "3 no mesmo dia": o melhor dia tem 2');
c = measure('busy', [D(12, 9), D(12, 10), D(12, 11)]);
ok(c.done, 'Desafio "3 no mesmo dia": 3 no mesmo dia concluem');
c = measure('high', [D(12, 9, { energyCost: 8 }), D(13, 9, { energyCost: 9 }), D(14, 9, { energyCost: 7 })]);
ok(c.done && c.v === 2, 'Desafio "energia 8 ou mais": 7 não conta');
c = measure('gentle', [D(12, 9, { energyCost: 3 }), D(13, 9, { energyCost: 4 })]);
ok(!c.done && c.v === 1, 'Desafio "tarefas leves": energia até 3');
c = measure('early', [D(12, 10), D(13, 9)]);
ok(c.done, 'Desafio "antes das 10h": 9h conta, 10h não');
c = measure('late', [D(12, 17), D(13, 18)]);
ok(c.done, 'Desafio "depois das 18h": 18h conta, 17h não');
c = measure('weekend', [D(12, 9), D(17, 9)]);
ok(c.done, 'Desafio "fim de semana": sábado conta');
c = measure('mix', [D(12, 9, { category: 'work' }), D(13, 9, { category: 'study' })]);
ok(c.done && c.v === 2, 'Desafio "2 categorias": conta categorias diferentes');
const catUser = (() => { for (let i = 0; i < 400; i++) { const u = 'c' + i; const id = G.challengeIds(u, NOW).find((x) => x.startsWith('cat:')); if (id) return { u, id }; } return null; })();
const catId = catUser.id.slice(4);
c = G.weekProgress({ tasks: [D(12, 9, { category: catId }), D(13, 9, { category: catId }), D(14, 9, { category: catId })], state: empty, userId: catUser.u, now: NOW }).challenges.find((x) => x.id === catUser.id);
ok(c.done && c.v === 3 && /^Conclua 3 tarefas de /.test(c.title) && !!c.icon, 'Desafio de categoria: 3 tarefas daquela categoria, com o nome dela no título');

// ---------- estado guardado ----------
ok(JSON.stringify(G.cleanGoalState(null)) === JSON.stringify({ target: null, claimed: {} }) && G.cleanGoalState({ target: 6 }).target === null && G.cleanGoalState({ target: 10 }).target === 10, 'Estado: só aceita as metas permitidas');
const sujo = G.cleanGoalState({ target: 5, claimed: { 'lixo': { goal: true }, '2026-10-12': { goal: true, ch: ['focus', 'nao-existe', 'focus', 'cat:work', 'cat:xx'] } } });
ok(Object.keys(sujo.claimed).join() === '2026-10-12' && sujo.claimed['2026-10-12'].ch.join() === 'cat:work,focus', 'Estado: ignora semana e desafio inválidos, sem repetir');
const muitas = {}; for (let i = 0; i < 20; i++) muitas[G.weekKey(at(2026, 1, 5 + 7 * i))] = { goal: true, ch: [] };
ok(Object.keys(G.cleanGoalState({ claimed: muitas }).claimed).length === 12, 'Estado: guarda só as últimas 12 semanas');
const m = G.mergeGoalState({ target: 5, claimed: { '2026-10-12': { goal: true, ch: ['focus'] } } }, { target: 10, claimed: { '2026-10-12': { goal: false, ch: ['busy'] }, '2026-10-05': { goal: true, ch: [] } } });
ok(m.target === 5 && m.claimed['2026-10-12'].goal && m.claimed['2026-10-12'].ch.join() === 'busy,focus' && m.claimed['2026-10-05'].goal, 'Importar: une o que já foi recebido (nunca perde) e mantém a meta que a conta já tinha');
ok(G.mergeGoalState({ target: null }, { target: 7 }).target === 7, 'Importar: sem meta na conta, usa a do backup');

// ---------- receber as recompensas (banco) ----------
await auth.register('Ana', 'ana@x.com', 'segredo1');
const uid = auth.state.user.id;
await G.setGoalTarget(uid, 3);
const mine = G.challengeIds(uid, NOW);
const tasksMeta = [done(at(2026, 10, 12, 12)), done(at(2026, 10, 13, 12)), done(at(2026, 10, 14, 12))];
let r = await G.claimWeekRewards({ userId: uid, tasks: tasksMeta, now: NOW });
ok(r.items.some((i) => i.kind === 'goal' && i.bonus === 50) && r.total >= 50 && r.total === r.items.reduce((a, i) => a + i.bonus, 0), 'Receber: meta batida paga +50 (mais o que algum desafio tenha pago)');
r = await G.claimWeekRewards({ userId: uid, tasks: tasksMeta, now: NOW });
ok(r.items.length === 0 && r.total === 0, 'Receber: cada recompensa sai uma vez só por semana');
r = await G.claimWeekRewards({ userId: uid, tasks: [...tasksMeta, done(at(2026, 10, 14, 13))], now: at(2026, 10, 19, 12) });
ok(!r.items.some((i) => i.kind === 'goal'), 'Receber: na semana nova a meta recomeça do zero (as tarefas da semana passada não contam)');
const uid2 = 'outra-pessoa';
r = await G.claimWeekRewards({ userId: uid2, tasks: tasksMeta, now: NOW });
ok(!r.items.some((i) => i.kind === 'goal'), 'Receber: a meta é de cada pessoa (outra conta sem meta não recebe)');
await G.setGoalTarget(uid, 99);
ok((await G.getGoalState(uid)).target === null, 'Meta: valor fora da lista tira a meta');
await G.setGoalTarget(uid, 5);
ok((await G.getGoalState(uid)).target === 5 && Object.keys((await G.getGoalState(uid)).claimed).length >= 1, 'Meta: escolher 5 fica guardado, junto do que já foi recebido');

// ---------- backup, importação e reset ----------
const backup = await buildBackup(uid);
ok(!!backup.goalState && backup.goalState.target === 5 && Object.keys(backup.goalState.claimed).length >= 1, 'Backup: leva a meta e o que já foi recebido');
const parsed = parseImport(JSON.stringify(backup));
ok(parsed.goalState.target === 5, 'Importar: o arquivo traz a meta da semana de volta');
ok(parseImport(JSON.stringify({ ...backup, goalState: { target: 'x', claimed: 'y' } })).goalState.target === null, 'Importar: meta inválida no arquivo é ignorada');
await db.resetUserData(uid);
ok((await G.getGoalState(uid)).target === null, 'Reset da conta: apaga a meta e as recompensas recebidas');

// ---------- telas ----------
const root = document.getElementById('app');
const silencia = async () => { const k = G.weekKey(); const u = auth.state.user.id; const s = await G.getGoalState(u); await G.saveGoalState(u, { ...s, claimed: { ...s.claimed, [k]: { goal: s.claimed[k]?.goal || false, ch: G.challengeIds(u) } } }); };
await silencia();
T.setActivePetStorage(uid, null);
let cleanup = await renderHome(root); await wait(120);
let slot = root.querySelector('#goal-slot');
ok(slot && /Meta da semana/.test(slot.textContent) && slot.querySelectorAll('[data-goal-pick]').length === 5 && /Definir minha meta/.test(slot.textContent), 'Home: sem meta, mostra um convite com as 5 opções (sem cobrança)');
slot.querySelector('[data-goal-pick="3"]').click(); await wait();
ok(root.querySelector('[data-goal-pick="3"]').getAttribute('aria-pressed') === 'true', 'Home: escolher um número marca a opção');
root.querySelector('[data-goal-save]').click(); await wait(120);
slot = root.querySelector('#goal-slot');
ok((await G.getGoalState(uid)).target === 3 && /0\/3/.test(slot.textContent) && /Mais 3 tarefas para ganhar \+50 pontos/.test(slot.textContent) && !!slot.querySelector('.ring[role="img"]'), 'Home: meta 3 salva; mostra o anel 0/3 e quanto falta para o bônus');
ok(!!slot.querySelector('[data-goal-edit]') && !!slot.querySelector('[data-goal-link]'), 'Home: tem "Mudar" e "Ver desafios"');
root.querySelector('[data-goal-edit]').click(); await wait();
ok(!!root.querySelector('[data-goal-clear]') && !!root.querySelector('[data-goal-cancel]') && root.querySelector('[data-goal-pick="3"]').classList.contains('active'), 'Home: "Mudar" abre as opções com a meta atual marcada, "Cancelar" e "Tirar a meta"');
root.querySelector('[data-goal-cancel]').click(); await wait();
root.querySelector('[data-goal-link]').click(); await wait();
ok(location.hash === '#/profile' && G.takeRequestedProfileTab() === 'goals' && G.takeRequestedProfileTab() === null, 'Home: "Ver desafios" leva ao Perfil, aba Metas (o pedido vale uma vez)');
cleanup?.(); root.innerHTML = '';

// concluir uma tarefa que bate a meta: parabéns mostra o bônus e o saldo sobe
for (let i = 0; i < 2; i++) await db.createTask({ id: 'm' + i, userId: uid, title: 'Feita ' + i, energyCost: 5, durationMinutes: 30, deadline: null, category: 'work', completed: true, completedAt: Date.now(), startedAt: null, pausedAt: null, pauseOffset: 0, createdAt: Date.now() });
await db.createTask({ id: 'm9', userId: uid, title: 'Última', energyCost: 5, durationMinutes: 30, deadline: null, category: 'work', completed: false, completedAt: null, startedAt: Date.now() - 40 * 60000, pausedAt: null, pauseOffset: 0, createdAt: Date.now() });
const xp0 = auth.state.user.xp;
cleanup = await renderTasks(root);
root.querySelector('[data-action="collect"]').click(); await wait(300);
const modal = document.querySelector('.congrats-panel')?.textContent || '';
ok(auth.state.user.xp - xp0 === 65 + 50 && /Meta da semana batida: \+50 pontos/.test(modal), 'Concluir a 3ª tarefa da semana: +65 da tarefa e +50 da meta, avisado na janela de parabéns');
cleanup?.(); root.innerHTML = '';
document.querySelectorAll('.modal-overlay').forEach((n) => n.remove());
cleanup = await renderHome(root); await wait(120);
ok(/3\/3/.test(root.querySelector('#goal-slot').textContent) && /Meta batida/.test(root.querySelector('#goal-slot').textContent) && !!root.querySelector('#goal-slot .goal-note.ok') && /success/.test(root.querySelector('#goal-slot circle:last-child').getAttribute('stroke')), 'Home: meta batida aparece em verde, com "Meta batida!"');
cleanup?.(); root.innerHTML = '';

// aba Metas do Perfil
cleanup = await renderProfile(root); await wait(80);
root.querySelector('[data-tab="goals"]').click(); await wait(150);
const g = root.querySelector('#tab-content');
ok(g.querySelectorAll('.goal-card').length === 1 && g.querySelectorAll('.ch-card').length === 3 && !g.querySelector('[data-goal-link]'), 'Perfil, aba Metas: a meta e os 3 desafios da semana (sem o botão "Ver desafios")');
ok(root.querySelector('[data-tab="goals"]').getAttribute('aria-selected') === 'true', 'Perfil: a aba Metas fica marcada');
ok([...g.querySelectorAll('.progress')].every((b) => b.getAttribute('aria-label') && b.getAttribute('role') === 'progressbar'), 'Acessibilidade: as barras de progresso têm nome');
ok(!/falhou|perdeu|atrasad|não conseguiu|pena|culp/i.test(g.textContent), 'Tom sem culpa: nenhum texto de cobrança ou de fracasso');
cleanup?.(); root.innerHTML = '';
G.requestProfileTab('goals');
cleanup = await renderProfile(root); await wait(150);
ok(root.querySelector('[data-tab="goals"]').classList.contains('active') && root.querySelectorAll('.ch-card').length === 3, 'Perfil: aberto pelo botão da Home, já vem na aba Metas');
cleanup?.(); root.innerHTML = '';
