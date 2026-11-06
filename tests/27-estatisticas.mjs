// Estatísticas: cálculos (esta semana, semana a semana, tempo focado, categorias, melhores dias, hábitos) e a aba do Perfil.
import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><head><title>Base</title></head><body><div id="app"></div><div id="toasts"></div></body></html>', { url: 'http://localhost/' });
const w = dom.window;
for (const k of ['window', 'document', 'location', 'navigator']) Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });
const base = new URL('../js/', import.meta.url).href;
const S = await import(base + 'stats.js');
const { statsHTML } = await import(base + 'components/stats-view.js');
const auth = await import(base + 'auth.js');
const db = await import(base + 'db.js');
const { renderProfile } = await import(base + 'pages/profile.js');
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const wait = (ms = 100) => new Promise((r) => setTimeout(r, ms));

const NOW = new Date(2026, 9, 17, 15, 0).getTime();               // sábado, 17 de outubro de 2026, 15h
const at = (off, h = 12, min = 0) => new Date(2026, 9, 17 - off, h, min).getTime();
let n = 0;
const done = (off, o = {}, h = 12) => ({ id: 't' + n++, title: 'Tarefa', category: 'work', energyCost: 5, durationMinutes: 30, completed: true, completedAt: at(off, h), createdAt: 1, ...o });
const weekday = new Date(NOW).getDay();
ok(weekday === 6, 'Base: 17/10/2026 é sábado (as contas abaixo dependem disso)');

// ---------- formato ----------
ok([0, 5, 59, 60, 61, 150, 180, 1234].map(S.formatMinutes).join('|') === '0 min|5 min|59 min|1 h|1 h 1 min|2 h 30 min|3 h|20 h 34 min' && S.formatMinutes(undefined) === '0 min' && S.formatMinutes(-5) === '0 min', 'Tempo: "45 min", "1 h", "2 h 30 min"');

// ---------- mapa de calor ----------
const tasks = [
  done(0), done(0), done(0), done(0), done(0),            // hoje: 5 -> nível 4
  done(1), done(1), done(1),                              // ontem: 3 -> nível 3
  done(2), done(2),                                       // 2 -> nível 2
  done(3),                                                // 1 -> nível 1
  done(200),                                              // muito antiga: fora do mapa
  { ...done(1), completed: false, completedAt: null },    // pendente: não conta
];
const wk0 = S.thisWeek(tasks, NOW);
ok(wk0.days.length === 7 && wk0.days.map((d) => d.letter).join('') === 'STQQSSD', 'Semana: 7 dias, de segunda a domingo');
ok(wk0.days.map((d) => d.count).join() === '0,0,1,2,3,5,0' && wk0.total === 11 && wk0.max === 5, 'Semana: tarefas por dia (qua 1, qui 2, sex 3, sáb 5); a pendente e a de 200 dias atrás não entram');
ok(wk0.days[5].today && !wk0.days[5].future && wk0.days[6].future && wk0.days[6].count === 0 && !wk0.days[4].future, 'Semana: hoje (sábado) marcado; domingo ainda não chegou (fica vazio, sem número)');
ok(S.thisWeek([], NOW).total === 0 && S.thisWeek([], NOW).max === 0, 'Semana: sem tarefas, tudo zerado');
const wly = S.weeklyTotals(tasks, NOW);
ok(wly.weeks.length === 6 && wly.weeks[5].current && !wly.weeks[4].current && wly.weeks[5].count === 11 && wly.weeks[4].count === 0 && wly.max === 11, 'Semana a semana: 6 semanas; a última é a atual (11 tarefas)');
ok(wly.weeks[5].label === '12/10' && wly.weeks[0].label === '7/9' && S.weeklyTotals([], NOW, 3).weeks.length === 3, 'Semana a semana: rótulo é a data da segunda-feira (12/10 e 7/9); o número de semanas pode mudar');
const wlyBorda = S.weeklyTotals([done(5), done(6)], NOW);   // sexta 12/10 (semana atual começa na segunda 12/10)
ok(wlyBorda.weeks[5].count === 1 && wlyBorda.weeks[4].count === 1, 'Semana a semana: domingo (11/10) é da semana anterior; segunda-feira começa a semana nova');

// ---------- tempo focado ----------
const f = S.focusTime([done(0, { durationMinutes: 45 }), done(3, { durationMinutes: 60 }), done(6, { durationMinutes: 15 }), done(7, { durationMinutes: 100 }), done(29, { durationMinutes: 10 }), done(30, { durationMinutes: 1000 })], NOW);
ok(f.today === 45 && f.week === 120 && f.month === 230 && f.total === 1230, 'Tempo: hoje 45, 7 dias 120 (dias 0 a 6), 30 dias 230 (dias 0 a 29), total 1230');

// ---------- categorias ----------
const cats = S.byCategory([done(0, { category: 'study' }), done(0, { category: 'work' }), done(1, { category: 'work' }), done(2, { category: 'work' }), done(3, { category: 'health' })]);
ok(cats.map((c) => `${c.id}:${c.count}:${c.percent}`).join() === 'work:3:60,study:1:20,health:1:20' && cats[0].label === 'Trabalho', 'Categorias: ordem do maior para o menor, com porcentagem (empate: ordem alfabética)');

// ---------- dias da semana e horário ----------
const wk = S.weekdayStats([done(0), done(0), done(7), done(1), done(2)]);   // sábado x3, sexta x1, quinta x1
ok(wk.counts.join() === '0,0,0,1,1,3,0' && wk.best === 5 && wk.max === 3, 'Dias da semana: segunda a domingo; melhor = sábado (índice 5)');
ok(S.weekdayStats([]).best === null, 'Dias da semana: sem tarefas, não há "melhor dia"');
const hour = (h, m = 0) => ({ ...done(0), completedAt: at(0, h, m) });
const per = S.periodStats([hour(4, 59), hour(5, 0), hour(11, 59), hour(12, 0), hour(17, 59), hour(18, 0), hour(21, 59), hour(22, 0), hour(0, 30)]);
ok(JSON.stringify(per.counts) === JSON.stringify({ morning: 2, afternoon: 2, evening: 2, night: 3 }) && per.best === 'night', 'Horário: manhã 5h-12h, tarde 12h-18h, noite 18h-22h, madrugada 22h-5h (limites exatos)');

// ---------- hábitos ----------
const rep = { repeat: { days: [1, 3, 5] } };
const habits = S.habitHistory([
  done(0, { title: 'Caminhar', ...rep }), done(1, { title: ' caminhar ', ...rep }), done(8, { title: 'Caminhar', ...rep }), done(15, { title: 'Caminhar', ...rep }), done(27, { title: 'Caminhar', ...rep }), done(28, { title: 'Caminhar', ...rep }),
  done(2, { title: 'Ler', ...rep }),
  done(0, { title: 'Única vez' }),                                   // não repete: não é hábito
], NOW);
ok(habits.length === 2 && habits[0].title === 'Caminhar' && habits[0].total === 6 && habits[0].weeks.join() === '1,1,1,2', 'Hábitos: agrupa pelo nome (sem ligar para maiúscula/espaço) e conta por semana (da mais antiga para a atual)');
ok(habits[1].title === 'Ler' && habits[1].weeks.join() === '0,0,0,1' && !habits.some((h) => h.title === 'Única vez'), 'Hábitos: tarefa que não se repete não entra');

// ---------- resumo ----------
const all = S.computeStats(tasks, NOW, {});
ok(all.completed === 12 && all.activeDays === 5 && all.perActiveDay === 2.4 && all.streak.current === 4 && all.streak.best === 4 && all.points > 0, 'Resumo: 12 tarefas no total em 5 dias (média 2,4; inclui a antiga), sequência de 4 dias');
const withShield = S.computeStats([done(2), done(3), done(4)], NOW, { covered: ['2026-10-16'] });
ok(withShield.streak.current === 4, 'Resumo: dias protegidos pelo escudo do Cão entram na sequência');

// ---------- a tela (HTML) ----------
const html = statsHTML(all);
const htmlQuando = statsHTML(all, 'quando'), htmlCat = statsHTML(all, 'categorias'), htmlHab = statsHTML(all, 'habitos');
ok(['st-week-now', 'st-weekly', 'st-focus'].every((id) => html.includes(`id="${id}"`)) && /Tarefas<\/span>/.test(html) && /Sequência<\/span>/.test(html) && /Tempo focado<\/span>/.test(html), 'Tela: o Resumo mostra números, esta semana, semana a semana e tempo focado');
ok(['st-week', 'st-period'].every((id) => htmlQuando.includes(`id="${id}"`)) && htmlCat.includes('id="st-cat"') && htmlHab.includes('id="st-habit"') && !html.includes('id="st-cat"'), 'Tela: cada aba mostra só o seu assunto (Dias e horários, Categorias, Hábitos)');
ok((html.match(/<div class="tabs tabs-4 stats-tabs"/g) || []).length === 1 && (html.match(/data-stats-tab=/g) || []).length === 4 && /aria-selected="true"[^>]*data-stats-tab="resumo"/.test(html) && /role="tabpanel"/.test(html), 'Tela: 4 abas internas (Resumo, Dias e horários, Categorias, Hábitos), com a escolhida marcada');
ok(statsHTML(all, 'qualquer-coisa').includes('id="st-week-now"'), 'Tela: aba desconhecida volta para o Resumo');
ok(/class="week-bars" role="img" aria-label="Tarefas concluídas por dia nesta semana: Segunda 0, Terça 0, Quarta 1, Quinta 2, Sexta 3, Sábado 5\./.test(html) && !/Domingo \d/.test(html), 'Acessibilidade: as colunas da semana têm descrição em texto (sem o domingo, que ainda não chegou)');
ok(/<div class="[^"]*future[^"]*">\s*<b><\/b>/.test(html), 'Semana: dia que ainda não chegou fica sem número');
ok(!/<span class="stat-track"(?![^>]*aria-hidden)/.test(htmlQuando) && !/<span class="stat-track"(?![^>]*aria-hidden)/.test(htmlCat), 'Acessibilidade: barras só decoram (os números estão no texto)');
ok(/Você conclui mais tarefas <strong>aos sábados<\/strong> \(5 tarefas\)/.test(htmlQuando) || /Você conclui mais tarefas <strong>[^<]+<\/strong> \(\d+ tarefas?\)/.test(htmlQuando), 'Tela: frase do melhor dia da semana');
ok(/Você conclui mais tarefas <strong>à tarde<\/strong>/.test(htmlQuando) && /5 \(\d+%\)|\d+ \(\d+%\)/.test(htmlCat), 'Tela: frase do melhor horário e números com porcentagem');
ok(/Semana a semana \(da mais antiga para a atual\)/.test(statsHTML(S.computeStats([done(0, { title: 'Caminhar', ...rep })], NOW), 'habitos')), 'Tela: hábitos com os números semana a semana em texto');
ok(!/falt|perdeu|atrasad|culpa|deveria/i.test(html + htmlQuando + htmlCat + htmlHab), 'Tom: só mostra o que você fez, nunca o que faltou');
ok(!/<img/.test(statsHTML(S.computeStats([done(0, { title: '<img src=x onerror=alert(1)>', ...rep })], NOW), 'habitos')) && /&lt;img/.test(statsHTML(S.computeStats([done(0, { title: '<img src=x onerror=alert(1)>', ...rep })], NOW), 'habitos')), 'Segurança: nome de hábito é escapado (nada de HTML do usuário)');
ok(/Conclua sua primeira tarefa/.test(statsHTML(S.computeStats([], NOW))) && !/st-week-now/.test(statsHTML(S.computeStats([], NOW))), 'Tela: sem tarefas concluídas, convite gentil em vez de gráficos vazios');

// ---------- aba no Perfil ----------
await auth.register('Ana', 'ana@x.com', 'segredo1');
const uid = auth.state.user.id;
const app = document.getElementById('app');
let cleanup = await renderProfile(app); await wait();
const tabs = app.querySelector('.tabs');
ok(tabs.classList.contains('tabs-4') && [...tabs.querySelectorAll('.tab')].map((b) => b.dataset.tab).join() === 'profile,stats,inventory,achievements', 'Perfil: 4 abas (Perfil, Estatísticas, Inventário, Conquistas)');
app.querySelector('[data-tab="stats"]').click(); await wait();
ok(/Conclua sua primeira tarefa/.test(app.textContent) && app.querySelector('[data-tab="stats"]').getAttribute('aria-selected') === 'true' && app.querySelector('[data-tab="profile"]').getAttribute('aria-selected') === 'false', 'Perfil: conta nova vê o convite gentil e a aba fica marcada');
cleanup?.(); app.innerHTML = '';
const nowReal = Date.now();
for (let i = 0; i < 6; i++) await db.createTask({ id: 'p' + i, userId: uid, title: 'Ler ' + i, energyCost: 4, durationMinutes: 20, deadline: null, category: i % 2 ? 'study' : 'work', completed: true, completedAt: nowReal - i * 3600000, createdAt: nowReal - 1e7 });
cleanup = await renderProfile(app); await wait();
app.querySelector('[data-tab="stats"]').click(); await wait();
ok(/6<\/strong>/.test(app.innerHTML) && !!app.querySelector('.week-bars') && /Tempo focado/.test(app.textContent), 'Perfil: com tarefas concluídas, mostra o resumo e esta semana de verdade');
app.querySelector('[data-stats-tab="categorias"]').click(); await wait();
ok(!!app.querySelector('#st-cat') && !app.querySelector('.week-bars') && app.querySelector('[data-stats-tab="categorias"]').getAttribute('aria-selected') === 'true' && app.querySelector('[data-tab="stats"]').getAttribute('aria-selected') === 'true', 'Perfil: a aba interna Categorias troca o conteúdo sem sair das Estatísticas');
app.querySelector('[data-tab="inventory"]').click(); await wait();
app.querySelector('[data-tab="stats"]').click(); await wait();
ok(app.querySelector('[data-stats-tab="categorias"]').getAttribute('aria-selected') === 'true' && app.querySelectorAll('.tabs')[0].querySelectorAll('.tab').length === 4, 'Perfil: ao voltar para Estatísticas, lembra a aba interna escolhida (e as 4 abas do Perfil continuam 4)');
app.querySelector('[data-tab="inventory"]').click(); await wait();
ok(!app.querySelector('.week-bars') && !app.querySelector('#st-cat') && !!app.querySelector('[data-pet]'), 'Perfil: trocar de aba troca o conteúdo');
cleanup?.();

// ---------- CSS ----------
const css = readFileSync(new URL('../css/style.css', import.meta.url), 'utf8');
ok(/\.week-bars \{[^}]*grid-template-columns: repeat\(7, (minmax\(0, 1fr\)|1fr)\)/.test(css) && /\.stat-tiles \{[^}]*repeat\(3, 1fr\)/.test(css) && !/\.heat/.test(css), 'CSS: colunas da semana (7), números em 3 colunas, e o mapa de calor saiu');
