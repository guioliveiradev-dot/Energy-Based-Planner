// Aviso de "versão nova disponível": quando aparece, quando não, e o script de publicação.
import 'fake-indexeddb/auto';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, cpSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><head><title>Base</title></head><body><div id="app"></div><div id="toasts"></div></body></html>', { url: 'http://localhost/' });
const w = dom.window;
for (const k of ['window', 'document', 'location', 'navigator']) Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: w.localStorage, configurable: true });
Object.defineProperty(w.document, 'visibilityState', { value: 'visible', configurable: true });   // o jsdom diz "prerender"
const base = new URL('../js/', import.meta.url).href;
const root = new URL('../', import.meta.url);
const U = await import(base + 'update-check.js');
const { APP_VERSION } = await import(base + 'version.js');
const auth = await import(base + 'auth.js');
const { renderProfile } = await import(base + 'pages/profile.js');
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const wait = (ms = 60) => new Promise((r) => setTimeout(r, ms));
const banner = () => document.querySelector('.update-banner');
const fakeFetch = (version, status = 200) => async (url, opts) => { fakeFetch.calls.push({ url, opts }); return { ok: status === 200, json: async () => (version === undefined ? {} : { version }) }; };
fakeFetch.calls = [];

// ---------- versão publicada x versão rodando ----------
const jsonVersion = JSON.parse(readFileSync(new URL('version.json', root), 'utf8')).version;
ok(/^\d{4}\.\d{2}\.\d{2}\.\d{4}$/.test(APP_VERSION) && jsonVersion === APP_VERSION, `Versão: version.json e js/version.js têm o mesmo valor (${APP_VERSION})`);
ok((await U.fetchLatestVersion(fakeFetch('9.9'))) === '9.9' && fakeFetch.calls[0].url === 'version.json' && fakeFetch.calls[0].opts.cache === 'no-store', 'Busca: lê o version.json sem usar cópia guardada');
ok((await U.fetchLatestVersion(fakeFetch('9.9', 404))) === null && (await U.fetchLatestVersion(fakeFetch(undefined))) === null && (await U.fetchLatestVersion(async () => { throw new Error('offline'); })) === null && (await U.fetchLatestVersion(async () => ({ ok: true, json: async () => { throw new Error('x'); } }))) === null, 'Busca: sem internet, arquivo ausente ou quebrado devolve null (sem erro)');
ok(U.hasUpdate('1', '2') && !U.hasUpdate('1', '1') && !U.hasUpdate('1', null) && !U.hasUpdate('1', ''), 'Comparação: só avisa se a versão publicada é diferente e existe');
ok((await U.checkForUpdate({ current: '1', fetchImpl: fakeFetch('2') })).status === 'new' && (await U.checkForUpdate({ current: '1', fetchImpl: fakeFetch('1') })).status === 'same' && (await U.checkForUpdate({ current: '1', fetchImpl: async () => { throw new Error(); } })).status === 'unknown', 'Verificação: nova, igual ou desconhecida');

// ---------- o aviso ----------
let reloaded = 0, later = 0;
const b = U.showUpdateBanner({ reload: () => reloaded++, onLater: () => later++ });
ok(b.getAttribute('role') === 'status' && b.getAttribute('aria-live') === 'polite' && /Versão nova disponível/.test(b.textContent) && !!b.querySelector('[data-act="reload"]') && !!b.querySelector('[data-act="later"]'), 'Aviso: anunciado com calma para leitor de tela, com "Atualizar agora" e "Depois"');
ok(U.showUpdateBanner() === b && document.querySelectorAll('.update-banner').length === 1, 'Aviso: nunca fica repetido');
b.querySelector('[data-act="reload"]').click();
ok(reloaded === 1 && !!banner(), 'Aviso: "Atualizar agora" recarrega (e só quando a pessoa clica)');
b.querySelector('[data-act="later"]').click();
ok(!banner() && later === 1, 'Aviso: "Depois" fecha');

// ---------- vigilância ----------
let t = 1000;
const common = { current: 'A', now: () => t, reload: () => {}, firstMs: 30, everyMs: 100000, snoozeMs: 400000 };
let stop = U.startUpdateCheck({ ...common, fetchImpl: fakeFetch('A') });
await wait(150);
ok(!banner(), 'Vigia: mesma versão, nada aparece');
stop();
stop = U.startUpdateCheck({ ...common, fetchImpl: fakeFetch('B') });
await wait(150);
ok(!!banner(), 'Vigia: versão nova publicada, o aviso aparece depois do primeiro intervalo');
banner().querySelector('[data-act="later"]').click();
w.document.dispatchEvent(new w.Event('visibilitychange'));
t += 200000;                                         // mais de 2 min depois
w.document.dispatchEvent(new w.Event('visibilitychange'));
await wait(60);
ok(!banner(), 'Vigia: depois de "Depois", não volta enquanto a soneca não acabar');
t += 250000;                                         // a soneca (400 s) acabou
w.document.dispatchEvent(new w.Event('visibilitychange'));
await wait(60);
ok(!!banner(), 'Vigia: passada a soneca, ao voltar para a aba avisa de novo');
banner().remove();
stop();
const calls = fakeFetch.calls.length;
w.dispatchEvent(new w.Event('online'));
w.document.dispatchEvent(new w.Event('visibilitychange'));
await wait(60);
ok(fakeFetch.calls.length === calls && !banner(), 'Vigia: depois de parar, não busca mais nada');

stop = U.startUpdateCheck({ ...common, firstMs: 100000, fetchImpl: fakeFetch('C') });
w.dispatchEvent(new w.Event('online'));
await wait(60);
ok(!!banner(), 'Vigia: quando a internet volta, confere na hora');
banner().remove(); stop();

// ---------- Perfil ----------
await auth.register('Ana', 'ana@x.com', 'segredo1');
const app = document.getElementById('app');
const cleanup = await renderProfile(app); await wait(100);
const btn = app.querySelector('[data-act="update"]');
ok(!!btn && new RegExp(`Versão do app: ${APP_VERSION.replace(/\./g, '\\.')}`).test(btn.textContent), 'Perfil: mostra a versão do app e o botão "Verificar atualização"');
cleanup?.();

// ---------- script de publicação ----------
const tmp = mkdtempSync(join(tmpdir(), 'ep-release-'));
mkdirSync(join(tmp, 'js')); mkdirSync(join(tmp, 'scripts')); mkdirSync(join(tmp, 'tests'));
cpSync(new URL('scripts/release.mjs', root), join(tmp, 'scripts/release.mjs'));
writeFileSync(join(tmp, 'version.json'), '{ "version": "velha" }\n');
writeFileSync(join(tmp, 'js/version.js'), "export const APP_VERSION = 'velha';\n");
writeFileSync(join(tmp, 'tests/run-all.mjs'), "console.log('10 verificações ok, 1 falha(s)');\n");
let r = spawnSync(process.execPath, [join(tmp, 'scripts/release.mjs')], { encoding: 'utf8' });
ok(r.status === 1 && /NÃO foi carimbada/.test(r.stderr) && JSON.parse(readFileSync(join(tmp, 'version.json'), 'utf8')).version === 'velha', 'Publicar: com teste falhando, não carimba versão e avisa');
writeFileSync(join(tmp, 'tests/run-all.mjs'), "console.log('10 verificações ok, 0 falha(s)');\n");
r = spawnSync(process.execPath, [join(tmp, 'scripts/release.mjs')], { encoding: 'utf8' });
const stamped = JSON.parse(readFileSync(join(tmp, 'version.json'), 'utf8')).version;
ok(r.status === 0 && /^\d{4}\.\d{2}\.\d{2}\.\d{4}$/.test(stamped) && readFileSync(join(tmp, 'js/version.js'), 'utf8').includes(`'${stamped}'`), `Publicar: com tudo passando, carimba a mesma versão nos dois arquivos (${stamped})`);
ok(/git push/.test(r.stdout) && JSON.parse(readFileSync(new URL('package.json', root), 'utf8')).scripts.release === 'node scripts/release.mjs', 'Publicar: mostra o próximo passo (git push) e existe o comando "npm run release"');
