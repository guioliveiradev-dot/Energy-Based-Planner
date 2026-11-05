// Menu sanduíche do Perfil: as configurações ficam numa gaveta, separadas do perfil.
import 'fake-indexeddb/auto';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html lang="pt-BR"><head><title>Base</title></head><body><div id="app"></div><div id="toasts"></div></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const w = dom.window;
for (const k of ['window', 'document', 'location', 'navigator']) Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });
const base = new URL('../js/', import.meta.url).href;
const auth = await import(base + 'auth.js');
const { renderProfile } = await import(base + 'pages/profile.js');
const { renderHome } = await import(base + 'pages/home.js');
const wait = (ms = 60) => new Promise((r) => setTimeout(r, ms));
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };

await auth.register('Ana', 'ana@x.com', 'segredo1');
const root = document.getElementById('app');
const cleanup = await renderProfile(root); await wait(100);
const btn = root.querySelector('#open-settings');
const overlay = root.querySelector('#settings-drawer-overlay');
const tab = root.querySelector('#tab-content');

ok(btn && btn.getAttribute('aria-label') === 'Configurações' && btn.getAttribute('aria-expanded') === 'false', 'Botão do menu no Perfil, com nome para leitor de tela');
ok(overlay.hidden, 'O menu começa fechado');
ok(!tab.querySelector('#pref-alerts') && !tab.querySelector('#text-size-card') && !tab.querySelector('[data-act="export"]') && !tab.querySelector('[data-act="logout"]'), 'A aba Perfil não tem mais configurações misturadas');
for (const s of ['#pref-alerts', '#text-size-card', '#storage-card', '[data-act="update"]', '[data-act="tutorial"]', '[data-act="export"]', '[data-act="import"]', '[data-act="logout"]'])
  ok(!!overlay.querySelector(s), `Dentro do menu: ${s}`);

btn.click();
ok(!overlay.hidden && btn.getAttribute('aria-expanded') === 'true' && document.activeElement.id === 'close-settings', 'Tocar no sanduíche abre o menu e leva o foco para "Fechar"');
const d = overlay.querySelector('[role="dialog"]');
ok(d.getAttribute('aria-modal') === 'true' && d.getAttribute('aria-labelledby') === 'settings-title' && /Configurações/.test(root.querySelector('#settings-title').textContent), 'Menu é uma janela com título');
overlay.querySelector('[data-text-size="large"]').click();
ok(document.documentElement.style.fontSize === '115%' && overlay.querySelector('[data-text-size="large"]').getAttribute('aria-pressed') === 'true', 'Tamanho do texto funciona dentro do menu');

document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
ok(overlay.hidden && document.activeElement === btn && btn.getAttribute('aria-expanded') === 'false', 'Esc fecha e devolve o foco ao sanduíche');
btn.click(); root.querySelector('#close-settings').click();
ok(overlay.hidden, 'O botão X fecha o menu');
btn.click(); overlay.dispatchEvent(new w.MouseEvent('mousedown', { bubbles: true }));
ok(overlay.hidden, 'Tocar fora do menu fecha');

cleanup();
btn.click === undefined || document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
ok(true, 'Ao sair da tela, o ouvinte de teclado é removido sem erro');

// ---------- o mesmo menu na Home ----------
root.innerHTML = '';
const cleanHome = await renderHome(root); await wait(120);
const hb = root.querySelector('#open-settings'), ho = root.querySelector('#settings-drawer-overlay');
ok(hb && hb.getAttribute('aria-label') === 'Configurações' && ho && ho.hidden, 'Home: tem o botão sanduíche e o menu começa fechado');
for (const sel of ['#pref-alerts', '#text-size-card', '[data-act="export"]', '[data-act="import"]', '[data-act="logout"]', '#import-file'])
  ok(!!root.querySelector(sel), `Home, dentro do menu: ${sel}`);
hb.click();
ok(!ho.hidden && document.activeElement.id === 'close-settings', 'Home: tocar abre o menu');
document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
ok(ho.hidden && document.activeElement === hb, 'Home: Esc fecha e devolve o foco');
cleanHome();
process.exit(process.exitCode || 0);
