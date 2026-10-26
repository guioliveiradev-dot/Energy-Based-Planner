// Prepara uma publicação: roda os testes e, se tudo passar, carimba uma versão nova (version.json e js/version.js).
// Quem está com o app aberto vê o aviso "Versão nova disponível". Uso:  npm run release
// Depois:  git add .  e  git commit  e  git push
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

console.log('Rodando os testes...');
const tests = spawnSync(process.execPath, [root + 'tests/run-all.mjs'], { encoding: 'utf8' });
const summary = (tests.stdout || '').trim().split('\n').pop();
console.log(summary);
if (!/, 0 falha\(s\)/.test(summary)) {
  console.error('\nTem teste falhando: a versão NÃO foi carimbada. Rode "npm test" para ver o que falhou.');
  process.exit(1);
}

const d = new Date();
const p = (n) => String(n).padStart(2, '0');
const version = `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}.${p(d.getHours())}${p(d.getMinutes())}`;
writeFileSync(root + 'version.json', `{ "version": "${version}" }\n`);
writeFileSync(root + 'js/version.js', `// Versão do app que está rodando. NÃO edite à mão: o comando \`npm run release\` atualiza este arquivo e o version.json juntos.\nexport const APP_VERSION = '${version}';\n`);
console.log(`\nVersão carimbada: ${version}\nAgora publique:  git add .   git commit -m "sua mensagem"   git push`);
