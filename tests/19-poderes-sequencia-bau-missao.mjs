// Poderes de sequência e sorte: escudo do Cão, Fênix, baú do Unicórnio, missão do Robô, Home, descrições e painel admin.
import 'fake-indexeddb/auto';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><head><title>Base</title></head><body><div id="app"></div><div id="toasts"></div></body></html>', { url: 'http://localhost/' });
const w = dom.window;
for (const k of ['window', 'document', 'location', 'navigator']) Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });
const base = new URL('../js/', import.meta.url).href;
const auth = await import(base + 'auth.js');
const db = await import(base + 'db.js');
const T = await import(base + 'themes.js');
const W = await import(base + 'pet-powers.js');
const S = await import(base + 'pet-state.js');
const { streakInfo, dayKey } = await import(base + 'progress.js');
const AT = await import(base + 'admin-tools.js');
const M = await import(base + 'pet-messages.js');
const { petInfoHTML } = await import(base + 'components/pet-info.js');
const { renderHome } = await import(base + 'pages/home.js');
const { renderTasks } = await import(base + 'pages/tasks.js');
const { renderProfile } = await import(base + 'pages/profile.js');
const { renderShop } = await import(base + 'pages/shop.js');
const B = await import(base + 'backup.js');
const { parseImport } = await import(base + 'data-import.js');
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const wait = (ms = 100) => new Promise((r) => setTimeout(r, ms));

const NOW = new Date(2026, 9, 17, 15).getTime();
const at = (off) => new Date(2026, 9, 17 - off, 12).getTime();           // meio-dia de "hoje - off"
const key = (off) => dayKey(at(off));
const done = (offs) => offs.map((o, i) => ({ id: 'd' + o + '-' + i, completed: true, completedAt: at(o), energyCost: 3, durationMinutes: 20 }));
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);   // de `from` a `to` dias atrás

await auth.register('Ana', 'ana@x.com', 'segredo1');
const uid = auth.state.user.id;

// ---------- sequência com dias protegidos e reacendidos ----------
ok(streakInfo(done(range(2, 6)), NOW).current === 0, 'Sequência: sem escudo, perder ontem zera');
ok(streakInfo(done(range(2, 6)), NOW, { covered: [key(1)] }).current === 6, 'Sequência: o dia protegido pelo escudo mantém e conta na sequência');
ok(streakInfo(done([0]), NOW, { bonuses: [{ start: key(0), extra: 3 }] }).current === 4, 'Sequência: dias reacendidos pela Fênix somam à sequência que começa hoje');
ok(streakInfo(done([0]), NOW, { bonuses: [{ start: key(5), extra: 3 }] }).current === 1, 'Sequência: bônus de outra sequência não vale');
ok(streakInfo(done(range(2, 4)), NOW, { bonuses: [{ start: key(4), extra: 2 }] }).best === 5, 'Sequência: o melhor recorde também conta os dias reacendidos');
ok(streakInfo(done(range(0, 3)), NOW).current === 4 && streakInfo([], NOW).current === 0, 'Sequência: sem poderes continua igual a antes');

// ---------- Cão Guardião: escudo ----------
T.addToInventory(uid, 'dog');
T.setActivePetStorage(uid, 'dog');
let r = await W.applyShield(uid, done(range(2, 6)), NOW);
ok(r && r.days.join() === key(1) && /Cão Guardião/.test(r.petName), 'Cão: perdeu ontem com 5 dias de sequência, o escudo protege ontem');
let st = await S.getPetState(uid);
ok(st.shields.join() === key(1) && streakInfo(done(range(2, 6)), NOW, await W.getStreakExtra(uid)).current === 6, 'Cão: o escudo fica registrado e a sequência segue em 6');
ok((await W.applyShield(uid, done(range(2, 6)), NOW)) === null, 'Cão: não gasta outro escudo para o mesmo dia');
await S.clearPetState(uid);
ok((await W.applyShield(uid, done(range(3, 7)), NOW)) === null, 'Cão: 2 dias perdidos com 1 escudo não dá para salvar (e não gasta)');
ok((await W.applyShield(uid, done([2]), NOW)) === null, 'Cão: sequência de só 1 dia não gasta escudo');
await S.savePetState(uid, { ...(await S.getPetState(uid)), shields: [key(3)] });
ok((await W.applyShield(uid, done(range(4, 8)), NOW)) === null, 'Cão: já usou o escudo esta semana, não há outro (1 por semana)');
await S.clearPetState(uid);
await db.addPetBond(uid, 'dog', 35);        // nível 4: 2 escudos por semana
r = await W.applyShield(uid, done(range(3, 7)), NOW);
ok(r && r.days.length === 2, 'Cão nível 4: 2 escudos por semana protegem 2 dias perdidos');
await S.clearPetState(uid);
T.setActivePetStorage(uid, 'cat');
ok((await W.applyShield(uid, done(range(2, 6)), NOW)) === null, 'Escudo: só funciona com o Cão ativo');

// ---------- Fênix: reacende parte da sequência ----------
T.addToInventory(uid, 'phoenix');
T.setActivePetStorage(uid, 'phoenix');
const task = { id: 'novo', energyCost: 5, durationMinutes: 30 };
const phoenix = (before, extra = {}) => W.applyPetPowers({ userId: uid, task, basePoints: 65, tasksBefore: before, completedAt: NOW, ...extra });
let fx = await phoenix(done(range(4, 8)));
ok(/reacendeu 2 dias da sua sequência/.test(fx.note) && fx.bonus === null, 'Fênix: sequência de 5 dias quebrou, na próxima tarefa reacende 50% = 2 dias');
st = await S.getPetState(uid);
ok(st.phoenix.join() === key(0) && st.bonuses[0].start === key(0) && st.bonuses[0].extra === 2, 'Fênix: registra o uso e os dias reacendidos');
const after = [...done(range(4, 8)), { id: 'novo', completed: true, completedAt: NOW }];
ok(streakInfo(after, NOW, await W.getStreakExtra(uid)).current === 3, 'Fênix: a sequência recomeça em 1 + 2 = 3 dias');
ok((await phoenix(done(range(4, 8)))).note === null, 'Fênix: só uma vez a cada 30 dias');
await S.clearPetState(uid);
ok((await phoenix(done(range(1, 5)))).note === null, 'Fênix: se ontem teve tarefa, a sequência não quebrou (não usa)');
ok((await phoenix(done([4]))).note === null, 'Fênix: sequência perdida de 1 dia não rende nada');
ok((await phoenix([...done(range(4, 8)), { id: 'h', completed: true, completedAt: at(0) }])).note === null, 'Fênix: só vale na primeira tarefa do dia');
await db.addPetBond(uid, 'phoenix', 70);
fx = await phoenix(done(range(4, 8)));
ok(/reacendeu 3 dias/.test(fx.note), 'Fênix nível 5: reacende 70% (5 dias → 3)');
await S.clearPetState(uid);

// ---------- Unicórnio: baú ----------
T.addToInventory(uid, 'unicorn');
T.setActivePetStorage(uid, 'unicorn');
const chest = (before, rng) => W.applyPetPowers({ userId: uid, task, basePoints: 65, tasksBefore: before, completedAt: NOW, rng });
fx = await chest([], () => 0);
ok(fx.bonus && fx.bonus.amount === 10 && /abriu um baú-surpresa: \+10 pontos/.test(fx.bonus.message), 'Unicórnio: baú no nível 1 vai de 10 a 40 (sorteio mínimo = 10)');
ok((await chest([], () => 0.9999)).bonus === null, 'Unicórnio: só um baú por dia');
await AT.releaseTodayChest(uid);
ok((await chest([], () => 0.9999)).bonus.amount === 40, 'Unicórnio: sorteio máximo = 40 no nível 1');
await AT.releaseTodayChest(uid);
ok((await chest(done([0]), () => 0)).bonus === null, 'Unicórnio: só na primeira tarefa do dia');
await S.clearPetState(uid);
await db.addPetBond(uid, 'unicorn', 70);
const lvl5 = [await chest([], () => 0), (await (async () => { await AT.releaseTodayChest(uid); return chest([], () => 0.9999); })())].map((x) => x.bonus.amount);
ok(lvl5.join() === '20,60', 'Unicórnio nível 5: baú de 20 a 60');
await S.clearPetState(uid);

// ---------- Robô: missão do dia ----------
T.addToInventory(uid, 'robot');
T.setActivePetStorage(uid, 'robot');
const pend = [
  { id: 'a', title: 'Sem prazo', completed: false, createdAt: 1, energyCost: 3, durationMinutes: 10 },
  { id: 'b', title: 'Com prazo', completed: false, createdAt: 2, deadline: NOW + 86400000, energyCost: 3, durationMinutes: 10 },
  { id: 'c', title: 'Outra', completed: false, createdAt: 0, energyCost: 3, durationMinutes: 10 },
];
let m = await W.robotMission(uid, pend, NOW);
ok(m.task.id === 'b' && m.pct === 30 && !m.done, 'Robô: escolhe a tarefa com prazo mais perto e promete +30%');
ok((await W.robotMission(uid, [...pend].reverse(), NOW)).task.id === 'b', 'Robô: a escolha fica a mesma o dia todo');
m = await W.robotMission(uid, pend.map((t) => (t.id === 'b' ? { ...t, completed: true } : t)), NOW);
ok(m.done && m.task.id === 'b', 'Robô: tarefa concluída aparece como missão cumprida');
m = await W.robotMission(uid, pend.filter((t) => t.id !== 'b'), NOW + 86400000);
ok(m.task.id === 'c' && !m.done, 'Robô: no dia seguinte escolhe outra (a mais antiga sem prazo)');
await S.clearPetState(uid);
await W.robotMission(uid, pend, NOW);
const hit = await W.applyPetPowers({ userId: uid, task: pend[1], basePoints: 100, tasksBefore: pend, completedAt: NOW });
const miss = await W.applyPetPowers({ userId: uid, task: pend[0], basePoints: 100, tasksBefore: pend, completedAt: NOW });
ok(hit.bonus.amount === 30 && /cumpriu a missão do dia/.test(hit.bonus.message) && miss.bonus === null, 'Robô: concluir a tarefa da missão dá +30%; outra tarefa não dá bônus');
ok((await W.robotMission(uid, [], NOW + 5 * 86400000)) === null, 'Robô: sem tarefas pendentes, sem missão (sem cobrança)');
T.setActivePetStorage(uid, 'cat');
ok((await W.robotMission(uid, pend, NOW)) === null, 'Robô: só com o Robô ativo');
await S.clearPetState(uid);

// ---------- Home: cartão do pet, missão, escudo ----------
const root = document.getElementById('app');
const real = (off) => new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - off, 12).getTime();
const seed = async (offs) => { for (const o of offs) await db.createTask({ id: 'h' + o, userId: uid, title: 'Dia ' + o, energyCost: 3, durationMinutes: 20, deadline: null, category: 'work', completed: true, completedAt: real(o), startedAt: real(o) - 1e6, pausedAt: null, pauseOffset: 0, createdAt: real(o) }); };
T.setActivePetStorage(uid, 'fagulha');
await renderHome(root); await wait(250);
const pc = root.querySelector('#pet-slot .pet-home');
ok(!!pc && /Fagulha/.test(pc.textContent) && !!pc.querySelector('svg[role="img"]') && pc.querySelector('p.muted').textContent.length > 10, 'Home: cartão da Fagulha com arte e mensagem do dia');
ok(!root.querySelector('.pet-mission'), 'Home: sem Robô ativo, sem missão do dia');
T.setActivePetStorage(uid, null);
await renderHome(root); await wait(200);
ok(root.querySelector('#pet-slot').innerHTML.trim() === '', 'Home: "Nenhum pet" escolhido, sem cartão');
T.setActivePetStorage(uid, 'robot');
await db.createTask({ id: 'pend1', userId: uid, title: 'Escrever relatório', energyCost: 4, durationMinutes: 30, deadline: null, category: 'work', completed: false, completedAt: null, startedAt: null, pausedAt: null, pauseOffset: 0, createdAt: Date.now() });
await renderHome(root); await wait(250);
const mission = root.querySelector('.pet-mission');
ok(!!mission && /Escrever relatório/.test(mission.textContent) && /\+30%/.test(mission.textContent) && mission.querySelector('a[href="#/tasks"]'), 'Home: Robô mostra a missão do dia e leva para Tarefas');
await db.resetUserData(uid);
ok((await S.getPetState(uid)).robot === null, 'Limpar dados: apaga o estado dos poderes');

await seed(range(2, 6));
T.setActivePetStorage(uid, 'dog');
document.getElementById('toasts').innerHTML = '';
await renderHome(root); await wait(300);
ok(/Cão Guardião protegeu a sua sequência/.test(document.getElementById('toasts').textContent), 'Home: ao abrir, o Cão avisa que protegeu a sequência');
ok(/6/.test(root.querySelector('#progress-slot').textContent) && (await S.getPetState(uid)).shields.length === 1, 'Home: o cartão de sequência mostra 6 dias e o escudo ficou registrado');
root.innerHTML = '';

// ---------- Fênix ao concluir tarefa de verdade ----------
await S.clearPetState(uid);
await db.resetUserData(uid);
await seed(range(4, 8));
T.setActivePetStorage(uid, 'phoenix');
await db.createTask({ id: 'fx', userId: uid, title: 'Voltar à rotina', energyCost: 5, durationMinutes: 30, deadline: null, category: 'work', completed: false, completedAt: null, startedAt: Date.now() - 4e6, pausedAt: null, pauseOffset: 0, createdAt: Date.now() });
const cleanup = await renderTasks(root);
root.querySelector('[data-action="collect"]').click(); await wait(300);
const modal = document.querySelector('.congrats-panel')?.textContent || '';
ok(/Fênix Estelar reacendeu 2 dias da sua sequência/.test(modal) && /3/.test(modal), 'Tarefas: a janela de parabéns avisa que a Fênix reacendeu a sequência (3 dias)');
cleanup?.(); root.innerHTML = '';

// ---------- descrições dos pets ----------
const infos = T.ALL_PETS.map((p) => petInfoHTML(p.id, 2));
ok(infos.every((h) => /<details class="pet-info[^"]*"><summary aria-label="Detalhes do poder de .+">Detalhes do poder<\/summary>/.test(h) && (h.match(/<li/g) || []).length === 5), 'Descrição: os 7 pets explicam o que fazem, com os 5 níveis');
ok(/aria-current="true" class="current">Nível 2/.test(infos[0]) && !/aria-current/.test(petInfoHTML('cat')), 'Descrição: destaca o nível atual (e nada na Loja)');
ok(/escudo/.test(petInfoHTML('dog')) && /30 dias/.test(petInfoHTML('phoenix')) && /sorteado/.test(petInfoHTML('unicorn')) && /Home/.test(petInfoHTML('robot')), 'Descrição: cada pet explica o próprio poder');
await renderProfile(root); await wait();
[...root.querySelectorAll('[data-tab]')].find((x) => /invent/i.test(x.dataset.tab + x.textContent))?.click(); await wait();
ok(root.querySelectorAll('.pet-info').length >= 2 && root.querySelector('.pet-info summary').textContent === 'Detalhes do poder' && /Detalhes do poder de /.test(root.querySelector('.pet-info summary').getAttribute('aria-label')), 'Inventário: cada pet tem "Detalhes do poder" (com o nome do pet para leitores de tela)');
const entry = root.querySelector('.pet-entry');
ok(entry && entry.children.length === 2 && entry.children[0].matches('[data-pet]') && entry.children[1].matches('details.pet-info-attached'), 'Inventário: a descrição fica colada embaixo do próprio pet (mesmo cartão), não solta entre dois pets');
root.innerHTML = '';
await renderShop(root); await wait();
root.querySelector('[data-tab="store"]').click(); await wait();
ok(root.querySelectorAll('.pet-info').length === 6, 'Loja: os 6 pets à venda têm "Detalhes do poder"');
const shopCard = root.querySelector('.pet-info').parentElement;
ok(shopCard.classList.contains('glass-card') && shopCard.lastElementChild.matches('.pet-info-footer') && !shopCard.querySelector('.row-between .pet-info'), 'Loja: a descrição é o rodapé do cartão do pet (abaixo do preço), não no meio do texto');
root.innerHTML = '';

// ---------- mensagens do dia ----------
const seeds = Array.from({ length: 30 }, (_, i) => 'k' + i);
const some = (o) => new Set(seeds.map((s) => M.dailyMessage({ ...o, seed: s })));
ok(M.dailyMessage({ hour: 9, seed: 'x' }) === M.dailyMessage({ hour: 9, seed: 'x' }), 'Mensagem: a mesma durante o dia inteiro');
ok(some({ hour: 9 }).size > 1 && some({ hour: 14 }).size > 1 && some({ hour: 20 }).size > 1 && some({ hour: 23 }).size > 1 && some({ doneToday: true }).size > 1, 'Mensagem: varia entre os dias e muda com a hora e com o que você já fez');
ok([...some({ streak: 5, hour: 10 })].some((x) => /5 dias seguidos/.test(x)), 'Mensagem: reconhece a sequência');
ok(M.ALL_MESSAGES.length >= 15 && M.ALL_MESSAGES.every((x) => x.length > 10 && !/falhou|perdeu|preguiç|atrasad|deveria|culpa|punição/i.test(x)), 'Mensagem: tom gentil, sem cobrança');

// ---------- painel admin: ferramentas de teste ----------
await db.resetUserData(uid);
for (const sc of ['alive', 'shield', 'broken']) {
  const n = await AT.createTestStreak(uid, sc, NOW);
  const tasks = await db.getUserTasks(uid);
  const s = streakInfo(tasks, NOW);
  const want = { alive: 5, shield: 0, broken: 0 }[sc];
  ok(n === AT.STREAK_SCENARIOS[sc].days && tasks.length === n && tasks.every((t) => t.testData && t.completed) && s.current === want, `Admin: cenário "${sc}" cria ${n} dias de teste (sequência atual = ${want})`);
}
ok((await AT.createTestTasks(uid, NOW)) === 3 && (await db.getUserTasks(uid)).filter((t) => !t.completed).map((t) => t.energyCost).sort().join() === '3,5,9', 'Admin: cria 3 tarefas de teste (energia 3, 5 e 9)');
ok((await AT.createTestStreak(uid, 'alive', NOW), (await db.getUserTasks(uid)).every((t) => t.completed)), 'Admin: gerar um cenário apaga os testes anteriores');
await db.createTask({ id: 'real', userId: uid, title: 'Minha tarefa', energyCost: 3, durationMinutes: 10, deadline: null, category: 'work', completed: false, completedAt: null, createdAt: 1 });
ok((await AT.clearTestTasks(uid)) === 5 && (await db.getUserTasks(uid)).map((t) => t.id).join() === 'real', 'Admin: limpar tarefas de teste apaga só as de teste');
T.setActivePetStorage(uid, null);
ok((await AT.giveBond(uid, 5)) === null && (await AT.giveMaxBond(uid)) === null && (await AT.resetBond(uid)) === null, 'Admin: sem pet ativo, vínculo não muda');
T.setActivePetStorage(uid, 'cat');
let gb = await AT.giveBond(uid, 5);
ok(gb.petId === 'cat' && gb.before === 0 && gb.after === 5, 'Admin: +5 de vínculo no pet ativo');
gb = await AT.giveMaxBond(uid);
ok(gb.after === 70, 'Admin: vínculo no máximo = 70 (nível 5)');
ok((await AT.giveMaxBond(uid)).after === 70, 'Admin: máximo não passa de 70 se já está lá');
gb = await AT.resetBond(uid);
ok(gb.after === 0 && (await db.getUserPetBonds(uid)).find((x) => x.petId === 'cat').bond === 0, 'Admin: zerar vínculo volta ao nível 1');
await S.savePetState(uid, { ...(await S.getPetState(uid)), shields: [key(1)], chestDate: key(0) });
await AT.releaseTodayChest(uid);
ok((await S.getPetState(uid)).chestDate === null && (await S.getPetState(uid)).shields.length === 1, 'Admin: liberar o baú não mexe nos escudos');
await AT.resetPetPowers(uid);
ok((await S.getPetState(uid)).shields.length === 0, 'Admin: zerar poderes limpa escudos, baú, Fênix e missão');

// painel na tela
const { openAdminPanel } = await import(base + 'components/admin-panel.js');
const p = openAdminPanel();
document.querySelector('#admin-pw').value = 'zen123';
document.querySelector('[data-act="login"]').click();
const acts = [...document.querySelectorAll('.modal-panel [data-act]')].map((x) => x.dataset.act);
ok(['xp100', 'points', 'xp10000', 'bond1', 'bond5', 'bond20', 'bondmax', 'bondreset', 'streak-alive', 'streak-shield', 'streak-broken', 'tasks-test', 'tasks-clear', 'chest-reset', 'powers-reset', 'tutorial', 'reset', 'delete'].every((a) => acts.includes(a)), 'Painel admin: todos os botões novos e antigos aparecem');
const xp0 = (await db.getUser(uid)).xp;   // o saldo real está no banco (os resets acima não passam pela tela)
document.querySelector('[data-act="xp100"]').click(); await wait();
document.querySelector('[data-act="xp10000"]').click(); await wait();
ok(auth.state.user.xp === xp0 + 10100, 'Painel admin: +100 e +10000 pontos na conta');
document.querySelector('[data-act="bond20"]').click(); await wait();
ok((await db.getUserPetBonds(uid)).find((x) => x.petId === 'cat').bond === 20 && /vínculo 0 → 20/.test(document.getElementById('toasts').textContent), 'Painel admin: +20 de vínculo mostra de quanto para quanto');
document.querySelector('[data-act="streak-shield"]').click(); await wait();
ok((await db.getUserTasks(uid)).filter((t) => t.testData).length === 5, 'Painel admin: botão de sequência cria os dias de teste');
p.close();

// ---------- backup e importação do estado dos poderes ----------
await S.savePetState(uid, { shields: [key(1)], phoenix: [key(9)], bonuses: [{ start: key(0), extra: 2 }], chestDate: key(0), robot: { date: key(0), taskId: 'x' } });
const backup = await B.buildBackup(uid);
ok(backup.petState.shields.length === 1 && backup.petState.bonuses[0].extra === 2, 'Backup: leva o estado dos poderes (escudos, Fênix, baú, missão)');
const parsed = parseImport(JSON.stringify({ tasks: [], petState: { shields: ['2026-10-01', 'lixo', 5], bonuses: [{ start: '2026-10-02', extra: 3 }, { start: 'x', extra: 9 }, { start: '2026-10-03', extra: -1 }], chestDate: 'ontem', robot: { date: '2026-10-01' } } }));
ok(parsed.petState.shields.join() === '2026-10-01' && parsed.petState.bonuses.length === 1 && parsed.petState.chestDate === null && parsed.petState.robot === null, 'Importar: descarta estado dos poderes inválido');
await S.clearPetState(uid);
await S.savePetState(uid, { shields: [key(5)], bonuses: [], phoenix: [], chestDate: null, robot: null });
await S.importPetState(uid, backup.petState);
const merged = await S.getPetState(uid);
ok(merged.shields.length === 2 && merged.bonuses.length === 1 && merged.phoenix.length === 1, 'Importar: junta com o que a conta já tem, sem perder nada');
