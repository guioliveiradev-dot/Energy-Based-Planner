// Registro de energia ao longo do dia: guarda a energia ao gerar missão e mostra em que parte do dia ela costuma ser mais alta.
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
const E = await import(base + 'energy-log.js');
const { buildBackup } = await import(base + 'backup.js');
const { parseImport } = await import(base + 'data-import.js');
const { renderHome } = await import(base + 'pages/home.js');
const { renderProfile } = await import(base + 'pages/profile.js');
const wait = (ms = 60) => new Promise((r) => setTimeout(r, ms));
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const at = (h, m = 0, day = 14) => new Date(2026, 9, day, h, m).getTime();

// ---------- limpeza e união ----------
const sujo = E.cleanEnergyLogs([[at(9), 8], [at(9), 7], [at(10), 0], [at(11), 11], [at(12), 5.5], ['x', 5], null, [at(8), 4], [-5, 3], [at(13)]]);
ok(JSON.stringify(sujo) === JSON.stringify([[at(8), 4], [at(9), 7]]), 'Limpeza: só horário válido com energia inteira de 1 a 10; em ordem; um registro por horário');
ok(E.cleanEnergyLogs('x').length === 0 && E.cleanEnergyLogs(null).length === 0, 'Limpeza: lixo vira lista vazia');
const muitos = Array.from({ length: 450 }, (_, i) => [1000 + i, 5]);
const lim = E.cleanEnergyLogs(muitos);
ok(lim.length === E.MAX_LOGS && lim[0][0] === 1050 && lim[lim.length - 1][0] === 1449, 'Limpeza: guarda só os 400 mais recentes');
ok(E.mergeEnergyLogs([[1000, 3], [2000, 4]], [[2000, 9], [3000, 5]]).map((x) => x[0]).join() === '1000,2000,3000', 'Importar: une os registros sem repetir o mesmo horário');

// ---------- guardar (banco) ----------
await auth.register('Ana', 'ana@x.com', 'segredo1');
const uid = auth.state.user.id;
T.setActivePetStorage(uid, null);
let logs = await E.addEnergyLog(uid, 7, at(9, 0));
ok(logs.length === 1 && logs[0][1] === 7, 'Guardar: o primeiro registro fica salvo');
logs = await E.addEnergyLog(uid, 4, at(9, 20));
ok(logs.length === 1 && logs[0][1] === 4 && logs[0][0] === at(9, 20), 'Guardar: dentro de 30 min vale só o último (gerar várias missões seguidas conta como um)');
logs = await E.addEnergyLog(uid, 6, at(9, 55));
ok(logs.length === 2 && logs[1][1] === 6, 'Guardar: passou de 30 min, é outro registro');
ok(await E.addEnergyLog(uid, 0, at(10)) === null && await E.addEnergyLog(uid, 11, at(10)) === null && await E.addEnergyLog(uid, 5.5, at(10)) === null && (await E.getEnergyLogs(uid)).length === 2, 'Guardar: energia fora de 1 a 10 não é registrada');
ok((await E.getEnergyLogs('outra-pessoa')).length === 0, 'Guardar: cada pessoa tem os seus registros');

// ---------- padrão do dia ----------
const mk = (list) => list.map(([h, e], i) => [at(h, i, 14 + (i % 5)), e]);
let r = E.energyByPeriod(mk([[9, 8], [9, 9], [10, 8], [14, 5], [15, 6], [20, 3], [21, 2], [20, 3]]));
ok(r.enough && r.best === 'morning' && r.low === 'evening' && r.total === 8, 'Padrão: manhã mais alta (8,3) e noite mais baixa (2,7)');
const manha = r.periods.find((p) => p.id === 'morning'), noite = r.periods.find((p) => p.id === 'night');
ok(manha.avg === 8.3 && manha.count === 3 && noite.avg === null && noite.count === 0, 'Padrão: média com 1 casa decimal; parte do dia sem registros fica sem média');
r = E.energyByPeriod(mk([[9, 8], [9, 9], [14, 5]]));
ok(!r.enough && r.best === null && r.total === 3, 'Padrão: com menos de 6 registros ainda não mostra nada');
r = E.energyByPeriod(mk([[9, 6], [9, 6], [14, 6], [14, 6], [20, 6], [20, 6]]));
ok(r.enough && r.best === null && r.low === null, 'Padrão: energia parecida o dia todo não escolhe uma parte do dia');
r = E.energyByPeriod(mk([[9, 8], [14, 3], [20, 2], [21, 2], [9, 9], [22, 1]]));
ok(r.periods.find((p) => p.id === 'afternoon').avg === null, 'Padrão: uma parte do dia com 1 registro só não entra na comparação');

// ---------- Home guarda a energia ao gerar a missão ----------
const root = document.getElementById('app');
const mkTask = (id, o = {}) => ({ id, userId: uid, title: id, energyCost: 5, durationMinutes: 30, deadline: null, category: 'work', completed: false, completedAt: null, startedAt: null, pausedAt: null, pauseOffset: 0, createdAt: Date.now(), ...o });
await db.createTask(mkTask('Pendente'));
await db.createTask(mkTask('Feita', { completed: true, completedAt: Date.now() - 3600000 }));
await E.clearEnergyLogs(uid);
let cleanup = await renderHome(root); await wait(150);
root.querySelector('#generate').click(); await wait(150);
let saved = await E.getEnergyLogs(uid);
ok(saved.length === 1 && saved[0][1] === 5 && Math.abs(saved[0][0] - Date.now()) < 60000, 'Home: "Gerar Missão" guarda a energia do slider (5) e o horário');
const slider = root.querySelector('input[type="range"]');
slider.value = '8'; slider.dispatchEvent(new w.Event('input', { bubbles: true }));
root.querySelector('#generate').click(); await wait(150);
saved = await E.getEnergyLogs(uid);
ok(saved.length === 1 && saved[0][1] === 8, 'Home: gerar de novo em seguida atualiza o mesmo registro (energia 8)');
cleanup?.(); root.innerHTML = '';

// ---------- Estatísticas ----------
const openQuando = async () => {
  const c = await renderProfile(root); await wait(120);
  root.querySelector('[data-tab="stats"]').click(); await wait(120);
  root.querySelector('[data-stats-tab="quando"]').click(); await wait(80);
  return c;
};
cleanup = await openQuando();
let card = root.querySelector('#st-energy')?.closest('section');
ok(!!card && /Registros até agora: 1 de 6/.test(card.textContent) && /em que parte do dia/.test(card.textContent) && !card.querySelector('.stat-list'), 'Estatísticas: com poucos registros, explica como funciona e mostra quantos faltam (sem cobrança)');
cleanup?.(); root.innerHTML = '';
await E.clearEnergyLogs(uid);
for (const [i, [h, e]] of [[9, 8], [9, 9], [10, 8], [14, 5], [15, 6], [20, 3], [21, 2]].entries()) await E.addEnergyLog(uid, e, at(h, 0, 4 + i));   // um dia diferente para cada registro
cleanup = await openQuando();
card = root.querySelector('#st-energy')?.closest('section');
ok(/mais alta de manhã/.test(card.textContent) && /mais baixa à noite/.test(card.textContent) && /Uma ideia: deixe as tarefas mais pesadas para a manhã\./.test(card.textContent), 'Estatísticas: mostra a frase "mais alta de manhã e mais baixa à noite" e uma ideia');
ok(card.querySelectorAll('.stat-list li').length === 4 && /\d,\d\/10/.test(card.textContent) && /–/.test(card.textContent), 'Estatísticas: 4 partes do dia com a média (ex.: 8,3/10); sem registros aparece "–"');
ok(!!root.querySelector('#st-period') && !!root.querySelector('#st-week'), 'Estatísticas: a energia fica junto de "Dias e horários"');
ok(!/falhou|perdeu|atrasad|culp|pena/i.test(card.textContent), 'Tom sem culpa: nenhum texto de cobrança');
cleanup?.(); root.innerHTML = '';

// ---------- backup, importação e reset ----------
const backup = await buildBackup(uid);
ok(Array.isArray(backup.energyLogs) && backup.energyLogs.length === 7, 'Backup: leva os registros de energia');
const parsed = parseImport(JSON.stringify({ ...backup, energyLogs: [[at(9), 7], [at(9), 99], 'lixo'] }));
ok(parsed.energyLogs.length === 1 && parsed.energyLogs[0][1] === 7, 'Importar: registros inválidos do arquivo são ignorados');
await E.importEnergyLogs(uid, [[at(9, 0, 3), 6]]);
ok((await E.getEnergyLogs(uid)).length === 8, 'Importar: une com o que a conta já tem');
await db.resetUserData(uid);
ok((await E.getEnergyLogs(uid)).length === 0, 'Reset da conta: apaga os registros de energia');
