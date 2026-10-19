// Arte dos pets em SVG (sem imagens): Fagulha, o espírito-chama da logo.
//
// Estilos:  'flat'  = silhueta chapada no estilo da logo (cor da tinta do tema + 1 cor de acento)
//           'color' = colorido (mesma forma, cores próprias)
// Poses:    idle (parada) | work (trabalhando) | sleep (dormindo) | cheer (comemorando)
// Estágios: spark (nível 1-2, Faísca) | flame (nível 3-4, Chama) | aura (nível 5, Aura)
// Todas as cores podem ser trocadas em `colors` (ink, base, bg, accent, aura); por padrão seguem as variáveis do tema.

export const FAGULHA_POSES = ['idle', 'work', 'sleep', 'cheer'];
export const FAGULHA_STAGES = ['spark', 'flame', 'aura'];
export const FAGULHA_STAGE_NAMES = { spark: 'Faísca', flame: 'Chama', aura: 'Aura' };
export const FAGULHA_POSE_NAMES = { idle: 'parada', work: 'trabalhando', sleep: 'dormindo', cheer: 'comemorando' };

// Nível de vínculo -> estágio (1-2 Faísca, 3-4 Chama, 5 Aura)
export const fagulhaStage = (level) => (level >= 5 ? 'aura' : level >= 3 ? 'flame' : 'spark');

// Estilo chapado: cada cor segue o tema, mas pode ser trocada pelas variáveis --pet-body, --pet-face, --pet-bolt e --pet-aura.
const THEME_COLORS = {
  ink: 'var(--pet-body, hsl(var(--foreground)))',                 // corpo
  base: 'var(--pet-base, var(--pet-body, hsl(var(--foreground))))', // base (pernas), um tom mais escura que o corpo
  bg: 'var(--pet-face, hsl(var(--background)))',                  // olhos e boca
  accent: 'var(--pet-bolt, hsl(var(--accent)))',                  // raio e brilhos
  aura: 'var(--pet-aura, var(--pet-bolt, hsl(var(--accent))))',   // halo e chamas laterais
};
const COLOR_STYLE = { ink: '#3B2314', bg: '#FFF4DE', accent: '#FFC21A', flame: '#FF7A2F', flameLight: '#FFB347', flameDark: '#E5561B' };

const BODY = 'M60 34 C71 47 90 57 90 76 C90 93 77 103 60 103 C43 103 30 93 30 76 C30 57 49 47 60 34 Z';
const BOLT = 'M66 3 L50 24 L59 24 L54 40 L72 17 L62 17 Z';
const PETAL = 'M24 98 C5 82 6 56 24 42 C21 58 27 72 36 82 Z';
const star = (x, y, r) => `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z"/>`;

function face(pose, c) {
  const line = (d, w = 3) => `<path d="${d}" fill="none" stroke="${c.face}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  switch (pose) {
    case 'work':
      return `${line('M41 64 L53 64')}${line('M79 64 L67 64')}
        <circle cx="47" cy="74" r="4.2" fill="${c.face}"/><circle cx="73" cy="74" r="4.2" fill="${c.face}"/>
        <circle cx="48.4" cy="72.6" r="1.3" fill="${c.faceLight}"/><circle cx="74.4" cy="72.6" r="1.3" fill="${c.faceLight}"/>${line('M55 86 L65 86')}`;
    case 'sleep':
      return `${line('M41 76 Q47 82 53 76')}${line('M67 76 Q73 82 79 76')}
        <ellipse cx="60" cy="87" rx="3" ry="3.6" fill="${c.face}"/>`;
    case 'cheer':
      return `${line('M41 76 Q47 67 53 76')}${line('M67 76 Q73 67 79 76')}
        <path d="M50 83 Q60 99 70 83 Z" fill="${c.face}"/><path d="M55 90 Q60 94 65 90 Q60 88 55 90 Z" fill="${c.mouth}"/>`;
    default:
      return `${line('M41 74 Q47 80 53 74')}${line('M67 74 Q73 80 79 74')}${line('M54 85 Q60 90 66 85')}`;
  }
}

// Devolve o texto do <svg>. size em pixels (padrão 120).
export function fagulhaSVG({ pose = 'idle', stage = 'flame', style = 'flat', size = 120, colors = null, label = null } = {}) {
  const flat = style === 'flat';
  const k = flat ? { ...THEME_COLORS, ...(colors || {}) } : { ...COLOR_STYLE, ...(colors || {}) };
  if (flat && colors && colors.ink && !colors.base) k.base = colors.ink;   // cor própria no corpo: a base acompanha
  const c = flat
    ? { body: k.ink, base: k.base, baseLine: 'none', bolt: k.accent, boltLine: 'none', face: k.bg, faceLight: k.ink, mouth: k.ink, aura: k.aura || k.accent, sparkle: k.accent, z: k.ink, shine: 'none' }
    : { body: 'url(#fg-body)', base: k.flameDark, baseLine: 'none', bolt: k.accent, boltLine: k.ink, face: k.ink, faceLight: '#FFFFFF', mouth: '#F2557A', aura: k.flameLight, sparkle: k.accent, z: k.flame, shine: '#FFFFFF' };
  const spark = stage === 'spark';
  const group = spark ? 'transform="translate(60 103) scale(.62) translate(-60 -103)"' : '';
  const sleeping = pose === 'sleep';
  const cheer = pose === 'cheer';
  const name = label || `Fagulha (${FAGULHA_STAGE_NAMES[stage]}), ${FAGULHA_POSE_NAMES[pose]}`;
  const defs = flat ? '' : `<defs><linearGradient id="fg-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${k.flameLight}"/><stop offset="1" stop-color="${k.flame}"/></linearGradient></defs>`;
  const arms = cheer
    ? `<path d="M33 84 C20 78 18 64 22 52" fill="none" stroke="${c.body}" stroke-width="9" stroke-linecap="round"/><path d="M87 84 C100 78 102 64 98 52" fill="none" stroke="${c.body}" stroke-width="9" stroke-linecap="round"/>`
    : '';
  const aura = stage === 'aura'
    ? `<circle cx="60" cy="64" r="52" fill="none" stroke="${c.aura}" stroke-width="2.5" opacity=".45"/><path d="${PETAL}" fill="${c.aura}" opacity="${flat ? 1 : .85}"/><path d="${PETAL}" fill="${c.aura}" opacity="${flat ? 1 : .85}" transform="translate(120 0) scale(-1 1)"/>`
    : '';
  const sparkles = cheer ? `<g fill="${c.sparkle}">${star(16, 36, 7)}${star(104, 30, 8)}${star(10, 68, 5)}${star(112, 62, 5)}</g>` : '';
  const zs = sleeping ? `<g fill="none" stroke="${c.z}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".75"><path d="M84 30 h10 l-10 11 h10"/><path d="M98 14 h7 l-7 8 h7"/></g>` : '';
  const boltPart = `<g ${sleeping ? 'opacity=".45"' : ''}><path d="${BOLT}" fill="${c.bolt}" stroke="${c.boltLine}" stroke-width="${flat ? 0 : 2.5}" stroke-linejoin="round"/></g>`;
  const shine = flat ? '' : `<path d="M42 62 C44 54 50 50 55 47" fill="none" stroke="${c.shine}" stroke-width="3.5" stroke-linecap="round" opacity=".55"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="${name}"><title>${name}</title>${defs}
  <g ${group}>${aura}${arms}<path d="${BODY}" fill="${c.body}"/>${shine}${boltPart}${face(pose, c)}
  <ellipse cx="60" cy="104" rx="35" ry="9" fill="${c.base}"/></g>${sparkles}${zs}</svg>`;
}
