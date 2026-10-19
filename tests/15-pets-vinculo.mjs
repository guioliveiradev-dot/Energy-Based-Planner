// Vínculo dos pets: níveis, registro ao concluir tarefa, banco, backup e importação.
import 'fake-indexeddb/auto';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><body><div id="app"></div><div id="toasts"></div></body>', { url: 'http://localhost/' });
const w = dom.window;
for (const k of ['window', 'document', 'location']) Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });
w.URL.createObjectURL = () => 'blob:x'; w.URL.revokeObjectURL = () => {}; globalThis.URL = w.URL;
const base = new URL('../js/', import.meta.url).href;
const auth = await import(base + 'auth.js');
const db = await import(base + 'db.js');
const T = await import(base + 'themes.js');
const P = await import(base + 'pets.js');
const B = await import(base + 'backup.js');
const { parseImport } = await import(base + 'data-import.js');
const { renderTasks } = await import(base + 'pages/tasks.js');
const { renderProfile } = await import(base + 'pages/profile.js');
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const wait = (ms = 60) => new Promise((r) => setTimeout(r, ms));

// ---------- regras de nível ----------
ok(P.BOND_THRESHOLDS.join() === '0,5,15,35,70' && P.MAX_BOND_LEVEL === 5, 'Níveis: 5 níveis, entrando em 0, 5, 15, 35 e 70 tarefas');
ok([0, 4, 5, 14, 15, 34, 35, 69, 70, 5000].map(P.bondLevel).join() === '1,1,2,2,3,3,4,4,5,5', 'Níveis: limites exatos de cada nível');
ok(P.bondLevel(-3) === 1 && P.bondLevel(undefined) === 1, 'Níveis: valores estranhos caem no nível 1');
const p0 = P.bondProgress(0), p7 = P.bondProgress(7), p70 = P.bondProgress(80);
ok(p0.level === 1 && p0.remaining === 5 && p0.pct === 0 && !p0.max, 'Progresso: vínculo 0 -> faltam 5 para o nível 2');
ok(p7.level === 2 && p7.remaining === 8 && p7.pct === 20 && p7.next === 15, 'Progresso: vínculo 7 -> nível 2, 20% do caminho, faltam 8');
ok(p70.level === 5 && p70.max && p70.remaining === 0 && p70.pct === 100, 'Progresso: nível máximo');

// ---------- registro ao concluir ----------
await auth.register('Ana', 'ana@x.com', 'segredo1');
const uid = auth.state.user.id;
T.setActivePetStorage(uid, null);
ok(T.getActivePet(uid) === null && (await P.recordTaskForPet(uid)) === null && (await db.getUserPetBonds(uid)).length === 0, 'Registro: "Nenhum pet" escolhido, nada acontece');
T.addToInventory(uid, 'cat'); T.addToInventory(uid, 'dog');
T.setActivePetStorage(uid, 'cat');
let r = await P.recordTaskForPet(uid);
ok(r.petId === 'cat' && r.before === 0 && r.after === 1 && r.level === 1 && !r.leveledUp, 'Registro: com o gato ativo, vínculo do gato vai a 1');
for (let i = 0; i < 3; i++) await P.recordTaskForPet(uid);
r = await P.recordTaskForPet(uid);
ok(r.after === 5 && r.level === 2 && r.leveledUp, 'Registro: a 5ª tarefa sobe o gato para o nível 2');
ok(/Gato Cósmico subiu para o nível 2/.test(P.petLevelUpMessage(r)), 'Registro: mensagem de subida de nível com o nome do pet');
r = await P.recordTaskForPet(uid);
ok(r.after === 6 && !r.leveledUp, 'Registro: tarefas seguintes não repetem o aviso');
T.setActivePetStorage(uid, 'dog');
await P.recordTaskForPet(uid);
T.setActivePetStorage(uid, null);
await P.recordTaskForPet(uid);
const bonds = Object.fromEntries((await db.getUserPetBonds(uid)).map((b) => [b.petId, b.bond]));
ok(bonds.cat === 6 && bonds.dog === 1, 'Registro: cada pet tem o seu vínculo e trocar de pet não apaga nada');
ok(!(await db.getUserPetBonds(uid)).some((b) => b.petId == null || b.id !== `${uid}:${b.petId}`), 'Banco: id do registro é "<usuário>:<pet>"');
T.setActivePetStorage(uid, 'ghost');
r = await P.recordTaskForPet(uid);
ok(r.petId === 'fagulha' && r.after === 1, 'Registro: pet desconhecido volta para a Fagulha (o pet inicial)');

// ---------- ao concluir uma tarefa de verdade (tela de Tarefas) ----------
T.setActivePetStorage(uid, 'cat');
await db.createTask({ id: 'k1', userId: uid, title: 'Ler', energyCost: 5, durationMinutes: 30, deadline: null, category: 'study', completed: false, completedAt: null, startedAt: Date.now() - 40 * 60000, createdAt: Date.now() });
const root = document.getElementById('app');
const cleanup = await renderTasks(root);
root.querySelector('[data-action="collect"]').click(); await wait(200);
const after = (await db.getUserPetBonds(uid)).find((b) => b.petId === 'cat');
ok(after.bond === 7, `Tarefas: coletar pontos soma 1 ao vínculo do pet ativo (cat = ${after.bond})`);
cleanup?.(); root.innerHTML = '';

// ---------- Perfil ----------
await renderProfile(root); await wait(100);
[...root.querySelectorAll('[data-tab]')].find((b) => /invent/i.test(b.dataset.tab + b.textContent))?.click(); await wait(60);
const catCard = root.querySelector('[data-pet="cat"]').textContent;
ok(/Vínculo nível 2 · faltam 8 tarefas para o nível 3/.test(catCard), 'Perfil: mostra o nível e quantas tarefas faltam');
ok(/Vínculo nível 1 · faltam 4 tarefas para o nível 2/.test(root.querySelector('[data-pet="dog"]').textContent), 'Perfil: pet com pouco uso mostra nível 1');
root.innerHTML = '';

// ---------- backup e importação ----------
const backup = await B.buildBackup(uid);
ok(backup.schemaVersion === 4 && backup.petBonds.length === 3 && backup.petBonds.every((b) => b.petId && b.bond > 0), 'Backup: arquivo leva o vínculo dos pets');
const parsed = parseImport(JSON.stringify(backup));
ok(parsed.petBonds.length === 3 && parsed.petBonds.find((b) => b.petId === 'cat').bond === 7, 'Importar: lê o vínculo do arquivo');
const dirty = parseImport(JSON.stringify({ tasks: [], petBonds: [{ petId: 'cat', bond: 3.9 }, { petId: 'cat', bond: 8 }, { petId: 'xx', bond: 5 }, { petId: 'dog', bond: -2 }, { petId: 'dragon', bond: 'muito' }, { petId: 'unicorn', bond: 1e9 }, null] }));
ok(dirty.petBonds.length === 2 && dirty.petBonds.find((b) => b.petId === 'cat').bond === 8 && dirty.petBonds.find((b) => b.petId === 'unicorn').bond === 100000, 'Importar: descarta pet inexistente e número inválido, mantém o maior, limita o exagero');
ok(parseImport(JSON.stringify({ tasks: [] })).petBonds.length === 0, 'Importar: arquivo antigo, sem vínculo, continua valendo');

await auth.register('Bia', 'bia@x.com', 'segredo1');
const uid2 = auth.state.user.id;
let res = await db.importUserData(uid2, parsed);
let b2 = Object.fromEntries((await db.getUserPetBonds(uid2)).map((b) => [b.petId, b.bond]));
ok(res.petBonds === 3 && b2.cat === 7 && b2.dog === 1 && b2.fagulha === 1, 'Importar em outra conta: vínculo chega com o id da conta nova');
await db.addPetBond(uid2, 'cat', 5);
res = await db.importUserData(uid2, parsed);
b2 = Object.fromEntries((await db.getUserPetBonds(uid2)).map((b) => [b.petId, b.bond]));
ok(b2.cat === 12, 'Importar: nunca diminui o vínculo que a conta já tem (fica o maior)');
ok((await db.getUserPetBonds(uid)).find((b) => b.petId === 'cat').bond === 7, 'Importar: a conta de origem não é afetada');
const counts = Object.keys(res.counts);
ok(counts.join() === 'tasks,routineBlocks,rewards,redemptionHistory', 'Importar: contagens de sempre continuam iguais');

// ---------- limpar dados ----------
await db.resetUserData(uid2);
ok((await db.getUserPetBonds(uid2)).length === 0 && (await db.getUserPetBonds(uid)).length === 3, 'Limpar dados: apaga o vínculo só da conta limpa');
await db.deleteUserAccount(uid);
ok((await db.getUserPetBonds(uid)).length === 0, 'Excluir conta: apaga o vínculo');
