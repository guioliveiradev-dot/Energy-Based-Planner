// Os 6 pets da Loja em SVG (js/pet-drawings.js): cada um com a própria paleta, 4 poses, nomes para leitor de tela, sem emoji.
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
for (const k of ['window', 'document']) Object.defineProperty(globalThis, k, { value: k === 'window' ? dom.window : dom.window[k], configurable: true });
const base = new URL('../js/', import.meta.url).href;
const D = await import(base + 'pet-drawings.js');
const T = await import(base + 'themes.js');
const P = await import(base + 'pets.js');
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const parse = (html) => new dom.window.DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
const EMOJI = /\p{Extended_Pictographic}/u;

ok(JSON.stringify([...D.PET_DRAWING_IDS].sort()) === JSON.stringify(T.SHOP_PETS.map((p) => p.id).sort()), 'Há um desenho para cada pet da Loja (mesmos ids)');
const NOMES = { cat: 'Gato Cósmico', dog: 'Cão Guardião', dragon: 'Dragão Neon', phoenix: 'Fênix Estelar', robot: 'Robô Quântico', unicorn: 'Unicórnio Mágico' };
const POSES = { idle: 'parado', work: 'trabalhando', sleep: 'dormindo', cheer: 'comemorando' };
const sigs = new Set();
const cores = {};
for (const id of D.PET_DRAWING_IDS) {
  cores[id] = new Set();
  for (const pose of D.PET_POSES) {
    const html = D.petDrawingSVG(id, { pose, size: 80 });
    const svg = parse(html).querySelector('svg');
    const nome = `${NOMES[id]}, ${id === 'phoenix' && pose === 'idle' ? 'parada' : POSES[pose]}`;
    ok(!!svg && svg.getAttribute('aria-label') === nome && svg.getAttribute('width') === '80' && svg.getAttribute('viewBox') === '0 0 120 120', `${id}/${pose}: SVG válido com o nome "${nome}"`);
    ok(!/NaN|undefined|null/.test(html) && !EMOJI.test(html), `${id}/${pose}: sem valores quebrados nem emoji`);
    const refs = [...html.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]);
    ok(refs.every((r) => svg.querySelector(`[id="${r}"]`)), `${id}/${pose}: todo degradê usado existe`);
    sigs.add(html.replace(/aria-label="[^"]*"|<title>[^<]*<\/title>|pd\d+/g, ''));
    (html.match(/#[0-9A-Fa-f]{6}/g) || []).forEach((c) => cores[id].add(c.toUpperCase()));
  }
}
ok(sigs.size === 24, 'Todas as 24 combinações (6 pets x 4 poses) são desenhos diferentes');
const comum = (a, b) => [...cores[a]].filter((c) => cores[b].has(c));
const pares = D.PET_DRAWING_IDS.flatMap((a, i) => D.PET_DRAWING_IDS.slice(i + 1).map((b) => [a, b]));
ok(pares.every(([a, b]) => comum(a, b).length <= Math.min(cores[a].size, cores[b].size) * 0.4), 'Cada pet tem a sua própria paleta (pouca cor repartida entre dois pets)');
const a1 = D.petDrawingSVG('cat'); const a2 = D.petDrawingSVG('cat');
ok(a1.match(/id="(pd\d+f)"/)[1] !== a2.match(/id="(pd\d+f)"/)[1], 'Duas cópias na mesma tela não dividem o mesmo id de degradê');
ok(D.petDrawingSVG('nao-existe') === '' && D.petDrawingSVG('cat', { pose: 'xyz' }).includes('parado'), 'Pet desconhecido não quebra; pose inválida vira "parado"');
ok(D.petDrawingSVG('cat', { label: 'Meu gato' }).includes('aria-label="Meu gato"'), 'Nome para leitor de tela pode ser trocado');

for (const p of T.SHOP_PETS) ok(/^<svg/.test(P.petFaceHTML(p, { size: 40 })) && P.petFaceHTML(p, { pose: 'cheer' }).includes('comemorando'), `Rosto de ${p.name}: desenho em SVG, com a pose pedida`);
ok(!T.ALL_PETS.some((p) => 'emoji' in p), 'Os pets não guardam mais emoji');
ok(/<svg/.test(P.petFaceHTML({ id: 'novo-pet' })) && !/novo-pet/.test(P.petFaceHTML({ id: 'novo-pet' })), 'Pet sem desenho cai num ícone do app (não quebra)');
const shop = readFileSync(new URL('../js/pages/shop.js', import.meta.url), 'utf8');
ok(/petFaceHTML\(p, \{ size: 40 \}\)/.test(shop) && !/\$\{p\.emoji\}/.test(shop), 'Loja: o cartão do pet mostra o desenho');
