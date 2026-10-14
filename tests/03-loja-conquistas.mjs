import 'fake-indexeddb/auto';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><body><div id="app"></div><div id="toasts"></div></body>', { url: 'http://localhost/' });
const w = dom.window;
for (const k of ['window','document','location']) Object.defineProperty(globalThis, k, { value: k==='window'? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });

const base = new URL('../js/', import.meta.url).href;
const auth = await import(base + 'auth.js');
const db = await import(base + 'db.js');
const { renderShop } = await import(base + 'pages/shop.js');
const { startAchievementWatcher } = await import(base + 'components/achievement-notification.js');
const { ACHIEVEMENTS, getUnlocked, totalPointsEarned } = await import(base + 'achievements.js');
const themes = await import(base + 'themes.js');
const wait = (ms=40) => new Promise(r => setTimeout(r, ms));
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const root = document.getElementById('app');
const ev = (t) => new w.Event(t, { bubbles: true });
const type = (el, v) => { el.value = v; el.dispatchEvent(ev('input')); };

await auth.register('Ana', 'ana@x.com', 'segredo1');
const uid = auth.state.user.id;
const mk = (o) => ({ id: crypto.randomUUID(), userId: uid, title: 't', energyCost: 5, durationMinutes: 30, deadline: null, category: 'work', completed: false, completedAt: null, startedAt: null, createdAt: Date.now(), ...o });

// regras de conquistas
ok(ACHIEVEMENTS.length === 16, 'Conquistas: 16 definidas');
ok(getUnlocked([], []).length === 0, 'Conquistas: nenhuma sem dados');
ok(totalPointsEarned([mk({ completed: true, energyCost: 8, durationMinutes: 45 })]) === 103, 'Conquistas: pontos totais = 103');
const ids = (t, h=[]) => getUnlocked(t, h).map(a => a.id);
ok(ids([mk({ completed: true, energyCost: 9, durationMinutes: 300 })]).join() === ['first_task','hard_task','long_task','marathon'].join(), 'Conquistas: primeira, desafiador, maratonista, ultra');
ok(ids([], [{}]).join() === 'first_redeem', 'Conquistas: primeiro resgate');

// ---------- Loja ----------
await db.updateUserXP(uid, 1200); await auth.refreshUser();
let cleanup = await renderShop(root);
ok(root.querySelector('#balance').textContent === '1200', 'Loja: saldo 1200');
ok(root.textContent.includes('Crie recompensas para se motivar!'), 'Loja: aba Recompensas vazia');

root.querySelector('#fab').click();
const dlg = document.querySelector('.modal-panel');
ok(dlg.querySelector('#r-create').disabled, 'Loja: Criar desabilitado vazio');
type(dlg.querySelector('#r-title'), 'Jogar <b>Video</b>game'); type(dlg.querySelector('#r-cost'), '500');
ok(!dlg.querySelector('#r-create').disabled, 'Loja: habilita com nome e custo');
dlg.querySelector('#r-create').click(); await wait(80);
ok((await db.getUserRewards(uid)).length === 1 && !document.querySelector('.modal-panel'), 'Loja: recompensa criada, diálogo fechou');
ok(root.textContent.includes('Jogar <b>Video</b>game') && !root.querySelector('.glass-card b'), 'Loja: nome escapado');

// recompensa cara -> botão desabilitado
await db.createReward({ id: 'cara', userId: uid, title: 'Cara', cost: 9999, createdAt: Date.now() + 1 });
cleanup(); root.innerHTML = ''; cleanup = await renderShop(root);
ok(root.querySelector('button.btn-disabled[disabled]'), 'Loja: sem saldo -> Resgatar desabilitado');

// resgatar
root.querySelector('[data-action="redeem"]').click(); await wait(100);
ok(auth.state.user.xp === 700, `Loja: resgate desconta 500 (xp=${auth.state.user.xp})`);
ok(root.querySelector('#balance').textContent === '700', 'Loja: saldo atualiza na tela');
ok((await db.getUserRedemptionHistory(uid)).length === 1, 'Loja: histórico gravado');
ok((await db.getUserRewards(uid)).length === 1, 'Loja: recompensa resgatada some');
ok([...document.querySelectorAll('.toast.success')].some(t => t.textContent.includes('resgatado')), 'Loja: aviso de resgate');

// aba Loja: comprar tema barato
root.querySelector('[data-tab="store"]').click();
ok(root.textContent.includes('Pôr do Sol') && root.textContent.includes('Gato Cósmico'), 'Loja: temas e pets listados');
ok(!root.querySelector('[data-action="buy"][data-id="sunset"]') && root.querySelector('button.btn-disabled[disabled]'), 'Loja: tema de 800 com 700 pontos -> Comprar desabilitado');
ok(!themes.getInventory(uid).includes('sunset'), 'Loja: tema não entrou no inventário sem saldo');
await db.updateUserXP(uid, 300); await auth.refreshUser();
cleanup(); root.innerHTML = ''; cleanup = await renderShop(root);
root.querySelector('[data-tab="store"]').click();
root.querySelector('[data-action="buy"][data-id="sunset"]').click(); await wait(100);
ok(auth.state.user.xp === 200 && themes.getInventory(uid).includes('sunset'), 'Loja: comprou tema (xp 1000→200, inventário ok)');
ok(root.textContent.includes('✓ Obtido'), 'Loja: mostra "Obtido"');

// conquistas + histórico
root.querySelector('[data-tab="achievements"]').click();
ok(root.textContent.includes('1/16 desbloqueadas'), 'Loja: conquistas 1/16 (Merecido pelo resgate)');
ok(root.querySelectorAll('.locked').length === 15, 'Loja: 15 conquistas bloqueadas (cinza)');
root.querySelector('[data-tab="history"]').click();
ok(/Jogar <b>Video<\/b>game/.test(root.textContent) && /\d\d\/\d\d\/\d{4} \d\d:\d\d · -500 Pontos/.test(root.textContent), 'Loja: histórico com data e custo');
cleanup(); root.innerHTML = '';

// ---------- Aviso de conquista ----------
const stop = startAchievementWatcher({ pollMs: 30, delayMs: 30 });
await wait(100);
ok(!document.querySelector('.achv-panel'), 'Aviso: nada ao iniciar (conquista já existente não avisa)');
await db.createTask(mk({ completed: true, completedAt: Date.now(), energyCost: 9 }));
await wait(250);
const p = document.querySelector('.achv-panel');
ok(p && p.textContent.includes('Conquista Desbloqueada') && p.textContent.includes('Primeiro Passo'), 'Aviso: nova conquista mostra popup');
p.querySelector('[data-role="ok"]').click();
ok(!document.querySelector('.achv-panel'), 'Aviso: botão fecha');
await wait(200);
ok(!document.querySelector('.achv-panel'), 'Aviso: não repete a mesma conquista');
stop();
process.exit(process.exitCode || 0);
