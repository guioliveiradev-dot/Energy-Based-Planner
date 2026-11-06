// Ciclos de foco e descanso do cronômetro (opcionais). Regras puras, sem tela.
// task.cycle: null (sem ciclos) ou { focus, rest } em minutos, só com os valores de CYCLE_OPTIONS.
// O descanso conta dentro do tempo da tarefa: o anel e o tempo total não mudam, e nada obriga a parar.
// Exemplo: tarefa de 40 min com 25 + 5 -> foco 1 (0-25), descanso (25-30), foco 2 (30-40).

export const CYCLE_OPTIONS = [
  { focus: 25, rest: 5 },
  { focus: 50, rest: 10 },
];

export function cleanCycle(c) {
  if (!c || typeof c !== 'object') return null;
  const found = CYCLE_OPTIONS.find((o) => o.focus === c.focus && o.rest === c.rest);
  return found ? { ...found } : null;
}

export const sameCycle = (a, b) => (!a && !b) || (!!a && !!b && a.focus === b.focus && a.rest === b.rest);

// Em que fase está quem já usou elapsedSec segundos de uma tarefa de totalSec segundos.
// Devolve null sem ciclo (ou se o tempo acabou). Senão:
// { phase: 'focus' | 'rest', index (bloco atual, de 1 a count), count (blocos), phaseRemaining (segundos), restMinutes, focusMinutes }
export function cyclePhase(cycle, elapsedSec, totalSec) {
  const c = cleanCycle(cycle);
  if (!c || !(totalSec > 0) || elapsedSec >= totalSec) return null;
  const e = Math.max(0, elapsedSec);
  const focusSec = c.focus * 60, block = (c.focus + c.rest) * 60;
  const idx = Math.floor(e / block);
  const inFocus = e - idx * block < focusSec;
  const phaseEnd = idx * block + (inFocus ? focusSec : block);
  return {
    phase: inFocus ? 'focus' : 'rest',
    index: idx + 1,
    count: Math.ceil(totalSec / block),
    phaseRemaining: Math.max(0, Math.min(phaseEnd, totalSec) - e),
    focusMinutes: c.focus,
    restMinutes: c.rest,
  };
}
