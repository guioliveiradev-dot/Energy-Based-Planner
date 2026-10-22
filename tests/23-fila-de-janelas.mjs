// Fila de janelas: a conquista nunca aparece por cima de outra janela, e várias conquistas vêm uma de cada vez.
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
const M = await import(base + 'components/modal.js');
const { startAchievementWatcher } = await import(base + 'components/achievement-notification.js');
const { showCongratsModal } = await import(base + 'components/congrats-modal.js');
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms));
const overlays = () => document.querySelectorAll('.modal-overlay').length;
const achv = () => [...document.querySelectorAll('.achv-panel')];

// ---------- a fila em si ----------
ok(M.isModalOpen() === false, 'Fila: sem janela aberta no começo');
let called = 0;
M.whenModalsClosed(() => called++);
ok(called === 1, 'Fila: sem janela aberta, executa na hora');
const a = M.createModal(); a.panel.innerHTML = '<button>a</button>'; a.open();
const b = M.createModal(); b.panel.innerHTML = '<button>b</button>'; b.open();
ok(M.isModalOpen(), 'Fila: com janela aberta, informa que está ocupado');
const order = [];
M.whenModalsClosed(() => order.push('1')); M.whenModalsClosed(() => order.push('2'));
b.close();
ok(order.length === 0 && M.isModalOpen(), 'Fila: ainda há uma janela aberta, continua esperando');
a.close();
ok(order.join() === '1,2' && !M.isModalOpen(), 'Fila: quando a última fecha, executa na ordem em que pediram');
M.lockBackground();
let t = 0; M.whenModalsClosed(() => t++);
ok(t === 0, 'Fila: o tutorial (que só trava o fundo) também conta como ocupado');
M.unlockBackground();
ok(t === 1, 'Fila: e libera quando o tutorial termina');

// ---------- conquistas em fila ----------
await auth.register('Ana', 'ana@x.com', 'segredo1');
const uid = auth.state.user.id;
await db.createTask({ id: 'seed', userId: uid, title: 'Semente', energyCost: 3, durationMinutes: 10, deadline: null, category: 'work', completed: true, completedAt: Date.now() - 1e6, createdAt: Date.now() - 2e6 });
const stop = startAchievementWatcher({ pollMs: 30, delayMs: 20, settleMs: 40 });
await wait(150);

// uma janela de parabéns está aberta quando 2 conquistas destravam juntas (Novo Amigo + Laço Criado)
const congrats = showCongratsModal({ taskTitle: 'Ler', points: 65 });
T.addToInventory(uid, 'cat');
await db.addPetBond(uid, 'cat', 5);
await wait(500);
ok(achv().length === 0 && overlays() === 1, 'Conquista: com a janela de parabéns aberta, NÃO aparece por cima');
congrats.close();
await wait(400);
ok(achv().length === 1 && overlays() === 1, 'Conquista: quando a janela de parabéns fecha, aparece a primeira (sozinha na tela)');
const first = achv()[0].querySelector('h3').textContent;
achv()[0].querySelector('[data-role="ok"]').click();
await wait(400);
ok(achv().length === 1 && overlays() === 1 && achv()[0].querySelector('h3').textContent !== first, 'Conquista: ao fechar a primeira, aparece a segunda (nenhuma se perde)');
const titles = new Set([first, achv()[0].querySelector('h3').textContent]);
ok(titles.has('Novo Amigo') && titles.has('Laço Criado'), 'Conquista: foram exatamente "Novo Amigo" e "Laço Criado"');
achv()[0].querySelector('[data-role="ok"]').click();
await wait(400);
ok(achv().length === 0 && overlays() === 0, 'Conquista: fila vazia, nada mais aparece');

// conquista nova enquanto outra janela qualquer está aberta (ex.: painel admin)
const other = M.createModal(); other.panel.innerHTML = '<button>x</button>'; other.open();
T.addToInventory(uid, 'dragon'); T.addToInventory(uid, 'robot');       // 3 pets: Matilha
await wait(400);
ok(achv().length === 0 && overlays() === 1, 'Conquista: com qualquer outra janela aberta, espera');
other.close();
await wait(400);
ok(achv().length === 1 && /Matilha/.test(achv()[0].textContent) && overlays() === 1, 'Conquista: depois que a outra fecha, aparece');
achv()[0].querySelector('[data-role="ok"]').click();

// parar o aviso limpa tudo
const other2 = M.createModal(); other2.panel.innerHTML = '<button>y</button>'; other2.open();
T.addToInventory(uid, 'unicorn'); T.addToInventory(uid, 'dog'); T.addToInventory(uid, 'phoenix');   // Zoológico Estelar
await wait(300);
stop();
other2.close();
await wait(400);
ok(achv().length === 0, 'Parar: ao sair, nada fica na fila para aparecer depois');
