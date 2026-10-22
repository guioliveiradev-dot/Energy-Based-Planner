// Tarefas: busca, ordenação e aviso de "prazo passou".
import 'fake-indexeddb/auto';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><head><title>Base</title></head><body><div id="app"></div><div id="toasts"></div></body></html>', { url: 'http://localhost/' });
const w = dom.window;
for (const k of ['window', 'document', 'location', 'navigator']) Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });
const base = new URL('../js/', import.meta.url).href;
const auth = await import(base + 'auth.js');
const db = await import(base + 'db.js');
const V = await import(base + 'task-view.js');
const { renderTasks } = await import(base + 'pages/tasks.js');
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const wait = (ms = 80) => new Promise((r) => setTimeout(r, ms));

const NOW = new Date(2026, 9, 17, 15).getTime();
const day = (off) => new Date(2026, 9, 17 + off).getTime();   // meia-noite local de "hoje + off"
const T = (id, o = {}) => ({ id, title: id, category: 'work', energyCost: 5, durationMinutes: 30, deadline: null, completed: false, createdAt: 100, ...o });

// ---------- busca ----------
ok(V.normalize('  Ação ÚNICA  ') === 'acao unica', 'Busca: ignora maiúsculas, acentos e espaços nas pontas');
ok(V.matchesSearch(T('x', { title: 'Estudar Ação' }), 'acao') && V.matchesSearch(T('x', { title: 'Ler livro' }), '') && !V.matchesSearch(T('x', { title: 'Ler livro' }), 'correr'), 'Busca: acha pedaço do título; vazio mostra tudo');
ok(V.matchesSearch(T('x', { title: 'Relatório', category: 'work' }), 'trabalho') && !V.matchesSearch(T('x', { title: 'Relatório', category: 'study' }), 'trabalho'), 'Busca: também acha pelo nome da categoria');
ok(V.matchesSearch(T('x', { title: 'Ler capítulo cinco' }), 'cinco ler') && !V.matchesSearch(T('x', { title: 'Ler capítulo cinco' }), 'ler seis'), 'Busca: várias palavras, todas precisam aparecer (em qualquer ordem)');

// ---------- prazos ----------
ok(V.isOverdue(T('a', { deadline: day(-1) }), NOW) && !V.isOverdue(T('a', { deadline: day(0) }), NOW) && !V.isOverdue(T('a', { deadline: day(1) }), NOW) && !V.isOverdue(T('a'), NOW), 'Prazo: passou só se o DIA do prazo já terminou (hoje ainda não)');
ok(!V.isOverdue(T('a', { deadline: day(-3), completed: true }), NOW), 'Prazo: tarefa concluída nunca fica "com prazo passado"');
ok(V.deadlineNote(T('a', { deadline: day(0) }), NOW) === 'Prazo hoje' && V.deadlineNote(T('a', { deadline: day(-1) }), NOW) === 'Prazo passou ontem' && V.deadlineNote(T('a', { deadline: day(-4) }), NOW) === 'Prazo passou há 4 dias' && V.deadlineNote(T('a', { deadline: day(2) }), NOW) === '' && V.deadlineNote(T('a'), NOW) === '', 'Prazo: texto "hoje", "ontem", "há N dias" (e nada nos outros casos)');
ok(!/atrasad|culp|falh/i.test(['Prazo hoje', V.deadlineNote(T('a', { deadline: day(-4) }), NOW)].join(' ')), 'Prazo: tom gentil, sem cobrança');

// ---------- ordenação ----------
const list = [
  T('b', { title: 'Bolo', energyCost: 8, durationMinutes: 90, deadline: day(5), createdAt: 1 }),
  T('a', { title: 'água', energyCost: 2, durationMinutes: 10, deadline: day(1), createdAt: 3 }),
  T('c', { title: 'Cartas', energyCost: 8, durationMinutes: 20, createdAt: 2 }),
  T('d', { title: 'Dados', energyCost: 4, durationMinutes: 45, deadline: day(-2), createdAt: 4 }),
];
const ids = (sorted) => sorted.map((t) => t.id).join('');
ok(ids(V.sortTasks(list, 'recent')) === 'dacb', 'Ordem: mais recentes primeiro');
ok(ids(V.sortTasks(list, 'deadline')) === 'dabc', 'Ordem: prazo mais próximo primeiro (o que já passou vem antes) e sem prazo por último');
ok(ids(V.sortTasks(list, 'energy-asc')) === 'adcb', 'Ordem: menor energia primeiro (empate: a mais recente)');
ok(ids(V.sortTasks(list, 'energy-desc')) === 'cbda', 'Ordem: maior energia primeiro (empate: a mais recente)');
ok(ids(V.sortTasks(list, 'short')) === 'acdb' && ids(V.sortTasks(list, 'long')) === 'bdca', 'Ordem: mais rápidas e mais longas');
ok(ids(V.sortTasks(list, 'title')) === 'abcd', 'Ordem: nome de A a Z (ignora acento e maiúscula)');
const before = ids(list);
V.sortTasks(list, 'title');
ok(ids(list) === before && ids(V.sortTasks(list, 'inventada')) === 'dacb', 'Ordem: não altera a lista original; opção desconhecida volta ao padrão');
ok(V.SORTS.length === 7 && V.SORTS.every((s) => V.isSortId(s.id)) && !V.isSortId('x'), 'Ordem: 7 opções');

// ---------- na tela ----------
await auth.register('Ana', 'ana@x.com', 'segredo1');
const uid = auth.state.user.id;
const now = Date.now();
const real = (off) => new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + off).getTime();
const mk = (id, o) => db.createTask({ id, userId: uid, title: id, energyCost: 5, durationMinutes: 30, deadline: null, category: 'work', completed: false, completedAt: null, startedAt: null, pausedAt: null, pauseOffset: 0, createdAt: now, ...o });
const root = document.getElementById('app');
let cleanup = await renderTasks(root);
ok(root.querySelector('#tools').hidden, 'Tela: sem tarefas, a busca e a ordenação ficam escondidas');
cleanup(); root.innerHTML = '';
await mk('Pagar conta', { energyCost: 3, durationMinutes: 10, deadline: real(-2), category: 'finance', createdAt: now - 3000 });
await mk('Estudar inglês', { energyCost: 6, durationMinutes: 40, deadline: real(3), category: 'study', createdAt: now - 2000 });
await mk('Ação de marketing', { energyCost: 9, durationMinutes: 120, category: 'work', createdAt: now - 1000 });
await mk('Correr', { energyCost: 7, durationMinutes: 45, deadline: real(0), category: 'health', createdAt: now });
await mk('Concluída antiga', { completed: true, completedAt: now - 1e6 });
cleanup = await renderTasks(root); await wait();
const titles = () => [...root.querySelectorAll('#list .task-title')].map((x) => x.textContent);
const search = root.querySelector('#task-search'), sort = root.querySelector('#task-sort');
ok(!root.querySelector('#tools').hidden && sort.options.length === 7 && search.getAttribute('type') === 'search', 'Tela: com tarefas, aparecem a busca e a ordenação');
ok(titles().join() === 'Correr,Ação de marketing,Estudar inglês,Pagar conta', 'Tela: começa com as mais recentes primeiro');
ok(/4 pendentes · 1 com prazo passado/.test(root.querySelector('#count').textContent), 'Tela: o contador avisa quantas passaram do prazo');

const cardOf = (t) => [...root.querySelectorAll('#list .glass-card')].find((c) => c.querySelector('.task-title')?.textContent === t);
ok(/Prazo passou há 2 dias/.test(cardOf('Pagar conta').textContent) && cardOf('Pagar conta').querySelector('.is-overdue') && /Prazo hoje/.test(cardOf('Correr').textContent) && !cardOf('Estudar inglês').querySelector('.overdue-note'), 'Tela: cartão mostra "Prazo passou há 2 dias" e "Prazo hoje" com texto (não só cor)');

search.value = 'acao'; search.dispatchEvent(new w.Event('input')); await wait();
ok(titles().join() === 'Ação de marketing' && /1 de 4 pendentes/.test(root.querySelector('#count').textContent), 'Busca na tela: "acao" acha "Ação de marketing" (sem acento) e mostra "1 de 4"');
ok(root.querySelector('#task-search') === search, 'Busca na tela: digitar não recria o campo (o foco não se perde)');
search.value = 'zzz'; search.dispatchEvent(new w.Event('input')); await wait();
ok(titles().length === 0 && /Nenhuma tarefa encontrada para “zzz”/.test(root.querySelector('#list').textContent), 'Busca na tela: sem resultado mostra mensagem com o que foi buscado');
root.querySelector('[data-action="clear-filters"]').click(); await wait();
ok(search.value === '' && titles().length === 4, 'Busca na tela: "Limpar busca e filtros" volta tudo');
search.value = 'estudo'; search.dispatchEvent(new w.Event('input')); await wait();
ok(titles().join() === 'Estudar inglês', 'Busca na tela: também acha pela categoria ("estudo")');
search.value = ''; search.dispatchEvent(new w.Event('input')); await wait();

sort.value = 'deadline'; sort.dispatchEvent(new w.Event('change')); await wait();
ok(titles().join() === 'Pagar conta,Correr,Estudar inglês,Ação de marketing', 'Ordem na tela: por prazo (o que passou, hoje, depois, sem prazo)');
ok(localStorage.getItem(`energy-planner-tasks-sort-${uid}`) === 'deadline', 'Ordem na tela: a escolha é guardada');
sort.value = 'energy-desc'; sort.dispatchEvent(new w.Event('change')); await wait();
ok(titles().join() === 'Ação de marketing,Correr,Estudar inglês,Pagar conta', 'Ordem na tela: maior energia primeiro');

const overdueChip = root.querySelector('[data-overdue]');
ok(!!overdueChip && /Prazo passou \(1\)/.test(overdueChip.textContent) && overdueChip.getAttribute('aria-pressed') === 'false', 'Filtro: botão "Prazo passou (1)"');
overdueChip.click(); await wait();
ok(titles().join() === 'Pagar conta' && root.querySelector('[data-overdue]').getAttribute('aria-pressed') === 'true' && /1 de 4 pendentes/.test(root.querySelector('#count').textContent), 'Filtro: mostra só as que passaram do prazo');
root.querySelector('[data-filter=""]').click(); await wait();
ok(titles().length === 4 && root.querySelector('[data-overdue]').getAttribute('aria-pressed') === 'false', 'Filtro: "Todas" limpa o filtro de prazo');
cleanup(); root.innerHTML = '';

// a ordem lembrada vale na próxima vez que a tela abrir
cleanup = await renderTasks(root); await wait();
ok(root.querySelector('#task-sort').value === 'energy-desc' && titles()[0] === 'Ação de marketing', 'Ordem na tela: ao voltar, a ordem escolhida continua');
cleanup();
