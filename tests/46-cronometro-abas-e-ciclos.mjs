// Cronômetro: ciclos de foco e descanso (regras puras) e as 3 abas (Foco, Etapas, Detalhes).
import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><head><title>Base</title></head><body><div id="app"></div><div id="toasts"></div></body></html>', { url: 'http://localhost/' });
const w = dom.window;
for (const k of ['window', 'document', 'location', 'navigator']) Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });
const base = new URL('../js/', import.meta.url).href;
const { cleanCycle, sameCycle, cyclePhase } = await import(base + 'cycles.js');
const { parseImport } = await import(base + 'data-import.js');
const { createTaskTimer } = await import(base + 'components/task-timer.js');
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const wait = (ms = 80) => new Promise((r) => setTimeout(r, ms));

// ---------- regras dos ciclos ----------
ok(cleanCycle({ focus: 25, rest: 5 })?.focus === 25 && cleanCycle({ focus: 50, rest: 10 })?.rest === 10, 'Ciclos: 25 + 5 e 50 + 10 são aceitos');
ok(cleanCycle({ focus: 30, rest: 5 }) === null && cleanCycle(null) === null && cleanCycle('x') === null, 'Ciclos: valores fora da lista viram "sem ciclos"');
ok(sameCycle(null, null) && sameCycle({ focus: 25, rest: 5 }, { focus: 25, rest: 5 }) && !sameCycle({ focus: 25, rest: 5 }, null), 'Ciclos: comparação');
const C = { focus: 25, rest: 5 };
const at = (min, total = 40) => cyclePhase(C, min * 60, total * 60);
ok(at(0).phase === 'focus' && at(0).index === 1 && at(0).count === 2 && at(0).phaseRemaining === 25 * 60, 'Ciclos: começa no foco 1 de 2, faltando 25 min');
ok(at(24.5).phase === 'focus' && at(25).phase === 'rest' && at(25).phaseRemaining === 5 * 60, 'Ciclos: aos 25 min começa o descanso de 5 min');
ok(at(30).phase === 'focus' && at(30).index === 2, 'Ciclos: aos 30 min volta ao foco (bloco 2)');
ok(at(35).phaseRemaining === 5 * 60 && at(39.9).phase === 'focus', 'Ciclos: o último foco vai até o fim da tarefa (40 min)');
ok(cyclePhase(C, 40 * 60, 40 * 60) === null && cyclePhase(null, 10, 600) === null, 'Ciclos: tempo acabado ou sem ciclos devolve null');
ok(cyclePhase({ focus: 50, rest: 10 }, 55 * 60, 120 * 60).phase === 'rest', 'Ciclos: 50 + 10 também funciona');

// troca de fase na mão (anchor)
const A = { focus: 25, rest: 5 };
ok(cleanCycle({ ...A, anchor: -600 }).anchor === -600 && cleanCycle({ ...A, anchor: 0 }).anchor === undefined && cleanCycle({ ...A, anchor: 'x' }).anchor === undefined, 'Ciclos: anchor é guardado só quando é um número diferente de 0');
const rest10 = cyclePhase({ ...A, anchor: 10 * 60 - 25 * 60 }, 10 * 60, 60 * 60);
ok(rest10.phase === 'rest' && rest10.phaseRemaining === 5 * 60 && rest10.index === 1, 'Ciclos: "Descanso agora" aos 10 min começa 5 min de descanso');
const back = cyclePhase({ ...A, anchor: 12 * 60 }, 12 * 60, 60 * 60);
ok(back.phase === 'focus' && back.phaseRemaining === 25 * 60, 'Ciclos: "Foco agora" aos 12 min começa 25 min de foco');
ok(sameCycle({ ...A, anchor: 5 }, A), 'Ciclos: o anchor não muda qual opção está marcada');

// ---------- importação guarda a escolha de ciclos ----------
const imp = parseImport(JSON.stringify({ tasks: [
  { id: 'a', title: 'A', energyCost: 3, durationMinutes: 30, category: 'work', cycle: { focus: 25, rest: 5 } },
  { id: 'b', title: 'B', energyCost: 3, durationMinutes: 30, category: 'work', cycle: { focus: 99, rest: 1 } },
] }));
ok(imp.tasks?.[0]?.cycle?.focus === 25 && imp.tasks?.[1]?.cycle === null, 'Importação: guarda os ciclos válidos e descarta os inválidos');

// ---------- as abas ----------
const panel = () => document.querySelector('.timer-panel');
const calls = { subs: [], cycles: [], pause: 0, collect: 0 };
const make = (o = {}) => createTaskTimer({
  userId: 'u1', taskTitle: 'Estudar inglês', durationMinutes: 40, startedAt: Date.now() - 12 * 60000,
  energyCost: 6, category: 'study',
  subtasks: [{ id: 's1', title: 'Revisar', done: true }, { id: 's2', title: 'Ler', done: false }, { id: 's3', title: 'Exercícios', done: false }],
  notes: 'Frases com would',
  onUpdate() { calls.pause++; }, onComplete() { calls.collect++; },
  onSubtasksChange: (l) => calls.subs.push(l), onCycleChange: (c) => calls.cycles.push(c), ...o,
});
const tabs = () => [...panel().querySelectorAll('[role="tab"]')];
const tab = (id) => panel().querySelector(`[data-tabid="${id}"]`);
const vis = (id) => !panel().querySelector(`[data-panel="${id}"]`).hidden;

let t = make(); t.open(); await wait();
ok(tabs().map((b) => b.dataset.tabid).join() === 'focus,steps,details', 'Abas: Foco, Etapas e Detalhes');
ok(tab('steps').textContent.includes('1/3') && tab('focus').getAttribute('aria-selected') === 'true' && vis('focus') && !vis('steps') && !vis('details'), 'Abas: abre na aba Foco e a aba Etapas mostra 1/3');
ok(panel().querySelector('[role="tablist"]').getAttribute('aria-label') && tabs().every((b) => b.getAttribute('aria-controls')), 'Abas: lista de abas com nome e ligação com o painel (leitor de tela)');
ok(panel().querySelector('[data-action="pause"]') && !panel().querySelector('[data-panel="focus"] [data-phase]'), 'Foco: continua com Pausar e sem ciclos (padrão)');
ok(panel().querySelectorAll('.tm-seg').length === 0 && panel().querySelectorAll('.tm-dots').length === 0, 'Foco: sem ciclos escolhidos, não aparecem fase nem bolinhas');

tab('steps').click(); await wait();
ok(vis('steps') && !vis('focus') && tab('steps').getAttribute('aria-selected') === 'true', 'Etapas: clicar abre a aba Etapas');
ok(panel().querySelectorAll('.tm-step').length === 3 && panel().textContent.includes('Frases com would'), 'Etapas: lista as 3 etapas e a nota');
ok(!!panel().querySelector('[data-panel="steps"] .tm-strip b'), 'Etapas: a faixa do topo mostra o tempo');
const box = panel().querySelector('[data-step="s2"]');
ok(box.type === 'checkbox' && !box.checked, 'Etapas: cada etapa é uma caixa de marcar');
box.checked = true; box.dispatchEvent(new w.Event('change', { bubbles: true })); await wait();
ok(calls.subs.length === 1 && calls.subs[0].find((s) => s.id === 's2').done === true && calls.subs[0].find((s) => s.id === 's1').done === true, 'Etapas: marcar guarda a lista nova (s1 e s2 feitas)');
ok(tab('steps').textContent.includes('2/3'), 'Etapas: o contador da aba vai para 2/3');
panel().querySelector('[data-panel="steps"] [data-role="strip-action"]').click(); await wait();
ok(calls.pause === 1 && !!panel().querySelector('[data-panel="steps"] [data-kind="resume"]'), 'Etapas: o botão da faixa pausa e vira Continuar');
panel().querySelector('[data-panel="steps"] [data-kind="resume"]').click(); await wait();

tab('details').click(); await wait();
const txt = panel().querySelector('[data-panel="details"]').textContent;
ok(vis('details') && txt.includes('Energia 6') && txt.includes('Estudo'), 'Detalhes: mostra energia e categoria');
ok(txt.includes('40 min') && txt.includes('+80') && txt.includes('já passou') && txt.includes('planejado'), 'Detalhes: planejado 40 min e +80 pontos (6 × 10 + 40 × 0,5)');
ok(!/pune|culpa|atras/i.test(txt) && txt.includes('Opcional'), 'Detalhes: texto calmo, sem cobrança');

// ---------- escolher ciclos ----------
const opt = (id) => panel().querySelector(`[data-cycle="${id}"]`);
ok(opt('').getAttribute('aria-pressed') === 'true' && !!opt('25-5') && !!opt('50-10'), 'Ciclos: opções Sem ciclos, 25 + 5 e 50 + 10 (Sem ciclos marcado)');
opt('25-5').click(); await wait();
ok(calls.cycles.length === 1 && calls.cycles[0].focus === 25 && calls.cycles[0].rest === 5, 'Ciclos: escolher 25 + 5 avisa quem guarda a tarefa');
ok(opt('25-5').getAttribute('aria-pressed') === 'true' && opt('').getAttribute('aria-pressed') === 'false', 'Ciclos: a opção escolhida fica marcada');
tab('focus').click(); await wait();
ok(!!panel().querySelector('.tm-seg') && panel().textContent.includes('Foco 1 de 2') && panel().querySelectorAll('.tm-dots i').length === 2, 'Foco: com ciclos aparecem "Foco 1 de 2" e 2 bolinhas');
ok(panel().querySelector('[data-role="rest"]').hidden, 'Foco: durante o foco o cartão de descanso fica escondido');
tab('details').click(); await wait();
opt('').click(); await wait();
ok(calls.cycles.length === 2 && calls.cycles[1] === null, 'Ciclos: voltar para "Sem ciclos" guarda null');
t.destroy();

// descanso: tarefa de 40 min com 25 + 5, já passaram 26 min
t = make({ startedAt: Date.now() - 26 * 60000, cycle: { focus: 25, rest: 5 } }); t.open(); await wait();
ok(!panel().querySelector('[data-role="rest"]').hidden && panel().textContent.includes('Descanso de 5 min') && panel().textContent.includes('Respire'), 'Descanso: aos 26 min aparece o cartão com a respiração');
ok(/^0[34]:\d\d$/.test(panel().querySelector('[data-role="rest-time"]').textContent), 'Descanso: mostra o tempo que falta do descanso (perto de 4 min)');
const stageEl = panel().querySelector('.pet-stage');
ok(stageEl && !stageEl.hidden && stageEl.dataset.state === 'resting' && stageEl.querySelector('.pet-status').textContent.includes('dormindo'), 'Descanso: o pet continua na tela, dormindo');
ok(!stageEl.querySelector('.pet-bubble').classList.contains('show'), 'Descanso: o pet dormindo não mostra balão de fala');
ok(/pet-stage\[data-state="resting"\] \.pet-z/.test(readFileSync(new URL('../css/style.css', import.meta.url), 'utf8')) && /pet-sleep/.test(readFileSync(new URL('../css/style.css', import.meta.url), 'utf8')), 'Descanso: o CSS mostra os Z e a respiração do pet dormindo');
ok(/focus-mode \[data-role="actions"\] \{[^}]*margin-inline: auto/.test(readFileSync(new URL('../css/style.css', import.meta.url), 'utf8')), 'Modo foco: o botão Pausar/Continuar fica centralizado');
t.destroy();

// trocar de fase tocando no campo da fase
t = make({ cycle: { focus: 25, rest: 5 } }); t.open(); await wait();
const phaseBtns = () => [...panel().querySelectorAll('[data-phase-go]')];
ok(phaseBtns().length === 2 && phaseBtns()[1].textContent === 'Descanso de 5 min' && phaseBtns()[0].getAttribute('aria-pressed') === 'true', 'Fase: "Foco" e "Descanso de 5 min" são botões (Foco marcado)');
const before = calls.cycles.length;
phaseBtns()[1].click(); await wait();
ok(calls.cycles.length === before + 1 && calls.cycles.at(-1).focus === 25 && Number.isFinite(calls.cycles.at(-1).anchor) && calls.cycles.at(-1).anchor < 0, 'Fase: tocar em Descanso guarda a nova fase na tarefa');
ok(!panel().querySelector('[data-role="rest"]').hidden && /^0[45]:\d\d$/.test(panel().querySelector('[data-role="rest-time"]').textContent), 'Fase: o descanso começa na hora (cerca de 5 min)');
ok(document.activeElement?.dataset.phaseGo === 'rest', 'Fase: o foco do teclado fica no botão tocado');
phaseBtns()[0].click(); await wait();
ok(panel().querySelector('[data-role="rest"]').hidden && calls.cycles.at(-1).anchor > 0, 'Fase: tocar em Foco volta ao foco');
phaseBtns()[0].click(); await wait();
ok(calls.cycles.length === before + 2, 'Fase: tocar na fase que já está ativa não faz nada');
const sel = new w.Event('selectstart', { bubbles: true, cancelable: true }); panel().querySelector('.timer-title').dispatchEvent(sel);
ok(sel.defaultPrevented, 'Cronômetro: não deixa selecionar texto');
t.destroy();

// tempo com horas e "planejado" com horas
t = make({ durationMinutes: 300, startedAt: Date.now() - 1000 }); t.open(); await wait();
ok(/^4:5\d:\d\d$/.test(panel().querySelector('.timer-time').textContent), 'Tempo: 5 h de tarefa aparece como 4:59:xx (horas, não 299 min)');
tab('details').click(); await wait();
ok(panel().querySelector('[data-panel="details"]').textContent.includes('5 h'), 'Detalhes: planejado em horas (5 h)');
t.destroy();
t = make({ durationMinutes: 90, startedAt: Date.now() - 1000 }); t.open(); await wait(); tab('details').click(); await wait();
ok(panel().querySelector('[data-panel="details"]').textContent.includes('1 h 30 min'), 'Detalhes: 90 min aparece como 1 h 30 min');
t.destroy();
t = make({ durationMinutes: 40, startedAt: Date.now() - 1000 }); t.open(); await wait();
ok(/^39:5\d$/.test(panel().querySelector('.timer-time').textContent), 'Tempo: abaixo de 1 hora continua mm:ss');
t.destroy();

// pausado: o pet fecha os olhos (qualquer pet, não só a Fagulha)
{
  const { setActivePetStorage } = await import(base + 'themes.js');
  const faceLabel = () => panel().querySelector('.pet-face svg')?.getAttribute('aria-label') || '';
  for (const petId of ['fagulha', 'unicorn', 'dragon']) {
    setActivePetStorage('u1', petId);
    t = make({ startedAt: Date.now() - 60000 }); t.open(); await wait();
    const awake = faceLabel();
    panel().querySelector('[data-action="pause"]').click(); await wait();
    ok(awake !== faceLabel() && /dormindo|dorme|sleep/i.test(faceLabel()), `Pausado: o pet (${petId}) fecha os olhos`);
    panel().querySelector('[data-action="resume"]').click(); await wait();
    ok(faceLabel() === awake, `Continuar: o pet (${petId}) acorda`);
    t.destroy();
  }
  setActivePetStorage('u1', 'fagulha');
}

// ---------- sem etapas nem nota: a aba some ----------
t = make({ subtasks: [], notes: '' }); t.open(); await wait();
ok(tabs().map((b) => b.dataset.tabid).join() === 'focus,details', 'Abas: tarefa sem etapas e sem nota só tem Foco e Detalhes');
t.destroy();
t = make({ subtasks: [], notes: 'só uma nota' }); t.open(); await wait();
ok(tab('steps')?.textContent.includes('Nota'), 'Abas: só com nota, a aba se chama Nota');
t.destroy();

// ---------- teclado e modo foco ----------
t = make(); t.open(); await wait();
tab('focus').focus();
tab('focus').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })); await wait();
ok(vis('steps') && document.activeElement === tab('steps'), 'Teclado: seta para a direita abre a aba seguinte e leva o foco');
tab('steps').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true })); await wait();
ok(vis('details'), 'Teclado: End vai para a última aba');
panel().querySelector('[data-role="focus"]').click(); await wait();
ok(t.focusMode && vis('details') && tabs().length === 3, 'Modo foco: as abas continuam e a aba aberta não muda');
tab('steps').click(); await wait();
ok(vis('steps') && !vis('details'), 'Modo foco: dá para trocar de aba (Etapas)');
panel().querySelector('[data-panel="steps"] [data-step="s3"]').click(); await wait();
ok(calls.subs.length > 0, 'Modo foco: dá para marcar etapas');
tab('focus').click(); await wait();
ok(vis('focus') && !!panel().querySelector('[data-action="pause"]'), 'Modo foco: a aba Foco continua com o Pausar');
const css46 = readFileSync(new URL('../css/style.css', import.meta.url), 'utf8');
ok(!/focus-mode[^{]*\.timer-tab[^{]*\{[^}]*display: none/.test(css46), 'Modo foco: o CSS não esconde mais as abas');
t.destroy();

// ---------- sem os dados novos, funciona como antes ----------
t = createTaskTimer({ userId: 'u1', taskTitle: 'Simples', durationMinutes: 10, startedAt: Date.now(), onUpdate() {}, onComplete() {} }); t.open(); await wait();
ok(tabs().map((b) => b.dataset.tabid).join() === 'focus,details' && !panel().querySelector('.tm-chip') && panel().textContent.includes('planejado'), 'Compatível: sem energia, categoria ou etapas o cronômetro abre normalmente');
t.destroy();
