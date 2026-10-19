// Poderes de pontos dos pets (Fagulha, Gato, Dragão): regras, níveis, parabéns, Perfil, Loja e economia.
import 'fake-indexeddb/auto';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><head><title>Base</title></head><body><div id="app"></div><div id="toasts"></div></body></html>', { url: 'http://localhost/' });
const w = dom.window;
for (const k of ['window', 'document', 'location', 'navigator']) Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });
const base = new URL('../js/', import.meta.url).href;
const auth = await import(base + 'auth.js');
const db = await import(base + 'db.js');
const T = await import(base + 'themes.js');
const W = await import(base + 'pet-powers.js');
const { totalPoints, levelInfo } = await import(base + 'progress.js');
const { renderTasks } = await import(base + 'pages/tasks.js');
const { renderProfile } = await import(base + 'pages/profile.js');
const { renderShop } = await import(base + 'pages/shop.js');
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const wait = (ms = 90) => new Promise((r) => setTimeout(r, ms));

// ---------- tabela de poderes ----------
ok(T.ALL_PETS.every((p) => W.hasPower(p.id)) && T.ALL_PETS.length === 7, 'Poderes: os 7 pets têm poder');
const lens = (p) => (p.pct || p.per || p.min).length;
ok(Object.values(W.PET_POWERS).every((p) => lens(p) === 5), 'Poderes: 5 níveis em todos');
ok(Object.values(W.PET_POWERS).filter((p) => p.pct).every((p) => p.pct.every((v, i) => i === 0 || v >= p.pct[i - 1])), 'Poderes: o percentual nunca diminui com o vínculo');
ok([1, 2, 3, 4, 5].map((l) => W.powerPct('fagulha', l)).join() === '8,9,10,11,12' && W.powerPct('fagulha', 99) === 12 && W.powerPct('fagulha', 0) === 8 && W.powerPct('dog', 1) === null, 'Fagulha: +8% a +12% (limites e pet sem percentual)');
ok(W.powerPct('cat', 1) === 25 && W.powerPct('cat', 5) === 40 && W.powerPct('dragon', 1) === 40 && W.powerPct('dragon', 5) === 60, 'Gato 25% a 40%, Dragão 40% a 60%: os pagos valem mais que a Fagulha');

// ---------- regras ----------
const task = (o = {}) => ({ id: 't', energyCost: 5, durationMinutes: 30, pausedAt: null, pauseOffset: 0, ...o });
ok(W.bonusFor('fagulha', 0, task(), 100).amount === 8 && W.bonusFor('fagulha', 70, task(), 100).amount === 12, 'Fagulha: +8% no nível 1 e +12% no nível 5, em qualquer tarefa');
ok(W.bonusFor('cat', 0, task(), 100).amount === 25 && W.bonusFor('cat', 0, task({ pauseOffset: 60000 }), 100) === null && W.bonusFor('cat', 0, task({ pausedAt: 5 }), 100) === null, 'Gato: +25% só se o cronômetro nunca foi pausado');
ok(W.bonusFor('dragon', 0, task({ energyCost: 8 }), 100).amount === 40 && W.bonusFor('dragon', 0, task({ energyCost: 7 }), 100) === null && W.bonusFor('dragon', 15, task({ energyCost: 10 }), 100).amount === 50, 'Dragão: +40% só em energia 8 ou mais (e sobe com o vínculo)');
ok(W.bonusFor('dog', 99, task(), 100) === null && W.bonusFor('unicorn', 99, task(), 100) === null && W.bonusFor('phoenix', 99, task(), 100) === null, 'Cão, Unicórnio e Fênix não dão bônus percentual');
ok(W.bonusFor('fagulha', 0, task(), 6) === null && W.bonusFor('fagulha', 0, task(), 7).amount === 1, 'Arredondamento: bônus menor que 1 ponto não aparece');
const b = W.bonusFor('cat', 20, task(), 80);
ok(b.amount === 25 && b.pct === 31 && b.level === 3 && b.petName === 'Gato Cósmico' && /Gato Cósmico ajudou: \+25 pontos/.test(b.message), 'Bônus: valor, percentual, nível, nome e mensagem');
ok(/Brilho extra: \+8% de pontos em toda tarefa/.test(W.powerText('fagulha', 1)) && /\+12%/.test(W.powerText('fagulha', 5)), 'Texto: poder no nível atual');
ok(/cresce com o vínculo/.test(W.powerSummary('cat')) && W.powerLevels('cat').length === 5, 'Loja: resumo e lista de níveis');

// ---------- na prática: concluir tarefas ----------
await auth.register('Ana', 'ana@x.com', 'segredo1');
const uid = auth.state.user.id;
const root = document.getElementById('app');
let seq = 0;
async function collect(extra = {}) {
  const id = 'p' + (++seq);
  await db.createTask({ id, userId: uid, title: 'Tarefa ' + id, energyCost: 5, durationMinutes: 30, deadline: null, category: 'work', completed: false, completedAt: null, startedAt: Date.now() - 40 * 60000, pausedAt: null, pauseOffset: 0, createdAt: Date.now(), ...extra });
  const before = auth.state.user.xp;
  document.querySelectorAll('.congrats-panel').forEach((m) => m.closest('.modal-overlay')?.remove());
  const cleanup = await renderTasks(root);
  root.querySelector('[data-action="collect"]').click(); await wait(240);
  cleanup?.(); root.innerHTML = '';
  return { gained: auth.state.user.xp - before, modal: document.querySelector('.congrats-panel')?.textContent || '' };
}
// pontos-base: 5*10 + 30*0.5 = 65
let r = await collect();
ok(r.gained === 65 + 5 && /\+65 Pontos Planner/.test(r.modal) && /Fagulha ajudou: \+5 pontos/.test(r.modal), 'Prática: Fagulha (nível 1) dá +5 em 65 pontos e o aviso aparece');
T.setActivePetStorage(uid, null);
r = await collect();
ok(r.gained === 65 && !/ajudou/.test(r.modal), 'Prática: sem pet, a tarefa vale só os pontos de sempre (sem aviso)');
T.addToInventory(uid, 'cat'); T.setActivePetStorage(uid, 'cat');
r = await collect();
ok(r.gained === 65 + 16 && /Gato Cósmico ajudou: \+16 pontos/.test(r.modal), 'Prática: Gato (sem pausas) dá +25% = +16');
r = await collect({ pauseOffset: 120000 });
ok(r.gained === 65 && !/ajudou/.test(r.modal), 'Prática: Gato não dá bônus se o cronômetro foi pausado (sem culpa: só não ganha o extra)');
T.addToInventory(uid, 'dragon'); T.setActivePetStorage(uid, 'dragon');
r = await collect();
ok(r.gained === 65, 'Prática: Dragão não dá bônus em tarefa de energia 5');
r = await collect({ energyCost: 9 });
ok(r.gained === 105 + 42 && /Dragão Neon ajudou: \+42 pontos/.test(r.modal), 'Prática: Dragão dá +40% em tarefa de energia 9 (105 → +42)');
T.addToInventory(uid, 'dog'); T.setActivePetStorage(uid, 'dog');
r = await collect();
ok(r.gained === 65 && !/ajudou/.test(r.modal), 'Prática: Cão não altera os pontos (o poder dele é a sequência)');

// ---------- o nível não é inflado pelo bônus ----------
const all = await db.getUserTasks(uid);
ok(auth.state.user.xp > totalPoints(all) && levelInfo(totalPoints(all)).points === totalPoints(all), `Nível: pontos ganhos (${totalPoints(all)}) só contam o valor-base; o saldo (${auth.state.user.xp}) inclui os bônus`);

// ---------- Perfil e Loja ----------
T.setActivePetStorage(uid, 'fagulha');
await renderProfile(root); await wait();
[...root.querySelectorAll('[data-tab]')].find((x) => /invent/i.test(x.dataset.tab + x.textContent))?.click(); await wait();
ok(/Brilho extra: \+8% de pontos em toda tarefa/.test(root.querySelector('[data-pet="fagulha"]').textContent) && /Escudo da sequência/.test(root.querySelector('[data-pet="dog"]').textContent), 'Perfil: cada pet mostra o que faz no nível atual');
root.innerHTML = '';
await renderShop(root); await wait();
root.querySelector('[data-tab="store"]').click(); await wait();
ok(/Foco: \+25% .*cresce com o vínculo/.test(root.textContent) && /Baú-surpresa/.test(root.textContent) && /Missão do dia/.test(root.textContent), 'Loja: cada pet mostra o poder antes de comprar');

// ---------- economia: o pet se paga em 2 a 4 semanas ----------
const prices = Object.fromEntries(T.SHOP_PETS.map((p) => [p.id, p.cost]));
ok(prices.cat === 500 && prices.dragon === 500 && prices.unicorn === 500 && prices.robot === 500 && prices.dog === 800 && prices.phoenix === 1000, 'Preços: Gato, Dragão, Unicórnio e Robô 500; Cão 800; Fênix 1000');
ok(T.SHOP_PETS.map((p) => p.cost).every((c, i, a) => i === 0 || c >= a[i - 1]), 'Loja: pets em ordem de preço');
// 3 tarefas/dia de 65 pontos; Gato: 60% sem pausar; Dragão: 0,75 tarefa/dia de energia 8+ (105 pontos); Unicórnio: baú médio; Robô: 1 tarefa/dia
const perDay = {
  cat: 3 * 0.6 * Math.round(65 * 0.25),
  dragon: 0.75 * Math.round(105 * 0.4),
  unicorn: (W.chestRange(1).min + W.chestRange(1).max) / 2,
  robot: Math.round(65 * 0.3),
};
const days = Object.fromEntries(Object.entries(perDay).map(([id, v]) => [id, prices[id] / v]));
ok(Object.values(days).every((d) => d >= 12 && d <= 28), `Economia: Gato ${days.cat.toFixed(0)}, Dragão ${days.dragon.toFixed(0)}, Unicórnio ${days.unicorn.toFixed(0)} e Robô ${days.robot.toFixed(0)} dias para se pagar (meta: 2 a 4 semanas)`);
ok(perDay.cat > 3 * Math.round(65 * 0.08) && perDay.dragon > 3 * Math.round(65 * 0.08) * 0.5, 'Economia: os pets pagos rendem mais que a Fagulha grátis');
