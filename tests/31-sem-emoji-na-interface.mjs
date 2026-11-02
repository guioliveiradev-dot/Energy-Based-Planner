// A interface usa os ícones do app (js/icons.js) e não emoji. Este teste avisa se um emoji voltar a entrar no código.
// Exceção: os 6 pets antigos da Loja ainda usam emoji (js/themes.js) até chegarem os desenhos do grupo.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { icon } from '../js/icons.js';
import { CATEGORY_LABELS, CATEGORY_ICON, categoryIcon } from '../js/categories.js';
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const root = new URL('../', import.meta.url);
const ALLOWED = new Set(['js/themes.js']);
const walk = (dir, out = []) => {
  for (const name of readdirSync(new URL(dir, root))) {
    const rel = dir + name;
    if (statSync(new URL(rel, root)).isDirectory()) walk(rel + '/', out); else if (/\.(js|html|css)$/.test(name)) out.push(rel);
  }
  return out;
};
const EMOJI = /\p{Extended_Pictographic}/u;
const files = [...walk('js/'), 'index.html', 'css/style.css', 'css/progress.css'];
const found = [];
for (const f of files) {
  if (ALLOWED.has(f)) continue;
  readFileSync(new URL(f, root), 'utf8').split('\n').forEach((line, i) => { if (EMOJI.test(line)) found.push(`${f}:${i + 1}`); });
}
ok(found.length === 0, `Sem emoji no código da interface${found.length ? ' (achei em: ' + found.join(', ') + ')' : ''}`);
const vazio = icon('nao-existe').length;   // ícone que não existe sai como SVG sem desenho
ok(Object.keys(CATEGORY_LABELS).every((id) => CATEGORY_ICON[id] && icon(CATEGORY_ICON[id]).length > vazio), 'Categorias: todas têm um ícone desenhado');
ok(categoryIcon('work').startsWith('<svg') && categoryIcon('nao-existe') === '', 'Categorias: ícone em SVG, e categoria desconhecida não quebra');
