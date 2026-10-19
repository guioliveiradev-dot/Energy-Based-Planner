// Fagulha dentro do app: pet inicial grátis, arte no Perfil e no cronômetro, forma pelo vínculo.
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
const P = await import(base + 'pets.js');
const { createTaskTimer } = await import(base + 'components/task-timer.js');
const { renderProfile } = await import(base + 'pages/profile.js');
const { parseImport } = await import(base + 'data-import.js');
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const wait = (ms = 80) => new Promise((r) => setTimeout(r, ms));

await auth.register('Ana', 'ana@x.com', 'segredo1');
const uid = auth.state.user.id;

// ---------- pet inicial ----------
ok(T.DEFAULT_PET === 'fagulha' && T.getActivePet(uid) === 'fagulha', 'Pet inicial: conta nova já começa com a Fagulha ativa');
ok(T.FREE_PETS.map((p) => p.id).join() === 'fagulha' && T.FREE_PETS[0].cost === 0 && !T.SHOP_PETS.some((p) => p.id === 'fagulha'), 'Pet inicial: a Fagulha é grátis e não é vendida na Loja');
ok(T.ALL_PETS.length === 7 && T.ALL_PETS[0].id === 'fagulha', 'Pets: Fagulha + 6 da Loja, com a Fagulha primeiro');
T.setActivePetStorage(uid, null);
ok(T.getActivePet(uid) === null && localStorage.getItem(`energy-planner-pet-${uid}`) === 'none', 'Nenhum pet: a escolha fica gravada e a Fagulha não volta sozinha');
T.setActivePetStorage(uid, 'cat');
ok(T.getActivePet(uid) === 'cat', 'Trocar de pet continua funcionando');
T.setActivePetStorage(uid, 'fagulha');

// ---------- forma pelo vínculo ----------
const faceLabel = (bond, pose) => (P.petFaceHTML(T.FREE_PETS[0], { bond, pose }).match(/aria-label="([^"]+)"/) || [])[1];
ok(faceLabel(0) === 'Fagulha (Faísca), parada' && faceLabel(5) === 'Fagulha (Faísca), parada' && faceLabel(15) === 'Fagulha (Chama), parada' && faceLabel(35) === 'Fagulha (Chama), parada' && faceLabel(70) === 'Fagulha (Aura), parada', 'Forma: Faísca até o nível 2, Chama nos níveis 3 e 4, Aura no 5');
ok(faceLabel(10, 'cheer') === 'Fagulha (Faísca), comemorando', 'Pose: o rosto aceita a pose pedida');
ok(/🐱/.test(P.petFaceHTML(T.SHOP_PETS[0], { size: 40 })) && !/<svg/.test(P.petFaceHTML(T.SHOP_PETS[0])), 'Pets da Loja: continuam com o emoji até serem desenhados');
ok(/virou Chama/.test(P.petLevelUpMessage({ petId: 'fagulha', level: 3, before: 14 })) && /virou Aura/.test(P.petLevelUpMessage({ petId: 'fagulha', level: 5, before: 34 })), 'Aviso: ao mudar de forma, diz "virou Chama" ou "virou Aura"');
ok(!/virou/.test(P.petLevelUpMessage({ petId: 'fagulha', level: 2, before: 4 })) && !/virou/.test(P.petLevelUpMessage({ petId: 'cat', level: 3, before: 14 })), 'Aviso: sem mudança de forma (ou outro pet), só o nível');
const r = await P.recordTaskForPet(uid);
ok(r.petId === 'fagulha' && r.after === 1, 'Vínculo: tarefa concluída com a Fagulha soma ao vínculo dela');

// ---------- Perfil ----------
const root = document.getElementById('app');
await renderProfile(root); await wait();
[...root.querySelectorAll('[data-tab]')].find((b) => /invent/i.test(b.dataset.tab + b.textContent))?.click(); await wait();
const cards = [...root.querySelectorAll('[data-pet]')].map((b) => b.dataset.pet);
ok(cards.join() === ',fagulha', 'Perfil: lista "Nenhum pet" e a Fagulha, mesmo sem comprar nada');
const fcard = root.querySelector('[data-pet="fagulha"]');
ok(!!fcard.querySelector('svg[role="img"]') && /Faísca/.test(fcard.querySelector('svg').getAttribute('aria-label')) && fcard.classList.contains('active'), 'Perfil: Fagulha aparece desenhada, na forma Faísca, marcada como ativa');
ok(/Vínculo nível 1 · faltam 4 tarefas/.test(fcard.textContent) && /Compre mais pets na Loja/.test(root.textContent), 'Perfil: mostra o vínculo e convida a comprar mais pets');
root.querySelector('[data-pet=""]').click(); await wait();
ok(T.getActivePet(uid) === null, 'Perfil: escolher "Nenhum pet" desliga a Fagulha');
root.querySelector('[data-pet="fagulha"]').click(); await wait();
ok(T.getActivePet(uid) === 'fagulha', 'Perfil: escolher a Fagulha de novo liga');
root.innerHTML = '';

// ---------- cronômetro ----------
await db.addPetBond(uid, 'fagulha', 19);          // vínculo 20 -> Chama
const face = () => document.querySelector('.timer-panel .pet-face svg')?.getAttribute('aria-label');
let timer = createTaskTimer({ userId: uid, taskTitle: 'Ler', durationMinutes: 60, startedAt: Date.now(), onUpdate() {}, onComplete() {} });
timer.open(); await wait(120);
ok(face() === 'Fagulha (Chama), trabalhando', 'Cronômetro: rodando, a Fagulha trabalha (e já na forma Chama pelo vínculo)');
document.querySelector('.timer-panel [data-action="pause"]').click(); await wait();
ok(face() === 'Fagulha (Chama), dormindo', 'Cronômetro: pausado, a Fagulha dorme');
document.querySelector('.timer-panel [data-action="resume"]').click(); await wait();
ok(face() === 'Fagulha (Chama), trabalhando', 'Cronômetro: continuando, volta a trabalhar');
timer.destroy();
timer = createTaskTimer({ userId: uid, taskTitle: 'Antiga', durationMinutes: 1, startedAt: Date.now() - 5 * 60000, onUpdate() {}, onComplete() {} });
timer.open(); await wait(150);
ok(face() === 'Fagulha (Chama), comemorando', 'Cronômetro: tempo acabou, a Fagulha comemora');
timer.destroy();
T.setActivePetStorage(uid, 'cat');
timer = createTaskTimer({ userId: uid, taskTitle: 'Gato', durationMinutes: 30, startedAt: Date.now(), onUpdate() {}, onComplete() {} });
timer.open(); await wait();
ok(!document.querySelector('.timer-panel .pet-face svg') && /🐱/.test(document.querySelector('.timer-panel .pet-face').textContent), 'Cronômetro: pets da Loja continuam com o emoji');
timer.destroy();
T.setActivePetStorage(uid, null);
timer = createTaskTimer({ userId: uid, taskTitle: 'Sem pet', durationMinutes: 30, startedAt: Date.now(), onUpdate() {}, onComplete() {} });
timer.open(); await wait();
ok(!document.querySelector('.timer-panel .pet-stage'), 'Cronômetro: sem pet, não mostra pet');
timer.destroy();

// ---------- backup e importação ----------
const parsed = parseImport(JSON.stringify({ tasks: [], activePet: 'fagulha', inventory: ['fagulha', 'cat'], petBonds: [{ petId: 'fagulha', bond: 12 }] }));
ok(parsed.pet === 'fagulha' && parsed.petBonds[0].bond === 12 && parsed.inventory.join() === 'cat', 'Importar: aceita Fagulha como pet ativo e com vínculo; ela não vai para o inventário');
