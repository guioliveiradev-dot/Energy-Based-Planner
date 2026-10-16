// Lê e valida um arquivo JSON exportado pelo Energy Based Planner (do Lovable ou deste app).
// Nada é gravado aqui: só devolve os dados limpos, ou { error }.

import { FREE_THEMES, SHOP_THEMES, SHOP_PETS } from './themes.js';
import { CATEGORY_LABELS } from './categories.js';
import { DB_VERSION } from './db.js';

const MAX_CHARS = 5 * 1024 * 1024;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const clamp = (v, min, max) => Math.max(min, Math.min(max, Math.round(v)));

// repeat válido: { days: [0..6] } sem repetidos e em ordem; senão null
function cleanRepeat(r) {
  if (!r || !Array.isArray(r.days)) return null;
  const days = [...new Set(r.days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort((a, b) => a - b);
  return days.length ? { days } : null;
}

export function parseImport(text) {
  if (typeof text !== 'string' || text.length > MAX_CHARS) return { error: 'Arquivo vazio ou grande demais.' };

  let data;
  try { data = JSON.parse(text); } catch { return { error: 'O arquivo não é um JSON válido.' }; }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { error: 'Formato não reconhecido.' };

  // Arquivos sem schemaVersion vêm do Lovable ou de versões antigas e são aceitos normalmente.
  if (isNum(data.schemaVersion) && data.schemaVersion > DB_VERSION) {
    return { error: 'Este arquivo foi criado por uma versão mais nova do Energy Based Planner. Atualize o app e tente de novo.' };
  }

  const keys = ['tasks', 'routineBlocks', 'rewards', 'redemptionHistory'];
  if (!keys.some((k) => Array.isArray(data[k])) && !data.user) {
    return { error: 'Este arquivo não parece ser uma exportação do Energy Based Planner.' };
  }

  let skipped = 0;
  const clean = (key, fn) => (Array.isArray(data[key]) ? data[key] : []).flatMap((item) => {
    const out = item && typeof item === 'object' ? fn(item) : null;
    if (!out) { skipped++; return []; }
    return [out];
  });

  const tasks = clean('tasks', (t) => {
    if (!isStr(t.id) || !isStr(t.title) || !isNum(t.energyCost) || !isNum(t.durationMinutes) || !CATEGORY_LABELS[t.category]) return null;
    return {
      id: t.id, title: t.title.trim().slice(0, 100),
      energyCost: clamp(t.energyCost, 1, 10), durationMinutes: clamp(t.durationMinutes, 1, 1440),
      deadline: isNum(t.deadline) ? t.deadline : null, category: t.category,
      completed: t.completed === true, completedAt: isNum(t.completedAt) ? t.completedAt : null,
      startedAt: isNum(t.startedAt) ? t.startedAt : null,
      pausedAt: isNum(t.pausedAt) ? t.pausedAt : null, pauseOffset: isNum(t.pauseOffset) && t.pauseOffset >= 0 ? t.pauseOffset : 0,
      repeat: cleanRepeat(t.repeat), availableFrom: isNum(t.availableFrom) ? t.availableFrom : null,
      createdAt: isNum(t.createdAt) ? t.createdAt : Date.now(),
    };
  });

  const routineBlocks = clean('routineBlocks', (b) => {
    if (!isStr(b.id) || !isStr(b.label) || !Number.isInteger(b.dayOfWeek) || b.dayOfWeek < 0 || b.dayOfWeek > 6) return null;
    if (!TIME.test(b.startTime) || !TIME.test(b.endTime)) return null;
    return { id: b.id, label: b.label.trim().slice(0, 50), dayOfWeek: b.dayOfWeek, startTime: b.startTime, endTime: b.endTime };
  });

  const rewards = clean('rewards', (r) => {
    if (!isStr(r.id) || !isStr(r.title) || !isNum(r.cost) || r.cost <= 0) return null;
    return { id: r.id, title: r.title.trim().slice(0, 50), cost: Math.round(r.cost), createdAt: isNum(r.createdAt) ? r.createdAt : Date.now() };
  });

  const redemptionHistory = clean('redemptionHistory', (h) => {
    if (!isStr(h.id) || !isStr(h.rewardTitle) || !isNum(h.cost) || h.cost < 0 || !isNum(h.redeemedAt)) return null;
    return { id: h.id, rewardTitle: h.rewardTitle.trim().slice(0, 50), cost: Math.round(h.cost), redeemedAt: h.redeemedAt };
  });

  const themeIds = SHOP_THEMES.map((t) => t.id);
  const petIds = SHOP_PETS.map((p) => p.id);
  const inventory = Array.isArray(data.inventory)
    ? data.inventory.filter((id) => themeIds.includes(id) || petIds.includes(id)) : [];

  return {
    tasks, routineBlocks, rewards, redemptionHistory, inventory, skipped,
    xp: data.user && isNum(data.user.xp) && data.user.xp >= 0 ? Math.floor(data.user.xp) : null,
    theme: [...themeIds, ...FREE_THEMES.map((t) => t.id)].includes(data.activeTheme) ? data.activeTheme : null,
    pet: petIds.includes(data.activePet) ? data.activePet : null,
  };
}
