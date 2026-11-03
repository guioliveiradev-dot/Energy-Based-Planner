// Transição suave entre telas: a troca de tela desvanece; a primeira abertura do app não anima; o CSS respeita "reduzir movimento".
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
const dom = new JSDOM('<!doctype html><html><body><main id="outlet"></main></body></html>', { url: 'http://localhost/' });
const w = dom.window;
for (const k of ['window', 'document', 'location']) Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true });

const R = await import(new URL('../js/router.js', import.meta.url).href);
const wait = (ms = 30) => new Promise((r) => setTimeout(r, ms));
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };

const outlet = document.getElementById('outlet');
const pagina = (nome) => async (el) => { el.textContent = nome; };
location.hash = '#/';
await wait();   // deixa o jsdom disparar o hashchange inicial antes de ligar o roteador
R.startRouter({ routes: { '/': pagina('Home'), '/tasks': pagina('Tarefas') }, fallback: '/', outlet });
await wait();
ok(outlet.textContent === 'Home', 'Primeira tela aparece');
ok(!outlet.classList.contains('page-in'), 'Primeira abertura do app não anima');

location.hash = '#/tasks';
await wait();
ok(outlet.textContent === 'Tarefas', 'Trocar de tela mostra a nova tela');
ok(outlet.classList.contains('page-in'), 'Trocar de tela liga o desvanecer');

location.hash = '#/';
await wait();
ok(outlet.textContent === 'Home' && outlet.classList.contains('page-in'), 'Trocas seguidas continuam animando (sem travar a classe)');
R.stopRouter();

const css = readFileSync(new URL('../css/style.css', import.meta.url), 'utf8');
ok(/#outlet\.page-in\s*\{[^}]*animation:\s*page-in/.test(css) && /@keyframes page-in\s*\{[^}]*opacity/.test(css), 'CSS: desvanecer da troca de tela existe');
ok(!/@keyframes page-in[^}]*transform/.test(css), 'CSS: só opacidade (transform quebraria os botões fixos)');
ok(/prefers-reduced-motion:\s*reduce\)\s*\{[^}]*animation-duration:\s*0\.01ms/.test(css), 'CSS: "reduzir movimento" desliga a animação');
