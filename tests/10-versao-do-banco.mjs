// Versão do banco e migrações: quem está na v2 chega na v3 sem perder nada.
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const base = new URL('../js/', import.meta.url).href;

// Abre o banco "do jeito antigo" (v2), como estava no app antes da Fase 0, e grava dados.
function openOld(version) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('energy-planner', version);
    req.onupgradeneeded = () => {
      const d = req.result;
      d.createObjectStore('users', { keyPath: 'id' }).createIndex('by-email', 'email', { unique: true });
      d.createObjectStore('sessions', { keyPath: 'id' });
      d.createObjectStore('tasks', { keyPath: 'id' }).createIndex('by-user', 'userId');
      d.createObjectStore('routineBlocks', { keyPath: 'id' }).createIndex('by-user', 'userId');
      d.createObjectStore('rewards', { keyPath: 'id' }).createIndex('by-user', 'userId');
      d.createObjectStore('redemptionHistory', { keyPath: 'id' }).createIndex('by-user', 'userId');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
const put = (d, store, v) => new Promise((res, rej) => { const tx = d.transaction(store, 'readwrite'); tx.objectStore(store).put(v); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });

// ---------- v2 -> v3 ----------
const old = await openOld(2);
await put(old, 'users', { id: 'u1', name: 'Ana', email: 'ana@x.com', passwordHash: 'h', salt: 's', xp: 321, createdAt: 1 });
await put(old, 'tasks', { id: 't1', userId: 'u1', title: 'Antiga', energyCost: 4, durationMinutes: 20, category: 'work', completed: true, completedAt: 5, createdAt: 1 });
await put(old, 'rewards', { id: 'r1', userId: 'u1', title: 'Café', cost: 50, createdAt: 1 });
ok(!old.objectStoreNames.contains('meta'), 'Base: o banco v2 não tem a tabela meta');
old.close();

const db = await import(base + 'db.js?v2');
ok(db.DB_VERSION === 3, 'Versão: o app está na v3');
const d3 = await db.getDB();
ok(d3.version === 3 && d3.objectStoreNames.contains('meta'), 'Migração: o banco passou para v3 e ganhou a tabela meta');
const user = await db.getUser('u1');
const tasks = await db.getUserTasks('u1');
const rewards = await db.getUserRewards('u1');
ok(user.xp === 321 && user.name === 'Ana' && tasks.length === 1 && tasks[0].title === 'Antiga' && rewards.length === 1, 'Migração: usuário, tarefas e recompensas continuam lá');
ok((await db.getUserByEmail('ana@x.com')).id === 'u1', 'Migração: índice por e-mail continua funcionando');
await db.setMeta('chave', { a: 1 });
ok((await db.getMeta('chave')).a === 1 && (await db.getMeta('nao-existe')) === undefined, 'Meta: grava e lê; chave ausente = undefined');
await db.deleteMeta('chave');
ok((await db.getMeta('chave')) === undefined, 'Meta: apaga');
d3.close();

// ---------- v0 -> v3 (instalação nova) ----------
globalThis.indexedDB = new IDBFactory();
const fresh = await import(base + 'db.js?fresh');
const dn = await fresh.getDB();
const names = [...dn.objectStoreNames].sort().join();
ok(dn.version === 3 && names === 'meta,redemptionHistory,rewards,routineBlocks,sessions,tasks,users', 'Instalação nova: cria todas as tabelas na v3');
await fresh.createUser({ id: 'x', name: 'N', email: 'n@x.com', passwordHash: 'h', salt: 's', xp: 0, createdAt: 1 });
ok((await fresh.getUser('x')).name === 'N', 'Instalação nova: grava e lê');
dn.close();

// ---------- banco mais novo que o app ----------
globalThis.indexedDB = new IDBFactory();
await new Promise((res, rej) => { const r = indexedDB.open('energy-planner', 99); r.onsuccess = () => { r.result.close(); res(); }; r.onerror = () => rej(r.error); });
const tooNew = await import(base + 'db.js?toonew');
let err = null;
try { await tooNew.getDB(); } catch (e) { err = e; }
ok(err && err.code === 'DB_TOO_NEW' && /mais nova/.test(err.message), 'Banco mais novo: erro claro (DB_TOO_NEW), sem apagar nada');

// ---------- arquivo de backup de versão futura ----------
globalThis.indexedDB = new IDBFactory();
const { parseImport } = await import(base + 'data-import.js?imp');
const future = parseImport(JSON.stringify({ schemaVersion: 99, tasks: [] }));
ok(future.error && /versão mais nova/.test(future.error), 'Importar: recusa arquivo de versão mais nova com explicação');
ok(!parseImport(JSON.stringify({ schemaVersion: 3, tasks: [] })).error && !parseImport(JSON.stringify({ schemaVersion: 2, tasks: [] })).error, 'Importar: aceita a versão atual e as antigas');
ok(!parseImport(JSON.stringify({ tasks: [] })).error, 'Importar: aceita arquivo sem versão (Lovable e exportações antigas)');
