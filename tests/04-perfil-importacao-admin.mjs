import 'fake-indexeddb/auto';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><body><div id="app"></div><div id="toasts"></div></body>', { url: 'http://localhost/' });
const w = dom.window;
for (const k of ['window','document','location']) Object.defineProperty(globalThis, k, { value: k==='window'? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });
let lastBlob = null, clicked = null;
w.URL.createObjectURL = (b) => { lastBlob = b; return 'blob:x'; }; w.URL.revokeObjectURL = () => {};
globalThis.URL = w.URL; globalThis.FileReader = w.FileReader;
w.HTMLAnchorElement.prototype.click = function () { clicked = this.download; };

const base = new URL('../js/', import.meta.url).href;
const auth = await import(base + 'auth.js');
const db = await import(base + 'db.js');
const { renderProfile } = await import(base + 'pages/profile.js');
const { parseImport } = await import(base + 'data-import.js');
const { openAdminPanel } = await import(base + 'components/admin-panel.js');
const { createTaskTimer } = await import(base + 'components/task-timer.js');
const themes = await import(base + 'themes.js');
const wait = (ms=40) => new Promise(r => setTimeout(r, ms));
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const root = document.getElementById('app');
const ev = (t) => new w.Event(t, { bubbles: true });

await auth.register('Ana <i>', 'ana@x.com', 'segredo1');
const uid = auth.state.user.id;
const mk = (o) => ({ id: crypto.randomUUID(), userId: uid, title: 't', energyCost: 5, durationMinutes: 30, deadline: null, category: 'work', completed: false, completedAt: null, startedAt: null, createdAt: Date.now(), ...o });
await db.createTask(mk({ completed: true, completedAt: Date.now(), energyCost: 8, durationMinutes: 45 }));
await db.createTask(mk({ completed: true, completedAt: Date.now(), energyCost: 2, durationMinutes: 20 }));
await db.createTask(mk({ completed: false }));
await db.updateUserXP(uid, 500); await auth.refreshUser();

// ---------- parseImport (formato do Lovable) ----------
ok(parseImport('{{').error, 'Import: JSON inválido recusado');
ok(parseImport('{"foo":1}').error, 'Import: arquivo estranho recusado');
const lovable = JSON.stringify({
  user: { name: 'Maria', email: 'm@x.com', xp: 1234 },
  tasks: [
    { id: 'a1', userId: 'OUTRO', title: 'Estudar', energyCost: 7, durationMinutes: 60, deadline: null, category: 'study', completed: true, completedAt: 1700000000000, startedAt: 1699990000000, createdAt: 1699900000000 },
    { id: 'a2', title: '', energyCost: 7, durationMinutes: 60, category: 'study' },
    { id: 'a3', title: 'Cat errada', energyCost: 7, durationMinutes: 60, category: 'hacker' },
  ],
  routineBlocks: [{ id: 'r1', userId: 'OUTRO', dayOfWeek: 1, startTime: '07:00', endTime: '12:00', label: 'Escola' }, { id: 'r2', dayOfWeek: 9, startTime: '07:00', endTime: '12:00', label: 'x' }],
  rewards: [{ id: 'w1', title: 'Videogame', cost: 500, createdAt: 1 }],
  redemptionHistory: [{ id: 'h1', rewardTitle: 'Pizza', cost: 300, redeemedAt: 1700000000000 }],
  exportedAt: '2026-01-01',
});
const p = parseImport(lovable);
ok(!p.error && p.tasks.length === 1 && p.routineBlocks.length === 1 && p.rewards.length === 1 && p.redemptionHistory.length === 1, 'Import: aceita válidos');
ok(p.skipped === 3, `Import: ignora 3 inválidos (veio ${p.skipped})`);
ok(p.xp === 1234 && p.inventory.length === 0 && p.theme === null, 'Import: xp lido, sem inventário (como no export do Lovable)');
ok(!('userId' in p.tasks[0]), 'Import: userId de outra conta é descartado');

// ---------- Perfil ----------
let cleanup = await renderProfile(root);
ok(root.querySelector('h2').textContent === 'Ana <i>' && !root.querySelector('h2 i'), 'Perfil: nome escapado');
const stats = [...root.querySelectorAll('.stat-value')].map(e => e.textContent);
ok(stats.join() === '500,2,' + (Math.round(8*10+45*.5) + Math.round(2*10+20*.5)), `Perfil: estatísticas ${stats.join('|')}`);
const svg = root.querySelector('svg[role="img"]');
ok(svg && svg.querySelectorAll('rect').length === 1 && svg.querySelectorAll('text').length >= 8, 'Perfil: gráfico com 1 barra (hoje) e 7 rótulos');
ok(svg.textContent.includes('Seg') && svg.textContent.includes('Dom'), 'Perfil: rótulos Seg..Dom');

// exportar
root.querySelector('[data-act="export"]').click(); await wait(80);
const exported = JSON.parse(await lastBlob.text());
ok(/^energy-planner-export-\d{4}-\d\d-\d\d\.json$/.test(clicked), 'Perfil: nome do arquivo exportado');
ok(exported.tasks.length === 3 && exported.user.xp === 500 && Array.isArray(exported.inventory), 'Perfil: export com tarefas, xp e inventário');
ok(parseImport(JSON.stringify(exported)).tasks.length === 3, 'Perfil: o que exporta, importa de volta');

// inventário vazio
root.querySelector('[data-tab="inventory"]').click();
ok(root.textContent.includes('Compre temas na Loja') && root.textContent.includes('Compre pets na Loja'), 'Inventário: avisos quando vazio');
themes.addToInventory(uid, 'sunset'); themes.addToInventory(uid, 'cat');
cleanup(); root.innerHTML = ''; cleanup = await renderProfile(root);
root.querySelector('[data-tab="inventory"]').click();
root.querySelector('[data-theme-id="sunset"]').click();
ok(document.documentElement.getAttribute('data-theme') === 'sunset' && themes.getActiveTheme(uid) === 'sunset', 'Inventário: equipar tema aplica no <html>');
ok(root.querySelector('[data-theme-id="sunset"]').classList.contains('active'), 'Inventário: tema marcado');
root.querySelector('[data-theme-id="default"]').click();
ok(!document.documentElement.hasAttribute('data-theme'), 'Inventário: voltar ao padrão');
// regressão: com um tema ativo no <html>, clicar no pet deve equipar o PET (não o tema)
root.querySelector('[data-theme-id="sunset"]').click();
ok(document.documentElement.getAttribute('data-theme') === 'sunset', 'Regressão: tema ativo antes de escolher pet');
document.querySelectorAll('.toast').forEach(t => t.remove());
root.querySelector('[data-pet="cat"]').click();
ok(themes.getActivePet(uid) === 'cat', 'Inventário: equipar pet (com tema ativo)');
ok(document.querySelector('.toast')?.textContent.includes('Pet "Gato Cósmico" ativado'), 'Regressão: aviso é de PET, não de tema');
ok(themes.getActiveTheme(uid) === 'sunset', 'Regressão: tema continua o mesmo');
const tm = createTaskTimer({ userId: uid, taskTitle: 'x', durationMinutes: 5, startedAt: Date.now(), onComplete() {} }); tm.open();
ok(!!document.querySelector('.pet-face'), 'Inventário: cronômetro usa o pet equipado');
tm.destroy();
root.querySelector('[data-pet=""]').click();
ok(themes.getActivePet(uid) === null, 'Inventário: "Nenhum pet"');

// importar (UI)
root.querySelector('[data-tab="profile"]').click();
const input = root.querySelector('#import-file');
const sendFile = async (text) => {
  Object.defineProperty(input, 'files', { value: [new w.File([text], 'x.json', { type: 'application/json' })], configurable: true });
  input.dispatchEvent(ev('change')); await wait(100);
};
await sendFile('isso não é json');
ok([...document.querySelectorAll('.toast.error')].some(t => t.textContent.includes('JSON válido')), 'Importar: arquivo inválido mostra erro');
await sendFile(lovable);
const modal = document.querySelector('.modal-panel');
ok(modal && modal.textContent.includes('1 tarefa(s)') && modal.textContent.includes('substituídos') && modal.textContent.includes('1234'), 'Importar: confirmação mostra contagem e aviso de pontos');
modal.querySelector('[data-act="cancel"]').click();
ok((await db.getUserTasks(uid)).length === 3, 'Importar: cancelar não altera nada');
await sendFile(lovable);
document.querySelector('.modal-panel [data-act="confirm"]').click(); await wait(200);
const tasksNow = await db.getUserTasks(uid);
ok(tasksNow.length === 4 && tasksNow.find(t => t.id === 'a1')?.userId === uid, 'Importar: tarefa entra na conta atual');
ok((await db.getUserRoutineBlocks(uid)).length === 1 && (await db.getUserRewards(uid)).length === 1 && (await db.getUserRedemptionHistory(uid)).length === 1, 'Importar: rotina, recompensa e histórico');
ok(auth.state.user.xp === 1234, 'Importar: pontos substituídos (1234)');
ok(!document.querySelector('.modal-panel'), 'Importar: janela fecha');
ok(root.textContent.includes('1234'), 'Importar: tela do perfil atualiza');
// registro de outra conta com mesmo id é preservado
await auth.logout(); await auth.register('Bia', 'bia@x.com', 'segredo1');
const bia = auth.state.user.id;
const r = await db.importUserData(bia, parseImport(lovable));
ok(r.skipped >= 1 && (await db.getUserTasks(uid)).find(t => t.id === 'a1').userId === uid, 'Importar: não rouba registros de outra conta');
await auth.logout(); await auth.login('ana@x.com', 'segredo1');
cleanup(); root.innerHTML = '';

// ---------- Admin ----------
openAdminPanel(); openAdminPanel();
ok(document.querySelectorAll('.modal-panel').length === 1, 'Admin: não abre dois painéis');
let m = document.querySelector('.modal-panel');
ok(m.textContent.includes('Acesso Restrito'), 'Admin: pede senha');
m.querySelector('#admin-pw').value = 'errada'; m.querySelector('[data-act="login"]').click();
ok([...document.querySelectorAll('.toast.error')].some(t => t.textContent.includes('Senha incorreta')), 'Admin: senha errada');
m.querySelector('#admin-pw').value = 'zen123'; m.querySelector('[data-act="login"]').click();
ok(m.textContent.includes('Painel Admin'), 'Admin: senha certa abre painel');
const before = auth.state.user.xp;
m.querySelector('[data-act="points"]').click(); await wait(80);
ok(auth.state.user.xp === before + 1000, 'Admin: +1000 pontos');
m.querySelector('[data-act="reset"]').click(); await wait(30);
ok(m.textContent.includes('Confirmar Reset?') && (await db.getUserTasks(uid)).length === 4, 'Admin: reset pede 2º toque');
m.querySelector('[data-act="reset"]').click(); await wait(150);
ok((await db.getUserTasks(uid)).length === 0 && auth.state.user.xp === 0 && auth.state.user, 'Admin: reset zera dados e mantém conta');
m.querySelector('[data-act="delete"]').click(); await wait(30);
ok(m.textContent.includes('Confirmar Exclusão?') && !!(await db.getUserByEmail('ana@x.com')), 'Admin: exclusão pede 2º toque');
m.querySelector('[data-act="delete"]').click(); await wait(150);
ok(!(await db.getUserByEmail('ana@x.com')) && auth.state.user === null && !document.querySelector('.modal-panel'), 'Admin: apagar conta remove tudo e fecha');
process.exit(process.exitCode || 0);
