// Etapas (subtarefas) e notas de uma tarefa. Regras puras, sem tela.
// task.notes: texto livre (até 500 letras). task.subtasks: [{ id, title (até 80), done }] (até 20).
// As etapas são opcionais: concluir a tarefa não exige que todas estejam marcadas (sem cobrança).

export const MAX_NOTES = 500;
export const MAX_SUBTASKS = 20;
export const MAX_SUBTASK_TITLE = 80;

export const cleanNotes = (text) => (typeof text === 'string' ? text.replace(/\r\n/g, '\n').trim().slice(0, MAX_NOTES) : '');

export const newSubtask = (title, newId = () => crypto.randomUUID()) => ({ id: newId(), title: String(title).trim().slice(0, MAX_SUBTASK_TITLE), done: false });

// Aceita só o formato esperado (vem do formulário e de arquivos de backup).
export function cleanSubtasks(list, newId = () => crypto.randomUUID()) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const s of list) {
    if (!s || typeof s.title !== 'string' || !s.title.trim() || out.length >= MAX_SUBTASKS) continue;
    let id = typeof s.id === 'string' && s.id ? s.id : newId();
    if (seen.has(id)) id = newId();
    seen.add(id);
    out.push({ id, title: s.title.trim().slice(0, MAX_SUBTASK_TITLE), done: s.done === true });
  }
  return out;
}

export function subtaskProgress(task) {
  const list = Array.isArray(task.subtasks) ? task.subtasks : [];
  return { done: list.filter((s) => s.done).length, total: list.length };
}

// Marca ou desmarca uma etapa. Devolve a lista nova (não mexe na original).
export const toggleSubtask = (list, id) => list.map((s) => (s.id === id ? { ...s, done: !s.done } : s));

// Próxima ocorrência de uma tarefa que se repete: mesmas etapas, todas desmarcadas.
export const resetSubtasks = (list, newId = () => crypto.randomUUID()) => (Array.isArray(list) ? list.map((s) => ({ id: newId(), title: s.title, done: false })) : []);
