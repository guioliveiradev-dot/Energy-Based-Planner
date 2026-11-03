// Arte dos 6 pets da Loja em SVG (sem imagens). Cada pet tem a sua própria paleta e personalidade (não seguem as cores do tema):
//   cat = Gato Cósmico (noite estrelada) · dog = Cão Guardião (caramelo com lenço azul) · dragon = Dragão Neon (verde-água e magenta)
//   phoenix = Fênix Estelar (chamas douradas) · robot = Robô Quântico (metal e luz ciano) · unicorn = Unicórnio Mágico (arco-íris)
// Poses: idle (parado) | work (trabalhando) | sleep (dormindo) | cheer (comemorando). Prévia: prototipo/pets-novos.html.
export const PET_DRAWING_IDS = ['cat', 'dog', 'dragon', 'phoenix', 'robot', 'unicorn'];
export const PET_POSES = ['idle', 'work', 'sleep', 'cheer'];

const NAMES = { cat: 'Gato Cósmico', dog: 'Cão Guardião', dragon: 'Dragão Neon', phoenix: 'Fênix Estelar', robot: 'Robô Quântico', unicorn: 'Unicórnio Mágico' };
const POSE_M = { idle: 'parado', work: 'trabalhando', sleep: 'dormindo', cheer: 'comemorando' };
const POSE_F = { idle: 'parada', work: 'trabalhando', sleep: 'dormindo', cheer: 'comemorando' };

let uidCounter = 0;
const star = (x, y, r, fill = '#FFD84D') => `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z" fill="${fill}"/>`;
const mirror = (d) => d.replace(/([MLCQZ])([^MLCQZ]*)/g, (m, cmd, rest) => cmd + rest.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (mm, x, y) => `${+(120 - x).toFixed(2)} ${y}`));
const stroke = (d, color, w, extra = '') => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;

// Ferramentas de cada desenho: gradientes com ids únicos (várias cópias na mesma tela não se misturam).
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

// Braços levantados (comemoração): cor do braço e da mãozinha.
const armsUp = (c1, c2, w = 10) => `${stroke('M38 86 C26 82 21 70 23 58', c1, w)}${stroke('M82 86 C94 82 99 70 97 58', c1, w)}<circle cx="23" cy="56" r="6.2" fill="${c2}"/><circle cx="97" cy="56" r="6.2" fill="${c2}"/>`;
const zs = (color) => `<g fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".85"><path d="M88 22 h10 l-10 11 h10"/><path d="M102 6 h7 l-7 8 h7"/></g>`;
const festa = () => `${star(12, 28, 7)}${star(108, 22, 8)}${star(8, 64, 5, '#FF8FD0')}${star(113, 58, 5, '#7AE7FF')}`;
const brows = (y, color, dx = 12) => `${stroke(`M${60 - dx - 7} ${y - 3} L${60 - dx + 6} ${y + 1}`, color, 3.2)}${stroke(`M${60 + dx + 7} ${y - 3} L${60 + dx - 6} ${y + 1}`, color, 3.2)}`;
const happyEyes = (y, color, dx = 12) => `${stroke(`M${60 - dx - 6} ${y + 3} Q${60 - dx} ${y - 6} ${60 - dx + 6} ${y + 3}`, color, 3.2)}${stroke(`M${60 + dx - 6} ${y + 3} Q${60 + dx} ${y - 6} ${60 + dx + 6} ${y + 3}`, color, 3.2)}`;
const sleepEyes = (y, color, dx = 12) => `${stroke(`M${60 - dx - 6} ${y} Q${60 - dx} ${y + 6} ${60 - dx + 6} ${y}`, color, 3.2)}${stroke(`M${60 + dx - 6} ${y} Q${60 + dx} ${y + 6} ${60 + dx + 6} ${y}`, color, 3.2)}`;
const shadow = '<ellipse cx="60" cy="110" rx="31" ry="6" fill="#000" opacity=".16"/>';

const PETS = {
  // ---------- Gato Cósmico ----------
  cat: (pose, k) => {
    const fur = k.lin('f', '#4C4FB3', '#272A6B'); const light = '#A9AEF5'; const dark = '#1B1D4D'; const pink = '#F59BD0';
    const eyeColor = '#FFD36B';
    const eye = (x) => `<ellipse cx="${x}" cy="53" rx="6.6" ry="${pose === 'work' ? 5.6 : 7.4}" fill="${eyeColor}"/><ellipse cx="${x}" cy="53" rx="2" ry="${pose === 'work' ? 5 : 6.4}" fill="${dark}"/><circle cx="${x + 2}" cy="50.5" r="1.8" fill="#fff"/>`;
    const eyes = pose === 'sleep' ? sleepEyes(53, '#D9DBFF', 12) : pose === 'cheer' ? happyEyes(53, '#FFE9A0', 12) : eye(48) + eye(72) + (pose === 'work' ? brows(44, dark, 12) : '');
    const mouth = pose === 'cheer' ? `<path d="M53 66 Q60 79 67 66 Z" fill="${dark}"/><path d="M56 72 Q60 76 64 72 Q60 70 56 72 Z" fill="${pink}"/>` : pose === 'sleep' ? stroke('M60 63 V65 M60 65 Q57 68 54 66 M60 65 Q63 68 66 66', '#E9EBFF', 2.4) : stroke('M60 63 V65.5 M60 65.5 Q56 70 52 67 M60 65.5 Q64 70 68 67', '#E9EBFF', 2.4);
    const body = `${pose === 'cheer' ? '' : `<ellipse cx="48" cy="104" rx="9" ry="5.5" fill="${light}"/><ellipse cx="72" cy="104" rx="9" ry="5.5" fill="${light}"/>${stroke('M46 103 V106 M50 103 V106 M70 103 V106 M74 103 V106', '#7C82DC', 1.4)}`}`;
    return `${shadow}${stroke('M82 100 C108 104 114 76 98 64', fur, 10)}${star(98, 60, 6.5, '#7AE7FF')}
      <ellipse cx="60" cy="88" rx="26" ry="22" fill="${fur}"/><ellipse cx="60" cy="94" rx="15" ry="14" fill="${light}" opacity=".5"/>${body}
      <path d="M33 48 L29 18 L53 33 Z M87 48 L91 18 L67 33 Z" fill="${fur}" stroke="${fur}" stroke-width="3" stroke-linejoin="round"/><path d="M36 42 L33.5 26 L47 34 Z M84 42 L86.5 26 L73 34 Z" fill="${pink}"/>
      <ellipse cx="60" cy="54" rx="29" ry="25" fill="${fur}"/>
      <g fill="#fff" opacity=".8"><circle cx="40" cy="38" r="1.2"/><circle cx="76" cy="36" r="1.5"/><circle cx="50" cy="31" r=".9"/><circle cx="36" cy="92" r="1.4"/><circle cx="82" cy="84" r="1.1"/><circle cx="72" cy="98" r="1.3"/></g>
      ${star(60, 38, 4.5, '#7AE7FF')}
      <ellipse cx="60" cy="64" rx="13" ry="8.5" fill="${light}" opacity=".55"/><path d="M57 59.5 L63 59.5 L60 63.5 Z" fill="${pink}" stroke="${pink}" stroke-width="1.5" stroke-linejoin="round"/>${mouth}
      ${eyes}<circle cx="38" cy="62" r="4.6" fill="${pink}" opacity=".35"/><circle cx="82" cy="62" r="4.6" fill="${pink}" opacity=".35"/>
      ${stroke('M22 60 L36 62 M22 67 L36 65 M98 60 L84 62 M98 67 L84 65', '#D5D8FF', 1.6)}
      ${stroke('M43 77 Q60 86 77 77', '#7B5CFF', 4.5)}${star(60, 84, 5.2)}`;
  },

  // ---------- Cão Guardião ----------
  dog: (pose, k) => {
    const fur = k.lin('f', '#E0A25D', '#B8742F'); const cream = '#F7E3BD'; const ear = k.lin('e', '#8F5528', '#64381A'); const dark = '#3B2314'; const blue = '#2F6FE0';
    const eye = (x) => `<circle cx="${x}" cy="50" r="4.8" fill="${dark}"/><circle cx="${x + 1.6}" cy="48.2" r="1.6" fill="#fff"/>`;
    const eyes = pose === 'sleep' ? sleepEyes(51, dark, 13) : pose === 'cheer' ? happyEyes(51, dark, 13) : eye(47) + eye(73) + (pose === 'work' ? brows(41, '#8F5528', 13) : stroke('M41 41 Q47 38 53 41 M67 41 Q73 38 79 41', '#C98A4B', 2.6));
    const mouth = pose === 'cheer' ? `<path d="M50 69 Q60 88 70 69 Z" fill="${dark}"/><path d="M54 77 Q60 87 66 77 Q60 73 54 77 Z" fill="#F46B8F"/>` : pose === 'sleep' ? stroke('M60 66 V69', dark, 2.6) : `${stroke('M60 66 V69', dark, 2.6)}${stroke('M60 69 Q54 75 49 71 M60 69 Q66 75 71 71', dark, 2.8)}`;
    const paws = pose === 'cheer' ? '' : `<ellipse cx="48" cy="105" rx="9" ry="5.5" fill="${cream}"/><ellipse cx="72" cy="105" rx="9" ry="5.5" fill="${cream}"/>${stroke('M46 104 V107 M50 104 V107 M70 104 V107 M74 104 V107', '#C9A56E', 1.4)}`;
    return `${shadow}${stroke('M84 98 C102 98 107 84 100 74', fur, 9)}
      <ellipse cx="60" cy="90" rx="25" ry="20" fill="${fur}"/><ellipse cx="60" cy="93" rx="14" ry="15" fill="${cream}"/>${paws}
      <ellipse cx="60" cy="54" rx="29" ry="25" fill="${fur}"/>
      <ellipse cx="46" cy="50" rx="11" ry="10" fill="#8F5528" opacity=".55"/><path d="M54 30 Q60 26 66 30 L65 60 L55 60 Z" fill="${cream}" opacity=".9"/>
      <ellipse cx="60" cy="65" rx="16" ry="11.5" fill="${cream}"/><ellipse cx="60" cy="60.5" rx="6.4" ry="4.6" fill="${dark}"/><ellipse cx="58" cy="59" rx="2" ry="1.2" fill="#fff" opacity=".7"/>${mouth}
      <path d="M36 36 C18 34 13 62 21 76 C32 74 38 58 38 46 Z" fill="${ear}"/><path d="M84 36 C102 34 107 62 99 76 C88 74 82 58 82 46 Z" fill="${ear}"/>
      ${eyes}<circle cx="37" cy="64" r="4.4" fill="#F29A8A" opacity=".4"/><circle cx="83" cy="64" r="4.4" fill="#F29A8A" opacity=".4"/>
      ${stroke('M38 77 Q60 88 82 77', blue, 6.5)}<path d="M60 79 L68 82 V88 C68 92.5 64.5 95 60 97 C55.5 95 52 92.5 52 88 V82 Z" fill="#FFC43D" stroke="#C98A00" stroke-width="1.6" stroke-linejoin="round"/>${star(60, 88, 3.4, '#C98A00')}`;
  },

  // ---------- Dragão Neon ----------
  dragon: (pose, k) => {
    const skin = k.lin('s', '#3BE8B6', '#0C8797'); const belly = '#E6FF9E'; const neon = k.lin('n', '#FF5BE0', '#A515D6'); const dark = '#073D4A';
    const wing = (up) => `<g ${up ? 'transform="rotate(32 38 72)"' : ''}><path d="M40 72 C22 74 8 60 7 36 C15 44 19 48 24 57 C24 48 29 43 35 43 C34 52 38 60 42 64 Z" fill="${neon}"/>${stroke('M40 70 C30 62 18 52 8 38', '#FFC2F4', 1.6, 'opacity=".7"')}</g>`;
    const wingR = (up) => `<g ${up ? 'transform="rotate(-32 82 72)"' : ''}><path d="${mirror('M40 72 C22 74 8 60 7 36 C15 44 19 48 24 57 C24 48 29 43 35 43 C34 52 38 60 42 64 Z')}" fill="${neon}"/>${stroke(mirror('M40 70 C30 62 18 52 8 38'), '#FFC2F4', 1.6, 'opacity=".7"')}</g>`;
    const up = pose === 'cheer';
    const eye = (x) => `<ellipse cx="${x}" cy="51" rx="6.4" ry="${pose === 'work' ? 4.8 : 6.2}" fill="#FFF35C" stroke="${dark}" stroke-width="1.6"/><ellipse cx="${x}" cy="51" rx="1.9" ry="${pose === 'work' ? 4.4 : 5.6}" fill="${dark}"/><circle cx="${x + 2}" cy="48.8" r="1.5" fill="#fff"/>`;
    const eyes = pose === 'sleep' ? sleepEyes(52, dark, 13) : pose === 'cheer' ? happyEyes(52, dark, 13) : eye(47) + eye(73) + (pose === 'work' ? brows(42, dark, 13) : stroke('M40 42 Q47 39 54 42 M66 42 Q73 39 80 42', '#0C8797', 2.6));
    const mouth = pose === 'cheer' ? `<path d="M49 70 Q60 88 71 70 Z" fill="${dark}"/><path d="M53 78 Q60 86 67 78 Q60 74 53 78 Z" fill="#FF7A59"/><path d="M52 70 L54.5 74 L57 70 M63 70 L65.5 74 L68 70" fill="#fff"/>` : pose === 'sleep' ? stroke('M54 71 Q60 74 66 71', dark, 2.6) : stroke('M50 70 Q60 78 70 70', dark, 2.8);
    const paws = pose === 'cheer' ? '' : `<ellipse cx="47" cy="105" rx="9.5" ry="5.8" fill="#16B79C"/><ellipse cx="73" cy="105" rx="9.5" ry="5.8" fill="#16B79C"/><path d="M42 106 l1 3 M47 106 l.5 3.4 M52 106 l-1 3 M68 106 l1 3 M73 106 l.5 3.4 M78 106 l-1 3" stroke="${belly}" stroke-width="1.6" stroke-linecap="round"/>`;
    return `${shadow}${wing(up)}${wingR(up)}${stroke('M82 102 C106 108 115 90 105 76', '#16B79C', 10)}<path d="M105 62 L112.5 75 L97.5 75 Z" fill="${neon}"/>
      <ellipse cx="60" cy="90" rx="24" ry="21" fill="${skin}"/><ellipse cx="60" cy="94" rx="14" ry="15" fill="${belly}"/><path d="M48 87 H72 M47 94 H73 M49 101 H71" stroke="#B9E86A" stroke-width="1.7" stroke-linecap="round"/>${paws}
      <path d="M43 40 C33 32 30 20 35 9 C44 16 51 27 53 38 Z M77 40 C87 32 90 20 85 9 C76 16 69 27 67 38 Z" fill="${neon}"/><path d="M36 14 C40 20 45 27 48 33" stroke="#FFC2F4" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>
      <path d="M54 31 L60 19 L66 31 Z" fill="${neon}"/>
      <ellipse cx="60" cy="55" rx="29" ry="25" fill="${skin}"/><ellipse cx="60" cy="67" rx="17" ry="11.5" fill="#8DF5D5"/><ellipse cx="54" cy="64" rx="1.8" ry="2.4" fill="${dark}"/><ellipse cx="66" cy="64" rx="1.8" ry="2.4" fill="${dark}"/>${mouth}
      ${eyes}<circle cx="36" cy="63" r="4.4" fill="#FF5BE0" opacity=".35"/><circle cx="84" cy="63" r="4.4" fill="#FF5BE0" opacity=".35"/>
      <g fill="#fff" opacity=".35"><circle cx="40" cy="42" r="2"/><circle cx="77" cy="40" r="1.5"/></g>`;
  },

  // ---------- Fênix Estelar ----------
  phoenix: (pose, k) => {
    const body = k.lin('b', '#FF7A2B', '#E5311F'); const head = k.lin('h', '#FFB02E', '#FF6A2B'); const flame = k.lin('fl', '#FFD84D', '#FF4B1F'); const mask = '#FFE9A8'; const dark = '#3A1405';
    const up = pose === 'cheer';
    const wingL = 'M42 80 C20 82 5 66 6 42 C12 48 17 50 21 49 C19 41 21 35 25 31 C27 39 31 43 37 45 C35 39 37 33 41 29 C44 42 46 62 46 72 Z';
    const wings = `<g ${up ? 'transform="rotate(34 42 76)"' : ''}><path d="${wingL}" fill="${flame}"/>${stroke('M42 74 C30 66 18 56 10 44', '#FFF1B0', 1.6, 'opacity=".75"')}</g><g ${up ? 'transform="rotate(-34 78 76)"' : ''}><path d="${mirror(wingL)}" fill="${flame}"/>${stroke(mirror('M42 74 C30 66 18 56 10 44'), '#FFF1B0', 1.6, 'opacity=".75"')}</g>`;
    const eye = (x) => `<circle cx="${x}" cy="53" r="5" fill="${dark}"/><circle cx="${x + 1.7}" cy="51.2" r="1.7" fill="#fff"/>`;
    const eyes = pose === 'sleep' ? sleepEyes(54, dark, 12) : pose === 'cheer' ? happyEyes(54, dark, 12) : eye(48) + eye(72) + (pose === 'work' ? brows(44, dark, 12) : '');
    const beak = pose === 'cheer' ? `<path d="M52 63 L68 63 L60 80 Z" fill="#FFC21A" stroke="#D98A00" stroke-width="1.4" stroke-linejoin="round"/><path d="M55 68 L65 68 L60 77 Z" fill="#E5311F"/>` : `<path d="M53 63 L67 63 L60 75 Z" fill="#FFC21A" stroke="#D98A00" stroke-width="1.4" stroke-linejoin="round"/><path d="M54 66.5 H66" stroke="#D98A00" stroke-width="1.2"/>`;
    return `${shadow}<path d="M60 96 C51 108 53 117 60 120 C67 117 69 108 60 96 Z" fill="${flame}"/><path d="M50 97 C38 103 33 113 26 116 C40 118 52 110 58 99 Z M70 97 C82 103 87 113 94 116 C80 118 68 110 62 99 Z" fill="${body}"/>
      ${wings}<ellipse cx="60" cy="88" rx="24" ry="21" fill="${body}"/><ellipse cx="60" cy="94" rx="13" ry="14" fill="#FFE27A"/>${stroke('M52 90 Q60 94 68 90 M51 97 Q60 101 69 97', '#FFB02E', 1.8)}
      <ellipse cx="50" cy="106" rx="7" ry="4" fill="#FFC21A"/><ellipse cx="70" cy="106" rx="7" ry="4" fill="#FFC21A"/>
      <path d="M60 38 C51 27 53 13 62 1 C68 14 69 28 60 38 Z" fill="${flame}"/><path d="M48 41 C37 35 34 22 40 12 C47 20 52 29 54 40 Z M72 41 C83 35 86 22 80 12 C73 20 68 29 66 40 Z" fill="${head}"/>
      <ellipse cx="60" cy="55" rx="27" ry="24" fill="${head}"/><ellipse cx="60" cy="61" rx="19" ry="14.5" fill="${mask}"/>${star(60, 41, 4.6, '#FFFFFF')}${eyes}${beak}
      <circle cx="40" cy="62" r="4.4" fill="#FF6A2B" opacity=".4"/><circle cx="80" cy="62" r="4.4" fill="#FF6A2B" opacity=".4"/>`;
  },

  // ---------- Robô Quântico ----------
  robot: (pose, k) => {
    const metal = k.lin('m', '#EEF3FB', '#9DB0CE'); const metal2 = k.lin('m2', '#C9D6EA', '#7F94B8'); const navy = '#0E1730'; const cyan = '#5AF2FF'; const orange = '#FF9B3D';
    const halo = k.rad('h', '#5AF2FF', 'rgba(90,242,255,0)');
    const eye = (x) => pose === 'work'
      ? `<path d="M${x - 6} 43 L${x + 6} 47 L${x - 6} 51 Z" fill="${cyan}"/>`
      : `<circle cx="${x}" cy="46" r="9" fill="${halo}" opacity=".65"/><rect x="${x - 4.5}" y="39.5" width="9" height="13" rx="4.5" fill="${cyan}"/><rect x="${x - 2.4}" y="41.5" width="3" height="4" rx="1.5" fill="#fff" opacity=".85"/>`;
    const eyes = pose === 'sleep' ? stroke('M39 46 H53 M67 46 H81', cyan, 3.4) + '' : pose === 'cheer' ? `${stroke('M40 49 Q46 38 52 49', cyan, 3.6)}${stroke('M68 49 Q74 38 80 49', cyan, 3.6)}` : eye(46) + (pose === 'work' ? `<path d="M${120 - 46 + 6} 43 L${120 - 46 - 6} 47 L${120 - 46 + 6} 51 Z" fill="${cyan}"/>` : eye(74));
    const mouth = pose === 'cheer' ? `<path d="M50 56 Q60 66 70 56 Z" fill="${cyan}"/>` : pose === 'sleep' ? `<circle cx="60" cy="58" r="2" fill="${cyan}" opacity=".7"/>` : stroke('M52 57 Q60 62 68 57', cyan, 3);
    const arms = pose === 'cheer' ? armsUp(k.lin('a', '#C9D6EA', '#8EA2C4'), '#6F85AB', 9) : `${stroke('M33 80 C26 84 24 92 25 99', '#9DB0CE', 9)}${stroke('M87 80 C94 84 96 92 95 99', '#9DB0CE', 9)}<circle cx="25" cy="101" r="6" fill="#6F85AB"/><circle cx="95" cy="101" r="6" fill="#6F85AB"/>`;
    return `${shadow}${arms}
      <rect x="44" y="97" width="12" height="11" rx="5" fill="#6F85AB"/><rect x="64" y="97" width="12" height="11" rx="5" fill="#6F85AB"/>
      <rect x="35" y="71" width="50" height="32" rx="13" fill="${metal2}"/><rect x="35" y="71" width="50" height="32" rx="13" fill="none" stroke="#7384A3" stroke-width="1.6"/>
      <circle cx="60" cy="87" r="10.5" fill="${navy}"/><g fill="none" stroke="${cyan}" stroke-width="1.4"><ellipse cx="60" cy="87" rx="8" ry="3.2"/><ellipse cx="60" cy="87" rx="8" ry="3.2" transform="rotate(60 60 87)"/><ellipse cx="60" cy="87" rx="8" ry="3.2" transform="rotate(-60 60 87)"/></g><circle cx="60" cy="87" r="2.2" fill="${orange}"/>
      <rect x="55" y="66" width="10" height="7" rx="2" fill="#7F94B8"/>
      <circle cx="29" cy="46" r="6.5" fill="#4A5D86"/><circle cx="91" cy="46" r="6.5" fill="#4A5D86"/><circle cx="29" cy="46" r="2.4" fill="${cyan}"/><circle cx="91" cy="46" r="2.4" fill="${cyan}"/>
      <rect x="32" y="25" width="56" height="44" rx="15" fill="${metal}" stroke="#7384A3" stroke-width="1.6"/>
      <rect x="38" y="32" width="44" height="31" rx="11" fill="${navy}"/>${eyes}${mouth}
      <path d="M44 28.5 Q50 26.5 56 28.5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>
      <rect x="58.2" y="13" width="3.6" height="12.5" rx="1.8" fill="#7F94B8"/><circle cx="60" cy="10.5" r="9" fill="${halo}" opacity=".5"/><circle cx="60" cy="10.5" r="5" fill="${orange}"/><circle cx="58.4" cy="8.8" r="1.6" fill="#fff" opacity=".85"/>
      ${pose === 'work' ? `<g fill="none" stroke="${orange}" stroke-width="2" stroke-linecap="round" opacity=".9"><path d="M96 20 l5 -4 M99 28 l7 0 M96 36 l5 4"/></g>` : ''}`;
  },

  // ---------- Unicórnio Mágico ----------
  unicorn: (pose, k) => {
    const coat = k.lin('c', '#FFFFFF', '#DCCBFF'); const horn = k.lin('hn', '#FFF3A8', '#F2B100'); const pink = '#FF8FC4'; const purple = '#6A3FD0';
    const line = '#BFA9F2'; const rainbow = ['#FF7EB6', '#B58CFF', '#6BB6FF', '#5BE3C8'];
    const mane = rainbow.map((c, i) => stroke(`M${40 - i * 4} ${34 + i * 3} C${18 - i * 4} ${40 + i * 3} ${12 - i * 3} ${64 + i * 2} ${22 - i * 2} ${90 - i * 2}`, c, 6)).join('');
    const tail = rainbow.map((c, i) => stroke(`M${82 + i * 2} ${100 - i * 2} C${106 + i * 2} ${104 - i * 2} ${114 + i} ${82} ${103 + i * 2} ${66 + i * 2}`, c, 5.4)).join('');
    const lash = (x, s) => stroke(`M${x + s * 6} 47 L${x + s * 9.5} 44`, '#3C2380', 2);
    const eye = (x, s) => `<ellipse cx="${x}" cy="53" rx="6.4" ry="${pose === 'work' ? 6 : 8}" fill="${purple}"/><ellipse cx="${x}" cy="56" rx="4.2" ry="3.4" fill="#A98BFF" opacity=".7"/><circle cx="${x + 2}" cy="49.6" r="2.4" fill="#fff"/><circle cx="${x - 2.2}" cy="57" r="1.2" fill="#fff"/>${lash(x, s)}`;
    const eyes = pose === 'sleep' ? `${sleepEyes(54, '#3C2380', 13)}${lash(47, -1)}${lash(73, 1)}` : pose === 'cheer' ? `${happyEyes(54, '#3C2380', 13)}${lash(47, -1)}${lash(73, 1)}` : eye(47, -1) + eye(73, 1) + (pose === 'work' ? brows(43, '#3C2380', 13) : '');
    const mouth = pose === 'cheer' ? `<path d="M54 72 Q60 84 66 72 Z" fill="#7A2C5C"/><path d="M57 77 Q60 81 63 77 Q60 75 57 77 Z" fill="#FF7A9F"/>` : pose === 'sleep' ? stroke('M57 73 Q60 75 63 73', '#B0508A', 2.4) : stroke('M54 72 Q60 78 66 72', '#B0508A', 2.6);
    const paws = pose === 'cheer' ? '' : `<ellipse cx="48" cy="106" rx="9" ry="5.5" fill="#F0E6FF" stroke="${line}" stroke-width="1.3"/><ellipse cx="72" cy="106" rx="9" ry="5.5" fill="#F0E6FF" stroke="${line}" stroke-width="1.3"/><ellipse cx="48" cy="108" rx="7.4" ry="3" fill="${horn}"/><ellipse cx="72" cy="108" rx="7.4" ry="3" fill="${horn}"/>`;
    return `${shadow}${tail}${mane}
      <ellipse cx="60" cy="90" rx="24" ry="20" fill="${coat}" stroke="${line}" stroke-width="1.5"/>${star(70, 92, 5, '#FFC21A')}${paws}
      <path d="M40 38 C35 29 37 20 44 17 C49 23 51 30 51 37 Z M80 38 C85 29 83 20 76 17 C71 23 69 30 69 37 Z" fill="${coat}" stroke="${line}" stroke-width="1.4"/><path d="M42 33 C40 27 41 23 44 21 C46 25 47 29 47 33 Z M78 33 C80 27 79 23 76 21 C74 25 73 29 73 33 Z" fill="${pink}" opacity=".7"/>
      <ellipse cx="60" cy="55" rx="28" ry="25" fill="${coat}" stroke="${line}" stroke-width="1.5"/>
      <path d="M60 1 L52 33 L68 33 Z" fill="${horn}"/>${stroke('M55 24 L65 20 M54 29 L66 25.4 M56 18 L63 15.6', '#C98A00', 1.8)}
      <path d="M44 34 C48 44 58 46 66 38 C64 50 50 52 44 34 Z" fill="${rainbow[0]}"/><path d="M48 33 C52 41 60 42 70 34 C66 44 54 46 48 33 Z" fill="${rainbow[1]}" opacity=".9"/>
      <ellipse cx="60" cy="67" rx="15.5" ry="10.5" fill="#FFE1F0"/><ellipse cx="54.5" cy="65" rx="1.7" ry="2.3" fill="#E58AB6"/><ellipse cx="65.5" cy="65" rx="1.7" ry="2.3" fill="#E58AB6"/>${mouth}
      ${eyes}<circle cx="36" cy="63" r="4.8" fill="${pink}" opacity=".45"/><circle cx="84" cy="63" r="4.8" fill="${pink}" opacity=".45"/>
      ${star(24, 36, 3.2, '#FFFFFF')}${star(100, 40, 3.8, '#FFD84D')}`;
  },
};

// Devolve o texto do <svg>. size em pixels (padrão 120). `label` troca o nome lido por leitores de tela.
export function petDrawingSVG(id, { pose = 'idle', size = 120, label = null } = {}) {
  const make = PETS[id];
  if (!make) return '';
  const p = PET_POSES.includes(pose) ? pose : 'idle';
  const k = kit();
  let inner = make(p, k);
  const arms = {
    cat: () => armsUp(k.lin('ca', '#4C4FB3', '#272A6B'), '#A9AEF5'),
    dog: () => armsUp(k.lin('da', '#E0A25D', '#B8742F'), '#F7E3BD'),
    dragon: () => armsUp('#16B79C', '#8DF5D5'),
    unicorn: () => armsUp('#E6DAFF', '#F7F1FF'),
  };
  if (p === 'cheer' && arms[id]) inner += arms[id]();
  const name = label || `${NAMES[id]}, ${(id === 'phoenix' ? POSE_F : POSE_M)[p]}`;
  const fx = (p === 'cheer' ? festa() : '') + (p === 'sleep' ? zs(id === 'robot' ? '#5AF2FF' : '#8EA0FF') : '');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="${name}"><title>${name}</title><defs>${k.defs.join('')}</defs>${inner}${fx}</svg>`;
}
