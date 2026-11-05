// Confere se todo arquivo que o app importa existe de verdade (e com as letras maiúsculas/minúsculas certas).
// Uso: node scripts/verificar-arquivos.mjs
// "FALTA" = arquivo que não existe; "CONFLITO" = sobrou marca de conflito do Git. Os dois deixam a página em branco.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arquivosJs = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? arquivosJs(p) : p.endsWith('.js') ? [p] : [];
});
// confere cada pedaço do caminho com as letras exatas (o GitHub Pages diferencia maiúsculas de minúsculas)
const existeExato = (caminho) => {
  let atual = raiz;
  for (const parte of relative(raiz, caminho).split(/[\\/]/)) {
    if (!readdirSync(atual).includes(parte)) return false;
    atual = join(atual, parte);
  }
  return true;
};

let faltas = 0, total = 0;
for (const arq of [...arquivosJs(join(raiz, 'js')), join(raiz, 'sw.js')].filter(existsSync)) {
  const texto = readFileSync(arq, 'utf8');
  for (const m of texto.matchAll(/(?:from\s+|import\s*\(\s*|import\s+)['"](\.{1,2}\/[^'"]+)['"]/g)) {
    total++;
    const alvo = resolve(dirname(arq), m[1]);
    if (!existsSync(alvo) || !existeExato(alvo)) {
      faltas++;
      console.log(`FALTA  ${relative(raiz, alvo)}   (pedido por ${relative(raiz, arq)})`);
    }
  }
}
// marcas de conflito do Git esquecidas (deixam a página em branco)
const MARCA = /^(<{7}( |$)|={7}$|>{7}( |$))/m;
for (const arq of arquivosJs(join(raiz, 'js'))) {
  if (MARCA.test(readFileSync(arq, 'utf8').replace(/\r/g, ''))) { faltas++; console.log(`CONFLITO  ${relative(raiz, arq)}   (sobrou <<<<<<< / ======= / >>>>>>> do Git: abra o arquivo e resolva)`); }
}
console.log(faltas ? `\n${faltas} problema(s) encontrado(s).` : `Tudo certo: ${total} imports, nenhum arquivo faltando.`);
process.exit(faltas ? 1 : 0);
