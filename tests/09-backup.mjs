// Backup: lembrete de 2 semanas, "lembrar depois", arquivo exportado e proteção do armazenamento.
import 'fake-indexeddb/auto';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><body><div id="app"></div><div id="toasts"></div></body>', { url: 'http://localhost/' });
const w = dom.window;
for (const k of ['window', 'document', 'location']) Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });
let lastBlob = null, clicked = null;
w.URL.createObjectURL = (b) => { lastBlob = b; return 'blob:x'; }; w.URL.revokeObjectURL = () => {};
globalThis.URL = w.URL; globalThis.FileReader = w.FileReader;
w.HTMLAnchorElement.prototype.click = function () { clicked = this.download; };

const base = new URL('../js/', import.meta.url).href;
const auth = await import(base + 'auth.js');
const db = await import(base + 'db.js');
const B = await import(base + 'backup.js');
const { mountBackupReminder } = await import(base + 'components/backup-reminder.js');
const { renderProfile } = await import(base + 'pages/profile.js');
const { renderHome } = await import(base + 'pages/home.js');
const { parseImport } = await import(base + 'data-import.js');
const wait = (ms = 40) => new Promise((r) => setTimeout(r, ms));
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const DAY = 86400000;
const t0 = Date.UTC(2026, 9, 1, 15);

await auth.register('Ana', 'ana@x.com', 'segredo1');
const uid = auth.state.user.id;

// ---------- lembrete ----------
let st = await B.backupStatus(uid, t0);
ok(st.due === false && st.never === true && st.days === 0, 'Lembrete: no primeiro dia não avisa');
await db.createTask({ id: 'a', userId: uid, title: 't', energyCost: 5, durationMinutes: 30, deadline: null, category: 'work', completed: false, completedAt: null, startedAt: null, createdAt: t0 });
st = await B.backupStatus(uid, t0 + 13 * DAY);
ok(!st.due && st.days === 13, 'Lembrete: com 13 dias ainda não avisa');
st = await B.backupStatus(uid, t0 + 14 * DAY);
ok(st.due && st.never && st.days === 14, 'Lembrete: com 14 dias avisa (nunca fez backup)');
st = await B.backupStatus(uid, t0 - 5 * DAY);
ok(!st.due, 'Lembrete: relógio voltando atrás não dispara');

await B.snoozeBackup(uid, t0 + 14 * DAY);
ok(!(await B.backupStatus(uid, t0 + 16 * DAY)).due, 'Lembrar depois: não avisa durante os 3 dias');
ok((await B.backupStatus(uid, t0 + 17 * DAY)).due, 'Lembrar depois: volta a avisar depois de 3 dias');

await B.markBackupDone(uid, t0 + 17 * DAY);
st = await B.backupStatus(uid, t0 + 20 * DAY);
ok(!st.due && !st.never && st.days === 3, 'Backup feito: zera a contagem');
ok((await B.backupStatus(uid, t0 + 31 * DAY)).due, 'Backup feito: 14 dias depois avisa de novo');
ok(!(await B.backupStatus(uid, t0 + 31 * DAY)).never, 'Backup feito: já não é "nunca"');

ok(B.lastBackupText(null) === 'Nenhum backup ainda' && B.lastBackupText({ lastBackupAt: t0 }, t0 + 1000) === 'Último backup: hoje' && B.lastBackupText({ lastBackupAt: t0 }, t0 + DAY) === 'Último backup: ontem' && B.lastBackupText({ lastBackupAt: t0 }, t0 + 5 * DAY) === 'Último backup: há 5 dias', 'Texto do último backup: hoje, ontem, há N dias');

// Conta vazia nunca recebe lembrete
await auth.register('Bia', 'bia@x.com', 'segredo1');
const uid2 = auth.state.user.id;
await B.getBackupState(uid2, t0);
ok(!(await B.backupStatus(uid2, t0 + 40 * DAY)).due, 'Lembrete: conta sem tarefas não recebe aviso');

// ---------- banner na tela ----------
await auth.login('ana@x.com', 'segredo1');
const slot = document.createElement('div'); document.body.appendChild(slot);
await B.snoozeBackup(uid, 0, -1);      // limpa o adiamento
await db.setMeta(`backup:${uid}`, { baselineAt: Date.now() - 20 * DAY, lastBackupAt: null, remindAfter: null });
await mountBackupReminder(slot, uid);
ok(!!slot.querySelector('[data-backup="download"]') && /há 20 dias/.test(slot.textContent), 'Banner: aparece com a mensagem de 20 dias');
ok(slot.querySelector('section').getAttribute('aria-label') === 'Lembrete de backup' && [...slot.querySelectorAll('button')].every((b) => b.textContent.trim()), 'Banner: região rotulada e botões com texto');
slot.querySelector('[data-backup="later"]').click(); await wait(80);
ok(slot.innerHTML === '' && !(await B.backupStatus(uid)).due, 'Banner: "Lembrar depois" some e adia');
await db.setMeta(`backup:${uid}`, { baselineAt: Date.now() - 20 * DAY, lastBackupAt: null, remindAfter: null });
await mountBackupReminder(slot, uid);
slot.querySelector('[data-backup="download"]').click(); await wait(120);
const file = JSON.parse(await lastBlob.text());
ok(slot.innerHTML === '' && /^energy-planner-export-\d{4}-\d\d-\d\d\.json$/.test(clicked) && file.tasks.length === 1, 'Banner: "Baixar cópia" baixa o arquivo e some');
ok(file.schemaVersion === db.DB_VERSION && Array.isArray(file.inventory), 'Arquivo: leva schemaVersion e inventário');
ok(parseImport(JSON.stringify(file)).tasks.length === 1, 'Arquivo: o que exporta, importa de volta');
ok(!(await B.backupStatus(uid)).due && (await db.getMeta(`backup:${uid}`)).lastBackupAt > 0, 'Banner: baixar registra a data do backup');
const empty = document.createElement('div');
await mountBackupReminder(empty, uid);
ok(empty.innerHTML === '', 'Banner: sem necessidade, não mostra nada');

// ---------- Home e Perfil ----------
const root = document.getElementById('app');
await db.setMeta(`backup:${uid}`, { baselineAt: Date.now() - 30 * DAY, lastBackupAt: Date.now() - 20 * DAY, remindAfter: null });
await renderHome(root); await wait(120);
ok(!!root.querySelector('#backup-slot [data-backup="download"]') && /Faz 20 dias/.test(root.textContent), 'Home: mostra o lembrete quando está na hora');
await db.setMeta(`backup:${uid}`, { baselineAt: Date.now(), lastBackupAt: Date.now(), remindAfter: null });
await renderHome(root); await wait(120);
ok(!root.querySelector('[data-backup]'), 'Home: sem lembrete depois de um backup recente');

await renderProfile(root); await wait(120);
ok(/Último backup: hoje/.test(root.querySelector('[data-act="export"]').textContent), 'Perfil: mostra a data do último backup');
clicked = null;
root.querySelector('[data-act="export"]').click(); await wait(120);
ok(!!clicked && /Último backup: hoje/.test(root.querySelector('[data-act="export"]').textContent), 'Perfil: exportar continua baixando o arquivo');
ok(!!root.querySelector('#storage-card') && /backup é a sua garantia/.test(root.querySelector('#storage-card').textContent), 'Perfil: cartão de proteção dos dados (navegador sem suporte)');

// ---------- armazenamento persistente (simulado) ----------
ok(B.persistenceSupported() === false && (await B.isPersisted()) === null && (await B.autoRequestPersistence(uid)) === null, 'Persistência: sem suporte devolve null e não quebra');
let persisted = false, asks = 0;
Object.defineProperty(w.navigator, 'storage', { value: { persist: async () => { asks++; persisted = true; return true; }, persisted: async () => persisted }, configurable: true });
Object.defineProperty(globalThis, 'navigator', { value: w.navigator, configurable: true });
ok(B.persistenceSupported() && (await B.isPersisted()) === false, 'Persistência: com suporte, começa desprotegido');
ok((await B.autoRequestPersistence(uid2)) === false && asks === 0, 'Persistência: não pede enquanto não há tarefas');
ok((await B.autoRequestPersistence(uid)) === true && asks === 1, 'Persistência: pede quando já há dados');
persisted = false;
ok((await B.autoRequestPersistence(uid)) === false && asks === 1, 'Persistência: pede automático só uma vez');
await renderProfile(root); await wait(120);
ok(!!root.querySelector('[data-act="persist"]'), 'Perfil: botão "Proteger armazenamento" quando desprotegido');
root.querySelector('[data-act="persist"]').click(); await wait(120);
ok(asks === 2 && !root.querySelector('[data-act="persist"]') && /Protegido/.test(root.querySelector('#storage-card').textContent), 'Perfil: botão pede a proteção e mostra "Protegido"');

// ---------- apagar conta limpa o estado do backup ----------
await db.deleteUserAccount(uid);
ok((await db.getMeta(`backup:${uid}`)) === undefined, 'Excluir conta: apaga o estado do backup');
