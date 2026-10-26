// Etapas (subtarefas) e notas nas tarefas: regras, formulário, cartão, repetição, busca e importação.
import 'fake-indexeddb/auto';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><head><title>Base</title></head><body><div id="app"></div><div id="toasts"></div></body></html>', { url: 'http://localhost/' });
const w = dom.window;
for (const k of ['window', 'document', 'location', 'navigator']) Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });
const base = new URL('../js/', import.meta.url).href;
const SU = await import(base + 'subtasks.js');
const { nextInstance } = await import(base + 'recurrence.js');
const { matchesSearch } = await import(base + 'task-view.js');
const { parseImport } = await import(base + 'data-import.js');
const auth = await import(base + 'auth.js');
const db = await import(base + 'db.js');
const { renderTasks } = await import(base + 'pages/tasks.js');
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const wait = (ms = 100) => new Promise((r) => setTimeout(r, ms));

// ---------- regras ----------
ok(SU.cleanNotes('  linha 1\r\nlinha 2  ') === 'linha 1\nlinha 2' && SU.cleanNotes('x'.repeat(900)).length === 500 && SU.cleanNotes(42) === '' && SU.cleanNotes(null) === '', 'Notas: aparam espaços, aceitam várias linhas, no máximo 500 letras');
const ids = (() => { let i = 0; return () => 'n' + ++i; })();
const clean = SU.cleanSubtasks([
  { id: 'a', title: '  Primeira  ', done: true }, { id: 'a', title: 'Repetida', done: false }, { title: 'Sem id', done: 'sim' },
  { id: 'b', title: '   ' }, { id: 'c' }, null, 'texto', { id: 'd', title: 'x'.repeat(200) },
], ids);
ok(clean.length === 4 && clean[0].title === 'Primeira' && clean[0].done === true && clean[1].id !== 'a' && clean[2].done === false && clean[3].title.length === 80, 'Etapas: descarta vazias e inválidas, renomeia id repetido, só aceita done verdadeiro de verdade, título até 80');
ok(SU.cleanSubtasks('x').length === 0 && SU.cleanSubtasks(Array.from({ length: 50 }, (_, i) => ({ title: 'e' + i }))).length === 20, 'Etapas: não-lista vira vazio; no máximo 20');
const s1 = SU.newSubtask('  Separar materiais  ', () => 'id1');
ok(s1.id === 'id1' && s1.title === 'Separar materiais' && s1.done === false, 'Etapas: nova etapa começa desmarcada');
const list = [{ id: 'a', title: 'A', done: false }, { id: 'b', title: 'B', done: true }];
const toggled = SU.toggleSubtask(list, 'a');
ok(toggled[0].done === true && toggled[1].done === true && list[0].done === false && SU.toggleSubtask(list, 'zzz').every((s, i) => s.done === list[i].done), 'Etapas: marcar não altera a lista original; id desconhecido não faz nada');
ok(SU.subtaskProgress({ subtasks: toggled }).done === 2 && SU.subtaskProgress({ subtasks: toggled }).total === 2 && SU.subtaskProgress({}).total === 0 && SU.subtaskProgress({ subtasks: null }).total === 0, 'Progresso: conta marcadas e total (tarefa sem etapas = 0 de 0)');
const reset = SU.resetSubtasks(toggled, ids);
ok(reset.length === 2 && reset.every((s) => s.done === false) && reset[0].id !== 'a' && reset.map((s) => s.title).join() === 'A,B' && SU.resetSubtasks(undefined).length === 0, 'Repetição: próxima vez, mesmas etapas e todas desmarcadas (ids novos)');

// ---------- tarefa que se repete ----------
const habit = { id: 'h', userId: 'u', title: 'Treino', energyCost: 5, durationMinutes: 30, category: 'health', repeat: { days: [1, 3, 5] }, notes: 'Levar a toalha', subtasks: toggled };
const next = nextInstance(habit, new Date(2026, 9, 12, 10).getTime(), () => 'novo');
ok(next.notes === 'Levar a toalha' && next.subtasks.length === 2 && next.subtasks.every((s) => !s.done) && next.completed === false, 'Repetição: a próxima ocorrência mantém as notas e traz as etapas desmarcadas');
ok(nextInstance({ ...habit, subtasks: undefined, notes: undefined }, Date.now()).subtasks.length === 0 && nextInstance({ ...habit, notes: undefined }, Date.now()).notes === '', 'Repetição: tarefas antigas (sem notas nem etapas) continuam funcionando');

// ---------- busca ----------
const t = { title: 'Mudança', category: 'personal', notes: 'Pedir caixas ao mercado', subtasks: [{ id: 'a', title: 'Contratar caminhão', done: false }] };
ok(matchesSearch(t, 'caixas') && matchesSearch(t, 'caminhao') && matchesSearch(t, 'mudanca mercado') && !matchesSearch(t, 'pintura'), 'Busca: também acha pelas notas e pelo nome das etapas');

// ---------- importação ----------
const imp = parseImport(JSON.stringify({ tasks: [
  { id: 'a', title: 'Com etapas', energyCost: 3, durationMinutes: 20, category: 'work', notes: ' nota ', subtasks: [{ id: 'x', title: 'Um', done: true }, { title: '' }, 7] },
  { id: 'b', title: 'Antiga', energyCost: 3, durationMinutes: 20, category: 'work' },
  { id: 'c', title: 'Estranha', energyCost: 3, durationMinutes: 20, category: 'work', notes: { a: 1 }, subtasks: 'x' },
] }));
const [ta, tb, tc] = imp.tasks;
ok(ta.notes === 'nota' && ta.subtasks.length === 1 && ta.subtasks[0].done === true && tb.notes === '' && tb.subtasks.length === 0 && tc.notes === '' && tc.subtasks.length === 0, 'Importar: limpa notas e etapas; arquivo antigo (sem esses campos) continua valendo');

// ---------- na tela ----------
await auth.register('Ana', 'ana@x.com', 'segredo1');
const uid = auth.state.user.id;
const root = document.getElementById('app');
const cleanup = await renderTasks(root); await wait();
const dlg = () => document.querySelector('.modal-panel');
const q = (sel) => dlg().querySelector(sel);
const type = (el, v) => { el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
root.querySelector('#fab').click(); await wait();
type(q('#t-title'), 'Organizar mudança');
type(q('#t-notes'), 'Pedir caixas ao <mercado> e "avisar" a vizinha');
type(q('#t-sub-new'), 'Contratar caminhão'); q('#t-sub-add').click();
ok(q('#t-sub-list').children.length === 1 && q('#t-sub-new').value === '' && document.activeElement === q('#t-sub-new'), 'Formulário: "Adicionar" cria a etapa, limpa o campo e mantém o foco para a próxima');
type(q('#t-sub-new'), 'Separar <b>roupas</b>'); q('#t-sub-new').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
type(q('#t-sub-new'), 'Etapa para remover'); q('#t-sub-add').click();
ok(q('#t-sub-list').children.length === 3, 'Formulário: a tecla Enter também adiciona');
const removeBtn = q('#t-sub-list [data-remove][aria-label="Remover etapa Etapa para remover"]');
ok(!!removeBtn, 'Formulário: cada etapa tem botão "Remover etapa ..." com o nome');
removeBtn.click();
ok(q('#t-sub-list').children.length === 2 && !/Etapa para remover/.test(q('#t-sub-list').textContent) && !q('#t-sub-list').querySelector('b'), 'Formulário: remover tira só aquela; texto da etapa não vira HTML');
type(q('#t-sub-new'), '   '); q('#t-sub-add').click();
ok(q('#t-sub-list').children.length === 2, 'Formulário: etapa em branco não é criada');
q('#t-create').click(); await wait(200);
let saved = (await db.getUserTasks(uid))[0];
ok(saved.notes === 'Pedir caixas ao <mercado> e "avisar" a vizinha' && saved.subtasks.length === 2 && saved.subtasks.every((s) => s.done === false && s.id), 'Salvar: guarda as notas e as 2 etapas no banco');
ok(!dlg(), 'Salvar: a janela fecha');

const moreBtn = () => root.querySelector('[data-action="toggle-more"]');
ok(moreBtn().textContent === 'Etapas 0/2 · Notas' && moreBtn().getAttribute('aria-expanded') === 'false' && !root.querySelector('.task-more'), 'Cartão: botão "Etapas 0/2 · Notas", fechado');
moreBtn().click(); await wait();
ok(moreBtn().getAttribute('aria-expanded') === 'true' && document.activeElement === moreBtn() && root.querySelectorAll('.sub-check input[type="checkbox"]').length === 2 && moreBtn().getAttribute('aria-controls') === `more-${saved.id}`, 'Cartão: abre mostrando as etapas com quadradinhos, e o foco continua no botão');
ok(root.querySelector('.task-notes').textContent === 'Pedir caixas ao <mercado> e "avisar" a vizinha' && !root.querySelector('.task-notes').querySelector('mercado') && !root.querySelector('.sub-list').querySelector('b') && /Separar <b>roupas<\/b>/.test(root.querySelector('.sub-list').textContent), 'Segurança: notas e etapas aparecem como texto (nada de HTML do usuário)');
const box = () => root.querySelector('.sub-check input');
box().checked = true; box().dispatchEvent(new w.Event('change', { bubbles: true })); await wait(200);
saved = (await db.getUserTasks(uid))[0];
ok(saved.subtasks[0].done === true && saved.subtasks[1].done === false && moreBtn().textContent === 'Etapas 1/2 · Notas', 'Marcar: guarda na hora e o contador vira 1/2');
ok(box().checked && document.activeElement === box() && !!root.querySelector('.task-more'), 'Marcar: a lista continua aberta e o foco fica no mesmo quadradinho (teclado não se perde)');
box().checked = false; box().dispatchEvent(new w.Event('change', { bubbles: true })); await wait(200);
ok((await db.getUserTasks(uid))[0].subtasks[0].done === false, 'Desmarcar: também guarda');

// a lista atualiza sozinha a cada 5 s e não pode fechar
root.querySelector('#task-search').dispatchEvent(new w.Event('input'));
await wait(50);
ok(!!root.querySelector('.task-more'), 'Cartão: ao atualizar a lista, as etapas abertas continuam abertas');
moreBtn().click(); await wait();
ok(!root.querySelector('.task-more') && moreBtn().getAttribute('aria-expanded') === 'false', 'Cartão: clicar de novo fecha');

// busca pelas notas
const search = root.querySelector('#task-search');
type(search, 'vizinha'); await wait();
ok(root.querySelectorAll('#list .task-title').length === 1, 'Tela: buscar "vizinha" acha a tarefa pelas notas');
type(search, 'caminhao'); await wait();
ok(root.querySelectorAll('#list .task-title').length === 1, 'Tela: buscar "caminhao" acha pela etapa (sem acento)');
type(search, ''); await wait();

// editar
root.querySelector('[data-action="edit"]').click(); await wait();
ok(q('#t-notes').value === saved.notes && q('#t-sub-list').children.length === 2 && q('#t-create').textContent === 'Salvar', 'Editar: a janela abre com as notas e as etapas');
q('#t-sub-list [data-remove]').click();
type(q('#t-sub-new'), 'Etapa nova'); q('#t-sub-add').click();
type(q('#t-notes'), 'Nota nova');
q('#t-create').click(); await wait(200);
saved = (await db.getUserTasks(uid))[0];
ok(saved.notes === 'Nota nova' && saved.subtasks.length === 2 && saved.subtasks.some((s) => s.title === 'Etapa nova') && saved.subtasks.every((s) => !s.done), 'Editar: salva as mudanças, sem criar tarefa nova');
ok((await db.getUserTasks(uid)).length === 1, 'Editar: continua só uma tarefa');

// nova tarefa depois de editar começa limpa; sem notas e etapas não tem botão
root.querySelector('#fab').click(); await wait();
ok(q('#t-notes').value === '' && q('#t-sub-list').children.length === 0 && q('#t-heading').textContent === 'Nova Tarefa', 'Criar: depois de editar, a janela nova vem sem notas nem etapas');
type(q('#t-title'), 'Tarefa simples'); q('#t-create').click(); await wait(200);
const simple = [...root.querySelectorAll('#list .glass-card')].find((c) => c.querySelector('.task-title')?.textContent === 'Tarefa simples');
ok(!!simple && !simple.querySelector('.task-more-btn'), 'Cartão: tarefa sem notas e sem etapas não mostra o botão');

// limite de 20 etapas
root.querySelector('#fab').click(); await wait();
for (let i = 0; i < 25; i++) { type(q('#t-sub-new'), 'e' + i); q('#t-sub-add').click(); }
ok(q('#t-sub-list').children.length === 20 && q('#t-sub-add').disabled && q('#t-sub-new').disabled && /Limite de 20 etapas/.test(q('#t-sub-new').placeholder), 'Formulário: no máximo 20 etapas, depois o campo avisa o limite');
q('[data-role="close"]').click();
cleanup?.();
