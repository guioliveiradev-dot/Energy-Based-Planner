// Arte dos 6 pets da Loja em SVG (sem imagens). Cada pet tem a sua própria paleta (sóbria) e personalidade; não seguem as cores do tema.
//   cat = Gato Cósmico · dog = Cão Guardião · dragon = Dragão Neon · phoenix = Coruja Lunar (id antigo, da época da Fênix) · robot = Robô Quântico · unicorn = Unicórnio Mágico
// Poses: idle (parado) | work (trabalhando) | sleep (dormindo) | cheer (comemorando).
// Formas por vínculo, como a Fagulha: spark (níveis 1-2, o pet jovem) | flame (3-4, o pet completo) | aura (5, com brilho e um detalhe novo).
export const PET_DRAWING_IDS = ['cat', 'dog', 'dragon', 'phoenix', 'robot', 'unicorn'];
export const PET_POSES = ['idle', 'work', 'sleep', 'cheer'];
export const PET_STAGES = ['spark', 'flame', 'aura'];

const NAMES = { cat: 'Gato Cósmico', dog: 'Cão Guardião', dragon: 'Dragão Neon', phoenix: 'Coruja Lunar', robot: 'Robô Quântico', unicorn: 'Unicórnio Mágico' };
// Nome de cada forma (aparece na Home e na comemoração de nível).
export const PET_STAGE_NAMES = {
  cat: { spark: 'Filhote', flame: 'Gato', aura: 'Gato Estelar' },
  dog: { spark: 'Filhote', flame: 'Cão', aura: 'Guardião' },
  dragon: { spark: 'Dragãozinho', flame: 'Dragão', aura: 'Dragão Ancestral' },
  phoenix: { spark: 'Corujinha', flame: 'Coruja', aura: 'Coruja Lunar' },
  robot: { spark: 'Protótipo', flame: 'Robô', aura: 'Robô Quântico' },
  unicorn: { spark: 'Potrinho', flame: 'Unicórnio', aura: 'Unicórnio Mágico' },
};
const POSE_M = { idle: 'parado', work: 'trabalhando', sleep: 'dormindo', cheer: 'comemorando' };
const POSE_F = { idle: 'parada', work: 'trabalhando', sleep: 'dormindo', cheer: 'comemorando' };
const HALO = { cat: '#AEB6EC', dog: '#EBCF8A', dragon: '#A9D8C4', phoenix: '#E9DDAA', robot: '#86D8E3', unicorn: '#F0C6DA' };

let uidCounter = 0;
const star = (x, y, r, fill = '#E9CF86') => `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z" fill="${fill}"/>`;
const mirror = (d) => d.replace(/([MLCQZ])([^MLCQZ]*)/g, (m, cmd, rest) => cmd + rest.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (mm, x, y) => `${+(120 - x).toFixed(2)} ${y}`));
const stroke = (d, color, w, extra = '') => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;

function kit() {
  const n = ++uidCounter;
  const defs = [];
  const lin = (name, a, b, dir = 'v') => {
    const id = `pd${n}${name}`;
    defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="${dir === 'v' ? 0 : 1}" y2="${dir === 'v' ? 1 : 0}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`);
    return `url(#${id})`;
  };
  const rad = (name, a, b) => {
    const id = `pd${n}${name}`;
    defs.push(`<radialGradient id="${id}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`);
    return `url(#${id})`;
  };
  return { lin, rad, defs };
}

const armsUp = (c1, c2, w = 10) => `${stroke('M38 86 C26 82 21 70 23 58', c1, w)}${stroke('M82 86 C94 82 99 70 97 58', c1, w)}<circle cx="23" cy="56" r="6.2" fill="${c2}"/><circle cx="97" cy="56" r="6.2" fill="${c2}"/>`;
const zs = (color) => `<g fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".8"><path d="M88 22 h10 l-10 11 h10"/><path d="M102 6 h7 l-7 8 h7"/></g>`;
const festa = () => `${star(12, 28, 7)}${star(108, 22, 8)}${star(8, 64, 5, '#E5B0C8')}${star(113, 58, 5, '#9FD0DC')}`;
const brows = (y, color, dx = 12) => `${stroke(`M${60 - dx - 7} ${y - 3} L${60 - dx + 6} ${y + 1}`, color, 3.2)}${stroke(`M${60 + dx + 7} ${y - 3} L${60 + dx - 6} ${y + 1}`, color, 3.2)}`;
const happyEyes = (y, color, dx = 12) => `${stroke(`M${60 - dx - 6} ${y + 3} Q${60 - dx} ${y - 6} ${60 - dx + 6} ${y + 3}`, color, 3.2)}${stroke(`M${60 + dx - 6} ${y + 3} Q${60 + dx} ${y - 6} ${60 + dx + 6} ${y + 3}`, color, 3.2)}`;
const sleepEyes = (y, color, dx = 12) => `${stroke(`M${60 - dx - 6} ${y} Q${60 - dx} ${y + 6} ${60 - dx + 6} ${y}`, color, 3.2)}${stroke(`M${60 + dx - 6} ${y} Q${60 + dx} ${y + 6} ${60 + dx + 6} ${y}`, color, 3.2)}`;
const shadow = '<ellipse cx="60" cy="110" rx="31" ry="6" fill="#000" opacity=".16"/>';

// Cada pet recebe (pose, kit, stage) com stage = 1 (jovem), 2 (completo) ou 3 (com brilho e detalhe novo).
const PETS = {
  // ---------- Gato Cósmico ----------
  cat: (pose, k, S) => {
    const fur = k.lin('f', '#5B6396', '#363C69'); const light = '#BAC0DC'; const dark = '#222648'; const pink = '#D8A0B8';
    const eye = (x) => `<ellipse cx="${x}" cy="53" rx="6.6" ry="${pose === 'work' ? 5.6 : 7.4}" fill="#E9C77A"/><ellipse cx="${x}" cy="53" rx="2" ry="${pose === 'work' ? 5 : 6.4}" fill="${dark}"/><circle cx="${x + 2}" cy="50.5" r="1.8" fill="#fff"/>`;
    const eyes = pose === 'sleep' ? sleepEyes(53, '#DADDF0', 12) : pose === 'cheer' ? happyEyes(53, '#F0DDA6', 12) : eye(48) + eye(72) + (pose === 'work' ? brows(44, dark, 12) : '');
    const mouth = pose === 'cheer' ? `<path d="M53 66 Q60 79 67 66 Z" fill="${dark}"/><path d="M56 72 Q60 76 64 72 Q60 70 56 72 Z" fill="${pink}"/>` : stroke(`M60 63 V65.5 M60 65.5 Q${pose === 'sleep' ? '57 68.5 54 66.5 M60 65.5 Q63 68.5 66' : '56 70 52 67 M60 65.5 Q64 70 68'} 67`, '#E4E6F4', 2.4);
    const paws = pose === 'cheer' ? '' : `<ellipse cx="48" cy="104" rx="9" ry="5.5" fill="${light}"/><ellipse cx="72" cy="104" rx="9" ry="5.5" fill="${light}"/>${stroke('M46 103 V106 M50 103 V106 M70 103 V106 M74 103 V106', '#8D93B8', 1.4)}`;
    const cosmos = S >= 2 ? `<g fill="#fff" opacity=".75"><circle cx="40" cy="38" r="1.2"/><circle cx="76" cy="36" r="1.5"/><circle cx="50" cy="31" r=".9"/><circle cx="36" cy="92" r="1.4"/><circle cx="82" cy="84" r="1.1"/><circle cx="72" cy="98" r="1.3"/></g>${star(60, 38, 4.5, '#A9D3DC')}` : '';
    const collar = S >= 2 ? `${stroke('M43 77 Q60 86 77 77', '#7A74B8', 4.5)}${star(60, 84, 5.2)}` : '';
    const constel = S >= 3 ? `<g stroke="#C9CEF4" stroke-width="1" opacity=".7" fill="none"><path d="M16 34 L30 18 L50 8"/><path d="M104 30 L92 14 L74 6"/></g>${star(16, 34, 3.4, '#E9CF86')}${star(30, 18, 3, '#F3F0D8')}${star(50, 8, 3.4, '#E9CF86')}${star(104, 30, 3.4, '#E9CF86')}${star(92, 14, 3, '#F3F0D8')}${star(74, 6, 3.4, '#E9CF86')}` : '';
    return `${shadow}${constel}${stroke('M82 100 C108 104 114 76 98 64', fur, 10)}${star(98, 60, S >= 2 ? 6.5 : 4.5, '#A9D3DC')}
      <ellipse cx="60" cy="88" rx="26" ry="22" fill="${fur}"/><ellipse cx="60" cy="94" rx="15" ry="14" fill="${light}" opacity=".45"/>${paws}
      <path d="M33 48 L29 18 L53 33 Z M87 48 L91 18 L67 33 Z" fill="${fur}" stroke="${fur}" stroke-width="3" stroke-linejoin="round"/><path d="M36 42 L33.5 26 L47 34 Z M84 42 L86.5 26 L73 34 Z" fill="${pink}"/>
      <ellipse cx="60" cy="54" rx="29" ry="25" fill="${fur}"/>${cosmos}
      <ellipse cx="60" cy="64" rx="13" ry="8.5" fill="${light}" opacity=".5"/><path d="M57 59.5 L63 59.5 L60 63.5 Z" fill="${pink}" stroke="${pink}" stroke-width="1.5" stroke-linejoin="round"/>${mouth}
      ${eyes}<circle cx="38" cy="62" r="4.6" fill="${pink}" opacity=".3"/><circle cx="82" cy="62" r="4.6" fill="${pink}" opacity=".3"/>
      ${stroke('M22 60 L36 62 M22 67 L36 65 M98 60 L84 62 M98 67 L84 65', '#CDD0E6', 1.6)}${collar}`;
  },

  // ---------- Cão Guardião ----------
  dog: (pose, k, S) => {
    const fur = k.lin('f', '#CFA06C', '#A97A4A'); const cream = '#EEDDBF'; const ear = k.lin('e', '#8A5E3A', '#6A4528'); const dark = '#3E2A1C'; const blue = '#5578A8'; const gold = '#D9B15A';
    const eye = (x) => `<circle cx="${x}" cy="50" r="4.8" fill="${dark}"/><circle cx="${x + 1.6}" cy="48.2" r="1.6" fill="#fff"/>`;
    const eyes = pose === 'sleep' ? sleepEyes(51, dark, 13) : pose === 'cheer' ? happyEyes(51, dark, 13) : eye(47) + eye(73) + (pose === 'work' ? brows(41, '#8A5E3A', 13) : stroke('M41 41 Q47 38 53 41 M67 41 Q73 38 79 41', '#B88A58', 2.6));
    const mouth = pose === 'cheer' ? `<path d="M50 69 Q60 88 70 69 Z" fill="${dark}"/><path d="M54 77 Q60 87 66 77 Q60 73 54 77 Z" fill="#D9798F"/>` : pose === 'sleep' ? stroke('M60 66 V69', dark, 2.6) : `${stroke('M60 66 V69', dark, 2.6)}${stroke('M60 69 Q54 75 49 71 M60 69 Q66 75 71 71', dark, 2.8)}`;
    const paws = pose === 'cheer' ? '' : `<ellipse cx="48" cy="105" rx="9" ry="5.5" fill="${cream}"/><ellipse cx="72" cy="105" rx="9" ry="5.5" fill="${cream}"/>${stroke('M46 104 V107 M50 104 V107 M70 104 V107 M74 104 V107', '#BFA377', 1.4)}`;
    const cape = S >= 3 ? `<path d="M36 76 C28 90 24 100 22 110 L98 110 C96 100 92 90 84 76 Z" fill="#3F5C86"/><path d="M36 76 C28 90 24 100 22 110 L30 110 C33 98 38 88 44 80 Z" fill="#2F4668"/>` : '';
    const badge = S >= 2 ? `<path d="M60 79 L68 82 V88 C68 92.5 64.5 95 60 97 C55.5 95 52 92.5 52 88 V82 Z" fill="${gold}" stroke="#A8842F" stroke-width="1.6" stroke-linejoin="round"/>${star(60, 88, 3.4, '#A8842F')}` : '';
    return `${shadow}${cape}${stroke('M84 98 C102 98 107 84 100 74', fur, 9)}
      <ellipse cx="60" cy="90" rx="25" ry="20" fill="${fur}"/><ellipse cx="60" cy="93" rx="14" ry="15" fill="${cream}"/>${paws}
      <ellipse cx="60" cy="54" rx="29" ry="25" fill="${fur}"/>
      <ellipse cx="46" cy="50" rx="11" ry="10" fill="#8A5E3A" opacity=".5"/><path d="M54 30 Q60 26 66 30 L65 60 L55 60 Z" fill="${cream}" opacity=".85"/>
      <ellipse cx="60" cy="65" rx="16" ry="11.5" fill="${cream}"/><ellipse cx="60" cy="60.5" rx="6.4" ry="4.6" fill="${dark}"/><ellipse cx="58" cy="59" rx="2" ry="1.2" fill="#fff" opacity=".6"/>${mouth}
      <path d="M36 36 C18 34 13 62 21 76 C32 74 38 58 38 46 Z" fill="${ear}"/><path d="M84 36 C102 34 107 62 99 76 C88 74 82 58 82 46 Z" fill="${ear}"/>
      ${eyes}<circle cx="37" cy="64" r="4.4" fill="#D98F82" opacity=".3"/><circle cx="83" cy="64" r="4.4" fill="#D98F82" opacity=".3"/>
      ${stroke('M38 77 Q60 88 82 77', blue, S >= 2 ? 6.5 : 4.5)}${badge}`;
  },

  // ---------- Dragão Neon ----------
  dragon: (pose, k, S) => {
    const skin = k.lin('s', '#74B29C', '#477F78'); const belly = '#E6E8C0'; const memb = k.lin('m', '#A084B0', '#6F5683'); const dark = '#233F3E'; const snout = '#9CCBB7';
    const wingL = 'M42 78 L9 42 Q13 56 17 60 Q20 53 23 51 Q26 62 31 66 Q34 59 37 58 Q40 68 46 72 Z';
    const fingers = 'M42 78 L9 42 M42 78 L19 56 M42 78 L29 62';
    const sc = S >= 3 ? 'translate(60 78) scale(1.18) translate(-60 -78)' : '';
    const wings = S >= 2 ? `<g transform="${sc}"><g ${pose === 'cheer' ? 'transform="rotate(26 42 78)"' : ''}><path d="${wingL}" fill="${memb}"/>${stroke(fingers, '#5A4570', 1.5, 'opacity=".55"')}</g><g ${pose === 'cheer' ? 'transform="rotate(-26 78 78)"' : ''}><path d="${mirror(wingL)}" fill="${memb}"/>${stroke(mirror(fingers), '#5A4570', 1.5, 'opacity=".55"')}</g></g>` : '';
    const eye = (x) => `<ellipse cx="${x}" cy="51" rx="6" ry="${pose === 'work' ? 4.6 : 6}" fill="#E6EC7A" stroke="${dark}" stroke-width="1.6"/><ellipse cx="${x}" cy="51" rx="1.8" ry="${pose === 'work' ? 4.2 : 5.4}" fill="${dark}"/><circle cx="${x + 2}" cy="48.8" r="1.4" fill="#fff"/>`;
    const eyes = pose === 'sleep' ? sleepEyes(52, dark, 13) : pose === 'cheer' ? happyEyes(52, dark, 13) : eye(47) + eye(73) + (pose === 'work' ? brows(42, dark, 13) : stroke('M39 43 Q47 39 54 44 M66 44 Q73 39 81 43', '#2F5C57', 3));
    const mouth = pose === 'cheer' ? `<path d="M50 72 Q60 88 70 72 Z" fill="${dark}"/><path d="M54 79 Q60 86 66 79 Q60 76 54 79 Z" fill="#D9798F"/><path d="M52 72 L54.5 76 L57 72 M63 72 L65.5 76 L68 72" fill="#fff"/>` : pose === 'sleep' ? stroke('M54 73 Q60 76 66 73', dark, 2.6) : stroke('M51 72 Q60 79 69 72', dark, 2.8);
    const paws = pose === 'cheer' ? '' : `<ellipse cx="47" cy="105" rx="9.5" ry="5.8" fill="#5E9B88"/><ellipse cx="73" cy="105" rx="9.5" ry="5.8" fill="#5E9B88"/><path d="M42 106 l1 3 M47 106 l.5 3.4 M52 106 l-1 3 M68 106 l1 3 M73 106 l.5 3.4 M78 106 l-1 3" stroke="${belly}" stroke-width="1.6" stroke-linecap="round"/>`;
    const horns = S >= 2 ? `<path d="M44 40 C37 32 36 22 41 13 C47 21 52 30 53 39 Z M76 40 C83 32 84 22 79 13 C73 21 68 30 67 39 Z" fill="#B9A3C4"/>` : `<path d="M45 38 C42 33 42 29 44 26 C48 30 50 34 51 38 Z M75 38 C78 33 78 29 76 26 C72 30 70 34 69 38 Z" fill="#B9A3C4"/>`;
    const frill = S >= 2 ? `<path d="M34 50 L17 45 L25 54 L17 63 L34 63 Z" fill="${memb}"/><path d="${mirror('M34 50 L17 45 L25 54 L17 63 L34 63 Z')}" fill="${memb}"/>` : '';
    const spikes = S >= 3 ? `<path d="M52 33 L56 22 L60 32 L64 22 L68 33 Z" fill="#B9A3C4"/>` : '';
    return `${shadow}${wings}${stroke('M82 102 C106 108 115 90 105 76', '#5E9B88', 10)}<path d="M105 62 L112.5 75 L97.5 75 Z" fill="${memb}"/>
      <ellipse cx="60" cy="90" rx="24" ry="21" fill="${skin}"/><ellipse cx="60" cy="94" rx="14" ry="15" fill="${belly}"/><path d="M48 87 H72 M47 94 H73 M49 101 H71" stroke="#C5CB94" stroke-width="1.7" stroke-linecap="round"/>${paws}
      ${horns}${frill}${spikes}
      <ellipse cx="60" cy="55" rx="28" ry="23" fill="${skin}"/><ellipse cx="60" cy="68" rx="17" ry="11" fill="${snout}"/><ellipse cx="54" cy="65.5" rx="1.8" ry="2.3" fill="${dark}"/><ellipse cx="66" cy="65.5" rx="1.8" ry="2.3" fill="${dark}"/>${mouth}
      ${eyes}<circle cx="36" cy="62" r="4.4" fill="#D9A0B0" opacity=".3"/><circle cx="84" cy="62" r="4.4" fill="#D9A0B0" opacity=".3"/>`;
  },

  // ---------- Coruja Lunar ----------
  // (o id interno continua 'phoenix' porque é o que já está salvo no inventário, nos vínculos e nos backups)
  phoenix: (pose, k, S) => {
    const body = k.lin('b', '#A08B79', '#625247'); const wingC = k.lin('w', '#7A6755', '#4A3D34');
    const disc = '#EFE2CB'; const ring = '#C9B191'; const dark = '#2A1C14'; const gold = '#E3B04F'; const goldD = '#B98A2C';
    const up = pose === 'cheer';
    const wingL = 'M33 62 C24 74 24 94 36 106 C43 97 45 80 43 66 Z';
    const feathers = 'M30 82 L40 84 M30 92 L39 93 M33 100 L40 100';
    const wings = `<g ${up ? 'transform="rotate(38 40 64)"' : ''}><path d="${wingL}" fill="${wingC}"/>${S >= 2 ? stroke(feathers, '#9A8574', 1.5, 'opacity=".8"') : ''}</g><g ${up ? 'transform="rotate(-38 80 64)"' : ''}><path d="${mirror(wingL)}" fill="${wingC}"/>${S >= 2 ? stroke(mirror(feathers), '#9A8574', 1.5, 'opacity=".8"') : ''}</g>`;
    const eye = (x) => `<circle cx="${x}" cy="53" r="9" fill="${gold}" stroke="${goldD}" stroke-width="1.2"/><circle cx="${x}" cy="53" r="${pose === 'work' ? 5.2 : 4.6}" fill="${dark}"/><circle cx="${x + 2}" cy="50.6" r="1.8" fill="#fff"/>`;
    const eyes = pose === 'sleep' ? sleepEyes(54, dark, 15) : pose === 'cheer' ? happyEyes(54, dark, 15) : eye(45) + eye(75) + (pose === 'work' ? brows(43, '#4A3D34', 15) : '');
    const beak = `<path d="M55.5 57 C55.5 52 64.5 52 64.5 57 C64.5 61 62 65 60 68 C58 65 55.5 61 55.5 57 Z" fill="#D99A3C" stroke="#A9701F" stroke-width="1.2" stroke-linejoin="round"/>${up ? `<path d="M58 61 L62 61 L60 66 Z" fill="#6E2C1B"/>` : ''}`;
    const tufts = S >= 2 ? `<path d="M36 42 L29 16 L54 33 Z M84 42 L91 16 L66 33 Z" fill="${body}" stroke="${body}" stroke-width="3" stroke-linejoin="round"/><path d="M37 36 L33 22 L46 32 Z M83 36 L87 22 L74 32 Z" fill="${disc}" opacity=".7"/>` : `<path d="M38 40 L34 26 L50 34 Z M82 40 L86 26 L70 34 Z" fill="${body}"/>`;
    const chest = S >= 2 ? `<ellipse cx="60" cy="89" rx="19" ry="17" fill="#EAD9BF"/>${stroke('M49 80 q4.7 4.5 9.4 0 q4.7 4.5 9.4 0 M47 88 q4.7 4.5 9.4 0 q4.7 4.5 9.4 0 q4.7 4.5 9.4 0 M49 96 q4.7 4.5 9.4 0 q4.7 4.5 9.4 0', '#BFA67F', 1.6)}` : `<ellipse cx="60" cy="90" rx="16" ry="14" fill="#EAD9BF"/>`;
    const moon = S >= 2 ? `<circle cx="60" cy="34" r="5.4" fill="${gold}"/><circle cx="62.6" cy="32.6" r="4.7" fill="#8E7A69"/>` : '';
    const sky = S >= 3 ? `${star(18, 30, 4, '#F6EBC0')}${star(103, 22, 3.6, '#F6EBC0')}${star(8, 70, 3, '#F6EBC0')}${star(112, 76, 3.4, '#F6EBC0')}` : '';
    return `${shadow}${sky}${tufts}
      <path d="M60 30 C82 30 92 50 90 76 C88 98 76 109 60 109 C44 109 32 98 30 76 C28 50 38 30 60 30 Z" fill="${body}"/>
      ${chest}${wings}
      <circle cx="45" cy="53" r="15.5" fill="${disc}" stroke="${ring}" stroke-width="1.4"/><circle cx="75" cy="53" r="15.5" fill="${disc}" stroke="${ring}" stroke-width="1.4"/>
      ${eyes}${beak}${moon}
      ${stroke('M50 108 L46 113 M50 108 V114 M50 108 L54 113 M70 108 L66 113 M70 108 V114 M70 108 L74 113', gold, 2.4)}`;
  },

  // ---------- Robô Quântico ----------
  robot: (pose, k, S) => {
    const metal = k.lin('m', '#E4E9F0', '#A8B5C7'); const metal2 = k.lin('m2', '#CBD4E0', '#8E9DB4'); const navy = '#1A2338'; const cyan = '#86D8E3'; const orange = '#E2A565';
    const halo = k.rad('h', '#86D8E3', 'rgba(134,216,227,0)');
    const eye = (x) => pose === 'work'
      ? `<path d="M${x - 6} 43 L${x + 6} 47 L${x - 6} 51 Z" fill="${cyan}"/>`
      : `<circle cx="${x}" cy="46" r="9" fill="${halo}" opacity=".55"/><rect x="${x - 4.5}" y="39.5" width="9" height="13" rx="4.5" fill="${cyan}"/><rect x="${x - 2.4}" y="41.5" width="3" height="4" rx="1.5" fill="#fff" opacity=".8"/>`;
    const eyes = pose === 'sleep' ? stroke('M39 46 H53 M67 46 H81', cyan, 3.4) : pose === 'cheer' ? `${stroke('M40 49 Q46 38 52 49', cyan, 3.6)}${stroke('M68 49 Q74 38 80 49', cyan, 3.6)}` : eye(46) + (pose === 'work' ? `<path d="M${120 - 46 + 6} 43 L${120 - 46 - 6} 47 L${120 - 46 + 6} 51 Z" fill="${cyan}"/>` : eye(74));
    const mouth = pose === 'cheer' ? `<path d="M50 56 Q60 66 70 56 Z" fill="${cyan}"/>` : pose === 'sleep' ? `<circle cx="60" cy="58" r="2" fill="${cyan}" opacity=".7"/>` : stroke('M52 57 Q60 62 68 57', cyan, 3);
    const arms = pose === 'cheer' ? armsUp(k.lin('a', '#C9D6EA', '#8EA2C4'), '#6F85AB', 9) : `${stroke('M33 80 C26 84 24 92 25 99', '#9DB0CE', 9)}${stroke('M87 80 C94 84 96 92 95 99', '#9DB0CE', 9)}<circle cx="25" cy="101" r="6" fill="#6F85AB"/><circle cx="95" cy="101" r="6" fill="#6F85AB"/>`;
    const chest = S >= 2 ? `<circle cx="60" cy="87" r="10.5" fill="${navy}"/><g fill="none" stroke="${cyan}" stroke-width="1.4"><ellipse cx="60" cy="87" rx="8" ry="3.2"/><ellipse cx="60" cy="87" rx="8" ry="3.2" transform="rotate(60 60 87)"/><ellipse cx="60" cy="87" rx="8" ry="3.2" transform="rotate(-60 60 87)"/></g><circle cx="60" cy="87" r="2.2" fill="${orange}"/>` : `<circle cx="60" cy="87" r="5" fill="${navy}"/><circle cx="60" cy="87" r="2" fill="${cyan}"/>`;
    const ears = S >= 2 ? `<circle cx="29" cy="46" r="6.5" fill="#4A5D86"/><circle cx="91" cy="46" r="6.5" fill="#4A5D86"/><circle cx="29" cy="46" r="2.4" fill="${cyan}"/><circle cx="91" cy="46" r="2.4" fill="${cyan}"/>` : '';
    const orbit = S >= 3 ? `<g fill="none" stroke="${cyan}" stroke-width="1.6" opacity=".7"><ellipse cx="60" cy="72" rx="46" ry="12" transform="rotate(-12 60 72)"/></g><circle cx="20" cy="78" r="3.2" fill="${orange}"/><circle cx="101" cy="64" r="3.2" fill="${cyan}"/>` : '';
    return `${shadow}${orbit}${arms}
      <rect x="44" y="97" width="12" height="11" rx="5" fill="#6F85AB"/><rect x="64" y="97" width="12" height="11" rx="5" fill="#6F85AB"/>
      <rect x="35" y="71" width="50" height="32" rx="13" fill="${metal2}" stroke="#7384A3" stroke-width="1.6"/>${chest}
      <rect x="55" y="66" width="10" height="7" rx="2" fill="#7F94B8"/>${ears}
      <rect x="32" y="25" width="56" height="44" rx="15" fill="${metal}" stroke="#7384A3" stroke-width="1.6"/>
      <rect x="38" y="32" width="44" height="31" rx="11" fill="${navy}"/>${eyes}${mouth}
      <path d="M44 28.5 Q50 26.5 56 28.5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>
      <rect x="58.2" y="${S >= 2 ? 13 : 17}" width="3.6" height="${S >= 2 ? 12.5 : 8.5}" rx="1.8" fill="#7F94B8"/><circle cx="60" cy="${S >= 2 ? 10.5 : 15}" r="${S >= 2 ? 5 : 3.6}" fill="${orange}"/>
      ${pose === 'work' ? `<g fill="none" stroke="${orange}" stroke-width="2" stroke-linecap="round" opacity=".85"><path d="M96 20 l5 -4 M99 28 l7 0 M96 36 l5 4"/></g>` : ''}`;
  },

  // ---------- Unicórnio Mágico ----------
  unicorn: (pose, k, S) => {
    const coat = k.lin('c', '#FFFDFB', '#E9E0F0'); const horn = k.lin('hn', '#F4E3A6', '#D7B25A'); const pink = '#F0B8CB'; const purple = '#7D62B8'; const line = '#C9BAD8';
    const rainbow = S >= 3 ? ['#E8A9C2', '#BDA9DD', '#A2C2E3', '#A5D9C8'] : ['#E8A9C2', '#BDA9DD', '#A2C2E3'];
    const mane = S === 1 ? stroke('M40 36 C28 40 24 56 28 70', rainbow[0], 6) : rainbow.map((c, i) => stroke(`M${40 - i * 4} ${34 + i * 3} C${18 - i * 4} ${40 + i * 3} ${12 - i * 3} ${64 + i * 2} ${22 - i * 2} ${90 - i * 2}`, c, 6)).join('');
    const tail = S === 1 ? stroke('M82 100 C98 100 102 90 98 82', rainbow[0], 6) : rainbow.map((c, i) => stroke(`M${82 + i * 2} ${100 - i * 2} C${106 + i * 2} ${104 - i * 2} ${114 + i} ${82} ${103 + i * 2} ${66 + i * 2}`, c, 5.4)).join('');
    const lash = (x, s) => stroke(`M${x + s * 6} 47 L${x + s * 9.5} 44`, '#463070', 2);
    const eye = (x, s) => `<ellipse cx="${x}" cy="53" rx="6.4" ry="${pose === 'work' ? 6 : 8}" fill="${purple}"/><ellipse cx="${x}" cy="56" rx="4.2" ry="3.4" fill="#A992D6" opacity=".6"/><circle cx="${x + 2}" cy="49.6" r="2.4" fill="#fff"/><circle cx="${x - 2.2}" cy="57" r="1.2" fill="#fff"/>${lash(x, s)}`;
    const eyes = pose === 'sleep' ? `${sleepEyes(54, '#463070', 13)}${lash(47, -1)}${lash(73, 1)}` : pose === 'cheer' ? `${happyEyes(54, '#463070', 13)}${lash(47, -1)}${lash(73, 1)}` : eye(47, -1) + eye(73, 1) + (pose === 'work' ? brows(43, '#463070', 13) : '');
    const mouth = pose === 'cheer' ? `<path d="M54 72 Q60 84 66 72 Z" fill="#7A3F5C"/><path d="M57 77 Q60 81 63 77 Q60 75 57 77 Z" fill="#E58AA5"/>` : pose === 'sleep' ? stroke('M57 73 Q60 75 63 73', '#B0708F', 2.4) : stroke('M54 72 Q60 78 66 72', '#B0708F', 2.6);
    const paws = pose === 'cheer' ? '' : `<ellipse cx="48" cy="106" rx="9" ry="5.5" fill="#F3ECF8" stroke="${line}" stroke-width="1.3"/><ellipse cx="72" cy="106" rx="9" ry="5.5" fill="#F3ECF8" stroke="${line}" stroke-width="1.3"/><ellipse cx="48" cy="108" rx="7.4" ry="3" fill="${horn}"/><ellipse cx="72" cy="108" rx="7.4" ry="3" fill="${horn}"/>`;
    const hornPath = S === 1 ? 'M60 20 L55 38 L65 38 Z' : 'M60 1 L52 33 L68 33 Z';
    const stripes = S === 1 ? '' : stroke('M55 24 L65 20 M54 29 L66 25.4 M56 18 L63 15.6', '#B08A3E', 1.8);
    const wings = S >= 3 ? `<path d="M36 78 C20 72 10 58 12 44 C22 46 30 54 38 66 Z" fill="#FFFFFF" stroke="${line}" stroke-width="1.4"/><path d="${mirror('M36 78 C20 72 10 58 12 44 C22 46 30 54 38 66 Z')}" fill="#FFFFFF" stroke="${line}" stroke-width="1.4"/>` : '';
    const forelock = S >= 2 ? `<path d="M44 34 C48 44 58 46 66 38 C64 50 50 52 44 34 Z" fill="${rainbow[0]}"/><path d="M48 33 C52 41 60 42 70 34 C66 44 54 46 48 33 Z" fill="${rainbow[1]}" opacity=".9"/>` : '';
    return `${shadow}${wings}${tail}${mane}
      <ellipse cx="60" cy="90" rx="24" ry="20" fill="${coat}" stroke="${line}" stroke-width="1.5"/>${S >= 2 ? star(70, 92, 5, '#D7B25A') : ''}${paws}
      <path d="M40 38 C35 29 37 20 44 17 C49 23 51 30 51 37 Z M80 38 C85 29 83 20 76 17 C71 23 69 30 69 37 Z" fill="${coat}" stroke="${line}" stroke-width="1.4"/><path d="M42 33 C40 27 41 23 44 21 C46 25 47 29 47 33 Z M78 33 C80 27 79 23 76 21 C74 25 73 29 73 33 Z" fill="${pink}" opacity=".7"/>
      <ellipse cx="60" cy="55" rx="28" ry="25" fill="${coat}" stroke="${line}" stroke-width="1.5"/>
      <path d="${hornPath}" fill="${horn}"/>${stripes}${forelock}
      <ellipse cx="60" cy="67" rx="15.5" ry="10.5" fill="#F8DDE7"/><ellipse cx="54.5" cy="65" rx="1.7" ry="2.3" fill="#D78AA8"/><ellipse cx="65.5" cy="65" rx="1.7" ry="2.3" fill="#D78AA8"/>${mouth}
      ${eyes}<circle cx="36" cy="63" r="4.8" fill="${pink}" opacity=".4"/><circle cx="84" cy="63" r="4.8" fill="${pink}" opacity=".4"/>`;
  },
};

// Devolve o texto do <svg>. size em pixels (padrão 120). stage: 'spark' | 'flame' | 'aura'. `label` troca o nome lido por leitores de tela.
export function petDrawingSVG(id, { pose = 'idle', stage = 'flame', size = 120, label = null } = {}) {
  const make = PETS[id];
  if (!make) return '';
  const p = PET_POSES.includes(pose) ? pose : 'idle';
  const st = PET_STAGES.includes(stage) ? stage : 'flame';
  const S = PET_STAGES.indexOf(st) + 1;
  const k = kit();
  let inner = make(p, k, S);
  const arms = {
    cat: () => armsUp(k.lin('ca', '#5B6396', '#363C69'), '#BAC0DC'),
    dog: () => armsUp(k.lin('da', '#CFA06C', '#A97A4A'), '#EEDDBF'),
    dragon: () => armsUp('#5E9B88', '#9CCBB7'),
    unicorn: () => armsUp('#E6DAFF', '#F7F1FF'),
  };
  if (p === 'cheer' && arms[id]) inner += arms[id]();
  const halo = S >= 3 ? `<circle cx="60" cy="64" r="56" fill="${k.rad('halo', HALO[id], 'rgba(255,255,255,0)')}" opacity=".5"/><circle cx="60" cy="64" r="53" fill="none" stroke="${HALO[id]}" stroke-width="2" opacity=".55"/>` : '';
  const scale = S === 1 ? ' transform="translate(60 110) scale(.74) translate(-60 -110)"' : '';
  const stageName = PET_STAGE_NAMES[id][st];
  const name = label || `${NAMES[id]} (${stageName}), ${(id === 'phoenix' ? POSE_F : POSE_M)[p]}`;
  const fx = (p === 'cheer' ? festa() : '') + (p === 'sleep' ? zs(id === 'robot' ? '#86D8E3' : '#98A6E6') : '');
  const aura = S >= 3 ? `${star(10, 14, 4, HALO[id])}${star(110, 96, 4, HALO[id])}` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="${name}"><title>${name}</title><defs>${k.defs.join('')}</defs>${halo}<g${scale}>${inner}</g>${aura}${fx}</svg>`;
}
