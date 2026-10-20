// Comemoração: fagulhas de luz (nível do pet, conquista, compra) e a animação própria da conclusão de tarefa.
import 'fake-indexeddb/auto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><head><title>Base</title></head><body><div id="app"></div><div id="toasts"></div></body></html>', { url: 'http://localhost/' });
const w = dom.window;
for (const k of ['window', 'document', 'location', 'navigator']) Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });
const base = new URL('../js/', import.meta.url).href;
const { celebrate, CELEBRATE_MS } = await import(base + 'celebrate.js');
const { showCongratsModal, countUp } = await import(base + 'components/congrats-modal.js');
const { showPetLevelUp } = await import(base + 'components/pet-levelup.js');
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const wait = (ms = 80) => new Promise((r) => setTimeout(r, ms));
const file = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const layers = () => document.querySelectorAll('.celebrate-layer');
const clear = () => { layers().forEach((l) => l.remove()); document.querySelectorAll('.modal-overlay').forEach((o) => o.remove()); };

// ---------- formato ----------
const count = (kind) => { const l = celebrate(kind, { duration: 5000 }); const n = l.querySelectorAll('.celebrate-spark').length; const ring = !!l.querySelector('.celebrate-ring'); l.remove(); return { n, ring }; };
ok(JSON.stringify([count('level'), count('achievement'), count('reward')]) === JSON.stringify([{ n: 22, ring: true }, { n: 18, ring: true }, { n: 10, ring: false }]), 'Comemoração: nível 22, conquista 18 e compra 10 fagulhas (compra sem anel)');
ok(count('task').n === 10 && count('inventado').n === 10, 'Comemoração: concluir tarefa não usa fagulhas (tem animação própria); tipo desconhecido vira o mais discreto');
const l = celebrate('level', { origin: { x: 0.25, y: 0.4 }, duration: 5000 });
ok(l.getAttribute('aria-hidden') === 'true' && l.style.getPropertyValue('--ox') === '25%' && l.style.getPropertyValue('--oy') === '40%' && !!l.querySelector('.celebrate-glow'), 'Comemoração: escondida do leitor de tela, com posição e brilho de fundo');
const sparks = [...l.querySelectorAll('.celebrate-spark')];
const num = (el, v) => parseFloat(el.style.getPropertyValue(v));
ok(sparks.every((s) => num(s, '--size') >= 6 && num(s, '--size') <= 15 && num(s, '--rise') >= 110 && num(s, '--rise') <= 340 && num(s, '--dur') >= 1.8 && num(s, '--dur') <= 2.9 && num(s, '--delay') >= 0 && num(s, '--delay') <= 0.75 && Math.abs(num(s, '--x')) <= 210 && Math.abs(num(s, '--dx')) <= 45), 'Fagulhas: tamanho, subida, duração, atraso e espalhamento dentro dos limites');
ok(sparks.filter((s) => s.classList.contains('soft')).length === 8, 'Fagulhas: uma a cada três é mais suave (variedade sem cores aleatórias)');
const fixed = celebrate('level', { rng: () => 0, duration: 5000 });
ok(fixed.querySelector('.celebrate-spark').style.getPropertyValue('--size') === '6.0px', 'Fagulhas: o sorteio pode ser fixado (para testar)');
clear();

// ---------- some sozinha ----------
const short = celebrate('reward', { duration: 60 });
ok(document.body.contains(short), 'Comemoração: aparece');
await wait(150);
ok(!document.body.contains(short) && CELEBRATE_MS > 2000 && CELEBRATE_MS < 5000, 'Comemoração: some sozinha depois de alguns segundos');

// ---------- quem pede menos movimento ----------
w.matchMedia = (q) => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {} });
ok(celebrate('level') === null && layers().length === 0, 'Acessibilidade: com "menos movimento" ligado, não anima nada');
w.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} });
ok(!!celebrate('level', { duration: 50 }), 'Acessibilidade: com "menos movimento" desligado, anima');
clear();

// ---------- onde é usada ----------
showCongratsModal({ taskTitle: 'Ler', points: 65 });
ok(layers().length === 0, 'Concluir tarefa: não usa as fagulhas (a animação dela é outra)');
clear();
showPetLevelUp({ petId: 'cat', before: 4, after: 5 });
ok(layers().length === 1 && layers()[0].querySelectorAll('.celebrate-spark').length === 22 && !!layers()[0].querySelector('.celebrate-ring'), 'Pet subiu de nível: fagulhas maiores, com anel');
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

// ---------- conclusão de tarefa: visto que se desenha, pontos contando, linhas que aparecem ----------
clear();
const m = showCongratsModal({ taskTitle: 'Ler capítulo', points: 65, petBonus: { message: 'Fagulha ajudou: +5 pontos' }, petNote: 'Fênix Estelar reacendeu 2 dias da sua sequência!', streak: 4 });
const panel = document.querySelector('.congrats-panel');
ok(!!panel.querySelector('.congrats-check[aria-hidden="true"] svg .cc-ring') && !!panel.querySelector('.cc-tick') && !!panel.querySelector('.cc-fill') && !!panel.querySelector('.cc-pulse'), 'Tarefa: círculo, "visto" e anel de luz (escondidos do leitor de tela)');
ok(!/🎉/.test(panel.textContent) && !panel.querySelector('.congrats-emoji'), 'Tarefa: o emoji pulando saiu');
ok(panel.querySelector('[data-count]').textContent === '65' && /\+65 Pontos Planner/.test(panel.querySelector('.congrats-points .sr-only').textContent) && panel.querySelector('.congrats-points > span').getAttribute('aria-hidden') === 'true', 'Tarefa: os pontos sobem contando, mas o leitor de tela lê o valor final');
const rev = [...panel.querySelectorAll('.congrats-reveal')].map((x) => x.style.getPropertyValue('--i'));
ok(rev.join() === '0,1,2' && /Fagulha ajudou/.test(panel.textContent) && /Fênix Estelar reacendeu/.test(panel.textContent) && /4 dias seguidos/.test(panel.textContent), 'Tarefa: bônus, nota e sequência aparecem em ordem (um após o outro)');
ok(document.activeElement === panel.querySelector('[data-role="ok"]'), 'Tarefa: foco no "Continuar"');
m.close();

// contagem de pontos (relógio e animação simulados)
const el = { textContent: '' };
let clock = 0; const frames = [];
const raf = (fn) => frames.push(fn);
countUp(el, 100, { duration: 800, raf, now: () => clock });
const seen = [el.textContent];
while (frames.length && clock <= 900) { clock += 100; frames.shift()(); seen.push(el.textContent); }
const nums = seen.map(Number);
ok(nums[0] === 0 && nums.at(-1) === 100 && nums.every((v, i) => i === 0 || v >= nums[i - 1]) && nums.length >= 8, `Contagem: sobe de 0 a 100 sem voltar atrás (${seen.join(' ')})`);
const first = nums[1] - nums[0], last = nums.at(-2) - nums.at(-3);
ok(first > last, 'Contagem: começa rápida e desacelera no fim');
const quick = { textContent: '' };
countUp(quick, 65, { raf: null });
ok(quick.textContent === '65', 'Contagem: sem animação (ou menos movimento), mostra o valor final na hora');
const zero = { textContent: 'x' };
countUp(zero, 0, { raf });
ok(zero.textContent === '0', 'Contagem: valor zero não anima');

// CSS da conclusão
const rule2 = (sel) => { const i = css.indexOf(sel); return css.slice(i, css.indexOf('}', i)); };
ok(['congrats-draw', 'congrats-pulse', 'congrats-reveal', 'congrats-in'].every((k) => new RegExp(`@keyframes ${k}`).test(css)), 'CSS: animações de desenhar, anel, entrada e aparecer');
ok(![rule2('.congrats-check {'), rule2('.cc-ring {'), rule2('.cc-tick {'), rule2('.cc-pulse {'), rule2('.congrats-reveal {')].some((r) => /infinite/.test(r)), 'CSS: nada fica repetindo para sempre (toca uma vez, calmo)');
ok(/hsl\(var\(--accent\)\)/.test(rule2('.cc-ring {')) && /hsl\(var\(--accent\)\)/.test(rule2('.cc-tick {')), 'CSS: o visto usa a cor de destaque do tema');
