// Editar recompensas na Loja e painel admin só no computador local.
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
const { renderShop } = await import(base + 'pages/shop.js');
const { isAdminAllowed, ADMIN_HOSTS } = await import(base + 'config.js');
const { openAdminPanel } = await import(base + 'components/admin-panel.js');
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const wait = (ms = 100) => new Promise((r) => setTimeout(r, ms));
const file = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

await auth.register('Ana', 'ana@x.com', 'segredo1');
const uid = auth.state.user.id;

// ---------- banco ----------
await db.createReward({ id: 'r1', userId: uid, title: 'Filme', cost: 300, createdAt: 5 });
const up = await db.updateReward('r1', { title: 'Filme em casa', cost: 350, id: 'hack', userId: 'outro' });
ok(up.title === 'Filme em casa' && up.cost === 350 && up.id === 'r1' && up.userId === uid && up.createdAt === 5, 'Banco: muda título e custo e preserva id, dono e data');
ok((await db.getUserRewards(uid))[0].cost === 350 && (await db.updateReward('nao-existe', { cost: 1 })) === null, 'Banco: grava de verdade; recompensa inexistente devolve null');

// ---------- na tela ----------
await db.createReward({ id: 'r2', userId: uid, title: 'Sorvete', cost: 80, createdAt: 6 });
await db.addRedemptionRecord({ id: 'h1', userId: uid, rewardTitle: 'Filme', cost: 300, redeemedAt: 1 });
const root = document.getElementById('app');
const cleanup = await renderShop(root); await wait();
const editBtn = (t) => [...root.querySelectorAll('[data-action="edit-reward"]')].find((b) => b.getAttribute('aria-label') === `Editar recompensa ${t}`);
const dlg = () => document.querySelector('.modal-panel');
ok(!!editBtn('Filme em casa') && !!editBtn('Sorvete') && root.querySelectorAll('[data-action="edit-reward"]').length === 2, 'Loja: cada recompensa tem o botão "Editar recompensa ..." (com nome para leitor de tela)');
editBtn('Sorvete').click(); await wait();
ok(dlg().querySelector('#r-heading').textContent === 'Editar Recompensa' && dlg().querySelector('#r-create').textContent === 'Salvar' && dlg().querySelector('#r-title').value === 'Sorvete' && dlg().querySelector('#r-cost').value === '80' && !dlg().querySelector('#r-create').disabled, 'Editar: a janela abre "Editar Recompensa" já preenchida e com "Salvar" liberado');
ok(document.activeElement === dlg().querySelector('#r-title'), 'Editar: o foco vai para o nome');
dlg().querySelector('#r-title').value = 'Sorvete grande';
dlg().querySelector('#r-title').dispatchEvent(new w.Event('input'));
dlg().querySelector('#r-cost').value = '120';
dlg().querySelector('#r-cost').dispatchEvent(new w.Event('input'));
dlg().querySelector('#r-create').click(); await wait(200);
const rewards = await db.getUserRewards(uid);
const ice = rewards.find((r) => r.id === 'r2');
ok(ice.title === 'Sorvete grande' && ice.cost === 120 && rewards.length === 2, 'Editar: salvou o novo nome e custo, sem criar outra recompensa');
ok(/Sorvete grande/.test(root.textContent) && /120 Pontos/.test(root.textContent) && /Recompensa atualizada!/.test(document.getElementById('toasts').textContent), 'Editar: a lista já mostra o novo valor e avisa "Recompensa atualizada!"');
ok((await db.getUserRedemptionHistory(uid))[0].rewardTitle === 'Filme' && (await db.getUserRedemptionHistory(uid))[0].cost === 300, 'Editar: o histórico de resgates antigo não muda');
ok(!document.querySelector('.modal-overlay'), 'Editar: a janela fecha ao salvar');

// validação: custo zero / nome vazio
editBtn('Sorvete grande').click(); await wait();
dlg().querySelector('#r-title').value = '   ';
dlg().querySelector('#r-title').dispatchEvent(new w.Event('input'));
ok(dlg().querySelector('#r-create').disabled, 'Editar: sem nome, "Salvar" fica desligado');
dlg().querySelector('#r-title').value = 'Sorvete';
dlg().querySelector('#r-title').dispatchEvent(new w.Event('input'));
dlg().querySelector('#r-cost').value = '0';
dlg().querySelector('#r-cost').dispatchEvent(new w.Event('input'));
dlg().querySelector('#r-create').click(); await wait();
ok((await db.getUserRewards(uid)).find((r) => r.id === 'r2').cost === 120 && /Custo inválido/.test(document.getElementById('toasts').textContent), 'Editar: custo zero é recusado e nada muda');
dlg().querySelector('[data-role="close"]').click(); await wait();

// depois de editar, o botão "+" volta a criar (janela limpa)
root.querySelector('#fab').click(); await wait();
ok(dlg().querySelector('#r-heading').textContent === 'Nova Recompensa' && dlg().querySelector('#r-create').textContent === 'Criar Recompensa' && dlg().querySelector('#r-title').value === '' && dlg().querySelector('#r-create').disabled, 'Criar: depois de editar, o "+" abre a janela vazia de "Nova Recompensa"');
dlg().querySelector('#r-title').value = 'Passeio'; dlg().querySelector('#r-title').dispatchEvent(new w.Event('input'));
dlg().querySelector('#r-cost').value = '40'; dlg().querySelector('#r-cost').dispatchEvent(new w.Event('input'));
dlg().querySelector('#r-create').click(); await wait(200);
ok((await db.getUserRewards(uid)).length === 3 && (await db.getUserRewards(uid)).some((r) => r.title === 'Passeio'), 'Criar: continua criando recompensa nova normalmente');
cleanup?.();

// ---------- painel admin só no computador ----------
ok(ADMIN_HOSTS.join() === 'localhost,127.0.0.1,[::1],::1', 'Painel: liberado só para localhost, 127.0.0.1 e ::1');
ok(isAdminAllowed('localhost') && isAdminAllowed('127.0.0.1') && isAdminAllowed('[::1]') && !isAdminAllowed('guioliveiradev-dot.github.io') && !isAdminAllowed('') && !isAdminAllowed('localhost.evil.com'), 'Painel: no GitHub Pages e em endereços parecidos fica desligado');
ok(!!openAdminPanel(), 'Painel: no endereço local abre');
document.querySelectorAll('.modal-overlay').forEach((o) => o.remove());
const original = globalThis.location;
Object.defineProperty(globalThis, 'location', { value: { hostname: 'guioliveiradev-dot.github.io' }, configurable: true });
ok(isAdminAllowed() === false && openAdminPanel() === null && !document.querySelector('.modal-overlay'), 'Painel: no site publicado não abre, nem chamando direto');
Object.defineProperty(globalThis, 'location', { value: original, configurable: true });
ok(/isAdminAllowed\(\)\) openAdminPanel\(\)/.test(file('js/app.js')), 'Painel: os 8 toques na Home só chamam o painel se o endereço for permitido');
