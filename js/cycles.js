// Ciclos de foco e descanso do cronômetro (opcionais). Regras puras, sem tela.
// task.cycle: null (sem ciclos) ou { focus, rest } em minutos, só com os valores de CYCLE_OPTIONS.
// Opcional: anchor (segundos) = quando você troca de fase na mão ("Descanso de 5 min" / "Foco"), o relógio dos ciclos recomeça dali.
// Sem anchor (ou 0) vale o horário normal: foco, descanso, foco...
// O descanso conta dentro do tempo da tarefa: o anel e o tempo total não mudam, e nada obriga a parar.
// Exemplo: tarefa de 40 min com 25 + 5 -> foco 1 (0-25), descanso (25-30), foco 2 (30-40).

export const CYCLE_OPTIONS = [
  { focus: 25, rest: 5 },
  { focus: 50, rest: 10 },
];

export function cleanCycle(c) {
  if (!c || typeof c !== 'object') return null;
  const found = CYCLE_OPTIONS.find((o) => o.focus === c.focus && o.rest === c.rest);
  if (!found) return null;
  const anchor = Number.isFinite(c.anchor) ? Math.max(-ANCHOR_LIMIT, Math.min(ANCHOR_LIMIT, Math.round(c.anchor))) : 0;
  return anchor ? { ...found, anchor } : { ...found };
}
const ANCHOR_LIMIT = 7 * 24 * 3600;

export const sameCycle = (a, b) => (!a && !b) || (!!a && !!b && a.focus === b.focus && a.rest === b.rest);

// Em que fase está quem já usou elapsedSec segundos de uma tarefa de totalSec segundos.
// Devolve null sem ciclo (ou se o tempo acabou). Senão:
// { phase: 'focus' | 'rest', index (bloco atual, de 1 a count), count (blocos), phaseRemaining (segundos), restMinutes, focusMinutes }
export function cyclePhase(cycle, elapsedSec, totalSec) {
  const c = cleanCycle(cycle);
  if (!c || !(totalSec > 0) || elapsedSec >= totalSec) return null;
  const anchor = c.anchor || 0;
  const e = Math.max(0, elapsedSec - anchor), total = totalSec - anchor;
  const focusSec = c.focus * 60, block = (c.focus + c.rest) * 60;
  const idx = Math.floor(e / block);
  const inFocus = e - idx * block < focusSec;
  const phaseEnd = idx * block + (inFocus ? focusSec : block);
  return {
    phase: inFocus ? 'focus' : 'rest',
    index: idx + 1,
    count: Math.ceil(total / block),
    phaseRemaining: Math.max(0, Math.min(phaseEnd, total) - e),
    focusMinutes: c.focus,
    restMinutes: c.rest,
  };
}
