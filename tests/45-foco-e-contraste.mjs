// Foco e contraste: o anel de foco tem contraste de 3:1 em todos os temas, a barra de energia mostra o foco
// e as tarefas concluídas não usam opacity (ela derrubava o contraste do texto).
import { readFileSync } from 'node:fs';
import { hslToRgb, contrast } from '../js/contrast.js';
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const css = readFileSync(new URL('../css/style.css', import.meta.url), 'utf8');

const temas = {};
for (const m of css.matchAll(/(:root|html\[data-theme="([a-z]+)"\])\s*\{([^}]*)\}/g)) {
  const vars = temas[m[2] || 'neon'] ||= {};
  for (const v of m[3].matchAll(/--(ring|background|card):\s*([^;]+);/g)) vars[v[1]] = v[2].trim();
}
const ids = Object.keys(temas).filter((id) => temas[id].ring);
ok(ids.length === 9, `Foco: 9 temas com cor de anel (achei ${ids.length})`);
for (const id of ids) {
  const v = temas[id];
  ok(contrast(hslToRgb(v.ring), hslToRgb(v.background)) >= 3, `Foco: anel com 3:1 sobre o fundo (${id})`);
  ok(contrast(hslToRgb(v.ring), hslToRgb(v.card)) >= 3, `Foco: anel com 3:1 sobre o cartão (${id})`);
}
ok(/:focus-visible\s*\{[^}]*outline:\s*2px solid hsl\(var\(--ring\)\)/.test(css), 'Foco: regra geral de foco visível');
ok(/\.energy-slider:focus-visible\s*\{[^}]*outline:\s*2px/.test(css), 'Foco: a barra de energia mostra o anel');
ok(!/\.done-card\s*\{[^}]*opacity/.test(css), 'Contraste: tarefa concluída sem opacity');
