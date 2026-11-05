// Vínculo dos pets (regras puras + registro ao concluir tarefa).
//
// Regras do sistema (decididas no ROADMAP, B1):
//  - Cada tarefa concluída com um pet ativo soma 1 ao vínculo DAQUELE pet.
//  - O vínculo nunca diminui. Trocar de pet ou ficar dias sem usar não tira nada ("sem culpa").
//  - Cada nível de vínculo aumenta o poder do pet e libera acessórios (B5).
//  - O vínculo não entra na conta de pontos nem de nível do usuário.

import { addPetBond } from './db.js';
import { getActivePet, ALL_PETS } from './themes.js';
import { fagulhaSVG, fagulhaStage, FAGULHA_STAGE_NAMES } from './pet-art.js';
import { petDrawingSVG, PET_STAGE_NAMES } from './pet-drawings.js';
import { icon } from './icons.js';

// Vínculo (tarefas concluídas) necessário para ENTRAR em cada nível. Nível 1 = 0.
// Com 3 tarefas por dia: nível 2 em ~2 dias, 3 em ~5, 4 em ~12 e 5 em ~23. Números ajustáveis.
export const BOND_THRESHOLDS = [0, 5, 15, 35, 70];
export const MAX_BOND_LEVEL = BOND_THRESHOLDS.length;

export function bondLevel(bond) {
  let level = 1;
  for (let i = 0; i < BOND_THRESHOLDS.length; i++) if (bond >= BOND_THRESHOLDS[i]) level = i + 1;
  return level;
}

// { level, bond, next (vínculo do próximo nível ou null), remaining, pct (0 a 100 dentro do nível), max }
export function bondProgress(bond) {
  const b = Math.max(0, Math.floor(bond || 0));
  const level = bondLevel(b);
  if (level >= MAX_BOND_LEVEL) return { level, bond: b, next: null, remaining: 0, pct: 100, max: true };
  const floor = BOND_THRESHOLDS[level - 1];
  const next = BOND_THRESHOLDS[level];
  return { level, bond: b, next, remaining: next - b, pct: Math.round(((b - floor) / (next - floor)) * 100), max: false };
}

// Chamado quando uma tarefa é concluída. Sem pet ativo, não faz nada (devolve null).
// Devolve { petId, before, after, level, leveledUp }.
export async function recordTaskForPet(userId) {
  const petId = getActivePet(userId);
  if (!petId || !ALL_PETS.some((p) => p.id === petId)) return null;
  const { before, after } = await addPetBond(userId, petId, 1);
  return { petId, before, after, level: bondLevel(after), leveledUp: bondLevel(after) > bondLevel(before) };
}

// Nome da forma do pet naquele nível de vínculo (a Fagulha: Faísca, Chama, Aura; os outros 6 têm nomes próprios). null se o pet não tem formas.
export function petFormName(petId, level) {
  const stage = fagulhaStage(level);
  if (petId === 'fagulha') return FAGULHA_STAGE_NAMES[stage];
  return PET_STAGE_NAMES[petId]?.[stage] ?? null;
}

export function petLevelUpMessage({ petId, level, before }) {
  const name = ALL_PETS.find((p) => p.id === petId)?.name ?? 'Seu pet';
  // O pet muda de forma nos níveis 3 e 5: avisa quando isso acontece.
  if (petFormName(petId, level) && before != null && fagulhaStage(bondLevel(before)) !== fagulhaStage(level)) {
    return `${name} subiu para o nível ${level} de vínculo e virou ${petFormName(petId, level)}!`;
  }
  return `${name} subiu para o nível ${level} de vínculo!`;
}

// Rosto do pet: desenho em SVG (a Fagulha em js/pet-art.js; os outros 6 em js/pet-drawings.js). Todos mudam de forma com o vínculo.
// pose: idle | work | sleep | cheer. bond: vínculo atual (define a forma: níveis 1-2, 3-4 e 5).
export function petFaceHTML(pet, { bond = 0, pose = 'idle', size = 64 } = {}) {
  if (pet.id === 'fagulha') return fagulhaSVG({ pose, stage: fagulhaStage(bondLevel(bond)), style: 'flat', size });
  return petDrawingSVG(pet.id, { pose, stage: fagulhaStage(bondLevel(bond)), size }) || icon('paw-print', Math.round(size * 0.55));
}
