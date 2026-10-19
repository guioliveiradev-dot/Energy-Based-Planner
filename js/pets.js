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

export function petLevelUpMessage({ petId, level, before }) {
  const name = ALL_PETS.find((p) => p.id === petId)?.name ?? 'Seu pet';
  // A Fagulha muda de forma (Faísca, Chama, Aura): avisa quando isso acontece.
  if (petId === 'fagulha' && before != null && fagulhaStage(bondLevel(before)) !== fagulhaStage(level)) {
    return `${name} subiu para o nível ${level} de vínculo e virou ${FAGULHA_STAGE_NAMES[fagulhaStage(level)]}!`;
  }
  return `${name} subiu para o nível ${level} de vínculo!`;
}

// Rosto do pet: desenho em SVG quando existe (Fagulha), senão o emoji de antes.
// pose: idle | work | sleep | cheer. bond: vínculo atual (define a forma da Fagulha).
export function petFaceHTML(pet, { bond = 0, pose = 'idle', size = 64 } = {}) {
  if (pet.id === 'fagulha') return fagulhaSVG({ pose, stage: fagulhaStage(bondLevel(bond)), style: 'flat', size });
  return `<span style="font-size:${Math.round(size * 0.55)}px;line-height:1" aria-hidden="true">${pet.emoji}</span>`;
}
