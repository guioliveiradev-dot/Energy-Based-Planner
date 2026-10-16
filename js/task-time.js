// Cálculo do tempo de uma tarefa em andamento, com pausa.
// Tudo é calculado a partir de 3 campos guardados na própria tarefa:
//   startedAt   quando começou (ms)
//   pausedAt    quando foi pausada (ms) ou null se está rodando
//   pauseOffset soma, em ms, de todo o tempo que ficou pausada
// Assim a pausa sobrevive a fechar a janela, trocar de tela e recarregar a página.

export function elapsedMs(task, now = Date.now()) {
  if (!task.startedAt) return 0;
  const end = task.pausedAt ?? now;                    // pausada: o relógio "congela" em pausedAt
  return Math.max(0, end - task.startedAt - (task.pauseOffset || 0));
}

export function remainingSeconds(task, now = Date.now()) {
  return Math.max(0, task.durationMinutes * 60 - elapsedMs(task, now) / 1000);
}

export function pausedTask(task, now = Date.now()) {
  return task.pausedAt ? task : { ...task, pausedAt: now };
}

export function resumedTask(task, now = Date.now()) {
  if (!task.pausedAt) return task;
  return { ...task, pauseOffset: (task.pauseOffset || 0) + (now - task.pausedAt), pausedAt: null };
}
