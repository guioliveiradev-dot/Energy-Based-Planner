// Pet subiu de nível: comemoração animada (tarefa e painel admin) e telas que se atualizam sozinhas.
import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><head><title>Base</title></head><body><div id="app"></div><div id="toasts"></div></body></html>', { url: 'http://localhost/' });
const w = dom.window;
for (const k of ['window', 'document', 'location', 'navigator']) Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });
const base = new URL('../js/', import.meta.url).href;
const auth = await import(base + 'auth.js');
const db = await import(base + 'db.js');
const T = await import(base + 'themes.js');
const L = await import(base + 'components/pet-levelup.js');
const { showCongratsModal } = await import(base + 'components/congrats-modal.js');
const { renderHome } = await import(base + 'pages/home.js');
const { renderProfile } = await import(base + 'pages/profile.js');
const { renderTasks } = await import(base + 'pages/tasks.js');
const { openAdminPanel } = await import(base + 'components/admin-panel.js');
const AT = await import(base + 'admin-tools.js');
const { emitDataChanged, onDataChanged } = await import(base + 'events.js');
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms));
const closeAll = () => document.querySelectorAll('.modal-overlay').forEach((o) => o.remove());

await auth.register('Ana', 'ana@x.com', 'segredo1');
const uid = auth.state.user.id;
T.addToInventory(uid, 'cat');

// ---------- quando o nível sobe ----------
const I = L.levelUpInfo;
ok(I({ petId: 'cat', before: 4, after: 5 }).to === 2 && I({ petId: 'cat', before: 4, after: 5 }).from === 1, 'Nível: 4 → 5 tarefas sobe do nível 1 para o 2');
ok(I({ petId: 'cat', before: 5, after: 6 }) === null && I({ petId: 'cat', before: 0, after: 4 }) === null && I({ petId: 'nada', before: 0, after: 99 }) === null && I(null) === null, 'Nível: sem subir (ou pet inexistente), não há comemoração');
ok(I({ petId: 'cat', before: 0, after: 70 }).to === 5, 'Nível: pode pular vários níveis de uma vez');
ok(I({ petId: 'fagulha', before: 14, after: 15 }).formChanged === true && I({ petId: 'fagulha', before: 4, after: 5 }).formChanged === false && I({ petId: 'fagulha', before: 69, after: 70 }).form === 'Aura', 'Fagulha: muda de forma ao chegar nos níveis 3 e 5');
ok(I({ petId: 'cat', before: 14, after: 15 }).formChanged === false && I({ petId: 'cat', before: 4, after: 5 }).power === 'em breve' === false && /\+28%/.test(I({ petId: 'cat', before: 4, after: 5 }).power), 'Gato: não muda de forma e mostra o poder do novo nível (+28%)');

// ---------- janela de comemoração ----------
const html = L.petLevelUpHTML(I({ petId: 'cat', before: 4, after: 5 }));
ok(/Gato Cósmico subiu para o nível 2!/.test(html) && /Nível 2/.test(html) && /levelup-spark/.test(html) && /Foco: \+28%/.test(html), 'Bloco: nome, nível, brilhos animados e o poder novo');
ok(/Nova forma: agora é Chama!/.test(L.petLevelUpHTML(I({ petId: 'fagulha', before: 14, after: 15 }))) && /nível máximo/.test(L.petLevelUpHTML(I({ petId: 'cat', before: 69, after: 70 }))), 'Bloco: avisa a nova forma da Fagulha e o nível máximo');
ok(L.showPetLevelUp({ petId: 'cat', before: 5, after: 6 }) === null && !document.querySelector('.levelup-panel'), 'Janela: não abre se o nível não subiu');
let m = L.showPetLevelUp({ petId: 'cat', before: 4, after: 5 });
const panel = document.querySelector('.levelup-panel');
ok(!!panel && panel.getAttribute('role') === 'dialog' && /Gato Cósmico subiu para o nível 2!/.test(panel.querySelector('h2').textContent) && panel.getAttribute('aria-labelledby') === panel.querySelector('h2').id, 'Janela: abre com título e rótulo para leitor de tela');
ok(document.activeElement === panel.querySelector('[data-role="ok"]') && !!panel.querySelector('[role="status"]'), 'Janela: foco no "Continuar" e aviso falado');
panel.querySelector('[data-role="ok"]').click();
ok(!m.isOpen && !document.querySelector('.levelup-panel'), 'Janela: "Continuar" fecha');
m = L.showPetLevelUp({ petId: 'fagulha', before: 14, after: 15 });
const faceLabel = () => document.querySelector('.levelup-panel [data-role="pet"] svg')?.getAttribute('aria-label');
ok(/Faísca/.test(faceLabel()), 'Fagulha: começa na forma antiga (Faísca)');
await wait(1400);
ok(/Chama/.test(faceLabel()) && document.querySelector('.levelup-panel [data-role="pet"]').classList.contains('levelup-flash'), 'Fagulha: evolui para Chama com um clarão');
m.close();
m = L.showPetLevelUp({ petId: 'fagulha', before: 14, after: 15 });
m.close();
await wait(1400);
ok(!document.querySelector('.levelup-panel'), 'Fagulha: fechar antes da evolução não deixa nada para trás');
closeAll();

// ---------- animação existe no CSS (e respeita "menos movimento") ----------
const css = readFileSync(new URL('../css/style.css', import.meta.url), 'utf8');
ok(['levelup-rise', 'levelup-bob', 'levelup-glow', 'levelup-spark', 'levelup-pop', 'levelup-flash'].every((k) => new RegExp(`@keyframes ${k}`).test(css)), 'CSS: animações de subida, flutuar, brilho, faíscas, selo e clarão');
ok(/animation-duration: 0\.01ms/.test(css.slice(css.indexOf('prefers-reduced-motion'), css.indexOf('prefers-reduced-motion') + 300)), 'Acessibilidade: quem pede menos movimento não vê a animação');

// ---------- dentro da janela de parabéns ----------
showCongratsModal({ taskTitle: 'Ler', points: 65, petLevelUp: { petId: 'cat', before: 4, after: 5 } });
ok(/Gato Cósmico subiu para o nível 2!/.test(document.querySelector('.congrats-panel .levelup-inline')?.textContent || ''), 'Parabéns: mostra a comemoração do pet junto com os pontos');
closeAll();
showCongratsModal({ taskTitle: 'Ler', points: 65, petLevelUp: { petId: 'cat', before: 5, after: 6 } });
ok(!document.querySelector('.levelup-inline'), 'Parabéns: sem subida de nível, nada de comemoração');
closeAll();

// ---------- ao concluir uma tarefa de verdade ----------
T.setActivePetStorage(uid, 'fagulha');
await db.addPetBond(uid, 'fagulha', 4);
await db.createTask({ id: 'up1', userId: uid, title: 'Quase lá', energyCost: 5, durationMinutes: 30, deadline: null, category: 'work', completed: false, completedAt: null, startedAt: Date.now() - 4e6, pausedAt: null, pauseOffset: 0, createdAt: Date.now() });
const root = document.getElementById('app');
let cleanup = await renderTasks(root);
root.querySelector('[data-action="collect"]').click(); await wait(300);
ok(/Fagulha subiu para o nível 2!/.test(document.querySelector('.congrats-panel .levelup-inline')?.textContent || '') && !/subiu para o nível 2 de vínculo/.test(document.getElementById('toasts').textContent), 'Tarefa: a 5ª tarefa com a Fagulha comemora o nível 2 na janela de parabéns (sem aviso solto)');
cleanup?.(); root.innerHTML = ''; closeAll();

// ---------- telas que se atualizam sozinhas ----------
await AT.resetBond(uid);
let homeCleanup = await renderHome(root); await wait(300);
const slot = root.querySelector('#pet-slot');
ok(/vínculo nível 1/.test(slot.textContent), 'Home: cartão do pet começa no nível 1');
await AT.giveBond(uid, 15);
emitDataChanged('teste'); await wait(300);
ok(root.querySelector('#pet-slot') === slot && /vínculo nível 3 · Chama/.test(slot.textContent), 'Home: o cartão sobe para o nível 3 (Chama) sozinho, sem trocar de aba');
await AT.createTestStreak(uid, 'alive');
emitDataChanged('teste'); await wait(300);
ok(/5/.test(root.querySelector('#progress-slot').textContent), 'Home: a sequência de teste aparece sozinha no cartão de nível');
homeCleanup();
await AT.giveBond(uid, 60);
emitDataChanged('teste'); await wait(200);
ok(/vínculo nível 3/.test(slot.textContent), 'Home: ao sair da tela, ela para de escutar (sem erro)');
root.innerHTML = '';

await AT.resetBond(uid);
const profileCleanup = await renderProfile(root); await wait();
[...root.querySelectorAll('[data-tab]')].find((x) => /invent/i.test(x.dataset.tab + x.textContent))?.click(); await wait();
ok(/Vínculo nível 1/.test(root.querySelector('[data-pet="fagulha"]').textContent), 'Perfil: Fagulha no nível 1');
await AT.giveBond(uid, 35);
emitDataChanged('teste'); await wait(300);
ok(/Vínculo nível 4/.test(root.querySelector('[data-pet="fagulha"]').textContent), 'Perfil: o nível do pet atualiza sozinho');
profileCleanup(); root.innerHTML = '';

const stop = [];
const off = onDataChanged((d) => stop.push(d.reason));
emitDataChanged('um'); off(); emitDataChanged('dois');
ok(stop.join() === 'um', 'Aviso interno: quem para de escutar não recebe mais');

// ---------- painel admin: comemora e atualiza ----------
await AT.resetBond(uid);
await AT.clearTestTasks(uid);
homeCleanup = await renderHome(root); await wait(300);
const admin = openAdminPanel();
document.querySelector('#admin-pw').value = 'zen123';
document.querySelector('[data-act="login"]').click();
document.querySelector('[data-act="bond5"]').click(); await wait(400);
const lu = document.querySelector('.levelup-panel');
ok(!!lu && /Fagulha subiu para o nível 2!/.test(lu.querySelector('h2').textContent), 'Admin: +5 de vínculo abre a comemoração de nível');
ok(/vínculo nível 2/.test(root.querySelector('#pet-slot').textContent), 'Admin: a Home por baixo já mostra o nível 2, sem trocar de aba');
lu.querySelector('[data-role="ok"]').click();
document.querySelector('[data-act="bond1"]').click(); await wait(300);
ok(!document.querySelector('.levelup-panel'), 'Admin: +1 sem mudar de nível não comemora');
document.querySelector('[data-act="bondmax"]').click(); await wait(400);
ok(/nível 5/.test(document.querySelector('.levelup-panel h2')?.textContent || '') && /nível máximo/.test(document.querySelector('.levelup-panel')?.textContent || ''), 'Admin: vínculo no máximo comemora o nível 5');
document.querySelector('.levelup-panel [data-role="ok"]').click();
document.querySelector('[data-act="bondreset"]').click(); await wait(300);
ok(!document.querySelector('.levelup-panel') && /vínculo nível 1/.test(root.querySelector('#pet-slot').textContent), 'Admin: zerar não comemora e a Home volta ao nível 1');
admin.close(); homeCleanup();
