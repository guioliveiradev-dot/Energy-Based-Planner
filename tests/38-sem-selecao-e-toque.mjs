// Sensação de app: sem retângulo azul ao tocar e sem seleção de texto (campos de digitar continuam selecionáveis); o foco do teclado fica.
import { readFileSync } from 'node:fs';
const css = readFileSync(new URL('../css/style.css', import.meta.url), 'utf8');
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
ok(/html\s*\{[^}]*-webkit-tap-highlight-color:\s*transparent/.test(css), 'Sem o retângulo azul ao tocar');
ok(/body\s*\{[^}]*user-select:\s*none/.test(css) && /body\s*\{[^}]*-webkit-user-select:\s*none/.test(css), 'Texto do app não é selecionável');
ok(/body\s*\{[^}]*-webkit-touch-callout:\s*none/.test(css), 'Sem menu de copiar ao segurar o dedo (iOS)');
ok(/input,\s*textarea,[^{]*\{[^}]*user-select:\s*text/.test(css), 'Campos de digitar continuam selecionáveis');
ok(/:focus-visible\s*\{\s*outline:/.test(css), 'Anel de foco do teclado continua');
