// Tamanho do texto: Normal, Grande e Muito grande, guardado nos ajustes e aplicado ao abrir o app.
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
globalThis.window = dom.window; globalThis.document = dom.window.document; globalThis.localStorage = dom.window.localStorage;
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA'), m); if (!c) process.exitCode = 1; };
const { TEXT_SIZES, applyTextSize, getSetting, setSetting } = await import('../js/settings.js');
const fs = () => document.documentElement.style.fontSize;

ok(TEXT_SIZES.map((t) => t.id).join() === 'normal,large,xlarge', 'Três tamanhos: normal, grande, muito grande');
ok(TEXT_SIZES.map((t) => t.percent).join() === '100,115,130', 'Porcentagens 100, 115 e 130');
applyTextSize(); ok(fs() === '100%', 'Sem escolha, fica normal');
applyTextSize('large'); ok(fs() === '115%', 'Grande aplica 115%');
applyTextSize('xlarge'); ok(fs() === '130%', 'Muito grande aplica 130%');
ok(applyTextSize('lixo') === 'normal' && fs() === '100%', 'Valor desconhecido volta para normal');
if (typeof setSetting === 'function') { setSetting('textSize', 'large'); ok(getSetting('textSize') === 'large', 'A escolha fica guardada'); applyTextSize(); ok(fs() === '115%', 'Ao abrir, aplica o que foi guardado'); }

const read = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
ok(/applyTextSize\(\)/.test(read('../js/app.js')), 'O app aplica o tamanho ao abrir');
const menu = read('../js/components/settings-menu.js');
ok(/data-text-size/.test(menu) && /Tamanho do texto/.test(menu), 'O menu de configurações tem o controle "Tamanho do texto"');
ok(!/font-size:\s*[\d.]+px/.test(read('../css/style.css')), 'Nenhuma fonte em px (só rem), para o tamanho valer em tudo');
ok(/\.tabs-4\s*\{[^}]*minmax\(0,\s*1fr\)/.test(read('../css/style.css')), 'As 4 abas da Loja não estouram a tela');
