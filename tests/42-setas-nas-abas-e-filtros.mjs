// Setas do teclado em abas e filtros: Tab entra uma vez, setas movem, Home/End, abas abrem ao navegar.
import { JSDOM } from 'jsdom';
const dom = new JSDOM(`<!doctype html><html><body><div id="app">
  <div id="tabs" class="tabs" role="tablist" data-roving="tabs">
    <button role="tab" aria-selected="true" id="a">A</button><button role="tab" aria-selected="false" id="b">B</button><button role="tab" aria-selected="false" id="c">C</button>
  </div>
  <div id="chips" data-roving="buttons">
    <button class="chip" aria-pressed="false" id="x">X</button><button class="chip active" aria-pressed="true" id="y">Y</button><button class="chip" aria-pressed="false" id="z">Z</button>
  </div></div></body></html>`, { url: 'http://localhost/', pretendToBeVisual: true });
const w = dom.window;
for (const k of ['window', 'document']) Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true });
globalThis.MutationObserver = w.MutationObserver;
const { enableArrowNav } = await import(new URL('../js/keyboard-nav.js', import.meta.url).href);
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const $ = (id) => document.getElementById(id);
const key = (el, k) => el.dispatchEvent(new w.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
const wait = () => new Promise((r) => setTimeout(r, 10));
// as abas se comportam como no app: clicar seleciona
for (const b of document.querySelectorAll('#tabs button')) b.addEventListener('click', () => document.querySelectorAll('#tabs button').forEach((o) => o.setAttribute('aria-selected', String(o === b))));

const stop = enableArrowNav(document.getElementById('app'));
const tabs = (ids) => ids.map((i) => $(i).getAttribute('tabindex')).join();
ok(tabs(['a', 'b', 'c']) === '0,-1,-1', 'Abas: só a aba ativa é parada do Tab');
ok(tabs(['x', 'y', 'z']) === '-1,0,-1', 'Filtros: só o filtro ativo é parada do Tab');

$('a').focus(); key($('a'), 'ArrowRight'); await wait();
ok(document.activeElement === $('b') && $('b').getAttribute('aria-selected') === 'true', 'Aba: seta para a direita foca e abre a próxima');
ok(tabs(['a', 'b', 'c']) === '-1,0,-1', 'Aba: a parada do Tab acompanha a aba aberta');
key($('b'), 'End'); await wait();
ok(document.activeElement === $('c') && $('c').getAttribute('aria-selected') === 'true', 'Aba: End vai para a última');
key($('c'), 'ArrowRight'); await wait();
ok(document.activeElement === $('a'), 'Aba: depois da última volta para a primeira');
key($('a'), 'ArrowLeft'); await wait();
ok(document.activeElement === $('c'), 'Aba: seta para a esquerda na primeira vai para a última');
key($('c'), 'Home'); await wait();
ok(document.activeElement === $('a') && $('a').getAttribute('aria-selected') === 'true', 'Aba: Home vai para a primeira');

$('y').focus(); key($('y'), 'ArrowRight');
ok(document.activeElement === $('z') && $('y').classList.contains('active') && $('z').getAttribute('aria-pressed') === 'false', 'Filtro: a seta só move o foco, não liga o filtro');
key($('z'), 'ArrowLeft'); key($('y'), 'ArrowLeft');
ok(document.activeElement === $('x'), 'Filtro: seta para a esquerda volta');
const down = new w.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }); $('x').dispatchEvent(down);
ok(!down.defaultPrevented, 'Seta para baixo continua rolando a página');

// grupo redesenhado (como nas Estatísticas e no filtro de Tarefas)
$('chips').innerHTML = '<button class="chip" aria-pressed="false" id="n1">1</button><button class="chip active" aria-pressed="true" id="n2">2</button>';
await wait();
ok(tabs(['n1', 'n2']) === '-1,0', 'Grupo redesenhado: a parada do Tab é refeita sozinha');
stop();
$('n2').setAttribute('tabindex', '-1'); key($('n2'), 'ArrowLeft');
ok(document.activeElement !== $('n1'), 'Depois de desligar, as setas não fazem mais nada');

// todas as abas e filtros do app estão marcados
import { readFileSync } from 'node:fs';
const src = (f) => readFileSync(new URL('../js/' + f, import.meta.url), 'utf8');
for (const [f, re, nome] of [
  ['pages/profile.js', /role="tablist" data-roving="tabs"/, 'Perfil: abas'], ['pages/shop.js', /role="tablist" data-roving="tabs"/, 'Loja: abas'],
  ['components/stats-view.js', /role="tablist"[^>]*data-roving="tabs"/, 'Estatísticas: abas'], ['pages/login.js', /role="tablist" data-roving="tabs"/, 'Login: abas'],
  ['pages/tasks.js', /class="chips" data-roving="buttons"/, 'Tarefas: filtros'], ['pages/routine.js', /id="days" data-roving="buttons"/, 'Rotina: dias'],
  ['pages/home.js', /class="quick"[^>]*data-roving="buttons"/, 'Home: tempo'], ['components/goal-cards.js', /goal-pick"[^>]*data-roving="buttons"/, 'Metas: escolha da meta'],
  ['components/settings-menu.js', /goal-pick"[^>]*data-roving="buttons"/, 'Menu: tamanho do texto'], ['app.js', /enableArrowNav\(root\)/, 'App liga as setas'],
]) ok(re.test(src(f)), `Marcado: ${nome}`);
process.exit(process.exitCode || 0);
