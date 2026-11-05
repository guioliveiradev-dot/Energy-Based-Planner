// Garante que nenhum arquivo ficou com marcas de conflito do Git (<<<<<<<, =======, >>>>>>>).
// Foi isso que deixou a página em branco depois de um "git rebase" com conflito.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const raiz = fileURLToPath(new URL('..', import.meta.url));
const PULAR = new Set(['node_modules', '.git']);
const EXT = new Set(['.js', '.mjs', '.css', '.html', '.json', '.md', '.webmanifest']);
const lista = (dir) => readdirSync(dir).flatMap((n) => {
  if (PULAR.has(n)) return [];
  const p = join(dir, n);
  return statSync(p).isDirectory() ? lista(p) : EXT.has(extname(p)) ? [p] : [];
});
const marca = /^(<{7}( |$)|={7}$|>{7}( |$))/m;
const ruins = lista(raiz).filter((p) => marca.test(readFileSync(p, 'utf8').replace(/\r/g, ''))).map((p) => relative(raiz, p));
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
ok(ruins.length === 0, ruins.length ? `Arquivos com marcas de conflito: ${ruins.join(', ')}` : 'Nenhum arquivo com marcas de conflito do Git');
