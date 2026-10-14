// Roda todos os testes e mostra um resumo.  Uso:  npm install  (uma vez)  e depois  npm test
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('.', import.meta.url));
const files = readdirSync(dir).filter((f) => /^\d\d-.*\.mjs$/.test(f)).sort();
let failed = 0, passed = 0;

for (const file of files) {
  const r = spawnSync(process.execPath, [dir + file], { encoding: 'utf8' });
  const lines = (r.stdout || '').split('\n');
  const ok = lines.filter((l) => l.startsWith('OK')).length;
  const bad = lines.filter((l) => l.startsWith('FALHA'));
  passed += ok; failed += bad.length;
  console.log(`${bad.length || r.status ? '✗' : '✓'} ${file}  (${ok} ok${bad.length ? `, ${bad.length} falha(s)` : ''})`);
  bad.forEach((l) => console.log('    ' + l));
  if (r.status && !bad.length) { failed++; console.log('    erro:', (r.stderr || '').split('\n').slice(0, 6).join('\n    ')); }
}
console.log(`\n${passed} verificações ok, ${failed} falha(s)`);
process.exit(failed ? 1 : 0);
