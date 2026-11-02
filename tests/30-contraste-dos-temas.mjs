// Contraste de todos os temas: nenhum par de cor de texto pode cair abaixo de 4,5 (WCAG AA).
// É a mesma tabela do guia de estilo (styleguide.html), agora como teste que falha.
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { url: 'http://localhost/' });
const w = dom.window;
for (const k of ['window', 'document', 'location']) Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });
globalThis.getComputedStyle = w.getComputedStyle.bind(w);
const st = w.document.createElement('style');
st.textContent = readFileSync(new URL('../css/style.css', import.meta.url), 'utf8');
w.document.head.appendChild(st);

const base = new URL('../js/', import.meta.url).href;
const T = await import(base + 'themes.js');
const { CONTRAST_PAIRS, MIN_CONTRAST, SOLID_CARD_THEMES, themeContrast } = await import(base + 'contrast.js');
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };

const VARS = [...new Set(CONTRAST_PAIRS.flatMap(([, a, b]) => [a, b]))].filter((v) => v !== 'card').concat('card');
const readVars = () => {
  const cs = getComputedStyle(document.documentElement);
  return Object.fromEntries(VARS.map((v) => [v, cs.getPropertyValue(`--${v}`).trim()]));
};

// Os ids da Loja não mudam: quem comprou continua com o que comprou.
const ids = [...T.FREE_THEMES, ...T.SHOP_THEMES].map((t) => t.id).sort();
ok(JSON.stringify(ids) === JSON.stringify(['forest', 'gold', 'grafite', 'midnight', 'neon', 'ocean', 'papel', 'silver', 'sunset']), 'Temas: os 9 ids continuam os mesmos');

for (const t of [...T.FREE_THEMES, ...T.SHOP_THEMES]) {
  T.applyTheme(t.id, { remember: false });
  const vars = readVars();
  const missing = VARS.filter((v) => !vars[v]);
  const res = themeContrast(vars, SOLID_CARD_THEMES.includes(t.id));
  const bad = res.filter((r) => r.ratio < MIN_CONTRAST);
  ok(!missing.length && bad.length === 0,
    `Contraste ${t.name}: ${res.length} pares com no mínimo ${MIN_CONTRAST}${bad.length ? ' (abaixo: ' + bad.map((b) => `${b.label} ${b.ratio.toFixed(2)}`).join('; ') + ')' : ''}${missing.length ? ' (faltam variáveis: ' + missing.join(', ') + ')' : ''}`);
}

// O teste precisa mesmo falhar quando um par cai: uma paleta ruim tem que ser pega.
T.applyTheme('sunset', { remember: false });
const ruim = { ...readVars(), destructive: '0 85% 40%' };
ok(themeContrast(ruim, false).some((r) => r.ratio < MIN_CONTRAST), 'Autoteste: um vermelho escuro demais é pego como falha');
