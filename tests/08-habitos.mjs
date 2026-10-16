// Tarefas recorrentes (hábitos).
import 'fake-indexeddb/auto';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><head><title>Base</title></head><body><div id="app"></div><div id="toasts"></div></body></html>', { url: 'http://localhost/' });
const w = dom.window;
for (const k of ['window', 'document', 'location', 'navigator']) Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });

const base = new URL('../js/', import.meta.url).href;
const auth = await import(base + 'auth.js');
const db = await import(base + 'db.js');
const R = await import(base + 'recurrence.js');
const { parseImport } = await import(base + 'data-import.js');
const { renderTasks } = await import(base + 'pages/tasks.js');
const { renderHome } = await import(base + 'pages/home.js');
const wait = (ms = 40) => new Promise((r) => setTimeout(r, ms));
// Percorre todas as missões sugeridas na Home (botão "Outra missão") e devolve os títulos
function allSuggested(root) {
  const titles = [];
  for (let i = 0; i < 10; i++) {
    const t = root.querySelector('.mission-title')?.textContent;
    if (!t || titles.includes(t)) break;
    titles.push(t);
    const next = root.querySelector('[data-action="next"]');
    if (!next) break;
    next.click();
  }
  return titles;
}
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const root = document.getElementById('app');
const ev = (t) => new w.Event(t, { bubbles: true });
const type = (el, v) => { el.value = v; el.dispatchEvent(ev('input')); };
const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h).getTime();
const dayOf = (ts) => new Date(ts).getDate();

// ---------- funções puras ----------
// 2026-10-14 é quarta-feira
ok(new Date(at(2026, 10, 14)).getDay() === 3, 'Base: 14/10/2026 é quarta');
let n = R.nextOccurrence(R.PRESETS.daily, at(2026, 10, 14));
ok(dayOf(n) === 15 && new Date(n).getHours() === 0, 'Próxima: todos os dias, de quarta -> quinta 00:00');
n = R.nextOccurrence(R.PRESETS.weekdays, at(2026, 10, 16));          // sexta
ok(dayOf(n) === 19 && new Date(n).getDay() === 1, 'Próxima: dias úteis, de sexta -> segunda');
n = R.nextOccurrence(R.PRESETS.weekend, at(2026, 10, 17));           // sábado
ok(dayOf(n) === 18 && new Date(n).getDay() === 0, 'Próxima: fim de semana, de sábado -> domingo');
n = R.nextOccurrence(R.PRESETS.weekend, at(2026, 10, 18));           // domingo
ok(dayOf(n) === 24 && new Date(n).getDay() === 6, 'Próxima: fim de semana, de domingo -> sábado');
n = R.nextOccurrence([1], at(2026, 10, 12));                         // segunda, só segunda
ok(dayOf(n) === 19, 'Próxima: só segunda, de segunda -> daqui 7 dias (nunca o mesmo dia)');
n = R.nextOccurrence([1], at(2026, 10, 13));                         // terça
ok(dayOf(n) === 19, 'Próxima: só segunda, de terça -> segunda que vem');
n = R.nextOccurrence(R.PRESETS.daily, at(2026, 10, 31));
ok(new Date(n).getMonth() === 10 && dayOf(n) === 1, 'Próxima: vira o mês (31/10 -> 01/11)');
n = R.nextOccurrence(R.PRESETS.daily, at(2026, 12, 31));
ok(new Date(n).getFullYear() === 2027 && dayOf(n) === 1, 'Próxima: vira o ano');
n = R.nextOccurrence(R.PRESETS.daily, at(2026, 10, 14, 23));
ok(dayOf(n) === 15, 'Próxima: concluir às 23h ainda agenda para o dia seguinte');
ok(R.nextOccurrence([], Date.now()) === null, 'Próxima: sem dias = null');

ok(R.presetOf(null) === '' && R.presetOf([]) === '' && R.presetOf([0, 1, 2, 3, 4, 5, 6]) === 'daily' && R.presetOf([5, 4, 3, 2, 1]) === 'weekdays' && R.presetOf([0, 6]) === 'weekend' && R.presetOf([1, 3]) === 'custom', 'Preset: reconhece cada opção, em qualquer ordem');
ok(R.repeatLabel(R.PRESETS.daily) === 'Todos os dias' && R.repeatLabel([1, 2, 3, 4, 5]) === 'Dias úteis' && R.repeatLabel([6, 0]) === 'Fins de semana' && R.repeatLabel([5, 1, 3]) === 'Seg, Qua, Sex' && R.repeatLabel([0, 2]) === 'Ter, Dom', 'Rótulo: nomes e ordem Seg..Dom');
ok(R.isRecurring({ repeat: { days: [1] } }) && !R.isRecurring({ repeat: null }) && !R.isRecurring({}) && !R.isRecurring({ repeat: { days: [] } }), 'Recorrente: só com dias');
ok(R.isAvailable({}) && R.isAvailable({ availableFrom: null }) && R.isAvailable({ availableFrom: 5 }, 10) && !R.isAvailable({ availableFrom: 20 }, 10), 'Disponível: sem data ou data já chegou');

const habit = { id: 'a', userId: 'u', title: 'Beber água', energyCost: 2, durationMinutes: 5, deadline: 123, category: 'health', completed: true, completedAt: 1, startedAt: 1, pausedAt: 9, pauseOffset: 7, repeat: { days: [1, 3] }, availableFrom: null };
const inst = R.nextInstance(habit, at(2026, 10, 14), () => 'novo');     // quarta -> próxima: segunda 19
ok(inst.id === 'novo' && inst.title === 'Beber água' && inst.energyCost === 2 && inst.durationMinutes === 5 && inst.category === 'health' && inst.userId === 'u', 'Instância: copia título, energia, duração, categoria e dono');
ok(inst.completed === false && inst.completedAt === null && inst.startedAt === null && inst.pausedAt === null && inst.pauseOffset === 0 && inst.deadline === null, 'Instância: nasce limpa (pendente, sem prazo, sem cronômetro)');
ok(dayOf(inst.availableFrom) === 19 && inst.repeat.days.join() === '1,3' && inst.repeat.days !== habit.repeat.days, 'Instância: agendada para segunda 19 e com cópia própria dos dias');
ok(R.nextInstance({ ...habit, repeat: null }) === null, 'Instância: tarefa que não repete não gera nada');
ok(R.comesBackLabel({ availableFrom: R.nextOccurrence(R.PRESETS.daily, at(2026, 10, 14)) }, at(2026, 10, 14)) === 'Volta amanhã', 'Rótulo: "Volta amanhã"');
ok(R.comesBackLabel({ availableFrom: at(2026, 10, 19, 0) }, at(2026, 10, 14)) === 'Volta Seg 19/10', 'Rótulo: "Volta Seg 19/10"');

// ---------- importação ----------
const imp = parseImport(JSON.stringify({ tasks: [
  { id: 'i1', title: 'ok', energyCost: 3, durationMinutes: 10, category: 'work', repeat: { days: [3, 1, 1, 9, 'x', -1] }, availableFrom: 5000 },
  { id: 'i2', title: 'sem repetir', energyCost: 3, durationMinutes: 10, category: 'work', repeat: { days: [] }, availableFrom: 'amanhã' },
  { id: 'i3', title: 'lixo', energyCost: 3, durationMinutes: 10, category: 'work', repeat: 'sempre' },
] }));
ok(imp.tasks[0].repeat.days.join() === '1,3' && imp.tasks[0].availableFrom === 5000, 'Importar: limpa dias inválidos/repetidos e ordena');
ok(imp.tasks[1].repeat === null && imp.tasks[1].availableFrom === null && imp.tasks[2].repeat === null, 'Importar: repetição inválida vira "não repete"');

// ---------- tela de Tarefas ----------
await auth.register('Ana', 'ana@x.com', 'segredo1');
const uid = auth.state.user.id;
let cleanup = await renderTasks(root);

// criar hábito com dias específicos
root.querySelector('#fab').click();
let dlg = document.querySelector('.modal-panel');
ok(dlg.querySelector('#t-repeat').value === '' && dlg.querySelector('#t-days').hidden, 'Form: começa em "Não repete" e sem dias');
ok([...dlg.querySelector('#t-repeat').options].map((o) => o.textContent).join('|') === 'Não repete|Todos os dias|Dias úteis (Seg a Sex)|Fins de semana|Dias específicos...', 'Form: opções de repetição');
type(dlg.querySelector('#t-title'), 'Academia');
dlg.querySelector('#t-repeat').value = 'custom'; dlg.querySelector('#t-repeat').dispatchEvent(ev('change'));
ok(!dlg.querySelector('#t-days').hidden && dlg.querySelectorAll('#t-days input').length === 7, 'Form: "Dias específicos" mostra os 7 dias');
ok([...dlg.querySelectorAll('#t-days span')].map((s) => s.textContent).join() === 'Seg,Ter,Qua,Qui,Sex,Sáb,Dom', 'Form: dias na ordem Seg..Dom');
dlg.querySelector('#t-create').click(); await wait(60);
ok([...document.querySelectorAll('.toast.error')].some((t) => t.textContent.includes('ao menos um dia')) && (await db.getUserTasks(uid)).length === 0, 'Form: dias específicos sem nenhum dia marcado é recusado');
for (const v of ['1', '3', '5']) dlg.querySelector(`#t-days input[value="${v}"]`).checked = true;
dlg.querySelector('#t-create').click(); await wait(100);
let tasks = await db.getUserTasks(uid);
ok(tasks.length === 1 && tasks[0].repeat.days.join() === '1,3,5' && tasks[0].availableFrom === null, 'Criar: hábito salvo com dias 1,3,5 e disponível agora');
ok(root.textContent.includes('🔁 Seg, Qua, Sex'), 'Lista: mostra "🔁 Seg, Qua, Sex"');

// criar hábito diário por preset
root.querySelector('#fab').click(); dlg = document.querySelector('.modal-panel');
type(dlg.querySelector('#t-title'), 'Beber água');
dlg.querySelector('#t-repeat').value = 'daily'; dlg.querySelector('#t-repeat').dispatchEvent(ev('change'));
ok(dlg.querySelector('#t-days').hidden, 'Form: preset não mostra os dias');
type(dlg.querySelector('#t-hours'), '0'); type(dlg.querySelector('#t-minutes'), '5');
dlg.querySelector('#t-create').click(); await wait(100);
tasks = await db.getUserTasks(uid);
const water = tasks.find((t) => t.title === 'Beber água');
ok(water.repeat.days.join() === '0,1,2,3,4,5,6' && root.textContent.includes('🔁 Todos os dias'), 'Criar: "Todos os dias" salva os 7 dias');

// tarefa sem repetição continua sem repetir
root.querySelector('#fab').click(); dlg = document.querySelector('.modal-panel');
type(dlg.querySelector('#t-title'), 'Avulsa');
dlg.querySelector('#t-create').click(); await wait(100);
const single = (await db.getUserTasks(uid)).find((t) => t.title === 'Avulsa');
ok(single.repeat === null && !root.querySelector(`[data-id="${single.id}"]`)?.closest('.glass-card').textContent.includes('🔁'), 'Criar: tarefa comum não repete');

// editar: abre com os dados do hábito
const gym = tasks.find((t) => t.title === 'Academia');
root.querySelector(`[data-action="edit"][data-id="${gym.id}"]`).click(); dlg = document.querySelector('.modal-panel');
ok(dlg.querySelector('#t-repeat').value === 'custom' && !dlg.querySelector('#t-days').hidden && [...dlg.querySelectorAll('#t-days input:checked')].map((i) => i.value).join() === '1,3,5', 'Editar: abre com "Dias específicos" e Seg/Qua/Sex marcados');
dlg.querySelector('#t-repeat').value = ''; dlg.querySelector('#t-repeat').dispatchEvent(ev('change'));
dlg.querySelector('#t-create').click(); await wait(100);
ok((await db.getUserTasks(uid)).find((t) => t.id === gym.id).repeat === null, 'Editar: trocar para "Não repete" remove a repetição');
root.querySelector(`[data-action="edit"][data-id="${water.id}"]`).click(); dlg = document.querySelector('.modal-panel');
ok(dlg.querySelector('#t-repeat').value === 'daily' && dlg.querySelector('#t-days').hidden, 'Editar: hábito diário abre em "Todos os dias"');
dlg.querySelector('[data-role="close"]').click();

// concluir o hábito: cria a próxima ocorrência, agendada
await db.updateTask({ ...water, startedAt: Date.now() - 10 * 60000 });
cleanup(); root.innerHTML = ''; cleanup = await renderTasks(root);
root.querySelector(`[data-action="collect"][data-id="${water.id}"]`).click(); await wait(250);
document.querySelector('.congrats-panel [data-role="ok"]').click();
tasks = await db.getUserTasks(uid);
const waters = tasks.filter((t) => t.title === 'Beber água');
const doneW = waters.find((t) => t.completed), nextW = waters.find((t) => !t.completed);
ok(waters.length === 2 && doneW && nextW, 'Concluir: o hábito vira histórico e nasce a próxima ocorrência (2 registros)');
ok(nextW.repeat.days.length === 7 && nextW.availableFrom > Date.now() && new Date(nextW.availableFrom).getHours() === 0 && nextW.startedAt === null && nextW.id !== doneW.id, 'Concluir: próxima agendada para amanhã 00:00, limpa e com outro id');
ok(root.textContent.includes('Agendadas (1)') && root.textContent.includes('Volta amanhã'), 'Lista: seção "Agendadas (1)" com "Volta amanhã"');
ok(!root.querySelector(`[data-action="start"][data-id="${nextW.id}"]`) && !!root.querySelector(`[data-action="delete"][data-id="${nextW.id}"]`) && !!root.querySelector(`[data-action="edit"][data-id="${nextW.id}"]`), 'Lista: agendada não tem Iniciar, mas pode editar e excluir');
ok(root.textContent.includes('Concluídas (1)'), 'Lista: o hábito concluído aparece em "Concluídas (1)"');
ok(/(\d) pendentes/.exec(root.querySelector('#count').textContent)[1] === '2', 'Lista: contador "2 pendentes" (Academia e Avulsa; a agendada não conta)');

// Home só sugere o que está disponível
cleanup(); root.innerHTML = '';
cleanup = await renderHome(root);
root.querySelector('#generate').click(); await wait(80);
const sugg = allSuggested(root);
ok(sugg.length >= 2 && !sugg.includes('Beber água'), `Home: entre as sugestões (${sugg.join(', ')}) não está a tarefa agendada para amanhã`);
cleanup(); root.innerHTML = '';

// quando chega a hora, ela volta sozinha
await db.updateTask({ ...nextW, availableFrom: Date.now() - 1000 });
cleanup = await renderTasks(root);
ok(!root.textContent.includes('Agendadas') && !!root.querySelector(`[data-action="start"][data-id="${nextW.id}"]`), 'Chegou o dia: sai de "Agendadas" e pode iniciar');
cleanup(); root.innerHTML = '';
cleanup = await renderHome(root);
root.querySelector('#generate').click(); await wait(80);
ok(allSuggested(root).includes('Beber água'), 'Home: depois que chega o dia, o hábito volta a ser sugerido');

// concluir pela Home também agenda a próxima
const t0 = (await db.getUserTasks(uid)).find((t) => t.id === nextW.id);
await db.updateTask({ ...t0, startedAt: Date.now() - 10 * 60000 });
cleanup(); root.innerHTML = '';
cleanup = await renderHome(root);
root.querySelector('#generate').click(); await wait(80);
for (let i = 0; i < 6 && !root.querySelector('[data-action="continue"]'); i++) root.querySelector('[data-action="next"]')?.click();
ok(!!root.querySelector('[data-action="continue"]'), 'Home: a missão iniciada do hábito aparece com "Continuar Missão"');
root.querySelector('[data-action="continue"]').click(); await wait(80);
document.querySelector('.timer-panel [data-action="collect"]').click(); await wait(250);
tasks = await db.getUserTasks(uid);
ok(tasks.filter((t) => t.title === 'Beber água').length === 3 && tasks.filter((t) => t.title === 'Beber água' && !t.completed && t.availableFrom > Date.now()).length === 1, 'Home: concluir o hábito agenda a próxima ocorrência (3 registros, 1 agendada)');
document.querySelectorAll('.modal-overlay').forEach((x) => x.remove());
cleanup(); root.innerHTML = '';

// excluir uma agendada para a repetição; desfazer traz de volta
cleanup = await renderTasks(root);
const sched = (await db.getUserTasks(uid)).find((t) => t.title === 'Beber água' && !t.completed);
root.querySelector(`[data-action="delete"][data-id="${sched.id}"]`).click(); await wait(100);
ok(![...(await db.getUserTasks(uid))].some((t) => t.id === sched.id) && [...document.querySelectorAll('.toast')].some((t) => t.textContent.includes('não vai mais se repetir')), 'Excluir: avisa que o hábito não vai mais se repetir');
[...document.querySelectorAll('.toast .toast-action')].find((b) => b.textContent === 'Desfazer').click(); await wait(100);
const back = (await db.getUserTasks(uid)).find((t) => t.id === sched.id);
ok(back && back.repeat.days.length === 7 && back.availableFrom === sched.availableFrom, 'Desfazer: o hábito volta com repetição e agendamento');
cleanup(); root.innerHTML = '';
process.exit(process.exitCode || 0);
