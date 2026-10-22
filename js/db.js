// Banco de dados local (IndexedDB nativo).
// Nome 'energy-planner' e os mesmos stores e índices do app original (v1 e v2); a v3 acrescenta 'meta'.
//
// Formato dos registros (igual ao original):
//   User:       { id, name, email, passwordHash, salt, xp, createdAt }
//   Session:    { id, userId, createdAt }
//   Task:       { id, userId, title, energyCost, durationMinutes, deadline, category,
//                 completed, completedAt, startedAt, pausedAt, pauseOffset, createdAt }
//                 category: work | study | personal | health | finance | leisure | social | creative
//   RoutineBlock: { id, userId, dayOfWeek, startTime, endTime, label }
//   Reward:     { id, userId, title, cost, createdAt }
//   RedemptionRecord: { id, userId, rewardTitle, cost, redeemedAt }
//   Meta (v3):  { key, value }   -> dados do próprio app (ex.: 'backup:<userId>', 'storage')
//   PetBond (v4): { id: '<userId>:<petId>', userId, petId, bond, updatedAt }  -> vínculo (tarefas concluídas com o pet ativo)
//
// ---------- Como mudar o banco sem perder dados ----------
// Cada item de MIGRATIONS leva o banco da versão anterior para a sua versão.
//  - NUNCA edite uma migração que já foi publicada: crie a próxima (version: 4, 5...).
//  - O número do banco (DB_VERSION) é sempre a versão da última migração.
//  - up(db, tx) roda dentro da transação de atualização. Para mexer em registros que já existem,
//    use tx.objectStore('tasks') com cursor; para criar uma tabela, db.createObjectStore(...).
//  - Quem abre o app só roda as migrações que ainda faltam (quem está na v2 roda só a v3).
//  - Cada migração precisa de um teste em tests/10-versao-do-banco.mjs.
const DB_NAME = 'energy-planner';

const MIGRATIONS = [
  {
    version: 1,
    up(db) {
      const users = db.createObjectStore('users', { keyPath: 'id' });
      users.createIndex('by-email', 'email', { unique: true });
      db.createObjectStore('sessions', { keyPath: 'id' });
      db.createObjectStore('tasks', { keyPath: 'id' }).createIndex('by-user', 'userId');
      db.createObjectStore('routineBlocks', { keyPath: 'id' }).createIndex('by-user', 'userId');
      db.createObjectStore('rewards', { keyPath: 'id' }).createIndex('by-user', 'userId');
    },
  },
  {
    version: 2,
    up(db) {
      db.createObjectStore('redemptionHistory', { keyPath: 'id' }).createIndex('by-user', 'userId');
    },
  },
  {
    version: 3,
    up(db) {
      db.createObjectStore('meta', { keyPath: 'key' });
    },
  },
  {
    version: 4,
    up(db) {
      db.createObjectStore('petBonds', { keyPath: 'id' }).createIndex('by-user', 'userId');
    },
  },
];

export const DB_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

let dbPromise = null;
const replacedListeners = new Set();

// Avisa quando outra aba/versão do app atualizou o banco e esta aba precisa recarregar.
export function onDatabaseReplaced(fn) {
  replacedListeners.add(fn);
  return () => replacedListeners.delete(fn);
}

export function getDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const open = indexedDB.open(DB_NAME, DB_VERSION);

      open.onupgradeneeded = (event) => {
        const db = open.result;
        const tx = open.transaction;
        for (const m of MIGRATIONS) {
          if (m.version > event.oldVersion) m.up(db, tx);
        }
      };

      open.onblocked = () => console.warn('Atualização do banco esperando outra aba do app fechar.');

      open.onsuccess = () => {
        const db = open.result;
        // Outra aba pediu uma versão maior: libera o banco para ela não ficar travada.
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
          replacedListeners.forEach((fn) => fn());
        };
        resolve(db);
      };
      open.onerror = () => {
        const err = open.error;
        if (err && err.name === 'VersionError') {
          const e = new Error('Os dados deste navegador foram criados por uma versão mais nova do app.');
          e.code = 'DB_TOO_NEW';
          reject(e);
        } else {
          reject(err);
        }
      };
    });
  }
  return dbPromise;
}

// Executa uma operação numa transação e só resolve quando ela termina de gravar.
async function run(storeName, mode, fn) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const request = fn(tx.objectStore(storeName));
    tx.oncomplete = () => resolve(request ? request.result : undefined);
    tx.onerror = (e) => reject(e.target.error);
    tx.onabort = () => reject(tx.error);
  });
}

const getOne = (store, key) => run(store, 'readonly', (s) => s.get(key));
const putOne = (store, value) => run(store, 'readwrite', (s) => s.put(value));
const addOne = (store, value) => run(store, 'readwrite', (s) => s.add(value));
const deleteOne = (store, key) => run(store, 'readwrite', (s) => s.delete(key));
const getAll = (store) => run(store, 'readonly', (s) => s.getAll());
const getAllByUser = (store, userId) => run(store, 'readonly', (s) => s.index('by-user').getAll(userId));

// ---------- Meta (dados do próprio app) ----------
export async function getMeta(key) {
  const row = await getOne('meta', key);
  return row ? row.value : undefined;
}
export const setMeta = (key, value) => putOne('meta', { key, value });
export const deleteMeta = (key) => deleteOne('meta', key);

// ---------- Usuários ----------
export const createUser = (user) => addOne('users', user);
export const getUserByEmail = (email) => run('users', 'readonly', (s) => s.index('by-email').get(email));
export const getUser = (id) => getOne('users', id);

export async function updateUserXP(userId, xpDelta) {
  const user = await getUser(userId);
  if (!user) return 0;
  user.xp = Math.max(0, (user.xp || 0) + xpDelta);
  await putOne('users', user);
  return user.xp;
}

// ---------- Sessões ----------
export const createSession = (session) => putOne('sessions', session);
export async function getActiveSession() {
  const all = await getAll('sessions');
  return all[0];
}
export const clearSessions = () => run('sessions', 'readwrite', (s) => s.clear());

// ---------- Tarefas ----------
export const getUserTasks = (userId) => getAllByUser('tasks', userId);
export const createTask = (task) => addOne('tasks', task);
export const updateTask = (task) => putOne('tasks', task);
export const deleteTask = (id) => deleteOne('tasks', id);

// ---------- Vínculo dos pets ----------
export const getUserPetBonds = (userId) => getAllByUser('petBonds', userId);

// Soma ao vínculo do pet. Devolve { before, after }.
export async function addPetBond(userId, petId, amount = 1, now = Date.now()) {
  const id = `${userId}:${petId}`;
  const prev = await getOne('petBonds', id);
  const before = prev ? prev.bond : 0;
  await putOne('petBonds', { id, userId, petId, bond: before + amount, updatedAt: now });
  return { before, after: before + amount };
}

// ---------- Rotina ----------
export const getUserRoutineBlocks = (userId) => getAllByUser('routineBlocks', userId);
export const createRoutineBlock = (block) => addOne('routineBlocks', block);
export const deleteRoutineBlock = (id) => deleteOne('routineBlocks', id);

// ---------- Recompensas ----------
export const getUserRewards = (userId) => getAllByUser('rewards', userId);
export const createReward = (reward) => addOne('rewards', reward);
export const deleteReward = (id) => deleteOne('rewards', id);
// Muda título e/ou custo de uma recompensa (o resto fica igual). Devolve a recompensa nova, ou null se não existe.
export async function updateReward(id, changes) {
  const reward = await getOne('rewards', id);
  if (!reward) return null;
  const next = { ...reward, ...changes, id: reward.id, userId: reward.userId };
  await putOne('rewards', next);
  return next;
}

// ---------- Histórico de resgates ----------
export const addRedemptionRecord = (record) => addOne('redemptionHistory', record);
export const getUserRedemptionHistory = (userId) => getAllByUser('redemptionHistory', userId);

// ---------- Resetar / excluir conta ----------
export async function resetUserData(userId) {
  await deleteMeta(`petstate:${userId}`);   // escudos, baú, Fênix e missão do Robô
  const stores = [
    ['tasks', getUserTasks],
    ['routineBlocks', getUserRoutineBlocks],
    ['rewards', getUserRewards],
    ['redemptionHistory', getUserRedemptionHistory],
    ['petBonds', getUserPetBonds],
  ];
  for (const [store, getter] of stores) {
    const items = await getter(userId);
    for (const item of items) await deleteOne(store, item.id);
  }
  const user = await getUser(userId);
  if (user) {
    user.xp = 0;
    await putOne('users', user);
  }
}

export async function deleteUserAccount(userId) {
  await resetUserData(userId);
  await deleteMeta(`backup:${userId}`);
  await deleteOne('users', userId);
  await clearSessions();
}

// ---------- Exportar ----------
export async function exportAllData(userId) {
  const [tasks, routineBlocks, rewards, user, redemptionHistory, petBonds] = await Promise.all([
    getUserTasks(userId),
    getUserRoutineBlocks(userId),
    getUserRewards(userId),
    getUser(userId),
    getUserRedemptionHistory(userId),
    getUserPetBonds(userId),
  ]);
  return {
    user: user ? { name: user.name, email: user.email, xp: user.xp } : null,
    tasks,
    routineBlocks,
    rewards,
    redemptionHistory,
    petBonds: petBonds.map(({ petId, bond, updatedAt }) => ({ petId, bond, updatedAt })),
    schemaVersion: DB_VERSION,
    exportedAt: new Date().toISOString(),
  };
}

// ---------- Importar ----------
// Recebe dados já validados por data-import.js. Registros com o mesmo id são atualizados,
// e registros que pertencem a outra conta são ignorados.
export async function importUserData(userId, data) {
  const counts = { tasks: 0, routineBlocks: 0, rewards: 0, redemptionHistory: 0 };
  let skipped = 0;
  for (const store of Object.keys(counts)) {
    for (const item of data[store] || []) {
      const existing = await getOne(store, item.id);
      if (existing && existing.userId !== userId) { skipped++; continue; }
      await putOne(store, { ...item, userId });
      counts[store]++;
    }
  }
  // Vínculo: o id leva o userId da conta de destino; se já existe, fica o maior (nunca perde progresso).
  let petBonds = 0;
  for (const b of data.petBonds || []) {
    const id = `${userId}:${b.petId}`;
    const existing = await getOne('petBonds', id);
    await putOne('petBonds', { id, userId, petId: b.petId, bond: Math.max(b.bond, existing ? existing.bond : 0), updatedAt: Date.now() });
    petBonds++;
  }
  if (data.xp !== null && data.xp !== undefined) {
    const user = await getUser(userId);
    if (user) { user.xp = data.xp; await putOne('users', user); }
  }
  return { counts, skipped, petBonds };
}
