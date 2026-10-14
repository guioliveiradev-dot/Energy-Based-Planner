// Autenticação local (sem servidor). Substitui o AuthContext do React.
// Quem precisar reagir a mudanças usa subscribe(fn).

import {
  getActiveSession, getUser, createUser, createSession,
  clearSessions, getUserByEmail, updateUserXP,
} from './db.js';
import { generateSalt, hashPassword, verifyPassword } from './crypto.js';

export const state = { user: null, loading: true };

const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn(state));

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function init() {
  try {
    const session = await getActiveSession();
    if (session) state.user = (await getUser(session.userId)) || null;
  } catch (e) {
    console.error('Auth init error:', e);
  } finally {
    state.loading = false;
    emit();
  }
}

export async function refreshUser() {
  const session = await getActiveSession();
  if (session) {
    state.user = (await getUser(session.userId)) || null;
    emit();
  }
}

export async function register(name, email, password) {
  try {
    if (await getUserByEmail(email)) return { success: false, error: 'Email já cadastrado.' };
    const salt = await generateSalt();
    const passwordHash = await hashPassword(password, salt);
    const id = crypto.randomUUID();
    const user = { id, name, email, passwordHash, salt, xp: 0, createdAt: Date.now() };
    await createUser(user);
    await createSession({ id: crypto.randomUUID(), userId: id, createdAt: Date.now() });
    state.user = user;
    emit();
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message || 'Erro ao cadastrar.' };
  }
}

export async function login(email, password) {
  try {
    const user = await getUserByEmail(email);
    if (!user) return { success: false, error: 'Usuário não encontrado.' };
    if (!(await verifyPassword(password, user.salt, user.passwordHash))) {
      return { success: false, error: 'Senha incorreta.' };
    }
    await createSession({ id: crypto.randomUUID(), userId: user.id, createdAt: Date.now() });
    state.user = user;
    emit();
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message || 'Erro ao logar.' };
  }
}

export async function logout() {
  await clearSessions();
  state.user = null;
  emit();
}

export async function addXP(amount) {
  if (!state.user) return 0;
  const xp = await updateUserXP(state.user.id, amount);
  state.user = { ...state.user, xp };
  emit();
  return xp;
}
