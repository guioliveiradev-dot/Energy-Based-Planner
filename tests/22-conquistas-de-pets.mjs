// Conquistas de pets: regras, contexto do banco, aviso ao desbloquear e Loja.
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
const A = await import(base + 'achievements.js');
const { icon } = await import(base + 'icons.js');
const { startAchievementWatcher } = await import(base + 'components/achievement-notification.js');
const { renderShop } = await import(base + 'pages/shop.js');
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const wait = (ms = 100) => new Promise((r) => setTimeout(r, ms));

const PET_IDS = ['pet_first', 'pet_three', 'pet_all', 'pet_bond_2', 'pet_bond_5'];
ok(A.ACHIEVEMENTS.length === 24 && new Set(A.ACHIEVEMENTS.map((a) => a.id)).size === 24, 'Conquistas: 24 no total, sem id repetido');
ok(PET_IDS.every((id) => A.ACHIEVEMENTS.some((a) => a.id === id)) && A.ACHIEVEMENTS.every((a) => /<path|<circle|<line|<rect|<polyline|<polygon/.test(icon(a.icon))), 'Conquistas: as 5 de pets existem e todas têm ícone desenhado');

// ---------- regras ----------
const unlocked = (pets) => A.getUnlocked([], [], pets).map((a) => a.id).filter((id) => id.startsWith('pet_'));
ok(unlocked({ owned: [], bonds: {} }).length === 0 && unlocked(undefined).length === 0, 'Pets: sem pet comprado e sem vínculo, nada desbloqueia (e a chamada antiga continua funcionando)');
ok(unlocked({ owned: ['cat'], bonds: {} }).join() === 'pet_first', 'Pets: o primeiro pet da Loja desbloqueia "Novo Amigo"');
ok(unlocked({ owned: ['cat', 'dog'], bonds: {} }).join() === 'pet_first' && unlocked({ owned: ['cat', 'dog', 'robot'], bonds: {} }).join() === 'pet_first,pet_three', 'Pets: com 3 pets desbloqueia "Matilha"');
ok(unlocked({ owned: T.SHOP_PETS.map((p) => p.id), bonds: {} }).join() === 'pet_first,pet_three,pet_all', 'Pets: com todos os da Loja desbloqueia "Zoológico Estelar"');
ok(unlocked({ owned: T.SHOP_PETS.slice(0, 5).map((p) => p.id), bonds: {} }).includes('pet_all') === false, 'Pets: faltando um, ainda não');
ok(unlocked({ owned: [], bonds: { fagulha: 4 } }).length === 0 && unlocked({ owned: [], bonds: { fagulha: 5 } }).join() === 'pet_bond_2', 'Vínculo: nível 2 (5 tarefas) desbloqueia "Laço Criado", nível 1 não (vale também para a Fagulha grátis)');
ok(unlocked({ owned: [], bonds: { cat: 69 } }).join() === 'pet_bond_2' && unlocked({ owned: [], bonds: { cat: 70 } }).join() === 'pet_bond_2,pet_bond_5', 'Vínculo: nível 5 (70 tarefas) desbloqueia "Vínculo Eterno"');
ok(unlocked({ owned: [], bonds: { cat: 3, dog: 3, robot: 3 } }).length === 0, 'Vínculo: somar pets diferentes não conta (precisa de um pet com o nível)');

// ---------- contexto vindo do banco e do inventário ----------
await auth.register('Ana', 'ana@x.com', 'segredo1');
const uid = auth.state.user.id;
let ctx = await A.loadPetContext(uid);
ok(ctx.owned.length === 0 && Object.keys(ctx.bonds).length === 0, 'Contexto: conta nova, sem pets comprados e sem vínculo');
T.addToInventory(uid, 'cat'); T.addToInventory(uid, 'fagulha'); T.addToInventory(uid, 'sunset');
await db.addPetBond(uid, 'cat', 6);
ctx = await A.loadPetContext(uid);
ok(ctx.owned.join() === 'cat' && ctx.bonds.cat === 6, 'Contexto: só conta pets da Loja (não a Fagulha nem temas) e lê o vínculo do banco');

// ---------- aviso ao desbloquear ----------
const user = auth.state.user;
await db.createTask({ id: 'seed', userId: uid, title: 'Semente', energyCost: 3, durationMinutes: 10, deadline: null, category: 'work', completed: true, completedAt: Date.now() - 1e6, createdAt: Date.now() - 2e6 });
const stop = startAchievementWatcher({ pollMs: 40, delayMs: 20 });
await wait(150);
ok(!document.querySelector('.achv-panel'), 'Aviso: o que já estava desbloqueado ao abrir o app não aparece de novo');
T.addToInventory(uid, 'dragon'); T.addToInventory(uid, 'robot');       // agora 3 pets da Loja -> "Matilha"
await wait(400);
const pop = document.querySelector('.achv-panel');
ok(!!pop && /Matilha/.test(pop.textContent), 'Aviso: ao ter o 3º pet, aparece "Matilha" (conquista nova)');
pop.querySelector('[data-role="ok"]').click();
await db.addPetBond(uid, 'dragon', 70);
await wait(400);
ok(/Vínculo Eterno/.test(document.querySelector('.achv-panel')?.textContent || ''), 'Aviso: levar um pet ao nível máximo desbloqueia "Vínculo Eterno"');
stop();
document.querySelectorAll('.modal-overlay').forEach((o) => o.remove());

// ---------- Loja ----------
const root = document.getElementById('app');
const cleanup = await renderShop(root); await wait();
root.querySelector('[data-tab="achievements"]').click(); await wait();
const text = root.textContent;
ok(/\/24 desbloqueadas/.test(text) && PET_IDS.every((id) => text.includes(A.ACHIEVEMENTS.find((a) => a.id === id).title)), 'Loja: aba de conquistas mostra "/24" e as 5 de pets');
const lockedTitles = [...root.querySelectorAll('.locked')].map((x) => x.textContent);
ok(!lockedTitles.some((t) => /Novo Amigo|Matilha|Laço Criado|Vínculo Eterno/.test(t)) && lockedTitles.some((t) => /Zoológico Estelar/.test(t)), 'Loja: as conquistas de pets que você já tem saem do cinza; "Zoológico Estelar" (faltam pets) continua bloqueada');
cleanup?.();
