<<<<<<< HEAD
// Os 6 pets da Loja em SVG (js/pet-drawings.js): cada um com a própria paleta, 4 poses, nomes para leitor de tela, sem emoji.
=======
// Os 6 pets da Loja em SVG (js/pet-drawings.js): cada um com a própria paleta, 3 formas por nível, 4 poses, nomes para leitor de tela, sem emoji.
>>>>>>> 764af62 (acess)
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
<<<<<<< HEAD
const NOMES = { cat: 'Gato Cósmico', dog: 'Cão Guardião', dragon: 'Dragão Neon', phoenix: 'Fênix Estelar', robot: 'Robô Quântico', unicorn: 'Unicórnio Mágico' };
const POSES = { idle: 'parado', work: 'trabalhando', sleep: 'dormindo', cheer: 'comemorando' };
=======
const NOMES = { cat: 'Gato Cósmico', dog: 'Cão Guardião', dragon: 'Dragão Neon', phoenix: 'Coruja Lunar', robot: 'Robô Quântico', unicorn: 'Unicórnio Mágico' };
const POSES = { idle: 'parado', work: 'trabalhando', sleep: 'dormindo', cheer: 'comemorando' };
ok(D.PET_STAGES.join() === 'spark,flame,aura' && D.PET_DRAWING_IDS.every((id) => D.PET_STAGES.every((s) => D.PET_STAGE_NAMES[id][s])), 'Cada pet tem nome para as 3 formas (nível 1-2, 3-4 e 5)');
ok(D.PET_DRAWING_IDS.every((id) => new Set(D.PET_STAGES.map((s) => D.PET_STAGE_NAMES[id][s])).size === 3), 'Os nomes das 3 formas de cada pet são diferentes');

>>>>>>> 764af62 (acess)
const sigs = new Set();
const cores = {};
for (const id of D.PET_DRAWING_IDS) {
  cores[id] = new Set();
<<<<<<< HEAD
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
=======
  for (const stage of D.PET_STAGES) {
    for (const pose of D.PET_POSES) {
      const html = D.petDrawingSVG(id, { pose, stage, size: 80 });
      const svg = parse(html).querySelector('svg');
      const nome = `${NOMES[id]} (${D.PET_STAGE_NAMES[id][stage]}), ${id === 'phoenix' && pose === 'idle' ? 'parada' : POSES[pose]}`;
      ok(!!svg && svg.getAttribute('aria-label') === nome && svg.getAttribute('width') === '80' && svg.getAttribute('viewBox') === '0 0 120 120', `${id}/${stage}/${pose}: SVG válido com o nome "${nome}"`);
      ok(!/NaN|undefined|null/.test(html) && !EMOJI.test(html), `${id}/${stage}/${pose}: sem valores quebrados nem emoji`);
      const refs = [...html.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]);
      ok(refs.every((r) => svg.querySelector(`[id="${r}"]`)), `${id}/${stage}/${pose}: todo degradê usado existe`);
      sigs.add(html.replace(/aria-label="[^"]*"|<title>[^<]*<\/title>|pd\d+/g, ''));
      if (stage === 'flame') (html.match(/#[0-9A-Fa-f]{6}/g) || []).forEach((c) => cores[id].add(c.toUpperCase()));
    }
  }
}
ok(sigs.size === 72, 'Todas as 72 combinações (6 pets x 3 formas x 4 poses) são desenhos diferentes');
const comum = (a, b) => [...cores[a]].filter((c) => cores[b].has(c));
const pares = D.PET_DRAWING_IDS.flatMap((a, i) => D.PET_DRAWING_IDS.slice(i + 1).map((b) => [a, b]));
ok(pares.every(([a, b]) => comum(a, b).length <= Math.min(cores[a].size, cores[b].size) * 0.4), 'Cada pet tem a sua própria paleta (pouca cor repartida entre dois pets)');

// Formas por nível: Filhote é menor, Lendário ganha halo de luz.
for (const id of D.PET_DRAWING_IDS) {
  const [sp, fl, au] = D.PET_STAGES.map((s) => D.petDrawingSVG(id, { stage: s }));
  ok(/scale\(\.74\)/.test(sp) && !/scale\(\.74\)/.test(fl) && !/scale\(\.74\)/.test(au), `${id}: Filhote é menor que as outras formas`);
  ok(!/stroke-width="2" opacity="\.55"/.test(fl) && /stroke-width="2" opacity="\.55"/.test(au), `${id}: só a forma Lendária tem o halo de luz`);
  ok(au.length > fl.length && fl.length > sp.length, `${id}: cada forma tem mais detalhes que a anterior`);
}
ok(/\(Gato\)/.test(D.petDrawingSVG('cat', { stage: 'xyz' })), 'Forma inválida vira a forma completa');

>>>>>>> 764af62 (acess)
const a1 = D.petDrawingSVG('cat'); const a2 = D.petDrawingSVG('cat');
ok(a1.match(/id="(pd\d+f)"/)[1] !== a2.match(/id="(pd\d+f)"/)[1], 'Duas cópias na mesma tela não dividem o mesmo id de degradê');
ok(D.petDrawingSVG('nao-existe') === '' && D.petDrawingSVG('cat', { pose: 'xyz' }).includes('parado'), 'Pet desconhecido não quebra; pose inválida vira "parado"');
ok(D.petDrawingSVG('cat', { label: 'Meu gato' }).includes('aria-label="Meu gato"'), 'Nome para leitor de tela pode ser trocado');

<<<<<<< HEAD
for (const p of T.SHOP_PETS) ok(/^<svg/.test(P.petFaceHTML(p, { size: 40 })) && P.petFaceHTML(p, { pose: 'cheer' }).includes('comemorando'), `Rosto de ${p.name}: desenho em SVG, com a pose pedida`);
=======
// petFaceHTML (Home, Perfil, cronômetro, Loja): a forma vem do vínculo
const lab = (pet, bond) => (P.petFaceHTML(pet, { bond, size: 40 }).match(/aria-label="([^"]+)"/) || [])[1];
const cat = T.SHOP_PETS.find((p) => p.id === 'cat');
ok(lab(cat, 0) === 'Gato Cósmico (Filhote), parado' && lab(cat, 5) === 'Gato Cósmico (Filhote), parado' && lab(cat, 15) === 'Gato Cósmico (Gato), parado' && lab(cat, 35) === 'Gato Cósmico (Gato), parado' && lab(cat, 70) === 'Gato Cósmico (Gato Estelar), parado', 'Rosto do pet: forma pelo vínculo (nível 1-2 Filhote, 3-4 Gato, 5 Gato Estelar)');
for (const p of T.SHOP_PETS) ok(/^<svg/.test(P.petFaceHTML(p, { size: 40 })) && P.petFaceHTML(p, { pose: 'cheer' }).includes('comemorando'), `Rosto de ${p.name}: desenho em SVG, com a pose pedida`);
ok(P.petFormName('dragon', 1) === 'Dragãozinho' && P.petFormName('dragon', 3) === 'Dragão' && P.petFormName('dragon', 5) === 'Dragão Ancestral' && P.petFormName('fagulha', 5) === 'Aura' && P.petFormName('nada', 3) === null, 'Nome da forma: cada pet tem os seus (a Fagulha segue Faísca, Chama, Aura)');
>>>>>>> 764af62 (acess)
ok(!T.ALL_PETS.some((p) => 'emoji' in p), 'Os pets não guardam mais emoji');
ok(/<svg/.test(P.petFaceHTML({ id: 'novo-pet' })) && !/novo-pet/.test(P.petFaceHTML({ id: 'novo-pet' })), 'Pet sem desenho cai num ícone do app (não quebra)');
const shop = readFileSync(new URL('../js/pages/shop.js', import.meta.url), 'utf8');
ok(/petFaceHTML\(p, \{ size: 40 \}\)/.test(shop) && !/\$\{p\.emoji\}/.test(shop), 'Loja: o cartão do pet mostra o desenho');
