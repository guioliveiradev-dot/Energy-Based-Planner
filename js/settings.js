// Preferências do usuário (guardadas no navegador).
// Para criar uma preferência nova: adicione em DEFAULTS e use getSetting/setSetting.

const KEY = 'energy-planner-settings';
const DEFAULTS = {
  alerts: true,   // som e vibração quando o cronômetro termina
};

function readAll() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return { ...DEFAULTS }; }
}

export const getSetting = (name) => readAll()[name];

export function setSetting(name, value) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...readAll(), [name]: value })); } catch { /* sem armazenamento */ }
}
