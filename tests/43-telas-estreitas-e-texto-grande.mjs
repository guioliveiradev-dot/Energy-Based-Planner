// Telas estreitas (320 px) e texto grande (até 200%): as regras que impedem estourar a largura.
import { readFileSync } from 'node:fs';
const css = readFileSync(new URL('../css/style.css', import.meta.url), 'utf8');
const prog = readFileSync(new URL('../css/progress.css', import.meta.url), 'utf8');
const menu = readFileSync(new URL('../js/components/settings-menu.js', import.meta.url), 'utf8');
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };

ok(/\.tabs-4\s*\{[^}]*minmax\(0,\s*1fr\)/.test(css) && /\.tabs-3\s*\{[^}]*minmax\(0,\s*1fr\)/.test(css), 'Abas de 3 e 4 colunas podem encolher');
ok(/\.row-between\s*\{\s*flex-wrap:\s*wrap/.test(css), 'Linhas com botões à direita quebram em vez de estourar');
ok(/\.icon-btn,\s*\.menu-btn\s*\{[^}]*min\(2\.75rem,\s*48px\)/.test(css), 'Botões de ícone não crescem sem fim com o texto');
ok(/\.switch\s*\{\s*width:\s*min\(3rem,\s*48px\)/.test(css), 'O interruptor tem tamanho limitado');
ok(/\.pad\s*\{\s*padding:\s*min\(1rem,\s*18px\)/.test(css), 'As margens dos cartões têm limite');
ok(/\.nav-tab\s*\{[^}]*min-width:\s*0/.test(css), 'A barra de baixo cabe com 6 itens');
ok(/\.week-dots\s*\{[^}]*minmax\(0,\s*1fr\)/.test(prog) && /\.streak-flame\s*\{[^}]*min\(3\.25rem,\s*56px\)/.test(prog), 'Sequência: os 7 dias e a chama cabem');
ok(/\.menu-btn\s*\{/.test(css) && /class="menu-btn"/.test(menu), 'O botão do sanduíche tem classe própria');
ok(!/\.icon-btn\s*\{[^}]*border-radius:\s*50%/.test(css), 'O .icon-btn dos botões de editar/apagar continua quadrado arredondado');
// o bloco de texto grande vem depois das regras base (senão não vale)
ok(css.lastIndexOf('.switch { width: min(3rem, 48px)') > css.indexOf('.switch { appearance'), 'As regras de texto grande vêm por último');
