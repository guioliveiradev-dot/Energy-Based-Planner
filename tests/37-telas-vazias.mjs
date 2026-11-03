// Telas vazias com desenho (opção B): Tarefas, Rotina e Recompensas mostram o desenho e mantêm a frase; o desenho é decorativo e sem emoji.
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
for (const k of ['window', 'document']) Object.defineProperty(globalThis, k, { value: k === 'window' ? dom.window : dom.window[k], configurable: true });
const { emptyState } = await import(new URL('../js/components/empty-state.js', import.meta.url).href);
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };

for (const kind of ['tasks', 'routine', 'rewards']) {
  const d = new dom.window.DOMParser().parseFromString(`<body>${emptyState(kind, 'Frase de teste.')}</body>`, 'text/html');
  const art = d.querySelector('.empty svg.empty-art');
  ok(!!art && art.getAttribute('aria-hidden') === 'true', `${kind}: desenho presente e decorativo (aria-hidden)`);
  ok(d.querySelector('.empty').getAttribute('role') === 'status' && d.querySelector('.empty p').textContent === 'Frase de teste.', `${kind}: frase mantida e anunciada (role=status)`);
  ok(!/#[0-9a-f]{3,6}\b|rgb\(/i.test(art.outerHTML), `${kind}: só cores do tema (nada fixo)`);
}
ok(emptyState('tasks', 'x') !== emptyState('rewards', 'x'), 'Cada tela tem o seu desenho');
for (const f of ['tasks', 'routine', 'shop']) ok(/emptyState\(/.test(readFileSync(new URL(`../js/pages/${f}.js`, import.meta.url), 'utf8')), `Página ${f} usa o desenho`);
const css = readFileSync(new URL('../css/style.css', import.meta.url), 'utf8');
ok(/\.empty-art\s*\{/.test(css) && /@keyframes empty-bob/.test(css), 'CSS do desenho existe');
