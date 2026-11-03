// Desenho das telas vazias (Tarefas, Rotina e Recompensas): formas cheias e suaves, só com as cores do tema.
// O texto é de quem chama (já com escapeHtml, se vier do usuário). O desenho é decorativo (aria-hidden).

const SOFT = 'fill="hsl(var(--foreground) / 0.34)"';
const BODY = 'fill="hsl(var(--foreground) / 0.15)"';
const PATH = 'fill="none" stroke="hsl(var(--foreground) / 0.34)" stroke-width="5" stroke-linecap="round"';
const ACC = 'fill="hsl(var(--accent))"';
const line = (x1, x2, y) => `<rect x="${x1}" y="${y - 2.5}" width="${x2 - x1}" height="5" rx="2.5" ${SOFT}/>`;
const spark = (x, y, r, delay) => `<path class="twinkle" style="animation-delay:${delay}s" d="M${x} ${y - r}L${x + r * 0.28} ${y - r * 0.28}L${x + r} ${y}L${x + r * 0.28} ${y + r * 0.28}L${x} ${y + r}L${x - r * 0.28} ${y + r * 0.28}L${x - r} ${y}L${x - r * 0.28} ${y - r * 0.28}Z" ${ACC}/>`;

const SCENES = {
  tasks: () => `<g class="bob">
      <rect x="30" y="12" width="60" height="74" rx="9" ${BODY}/>
      <rect x="44" y="7" width="32" height="12" rx="6" ${BODY}/>
      <circle cx="45" cy="38" r="6.5" ${ACC}/><path d="M42 38l2.4 2.6 4.4-5" fill="none" stroke="hsl(var(--background))" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      ${line(57, 78, 38)}
      <circle cx="45" cy="60" r="6.5" ${BODY}/>${line(57, 72, 60)}
    </g>${spark(95, 22, 6, 0)}${spark(24, 66, 4, 1.2)}`,
  routine: () => `<g class="bob">
      <rect x="22" y="18" width="76" height="66" rx="10" ${BODY}/>
      <path d="M22 36H98" ${PATH}/>
      <path d="M42 12v13M78 12v13" ${PATH}/>
      ${line(34, 56, 50)}${line(34, 48, 64)}
      <rect x="62" y="44" width="26" height="16" rx="5" ${ACC}/>
      ${line(62, 80, 72)}
    </g>${spark(102, 30, 5, 0.4)}`,
  rewards: () => `<g class="bob">
      <rect x="26" y="40" width="68" height="44" rx="8" ${BODY}/>
      <rect x="20" y="28" width="80" height="16" rx="6" ${BODY}/>
      <path d="M60 28V84" fill="none" stroke="hsl(var(--accent))" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M60 28c-4-14-20-14-20-6 0 6 12 6 20 6zM60 28c4-14 20-14 20-6 0 6-12 6-20 6z" ${ACC}/>
    </g>${spark(100, 16, 7, 0)}${spark(18, 20, 4, 0.9)}${spark(104, 62, 3.5, 1.7)}`,
};

// kind: 'tasks' | 'routine' | 'rewards'
export function emptyState(kind, textHtml) {
  const scene = (SCENES[kind] || SCENES.tasks)();
  return `<div class="empty" role="status"><svg class="empty-art" viewBox="0 0 120 96" aria-hidden="true">${scene}</svg><p class="muted small">${textHtml}</p></div>`;
}
