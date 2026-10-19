// Temas: Papel (claro) e Grafite (escuro) gratuitos, Neon (clássico) na Loja, fonte Space Grotesk (só o Neon usa Orbitron).
import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><head><meta name="theme-color" content="#000"></head><body><div id="app"></div><div id="toasts"></div></body></html>', { url: 'http://localhost/' });
const w = dom.window;
for (const k of ['window', 'document', 'location']) Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });
globalThis.getComputedStyle = w.getComputedStyle.bind(w);
const css = readFileSync(new URL('../css/style.css', import.meta.url), 'utf8');
const st = w.document.createElement('style'); st.textContent = css; w.document.head.appendChild(st);

const base = new URL('../js/', import.meta.url).href;
const auth = await import(base + 'auth.js');
const T = await import(base + 'themes.js');
const { parseImport } = await import(base + 'data-import.js');
const { renderProfile } = await import(base + 'pages/profile.js');
const { renderShop } = await import(base + 'pages/shop.js');
const { hslToRgb, contrast } = await import(base + 'contrast.js');
const { getEnergyConfig } = await import(base + 'components/energy-slider.js');
const wait = (ms = 40) => new Promise((r) => setTimeout(r, ms));
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const root = document.getElementById('app');
const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const near = (a, b, tol = 4) => a.every((v, i) => Math.abs(v - b[i]) <= tol);
const root$ = document.documentElement;
const cssVar = (n) => getComputedStyle(root$).getPropertyValue(`--${n}`).trim();

// ---------- paleta aprovada ----------
const PALETTE = {
  papel: { background: '#F7F6F2', card: '#FFFFFF', foreground: '#1C1A19', 'muted-foreground': '#53514F', border: '#E1E0DA', accent: '#8A6414', destructive: '#B3382C', success: '#2B7A4B', warning: '#8F5B00' },
  grafite: { background: '#100E0C', card: '#1A1816', foreground: '#EFEDE9', 'muted-foreground': '#B1B0AA', border: '#2A2723', accent: '#D8AE55', destructive: '#EC6B5F', success: '#5FBF86', warning: '#E5B040' },
};
for (const [theme, colors] of Object.entries(PALETTE)) {
  T.applyTheme(theme);
  const wrong = Object.entries(colors).filter(([n, hex]) => !near(hslToRgb(cssVar(n)), hexToRgb(hex)));
  ok(wrong.length === 0, `Paleta ${theme}: cores iguais às aprovadas ${wrong.length ? '(' + wrong.map((x) => x[0]).join(', ') + ')' : ''}`);
}
// Papel é o espelho claro do Grafite: tinta e fundo trocados
T.applyTheme('papel');
const pf = hslToRgb(cssVar('primary')), pb = hslToRgb(cssVar('background'));
T.applyTheme('grafite');
ok(near(hslToRgb(cssVar('primary')), pb, 14) && near(hslToRgb(cssVar('background')), pf, 14), 'Grafite: tinta e fundo são o inverso do Papel');

// ---------- fonte ----------
for (const t of [...T.FREE_THEMES, ...T.SHOP_THEMES]) {
  T.applyTheme(t.id);
  const f = cssVar('font-display');
  if (t.id === 'neon') ok(/Orbitron/.test(f) && !/Space/.test(f), 'Fonte: Neon (clássico) é o único com Orbitron');
  else ok(/^["']?Space Grotesk/.test(f) && !/Orbitron/.test(f), `Fonte: ${t.name} usa Space Grotesk`);
}
const fontsCss = readFileSync(new URL('../css/fonts.css', import.meta.url), 'utf8');
ok(/font-family: 'Space Grotesk'/.test(fontsCss) && /font-family: 'Orbitron'/.test(fontsCss), 'Fonte: Space Grotesk e Orbitron carregadas pelo css/fonts.css')

// ---------- padrão, "último tema" e migração ----------
await auth.register('Ana', 'ana@x.com', 'segredo1');
const user = auth.state.user, uid = user.id;
ok(T.getActiveTheme(uid) === 'papel' && T.DEFAULT_THEME === 'papel', 'Padrão: conta nova começa no Papel');
localStorage.setItem(`energy-planner-theme-${uid}`, 'default');
ok(T.getActiveTheme(uid) === 'papel', 'Padrão: o antigo "default" vira Papel');
T.setActiveThemeStorage(uid, 'grafite');
ok(T.getActiveTheme(uid) === 'grafite' && root$.getAttribute('data-theme') === 'grafite' && T.getLastTheme() === 'grafite', 'Escolher Grafite: aplica, grava e vira o último tema');
ok(document.querySelector('meta[name="theme-color"]').getAttribute('content') === `hsl(${cssVar('background')})`, 'Barra do navegador: theme-color acompanha o fundo do tema');
T.applyTheme('nao-existe');
ok(root$.getAttribute('data-theme') === 'papel', 'Tema desconhecido cai no Papel');

localStorage.clear();
T.migrateThemes({ id: 'velho', createdAt: Date.UTC(2026, 0, 1) });
ok(T.getInventory('velho').includes('neon'), 'Migração: quem já tinha conta ganha o Neon (clássico) de graça');
T.migrateThemes({ id: 'novo', createdAt: Date.UTC(2026, 11, 1) });
ok(!T.getInventory('novo').includes('neon'), 'Migração: conta nova não ganha o Neon');
localStorage.setItem('energy-planner-theme-velho', 'default');
T.migrateThemes({ id: 'velho', createdAt: 1 });
ok(localStorage.getItem('energy-planner-theme-velho') === 'default', 'Migração: roda uma vez só');
T.migrateThemes({ id: 'sunsetter', createdAt: 1 });
T.addToInventory('sunsetter', 'sunset'); localStorage.setItem('energy-planner-theme-sunsetter', 'sunset');
ok(T.getActiveTheme('sunsetter') === 'sunset', 'Migração: quem usa um tema da Loja continua nele');

// ---------- Perfil ----------
T.setActiveThemeStorage(uid, 'papel');
await renderProfile(root); await wait(100);
const tabBtn = [...root.querySelectorAll('[data-tab]')].find((b) => /invent/i.test(b.dataset.tab + b.textContent));
tabBtn?.click(); await wait(60);
ok(!!root.querySelector('[data-theme-id="papel"]') && !!root.querySelector('[data-theme-id="grafite"]') && !root.querySelector('[data-theme-id="default"]'), 'Perfil: Papel e Grafite sempre disponíveis (sem Cyberpunk padrão)');
ok(!root.querySelector('[data-theme-id="neon"]'), 'Perfil: Neon só aparece depois de comprado');
root.querySelector('[data-theme-id="grafite"]').click(); await wait(40);
ok(root$.getAttribute('data-theme') === 'grafite' && T.getActiveTheme(uid) === 'grafite', 'Perfil: trocar para Grafite sem precisar comprar');
root.querySelector('[data-theme-id="papel"]').click(); await wait(40);
ok(root$.getAttribute('data-theme') === 'papel', 'Perfil: voltar para Papel');
T.addToInventory(uid, 'neon');
await renderProfile(root); await wait(100);
[...root.querySelectorAll('[data-tab]')].find((b) => /invent/i.test(b.dataset.tab + b.textContent))?.click(); await wait(60);
root.querySelector('[data-theme-id="neon"]').click(); await wait(40);
ok(root$.getAttribute('data-theme') === 'neon', 'Perfil: Neon (clássico) comprado pode ser equipado');

// ---------- Loja ----------
const neon = T.SHOP_THEMES.find((t) => t.id === 'neon');
ok(neon && neon.cost === 3500 && neon.name === 'Neon (clássico)' && !T.FREE_THEMES.some((t) => t.id === 'neon'), 'Loja: Neon (clássico) é vendido por 3500 pontos');
ok(T.FREE_THEMES.every((t) => !T.SHOP_THEMES.some((s) => s.id === t.id)), 'Loja: Papel e Grafite não são vendidos');

// ---------- importação ----------
ok(parseImport(JSON.stringify({ tasks: [], activeTheme: 'grafite' })).theme === 'grafite', 'Importar: aceita tema ativo Grafite');
ok(parseImport(JSON.stringify({ tasks: [], activeTheme: 'default' })).theme === null, 'Importar: "default" antigo é ignorado');
ok(parseImport(JSON.stringify({ tasks: [], inventory: ['neon', 'sunset', 'xyz'] })).inventory.join() === 'neon,sunset', 'Importar: Neon entra no inventário');

// ---------- cores de energia seguem o tema ----------
ok(getEnergyConfig(2).color === 'hsl(var(--energy-low))' && getEnergyConfig(5).color === 'hsl(var(--energy-mid))' && getEnergyConfig(9).color === 'hsl(var(--energy-high))', 'Energia: cores vêm das variáveis do tema');
T.applyTheme('neon');
ok(cssVar('energy-low') === '0 85% 55%' && cssVar('energy-mid') === '45 100% 55%' && cssVar('energy-high') === '150 100% 50%', 'Energia: Neon mantém exatamente as cores de antes');

// ---------- contraste de texto no Papel (categorias e selos) ----------
const rule = (sel) => { const i = css.indexOf(sel); return css.slice(i, css.indexOf('}', i)); };
const cream = hexToRgb('#F7F6F2'), white = [255, 255, 255];
const mix = (fg, bg, a) => fg.map((v, i) => v * a + bg[i] * (1 - a));
let worst = 99;
for (const c of ['health', 'finance', 'leisure', 'social', 'creative', 'study', 'personal']) {
  const r = rule(`html[data-theme="papel"] .category-${c}`);
  const text = r.match(/[^-]color: (hsl\([^)]*\))/)[1].match(/[\d.]+/g).map(Number);
  const fg = hslToRgb(`${text[0]} ${text[1]}% ${text[2]}%`);
  const tint = r.match(/background: hsl\(([\d.]+) ([\d.]+)% ([\d.]+)% \/ ([\d.]+)\)/);
  const tintRgb = tint ? hslToRgb(`${tint[1]} ${tint[2]}% ${tint[3]}%`) : fg;
  const a = tint ? Number(tint[4]) : 0.2;
  for (const bg of [cream, white]) worst = Math.min(worst, contrast(fg, mix(tintRgb, bg, a)));
}
ok(worst >= 4.5, `Papel: texto das 7 etiquetas de categoria passa de 4,5 (pior: ${worst.toFixed(1)})`);

// ---------- brilho dos botões de dia não pode ser cortado em quadrado ----------
const chips = rule('.chips {');
ok(/overflow-x: auto/.test(chips) && /padding: 0\.75rem/.test(chips) && /margin: -0\.75rem/.test(chips), 'Rotina: a faixa de dias tem folga para o brilho (sem quadrado de luz)');

// ---------- ordem da Loja: do mais barato ao mais caro ----------
const costs = T.SHOP_THEMES.map((t) => t.cost);
ok(costs.every((c, i) => i === 0 || c >= costs[i - 1]), 'Loja: temas em ordem de preço');
ok(T.SHOP_THEMES.map((t) => t.id).join() === 'sunset,forest,ocean,midnight,neon,silver,gold', 'Loja: Neon fica entre Meia-Noite e Prata Lunar');
