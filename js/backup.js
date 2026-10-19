// Backup dos dados: arquivo JSON, lembrete a cada 2 semanas e armazenamento persistente.
//
// Os dados ficam só neste navegador (IndexedDB). O backup é a garantia contra limpar dados do
// site, trocar de aparelho ou o navegador apagar tudo por falta de espaço.
// O estado do lembrete fica no próprio banco (store 'meta'), junto dos dados que ele descreve.

import { exportAllData, getMeta, setMeta, getUserTasks } from './db.js';
import { getInventory, getActiveTheme, getActivePet } from './themes.js';
import { getPetState } from './pet-state.js';

export const BACKUP_INTERVAL_DAYS = 14;   // de quanto em quanto tempo lembrar
export const SNOOZE_DAYS = 3;             // "Lembrar depois" volta em quantos dias
const DAY = 24 * 60 * 60 * 1000;

const backupKey = (userId) => `backup:${userId}`;
const pad = (n) => String(n).padStart(2, '0');

// ---------- Arquivo de backup ----------

// Tudo o que o app guarda do usuário: banco + inventário, tema e pet (que ficam no localStorage).
export async function buildBackup(userId) {
  const data = await exportAllData(userId);
  data.inventory = getInventory(userId);
  data.activeTheme = getActiveTheme(userId);
  data.activePet = getActivePet(userId);
  data.petState = await getPetState(userId);   // escudos, baú e Fênix
  return data;
}

// energy-planner-export-2026-10-15.json (data local, não UTC)
export function backupFileName(date = new Date()) {
  return `energy-planner-export-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`;
}

// Gera o arquivo, baixa e registra a data do backup.
export async function downloadBackup(userId, now = Date.now()) {
  const data = await buildBackup(userId);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backupFileName(new Date(now));
  a.click();
  URL.revokeObjectURL(url);
  await markBackupDone(userId, now);
  return data;
}

// ---------- Estado do lembrete ----------
// { baselineAt, lastBackupAt, remindAfter }
//   baselineAt:   quando o app viu este usuário pela primeira vez (conta os 14 dias de quem nunca fez backup)
//   lastBackupAt: último backup baixado (ou null)
//   remindAfter:  depois de "Lembrar depois", só volta a avisar a partir desta data

export async function getBackupState(userId, now = Date.now()) {
  let state = await getMeta(backupKey(userId));
  if (!state) {
    state = { baselineAt: now, lastBackupAt: null, remindAfter: null };
    await setMeta(backupKey(userId), state);
  }
  return state;
}

export async function markBackupDone(userId, now = Date.now()) {
  const state = await getBackupState(userId, now);
  await setMeta(backupKey(userId), { ...state, lastBackupAt: now, remindAfter: null });
}

export async function snoozeBackup(userId, now = Date.now(), days = SNOOZE_DAYS) {
  const state = await getBackupState(userId, now);
  await setMeta(backupKey(userId), { ...state, remindAfter: now + days * DAY });
}

const wholeDays = (from, to) => Math.floor((to - from) / DAY);

// Devolve { due, days, never }:
//   due:   hora de lembrar? (só lembra quem já tem tarefas, para não incomodar uma conta vazia)
//   days:  há quantos dias foi o último backup (ou, se nunca fez, há quantos dias usa o app)
//   never: nunca baixou um backup
export async function backupStatus(userId, now = Date.now()) {
  const state = await getBackupState(userId, now);
  const reference = state.lastBackupAt ?? state.baselineAt;
  const days = Math.max(0, wholeDays(reference, now));
  const never = state.lastBackupAt == null;
  const snoozed = state.remindAfter != null && now < state.remindAfter;
  const overdue = now >= reference + BACKUP_INTERVAL_DAYS * DAY;      // relógio voltando atrás nunca dispara
  let due = overdue && !snoozed;
  if (due) due = (await getUserTasks(userId)).length > 0;
  return { due, days, never };
}

// "Último backup: hoje" / "ontem" / "há 5 dias" / "Nenhum backup ainda"
export function lastBackupText(state, now = Date.now()) {
  if (!state || state.lastBackupAt == null) return 'Nenhum backup ainda';
  const d = wholeDays(state.lastBackupAt, now);
  if (d <= 0) return 'Último backup: hoje';
  if (d === 1) return 'Último backup: ontem';
  return `Último backup: há ${d} dias`;
}

// ---------- Armazenamento persistente ----------
// Com a permissão, o navegador não apaga os dados do site sozinho quando falta espaço.
// O Chrome decide em silêncio (ajuda o app estar instalado); o Firefox pergunta ao usuário.

export const persistenceSupported = () => typeof navigator !== 'undefined' && !!(navigator.storage && navigator.storage.persist);

// true | false | null (o navegador não informa)
export async function isPersisted() {
  try {
    return navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted() : null;
  } catch { return null; }
}

export async function requestPersistence() {
  try {
    return persistenceSupported() ? await navigator.storage.persist() : false;
  } catch { return false; }
}

// Pede uma vez, sozinho, quando o usuário já tem dados para proteger. Devolve true | false | null.
export async function autoRequestPersistence(userId, now = Date.now()) {
  if (!persistenceSupported()) return null;
  if (await isPersisted()) return true;
  const asked = await getMeta('storage');
  if (asked && asked.persistAskedAt) return false;               // já pedimos: não insiste
  if ((await getUserTasks(userId)).length === 0) return false;   // sem dados ainda, espera
  await setMeta('storage', { persistAskedAt: now });
  return requestPersistence();
}
