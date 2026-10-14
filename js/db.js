// Banco de dados local (IndexedDB nativo).
// Mesmo nome e versão do app original ('energy-planner', v2), com os mesmos stores e índices.
//
// Formato dos registros (igual ao original):
//   User:       { id, name, email, passwordHash, salt, xp, createdAt }
//   Session:    { id, userId, createdAt }
//   Task:       { id, userId, title, energyCost, durationMinutes, deadline, category,
//                 completed, completedAt, startedAt, createdAt }
//                 category: work | study | personal | health | finance | leisure | social | creative
//   RoutineBlock: { id, userId, dayOfWeek, startTime, endTime, label }
//   Reward:     { id, userId, title, cost, createdAt }
//   RedemptionRecord: { id, userId, rewardTitle, cost, redeemedAt }

const DB_NAME = 'energy-planner';
const DB_VERSION = 2;

let dbPromise = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const open = indexedDB.open(DB_NAME, DB_VERSION);

      open.onupgradeneeded = (event) => {
        const db = open.result;
        const old = event.oldVersion;

        if (old < 1) {
          const users = db.createObjectStore('users', { keyPath: 'id' });
          users.createIndex('by-email', 'email', { unique: true });
          db.createObjectStore('sessions', { keyPath: 'id' });
          db.createObjectStore('tasks', { keyPath: 'id' }).createIndex('by-user', 'userId');
          db.createObjectStore('routineBlocks', { keyPath: 'id' }).createIndex('by-user', 'userId');
          db.createObjectStore('rewards', { keyPath: 'id' }).createIndex('by-user', 'userId');
        }
        if (old < 2) {
          db.createObjectStore('redemptionHistory', { keyPath: 'id' }).createIndex('by-user', 'userId');
        }
      };

      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
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

// ---------- Rotina ----------
export const getUserRoutineBlocks = (userId) => getAllByUser('routineBlocks', userId);
export const createRoutineBlock = (block) => addOne('routineBlocks', block);
export const deleteRoutineBlock = (id) => deleteOne('routineBlocks', id);

// ---------- Recompensas ----------
export const getUserRewards = (userId) => getAllByUser('rewards', userId);
export const createReward = (reward) => addOne('rewards', reward);
export const deleteReward = (id) => deleteOne('rewards', id);

// ---------- Histórico de resgates ----------
export const addRedemptionRecord = (record) => addOne('redemptionHistory', record);
export const getUserRedemptionHistory = (userId) => getAllByUser('redemptionHistory', userId);

// ---------- Resetar / excluir conta ----------
export async function resetUserData(userId) {
  const stores = [
    ['tasks', getUserTasks],
    ['routineBlocks', getUserRoutineBlocks],
    ['rewards', getUserRewards],
    ['redemptionHistory', getUserRedemptionHistory],
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
  await deleteOne('users', userId);
  await clearSessions();
}

// ---------- Exportar ----------
export async function exportAllData(userId) {
  const [tasks, routineBlocks, rewards, user, redemptionHistory] = await Promise.all([
    getUserTasks(userId),
    getUserRoutineBlocks(userId),
    getUserRewards(userId),
    getUser(userId),
    getUserRedemptionHistory(userId),
  ]);
  return {
    user: user ? { name: user.name, email: user.email, xp: user.xp } : null,
    tasks,
    routineBlocks,
    rewards,
    redemptionHistory,
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
  if (data.xp !== null && data.xp !== undefined) {
    const user = await getUser(userId);
    if (user) { user.xp = data.xp; await putOne('users', user); }
  }
  return { counts, skipped };
}
