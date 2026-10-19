// Publicação (GitHub Pages) e guia de estilo.
//  - O app roda em subpasta (https://usuario.github.io/Energy-Based-Planner/): nada pode usar caminho que começa com "/".
//  - O guia de estilo precisa montar com todos os temas e calcular o contraste.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const exists = (p) => existsSync(new URL(p, root));

// ---------- caminhos relativos ----------
function walk(dir, out = []) {
  for (const name of readdirSync(new URL(dir, root))) {
    const rel = dir + name;
    if (statSync(new URL(rel, root)).isDirectory()) walk(rel + '/', out); else out.push(rel);
  }
  return out;
}
const sources = ['index.html', 'styleguide.html', 'sw.js', ...walk('js/'), ...walk('css/')];
const rootAbs = /(?:href|src|action)\s*=\s*["']\/(?!\/)|fetch\(\s*["'`]\/(?!\/)|import\s*(?:\(|[^'"`]*from\s*)["']\/(?!\/)|url\(\s*["']?\/(?!\/)/;
const bad = sources.filter((f) => rootAbs.test(read(f)));
ok(bad.length === 0, `Caminhos: nenhum arquivo usa endereço que começa com "/" ${bad.length ? '(' + bad.join(', ') + ')' : ''}`);

// ---------- manifest ----------
const manifest = JSON.parse(read('manifest.webmanifest'));
ok(!manifest.start_url.startsWith('/') && !manifest.scope.startsWith('/') && !String(manifest.id).startsWith('/'), 'Manifest: start_url, scope e id são relativos');
ok(manifest.icons.length >= 3 && manifest.icons.every((i) => !i.src.startsWith('/') && exists(i.src)), 'Manifest: todos os ícones existem e são relativos');
ok(manifest.icons.some((i) => i.purpose === 'maskable') && manifest.icons.some((i) => i.sizes === '512x512'), 'Manifest: tem ícone de 512 px e ícone maskable');

// ---------- index.html ----------
const index = read('index.html');
const refs = [...index.matchAll(/(?:href|src)="([^"#:]+?)"/g)].map((m) => m[1]).filter((u) => !u.startsWith('//'));
const missing = refs.filter((u) => !exists(u));
ok(refs.length > 5 && missing.length === 0, `Index: todos os arquivos referenciados existem ${missing.length ? '(faltam: ' + missing.join(', ') + ')' : ''}`);
ok(/<link rel="manifest" href="manifest\.webmanifest">/.test(index) && /viewport-fit=cover/.test(index), 'Index: manifest ligado e viewport pronto para celular');
ok(/register\('sw\.js'\)/.test(read('js/app.js')) && exists('sw.js'), 'App: registra o service worker por caminho relativo');
ok(exists('.nojekyll'), 'GitHub Pages: .nojekyll presente (publica os arquivos como estão)');

// ---------- fontes hospedadas no app ----------
const fontsCss = read('css/fonts.css');
const fontUrls = [...fontsCss.matchAll(/url\('\.\.\/([^']+)'\)/g)].map((m) => m[1]);
ok(fontUrls.length === 7 && fontUrls.every((u) => exists(u) && statSync(new URL(u, root)).size > 3000), 'Fontes: 7 arquivos .woff2 existem e não estão vazios');
ok(['Inter', 'Orbitron', 'Space Grotesk'].every((f) => fontsCss.includes(`font-family: '${f}'`)) && !/fonts\.googleapis|gstatic/.test(index), 'Fontes: Inter, Orbitron e Space Grotesk locais; index.html não chama o Google');
ok(index.includes('css/fonts.css') && ['LICENSE-Inter.txt', 'LICENSE-Orbitron.txt', 'LICENSE-SpaceGrotesk.txt'].every((f) => exists('fonts/' + f)), 'Fontes: fonts.css ligado e licenças (OFL) junto dos arquivos');
ok(/\/fonts\//.test(read('sw.js')), 'Fontes: o service worker guarda as fontes para uso offline');

// ---------- contraste (funções puras) ----------
const { hslToRgb, contrast } = await import(new URL('js/contrast.js', root).href);
const white = hslToRgb('0 0% 100%'), black = hslToRgb('0 0% 0%');
ok(Math.round(white[0]) === 255 && Math.round(black[0]) === 0, 'Contraste: HSL -> RGB (branco e preto)');
ok(Math.abs(contrast(white, black) - 21) < 0.01 && Math.abs(contrast(white, white) - 1) < 0.001, 'Contraste: branco x preto = 21, igual = 1');
ok(Math.abs(contrast(hslToRgb('0 0% 46.7%'), white) - 4.48) < 0.05, 'Contraste: cinza #777 sobre branco ≈ 4,5');

// ---------- guia de estilo montado de verdade ----------
const html = read('styleguide.html').replace(/<link[^>]*>/g, '').replace(/<script[^>]*><\/script>/g, '');
const dom = new JSDOM(html, { url: 'http://localhost/styleguide.html' });
const w = dom.window;
const style = w.document.createElement('style');
style.textContent = read('css/style.css');
w.document.head.appendChild(style);
for (const k of ['window', 'document', 'location']) Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });
globalThis.getComputedStyle = w.getComputedStyle.bind(w);
await import(new URL('js/styleguide.js', root).href);

const buttons = [...w.document.querySelectorAll('#themes [data-theme-id]')];
ok(buttons.length === 9 && buttons[0].dataset.themeId === 'papel' && buttons[1].dataset.themeId === 'grafite', 'Guia: botões de tema (Papel, Grafite + 7 da loja)');
const rows = [...w.document.querySelectorAll('#contrast tbody tr')];
const cells = rows.flatMap((r) => [...r.querySelectorAll('td')]);
ok(rows.length === 14 && cells.length === 14 * 9, 'Guia: tabela de contraste com 14 pares x 9 temas');
ok(cells.every((c) => /^\d+\.\d (✓|✗)$/.test(c.textContent)), 'Guia: todas as células têm um número válido e ✓ ou ✗');
ok(w.document.querySelectorAll('#swatches .sg-swatch').length === 18, 'Guia: amostras das 18 cores do tema');
const themeBtn = (i) => w.document.querySelectorAll('#themes [data-theme-id]')[i];
const wanted = themeBtn(3).dataset.themeId;
themeBtn(3).click();
ok(w.document.documentElement.getAttribute('data-theme') === wanted && themeBtn(3).getAttribute('aria-pressed') === 'true' && themeBtn(0).getAttribute('aria-pressed') === 'false', 'Guia: clicar num tema aplica e marca o botão');
ok(w.document.activeElement === themeBtn(3), 'Guia: o foco do teclado continua no botão do tema');
themeBtn(0).click();
ok(w.document.documentElement.getAttribute('data-theme') === 'papel', 'Guia: voltar ao Papel');
ok(w.localStorage.getItem('energy-planner-last-theme') === null, 'Guia: não mexe no "último tema" do app');
ok(w.document.querySelectorAll('#categories .badge').length === 8 && !!w.document.querySelector('#progress-slot .level-badge'), 'Guia: categorias e cartão de nível renderizados');
// Cada botão e campo do guia tem nome acessível
const unnamed = [...w.document.querySelectorAll('button')].filter((b) => !(b.textContent.trim() || b.getAttribute('aria-label')));
ok(unnamed.length === 0, 'Guia: todos os botões têm texto ou aria-label');
w.document.querySelector('[data-toast="success"]').click();
ok(!!w.document.querySelector('#toasts .toast.success'), 'Guia: aviso de exemplo aparece');
w.document.querySelector('#open-modal').click();
ok(!!w.document.querySelector('.modal-overlay [role="dialog"]'), 'Guia: janela real abre');

// Mostra o que o guia achou (informativo: a correção é a tarefa A7)
const fails = cells.filter((c) => c.classList.contains('fail')).length;
console.log(`INFO  pares de cor abaixo de 4,5: ${fails} de ${cells.length} (veja styleguide.html)`);
