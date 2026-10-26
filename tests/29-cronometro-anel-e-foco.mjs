// Cronômetro: anel de progresso e modo foco em tela cheia.
import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><head><title>Base</title></head><body><div id="app"></div><div id="toasts"></div></body></html>', { url: 'http://localhost/' });
const w = dom.window;
for (const k of ['window', 'document', 'location', 'navigator']) Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });
const base = new URL('../js/', import.meta.url).href;
const { createTaskTimer } = await import(base + 'components/task-timer.js');
const { icon } = await import(base + 'icons.js');
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const wait = (ms = 80) => new Promise((r) => setTimeout(r, ms));
const css = readFileSync(new URL('../css/style.css', import.meta.url), 'utf8');

const panel = () => document.querySelector('.timer-panel');
const arc = () => panel().querySelector('[data-role="arc"]');
const offset = () => parseFloat(arc().style.strokeDashoffset);
const make = (o = {}) => createTaskTimer({ userId: 'u1', taskTitle: 'Estudar', durationMinutes: 60, startedAt: Date.now(), onUpdate() {}, onComplete() {}, ...o });
const press = (key) => document.dispatchEvent(new w.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

// ---------- anel de progresso ----------
let t = make({ startedAt: Date.now() - 30 * 60000 });          // 30 de 60 minutos
t.open(); await wait();
ok(!!panel().querySelector('.timer-ring svg circle.ring-track') && !!arc() && !panel().querySelector('.progress-bar'), 'Anel: o cronômetro tem um anel (e a barra reta saiu)');
ok(Math.abs(offset() - 50) <= 1, `Anel: com metade do tempo, o anel está pela metade (falta ${offset()}%)`);
const ring = panel().querySelector('[role="progressbar"]');
ok(ring.getAttribute('aria-label') === 'Tempo da tarefa' && ring.getAttribute('aria-valuemin') === '0' && ring.getAttribute('aria-valuemax') === '100' && Math.abs(Number(ring.getAttribute('aria-valuenow')) - 50) <= 1, 'Acessibilidade: o anel é uma barra de progresso com nome e valor (50%)');
ok(panel().querySelector('[data-role="time"]').closest('.timer-ring') !== null && !panel().querySelector('[data-role="time"]').closest('[role="progressbar"]'), 'Acessibilidade: o texto do tempo fica dentro do anel mas fora da barra (continua legível para leitor de tela)');
ok(arc().dataset.state === 'running', 'Anel: rodando');
panel().querySelector('[data-action="pause"]').click(); await wait();
ok(arc().dataset.state === 'paused', 'Anel: pausado muda de estado (cor mais apagada)');
const frozen = offset();
await wait(1200);
ok(offset() === frozen, 'Anel: pausado, o anel não anda');
panel().querySelector('[data-action="resume"]').click(); await wait();
ok(arc().dataset.state === 'running', 'Anel: continuar volta ao normal');
t.destroy();

t = make({ durationMinutes: 1, startedAt: Date.now() - 5 * 60000 });
t.open(); await wait(150);
ok(offset() === 0 && arc().dataset.state === 'done' && panel().querySelector('[role="progressbar"]').getAttribute('aria-valuenow') === '100', 'Anel: tempo esgotado, anel cheio e verde (100%)');
t.destroy();

t = make({ startedAt: Date.now() });
t.open(); await wait();
ok(offset() >= 99 && panel().querySelector('[role="progressbar"]').getAttribute('aria-valuenow') === '0', 'Anel: no começo está vazio (0%)');

// ---------- modo foco ----------
const focusBtn = () => panel().querySelector('[data-role="focus"]');
ok(focusBtn().getAttribute('aria-pressed') === 'false' && focusBtn().getAttribute('aria-label') === 'Modo foco (tela cheia)' && /<svg/.test(focusBtn().innerHTML) && !t.focusMode, 'Foco: botão "Modo foco (tela cheia)" começa desligado');
ok(icon('maximize-2').includes('polyline') && icon('minimize-2').includes('polyline'), 'Foco: os dois ícones existem');
focusBtn().click();
const overlay = () => panel().parentElement;
ok(t.focusMode && panel().classList.contains('focus-mode') && overlay().classList.contains('timer-focus') && focusBtn().getAttribute('aria-pressed') === 'true' && focusBtn().getAttribute('aria-label') === 'Sair do modo foco', 'Foco: ligar ocupa a tela, marca o botão e muda o nome para "Sair do modo foco"');
ok(!!panel().querySelector('[data-action="pause"]') && !!panel().querySelector('[data-role="time"]'), 'Foco: o tempo e o botão de pausar continuam lá');
press('Escape');
ok(!t.focusMode && !panel().classList.contains('focus-mode') && !overlay().classList.contains('timer-focus') && t.isOpen, 'Foco: o Esc sai do modo foco sem fechar o cronômetro');
ok(focusBtn().getAttribute('aria-pressed') === 'false', 'Foco: o botão volta ao normal');
focusBtn().click();
focusBtn().click();
ok(!t.focusMode, 'Foco: o botão liga e desliga');
focusBtn().click();
press('Escape');
press('Escape');
await wait();
ok(!t.isOpen && !document.querySelector('.timer-panel'), 'Foco: no modo normal o Esc fecha o cronômetro (depois de sair do foco, o 2º Esc)');
t.destroy();

// tela cheia do navegador (simulada): entra com o foco e sair da tela cheia sai do foco
let requested = 0, exited = 0;
t = make();
t.open(); await wait();
panel().requestFullscreen = async () => { requested++; Object.defineProperty(document, 'fullscreenElement', { value: panel(), configurable: true }); };
Object.defineProperty(document, 'exitFullscreen', { value: async () => { exited++; Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true }); }, configurable: true });
focusBtn().click(); await wait();
ok(requested === 1 && t.focusMode, 'Tela cheia: o modo foco pede a tela cheia ao navegador');
Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true });   // a pessoa apertou Esc do navegador
document.dispatchEvent(new w.Event('fullscreenchange'));
ok(!t.focusMode && !panel().classList.contains('focus-mode'), 'Tela cheia: se a pessoa sai da tela cheia, o modo foco acaba junto');
focusBtn().click(); await wait();
Object.defineProperty(document, 'fullscreenElement', { value: panel(), configurable: true });
focusBtn().click(); await wait();
ok(exited === 1 && !t.focusMode, 'Tela cheia: sair do foco também sai da tela cheia');
t.destroy();

// navegador sem tela cheia: o modo foco funciona do mesmo jeito
Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true });
t = make();
t.open(); await wait();
focusBtn().click();
ok(t.focusMode && panel().classList.contains('focus-mode'), 'Sem tela cheia no navegador: o foco ocupa a janela mesmo assim');
t.close();
ok(!document.querySelector('.timer-panel'), 'Fechar: sai do foco e fecha');
t.destroy();

// ---------- CSS ----------
ok(/\.ring-arc \{[^}]*stroke-linecap: round[^}]*transition: stroke-dashoffset/.test(css) && /\.timer-ring svg \{[^}]*rotate\(-90deg\)/.test(css), 'CSS: anel começa no topo e se enche com transição suave');
ok(/\.timer-panel\.focus-mode \{[^}]*width: 100%[^}]*height: 100%[^}]*border-radius: 0/.test(css) && /\.modal-overlay\.timer-focus \{ padding: 0; \}/.test(css) && /min\(70vmin, 26rem\)/.test(css), 'CSS: o modo foco ocupa a tela toda e o anel cresce com ela');
