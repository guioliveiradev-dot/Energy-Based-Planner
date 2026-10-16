// Validação de e-mail: formato, erros de digitação comuns e telas de Login/Cadastro.
import 'fake-indexeddb/auto';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><body><div id="app"></div></body>', { url: 'http://localhost/' });
const w = dom.window;
for (const k of ['window', 'document', 'location']) Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });
const base = new URL('../js/', import.meta.url).href;
const { validateEmail, suggestEmail } = await import(base + 'email.js');
const auth = await import(base + 'auth.js');
const { renderLogin } = await import(base + 'pages/login.js');
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const wait = (ms = 60) => new Promise((r) => setTimeout(r, ms));

// ---------- formato ----------
const good = ['ana@gmail.com', 'ANA.Silva+planner@Hotmail.com.br', 'a_b-c@sub.dominio.org', 'x@x.co', '  maria@uol.com.br  '];
ok(good.every((e) => validateEmail(e).ok), 'Válidos: aceita e-mails bem escritos (com maiúsculas, + e espaços nas pontas)');
ok(validateEmail('  Ana@Gmail.com ').email === 'ana@gmail.com', 'Válidos: devolve o e-mail em minúsculas e sem espaços');
const bad = ['', 'abc', 'abc@', '@gmail.com', 'ana@gmail', 'ana@@gmail.com', 'ana gmail@gmail.com', 'ana@gmail..com', '.ana@gmail.com', 'ana.@gmail.com', 'ana@-gmail.com', 'ana@gmail.c', 'ana@gmail.123', 'ana@gmail.com.', 'ana@gm ail.com', 'ana@gmail,com', 'ana@gmail.com/x', 'á@gmail.com', 'a'.repeat(65) + '@gmail.com'];
const accepted = bad.filter((e) => validateEmail(e).ok);
ok(accepted.length === 0, `Inválidos: recusa ${bad.length} formatos errados ${accepted.length ? '(aceitou: ' + accepted.join(' | ') + ')' : ''}`);
ok(/@/.test(validateEmail('abc').error) && /\.com/.test(validateEmail('ana@gmail').error) && /espaços/.test(validateEmail('a b@x.com').error), 'Mensagens: dizem o que está errado (falta @, falta .com, espaços)');

// ---------- erros de digitação ----------
const typos = { 'ana@gmial.com': 'ana@gmail.com', 'ana@gmail.con': 'ana@gmail.com', 'ana@gnail.com': 'ana@gmail.com', 'ana@hotmial.com': 'ana@hotmail.com', 'ana@gmail.com.br': 'ana@gmail.com', 'ana@outlok.com': 'ana@outlook.com', 'ana@yaho.com.br': 'ana@yahoo.com.br' };
const wrong = Object.entries(typos).filter(([e, fix]) => suggestEmail(e) !== fix);
ok(wrong.length === 0, `Digitação: sugere a correção de ${Object.keys(typos).length} erros comuns ${wrong.length ? '(falhou: ' + wrong.map((x) => x[0]).join(', ') + ')' : ''}`);
const fine = ['ana@gmail.com', 'ana@mail.com', 'ana@aol.com', 'ana@x.com', 'ana@empresa.com.br', 'ana@live.com.br', 'ana@usp.br', 'a@b.com'];
const false_ = fine.filter((e) => suggestEmail(e));
ok(false_.length === 0, `Digitação: não implica com e-mails corretos ${false_.length ? '(sugeriu para: ' + false_.join(', ') + ')' : ''}`);

// ---------- cadastro (auth) ----------
let r = await auth.register('Ana', 'abc', 'segredo1');
ok(!r.success && /@/.test(r.error), 'Cadastro: recusa e-mail sem @ mesmo fora da tela');
r = await auth.register('Ana', '  Ana@X.com ', 'segredo1');
ok(r.success && auth.state.user.email === 'ana@x.com', 'Cadastro: grava o e-mail limpo e em minúsculas');
await auth.logout?.();

// ---------- tela ----------
const root = document.getElementById('app');
renderLogin(root);
const email = root.querySelector('#email'), pass = root.querySelector('#password'), name = root.querySelector('#name');
const hint = root.querySelector('#email-hint'), err = root.querySelector('#auth-error'), form = root.querySelector('#auth-form');
const submit = () => form.dispatchEvent(new w.Event('submit', { cancelable: true, bubbles: true }));
ok(email.getAttribute('inputmode') === 'email' && email.getAttribute('autocapitalize') === 'off' && email.getAttribute('aria-describedby') === 'email-hint', 'Tela: campo de e-mail com teclado de e-mail e dica ligada');

// login é tolerante: e-mail antigo mal escrito não bloqueia, mas explica quando o login falha
email.value = 'abc'; pass.value = 'segredo1'; submit(); await wait(200);
ok(/@/.test(hint.textContent) && email.getAttribute('aria-invalid') === 'true' && err.textContent !== '', 'Login: e-mail mal escrito + login que falha explica o problema do e-mail');

// cadastro é rígido
root.querySelector('[data-tab="register"]').click();
ok(hint.textContent === '' && email.getAttribute('aria-invalid') === 'false', 'Cadastro: trocar de aba limpa o aviso');
name.value = 'Bia'; pass.value = 'segredo1'; email.value = 'bia';
submit(); await wait(100);
ok(/@/.test(hint.textContent) && email.getAttribute('aria-invalid') === 'true' && document.activeElement === email, 'Cadastro: "bia" é recusado, com aviso e foco no campo');
ok((await import(base + 'db.js').then((d) => d.getUserByEmail('bia'))) === undefined, 'Cadastro: nenhuma conta criada com e-mail inválido');

email.value = 'bia@gmial.com'; submit(); await wait(100);
ok(/Você quis dizer bia@gmail\.com/.test(hint.textContent), 'Cadastro: "gmial.com" avisa "Você quis dizer bia@gmail.com?"');
ok(auth.state.user === null || auth.state.user.email !== 'bia@gmial.com', 'Cadastro: na primeira tentativa não cria a conta');
submit(); await wait(250);
ok(auth.state.user && auth.state.user.email === 'bia@gmial.com', 'Cadastro: segunda tentativa com o mesmo e-mail confirma e cria a conta');

// aviso ao sair do campo
await auth.logout?.();
renderLogin(root);
const root2 = root.querySelector('[data-tab="register"]'); root2.click();
const e2 = root.querySelector('#email'); e2.value = 'zé@x.com'; e2.dispatchEvent(new w.Event('blur'));
ok(/caracteres/.test(root.querySelector('#email-hint').textContent), 'Cadastro: ao sair do campo, já avisa do caractere não permitido');
e2.dispatchEvent(new w.Event('input'));
ok(root.querySelector('#email-hint').textContent === '', 'Cadastro: ao digitar de novo, o aviso some');
