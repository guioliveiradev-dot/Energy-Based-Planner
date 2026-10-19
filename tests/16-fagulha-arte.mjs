// Arte da Fagulha (SVG): todas as combinações de pose, estágio e estilo precisam ser desenhos válidos.
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><body></body>');
const parser = new dom.window.DOMParser();
const A = await import(new URL('../js/pet-art.js', import.meta.url).href);
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };

const combos = [];
for (const style of ['flat', 'color']) for (const stage of A.FAGULHA_STAGES) for (const pose of A.FAGULHA_POSES) combos.push({ style, stage, pose });
ok(combos.length === 24, 'Fagulha: 4 poses x 3 estágios x 2 estilos = 24 desenhos');
const broken = combos.filter((o) => {
  const svg = A.fagulhaSVG({ ...o, size: 100 });
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  return doc.querySelector('parsererror') || /undefined|NaN|null/.test(svg) || !doc.documentElement.getAttribute('aria-label');
});
ok(broken.length === 0, `Fagulha: todos os desenhos são SVG válidos, sem valores quebrados ${broken.length ? JSON.stringify(broken[0]) : ''}`);

const svg = A.fagulhaSVG({ pose: 'sleep', stage: 'aura', style: 'flat', size: 80 });
const el = parser.parseFromString(svg, 'image/svg+xml').documentElement;
ok(el.getAttribute('width') === '80' && el.getAttribute('role') === 'img' && /Aura/.test(el.getAttribute('aria-label')) && /dormindo/.test(el.getAttribute('aria-label')), 'Acessibilidade: role="img" e nome com estágio e pose (leitor de tela)');
ok(el.querySelector('title').textContent === el.getAttribute('aria-label'), 'Acessibilidade: <title> igual ao nome');
ok(A.fagulhaSVG({ label: 'Pet do dia' }).includes('aria-label="Pet do dia"'), 'Acessibilidade: nome pode ser trocado');

ok(/hsl\(var\(--foreground\)\)/.test(A.fagulhaSVG({ style: 'flat' })) && /hsl\(var\(--accent\)\)/.test(A.fagulhaSVG({ style: 'flat' })), 'Estilo chapado: segue as cores do tema (tinta e acento)');
ok(!/linearGradient/.test(A.fagulhaSVG({ style: 'flat' })) && /linearGradient/.test(A.fagulhaSVG({ style: 'color' })), 'Estilo colorido: usa degradê; o chapado não');
ok(A.fagulhaSVG({ style: 'flat', colors: { ink: '#123456' } }).includes('#123456'), 'Cores: podem ser trocadas por quem usa o desenho');

ok([1, 2, 3, 4, 5, 9].map(A.fagulhaStage).join() === 'spark,spark,flame,flame,aura,aura', 'Estágios: nível 1-2 Faísca, 3-4 Chama, 5 Aura');
ok(A.FAGULHA_STAGES.map((s) => A.FAGULHA_STAGE_NAMES[s]).join() === 'Faísca,Chama,Aura', 'Estágios: nomes Faísca, Chama, Aura');
const sig = (o) => A.fagulhaSVG(o);
ok(new Set(A.FAGULHA_POSES.map((pose) => sig({ pose }))).size === 4 && new Set(A.FAGULHA_STAGES.map((stage) => sig({ stage }))).size === 3, 'Variações: cada pose e cada estágio gera um desenho diferente');
ok(/<g fill=".*">.*<path d="M\d+ \d+ Q/s.test(sig({ pose: 'cheer' })) && !/stroke-dasharray/.test(sig({})) && !/M84 30 h10/.test(sig({ pose: 'idle' })) && /M84 30 h10/.test(sig({ pose: 'sleep' })), 'Poses: brilhos só ao comemorar e "zzz" só ao dormir');

// ---------- cores trocáveis pelo tema (variáveis --pet-*) ----------
const def = A.fagulhaSVG({ style: 'flat', stage: 'aura' });
ok(['--pet-body', '--pet-base', '--pet-face', '--pet-bolt', '--pet-aura'].every((v) => def.includes(`var(${v}`)), 'Cores: corpo, base, rosto, raio e aura podem ser trocados por variáveis CSS (--pet-*)');
const custom = A.fagulhaSVG({ style: 'flat', stage: 'aura', colors: { ink: '#111111', base: '#666666', bg: '#222222', accent: '#333333', aura: '#444444' } });
ok(['#111111', '#666666', '#222222', '#333333', '#444444'].every((c) => custom.includes(c)), 'Cores: corpo, base, rosto, raio e aura aceitam cor própria');
ok(A.fagulhaSVG({ style: 'flat', colors: { ink: '#abcdef' } }).match(/<ellipse[^>]*fill="#abcdef"/), 'Cores: se só o corpo muda, a base acompanha');
ok(!/<ellipse[^>]*stroke/.test(def) && /<ellipse[^>]*fill="var\(--pet-base/.test(def), 'Base: sem contorno e com um tom próprio (--pet-base)');

// ---------- Fagulha legível em TODOS os temas (nada de mascote todo branco) ----------
const css = readFileSync(new URL('../css/style.css', import.meta.url), 'utf8');
const sdom = new JSDOM('<!doctype html><html><body></body></html>');
const st = sdom.window.document.createElement('style'); st.textContent = css; sdom.window.document.head.appendChild(st);
const T = await import(new URL('../js/themes.js', import.meta.url).href);
const { hslToRgb, contrast } = await import(new URL('../js/contrast.js', import.meta.url).href);
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const root = sdom.window.document.documentElement;
const v = (n) => sdom.window.getComputedStyle(root).getPropertyValue(`--${n}`).trim();
const themes = [...T.FREE_THEMES, ...T.SHOP_THEMES];
const problems = [];
for (const t of themes) {
  root.setAttribute('data-theme', t.id);
  const body = v('pet-body'), face = v('pet-face'), bolt = v('pet-bolt'), aura = v('pet-aura');
  if (![body, face, bolt, aura].every((x) => /^#[0-9A-Fa-f]{6}$/.test(x))) { problems.push(`${t.id}: faltam cores --pet-*`); continue; }
  const bg = hslToRgb(v('background')), fg = hslToRgb(v('foreground'));
  const base = v('pet-base');
  if (!/^#[0-9A-Fa-f]{6}$/.test(base) || contrast(rgb(base), rgb(body)) < 1.1 || contrast(rgb(base), bg) < 2) problems.push(`${t.id}: base sem tom próprio ou some no fundo`);
  if (contrast(rgb(body), bg) < 2.9) problems.push(`${t.id}: corpo some no fundo (${contrast(rgb(body), bg).toFixed(1)})`);
  if (contrast(rgb(face), rgb(body)) < 4.5) problems.push(`${t.id}: rosto difícil de ver no corpo (${contrast(rgb(face), rgb(body)).toFixed(1)})`);
  if (contrast(rgb(bolt), bg) < 3) problems.push(`${t.id}: raio some no fundo (${contrast(rgb(bolt), bg).toFixed(1)})`);
  if (contrast(rgb(body), fg) < 1.5 && contrast(rgb(body), bg) < 1.5) problems.push(`${t.id}: corpo sem contraste`);
  if (contrast(rgb(body), fg) < 1.3) problems.push(`${t.id}: corpo igual à cor do texto (mascote todo branco ou todo preto)`);
}
ok(themes.length === 9 && problems.length === 0, `Fagulha: legível nos 9 temas (corpo 3:1 com o fundo, rosto 4,5:1 com o corpo, raio 3:1) ${problems.join(' | ')}`);
root.setAttribute('data-theme', 'neon');
ok(v('pet-body') !== v('foreground') && v('pet-body').toLowerCase() !== '#f8fafc', 'Fagulha: no Neon o corpo não é branco');
