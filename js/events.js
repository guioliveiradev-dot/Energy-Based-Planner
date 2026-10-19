// Aviso interno de "os dados mudaram" (ex.: o painel admin mudou vínculo, pontos ou tarefas).
// As telas abertas (Home, Perfil, Tarefas) escutam e se atualizam sozinhas, sem precisar trocar de aba.
const bus = new EventTarget();

export const emitDataChanged = (reason = '') => bus.dispatchEvent(new CustomEvent('data-changed', { detail: { reason } }));

// Devolve a função para parar de escutar (chame ao sair da tela).
export function onDataChanged(fn) {
  const handler = (e) => fn(e.detail);
  bus.addEventListener('data-changed', handler);
  return () => bus.removeEventListener('data-changed', handler);
}
