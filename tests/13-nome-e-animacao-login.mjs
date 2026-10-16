// Nome completo do app e animação da troca Login <-> Cadastro.
import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><body><div id="app"></div></body>', { url: 'http://localhost/' });
const w = dom.window;
for (const k of ['window', 'document', 'location']) Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const file = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const NAME = 'Energy Based Planner';

// ---------- nome ----------
ok(file('index.html').includes(`<title>${NAME}</title>`) && file('index.html').includes(`apple-mobile-web-app-title" content="${NAME}"`), 'Nome: título da aba e do iOS são "Energy Based Planner"');
ok(JSON.parse(file('manifest.webmanifest')).name === NAME, 'Nome: manifest usa o nome completo');
ok(file('js/app.js').includes(`· ${NAME}\``), 'Nome: título de cada tela termina com o nome completo');
const { renderLogin } = await import(new URL('../js/pages/login.js', import.meta.url).href);
const root = document.getElementById('app');
renderLogin(root);
ok(root.querySelector('h1').textContent === NAME && root.querySelector('.logo-hero').getAttribute('aria-label') === `Logo do ${NAME}`, 'Nome: tela de login mostra o nome completo');

// ---------- animação ----------
const tabs = root.querySelector('.tabs'), wrap = root.querySelector('#name-wrap'), name = root.querySelector('#name');
ok(tabs.dataset.mode === 'login' && wrap.dataset.open === 'false' && wrap.hasAttribute('inert') && wrap.getAttribute('aria-hidden') === 'true', 'Login: campo de nome fechado, sem foco e escondido do leitor de tela');
root.querySelector('[data-tab="register"]').click();
ok(tabs.dataset.mode === 'register' && wrap.dataset.open === 'true' && !wrap.hasAttribute('inert') && wrap.getAttribute('aria-hidden') === 'false', 'Cadastro: indicador vai para a direita e o campo de nome abre');
ok(root.querySelector('#submit-label').textContent === 'Criar Conta' && root.querySelector('[data-tab="register"]').getAttribute('aria-selected') === 'true', 'Cadastro: botão e aba atualizados');
root.querySelector('[data-tab="login"]').click();
ok(tabs.dataset.mode === 'login' && wrap.dataset.open === 'false' && wrap.hasAttribute('inert') && root.querySelector('#submit-label').textContent === 'Entrar', 'Voltar ao Login: tudo volta ao estado inicial');
ok(!!name && wrap.contains(name), 'Campo de nome continua no formulário (só fechado)');

const css = file('css/style.css');
const rule = (sel) => { const i = css.lastIndexOf(sel); return css.slice(i, css.indexOf('}', i)); };
ok(/transition: transform 0\.3s/.test(rule('\n.auth-card .tabs::before {')) && /translateX/.test(rule('.auth-card .tabs[data-mode="register"]::before')), 'CSS: indicador da aba desliza com transição');
ok(/grid-template-rows 0\.3s/.test(rule('.collapse {')) && /grid-template-rows: 1fr/.test(rule('.collapse[data-open="true"]')), 'CSS: campo de nome abre e fecha com transição de altura');
ok(/transition-duration: 0\.01ms/.test(css.slice(css.indexOf('prefers-reduced-motion'), css.indexOf('prefers-reduced-motion') + 400)), 'Acessibilidade: quem pede menos movimento não vê a animação');
