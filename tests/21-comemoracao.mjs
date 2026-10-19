// Comemoração (fagulhas de luz) no lugar do confete: formato, tamanhos, acessibilidade e onde é usada.
import 'fake-indexeddb/auto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><head><title>Base</title></head><body><div id="app"></div><div id="toasts"></div></body></html>', { url: 'http://localhost/' });
const w = dom.window;
for (const k of ['window', 'document', 'location', 'navigator']) Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });
const base = new URL('../js/', import.meta.url).href;
const { celebrate, CELEBRATE_MS } = await import(base + 'celebrate.js');
const { showCongratsModal } = await import(base + 'components/congrats-modal.js');
const { showPetLevelUp } = await import(base + 'components/pet-levelup.js');
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const wait = (ms = 80) => new Promise((r) => setTimeout(r, ms));
const file = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const layers = () => document.querySelectorAll('.celebrate-layer');
const clear = () => { layers().forEach((l) => l.remove()); document.querySelectorAll('.modal-overlay').forEach((o) => o.remove()); };

// ---------- formato ----------
const count = (kind) => { const l = celebrate(kind, { duration: 5000 }); const n = l.querySelectorAll('.celebrate-spark').length; const ring = !!l.querySelector('.celebrate-ring'); l.remove(); return { n, ring }; };
ok(JSON.stringify([count('task'), count('level'), count('achievement'), count('reward')]) === JSON.stringify([{ n: 14, ring: true }, { n: 22, ring: true }, { n: 18, ring: true }, { n: 10, ring: false }]), 'Comemoração: task 14, level 22, achievement 18 e reward 10 fagulhas (reward sem anel)');
ok(count('inventado').n === 14, 'Comemoração: tipo desconhecido usa o padrão de concluir tarefa');
const l = celebrate('task', { origin: { x: 0.25, y: 0.4 }, duration: 5000 });
ok(l.getAttribute('aria-hidden') === 'true' && l.style.getPropertyValue('--ox') === '25%' && l.style.getPropertyValue('--oy') === '40%' && !!l.querySelector('.celebrate-glow'), 'Comemoração: escondida do leitor de tela, com posição e brilho de fundo');
const sparks = [...l.querySelectorAll('.celebrate-spark')];
const num = (el, v) => parseFloat(el.style.getPropertyValue(v));
ok(sparks.every((s) => num(s, '--size') >= 6 && num(s, '--size') <= 15 && num(s, '--rise') >= 110 && num(s, '--rise') <= 340 && num(s, '--dur') >= 1.8 && num(s, '--dur') <= 2.9 && num(s, '--delay') >= 0 && num(s, '--delay') <= 0.75 && Math.abs(num(s, '--x')) <= 150 && Math.abs(num(s, '--dx')) <= 45), 'Fagulhas: tamanho, subida, duração, atraso e espalhamento dentro dos limites');
ok(sparks.filter((s) => s.classList.contains('soft')).length === 5, 'Fagulhas: uma a cada três é mais suave (variedade sem cores aleatórias)');
const fixed = celebrate('task', { rng: () => 0, duration: 5000 });
ok(fixed.querySelector('.celebrate-spark').style.getPropertyValue('--size') === '6.0px', 'Fagulhas: o sorteio pode ser fixado (para testar)');
clear();

// ---------- some sozinha ----------
const short = celebrate('reward', { duration: 60 });
ok(document.body.contains(short), 'Comemoração: aparece');
await wait(150);
ok(!document.body.contains(short) && CELEBRATE_MS > 2000 && CELEBRATE_MS < 5000, 'Comemoração: some sozinha depois de alguns segundos');

// ---------- quem pede menos movimento ----------
w.matchMedia = (q) => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {} });
ok(celebrate('task') === null && layers().length === 0, 'Acessibilidade: com "menos movimento" ligado, não anima nada');
w.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} });
ok(!!celebrate('task', { duration: 50 }), 'Acessibilidade: com "menos movimento" desligado, anima');
clear();

// ---------- onde é usada ----------
showCongratsModal({ taskTitle: 'Ler', points: 65 });
ok(layers().length === 1 && layers()[0].querySelectorAll('.celebrate-spark').length === 14, 'Concluir tarefa: janela de parabéns comemora com fagulhas');
clear();
showPetLevelUp({ petId: 'cat', before: 4, after: 5 });
ok(layers().length === 1 && layers()[0].querySelectorAll('.celebrate-spark').length === 22 && !!layers()[0].querySelector('.celebrate-ring'), 'Pet subiu de nível: comemoração maior, com anel');
clear();
ok((file('js/pages/shop.js').match(/celebrate\('reward'\)/g) || []).length === 2, 'Loja: compra e resgate comemoram (2 lugares)');
ok(/celebrate\('achievement'/.test(file('js/components/achievement-notification.js')), 'Conquista: comemora ao desbloquear');

// ---------- confete foi embora de vez ----------
function walk(dir, out = []) { for (const n of readdirSync(new URL('../' + dir, import.meta.url))) { const p = dir + n; if (statSync(new URL('../' + p, import.meta.url)).isDirectory()) walk(p + '/', out); else out.push(p); } return out; }
const sources = [...walk('js/'), 'index.html', 'sw.js', 'eslint.config.js'];
const withConfetti = sources.filter((f) => /confetti|confete/i.test(file(f)));
ok(withConfetti.length === 0, `Confete: nenhuma referência sobrou no código ${withConfetti.join(', ')}`);
ok(!/<script[^>]+src="https?:/.test(file('index.html')), 'Offline: o index.html não carrega nenhum script de outro site');

// ---------- CSS ----------
const css = file('css/style.css');
const rule = (sel) => { const i = css.indexOf(sel); return css.slice(i, css.indexOf('}', i)); };
const z = (sel) => Number((rule(sel).match(/z-index: (\d+)/) || [])[1]);
ok(/pointer-events: none/.test(rule('.celebrate-layer {')) && z('.celebrate-layer {') > z('.modal-overlay.top {') && z('.celebrate-layer {') > z('#toasts {'), 'CSS: a camada não bloqueia cliques e fica por cima das janelas e avisos');
ok(['celebrate-rise', 'celebrate-ring', 'celebrate-glow'].every((k) => new RegExp(`@keyframes ${k}`).test(css)) && /clip-path: polygon/.test(rule('.celebrate-spark {')), 'CSS: animações de subida, anel e brilho; fagulha em forma de estrela de 4 pontas');
ok(/hsl\(var\(--accent\)/.test(rule('.celebrate-spark {')) && /hsl\(var\(--accent\) \/ 0\.55\)/.test(rule('.celebrate-spark.soft {')), 'CSS: usa a cor de destaque do tema (nada de arco-íris)');
