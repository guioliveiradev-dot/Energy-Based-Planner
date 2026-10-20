// Guia de estilo (styleguide.html): mostra os componentes reais em todos os temas
// e calcula o contraste de cada par de cores. Não faz parte do app: só ajuda a revisar o visual.

import { FREE_THEMES, SHOP_THEMES, applyTheme as applyAndRemember } from './themes.js';

// O guia não pode mudar o "último tema" do app (ele guarda no mesmo navegador).
const applyTheme = (id) => applyAndRemember(id, { remember: false });
import { CATEGORY_LABELS } from './categories.js';
import { icon } from './icons.js';
import { toast } from './ui.js';
import { createModal } from './components/modal.js';
import { progressCardHTML } from './components/progress-card.js';
import { levelInfo, streakInfo } from './progress.js';
import { celebrate } from './celebrate.js';
import { showCongratsModal } from './components/congrats-modal.js';
import { hslToRgb, contrast } from './contrast.js';

const THEMES = [...FREE_THEMES, ...SHOP_THEMES].map((t) => ({ id: t.id, name: t.name }));
const SOLID_CARD = ['papel', 'grafite'];   // nestes temas o cartão é sólido; nos outros é 60% sobre o fundo
const root = document.documentElement;

const blend = (top, bottom, alpha) => top.map((c, i) => c * alpha + bottom[i] * (1 - alpha));

const VARS = ['background', 'foreground', 'card', 'primary', 'primary-foreground', 'accent', 'accent-foreground',
  'secondary', 'muted', 'muted-foreground', 'destructive', 'destructive-foreground', 'success', 'warning', 'border',
  'energy-low', 'energy-mid', 'energy-high'];
const readVars = () => {
  const cs = getComputedStyle(root);
  return Object.fromEntries(VARS.map((v) => [v, cs.getPropertyValue(`--${v}`).trim()]));
};

const PAIRS = [
  ['Texto no fundo', (c) => [c.foreground, c.background]],
  ['Texto secundário no fundo', (c) => [c['muted-foreground'], c.background]],
  ['Texto no cartão', (c) => [c.foreground, 'card']],
  ['Texto secundário no cartão', (c) => [c['muted-foreground'], 'card']],
  ['Texto do botão principal', (c) => [c['primary-foreground'], c.primary]],
  ['Cor primária como texto (cartão)', (c) => [c.primary, 'card']],
  ['Cor de destaque como texto (cartão)', (c) => [c.accent, 'card']],
  ['Texto sobre destaque', (c) => [c['accent-foreground'], c.accent]],
  ['Sucesso como texto (cartão)', (c) => [c.success, 'card']],
  ['Atenção como texto (cartão)', (c) => [c.warning, 'card']],
  ['Erro como texto (cartão)', (c) => [c.destructive, 'card']],
  ['Energia baixa como texto (cartão)', (c) => [c['energy-low'], 'card']],
  ['Energia média como texto (cartão)', (c) => [c['energy-mid'], 'card']],
  ['Energia alta como texto (cartão)', (c) => [c['energy-high'], 'card']],
];

function ratio(vars, make, solid) {
  const bg = hslToRgb(vars.background);
  const cardBg = blend(hslToRgb(vars.card), bg, solid ? 1 : 0.6);
  const [fg, back] = make(vars);
  return contrast(hslToRgb(fg), back === 'card' ? cardBg : hslToRgb(back));
}

function buildContrastTable() {
  const original = root.getAttribute('data-theme');
  const perTheme = THEMES.map((t) => {
    applyTheme(t.id);
    return { ...t, vars: readVars() };
  });
  applyTheme(original || 'papel');
  const head = `<thead><tr><th scope="col">Par de cores</th>${perTheme.map((t) => `<th scope="col">${t.name}</th>`).join('')}</tr></thead>`;
  const body = PAIRS.map(([label, make]) => `<tr><th scope="row">${label}</th>${perTheme.map((t) => {
    const r = ratio(t.vars, make, SOLID_CARD.includes(t.id));
    return r >= 4.5 ? `<td>${r.toFixed(1)} ✓</td>` : `<td class="fail">${r.toFixed(1)} ✗</td>`;
  }).join('')}</tr>`).join('');
  document.getElementById('contrast').innerHTML = `${head}<tbody>${body}</tbody>`;
}

// ---------- amostras de cor do tema atual ----------
function renderSwatches() {
  const vars = readVars();
  document.getElementById('swatches').innerHTML = VARS.map((v) => `
    <div class="sg-swatch"><i style="background:hsl(${vars[v]})"></i><span>--${v}<br>${vars[v]}</span></div>`).join('');
}

// ---------- seletor de tema ----------
function renderThemes(active) {
  const host = document.getElementById('themes');
  host.innerHTML = THEMES.map((t) => `<button type="button" class="chip ${t.id === active ? 'active' : ''}" data-theme-id="${t.id}" aria-pressed="${t.id === active}">${t.name}</button>`).join('');
}

function setTheme(id, keepFocus = false) {
  applyTheme(id);
  renderThemes(id);
  renderSwatches();
  if (keepFocus) document.querySelector(`#themes [data-theme-id="${id}"]`)?.focus();   // o teclado não perde o lugar
}

// ---------- comparar fontes dos títulos (não altera o app) ----------
const FONTS = [
  { id: 'app', name: 'Padrão do app (Space Grotesk)', value: null },
  { id: 'orbitron', name: 'Orbitron (Neon)', value: "'Orbitron', sans-serif" },
  { id: 'rajdhani', name: 'Rajdhani', value: "'Rajdhani', sans-serif" },
  { id: 'exo', name: 'Exo 2', value: "'Exo 2', sans-serif" },
  { id: 'newsreader', name: 'Newsreader (serifada)', value: "'Newsreader', Georgia, serif" },
];
function setFont(id, keepFocus = false) {
  const f = FONTS.find((x) => x.id === id) || FONTS[0];
  if (f.value) root.style.setProperty('--font-display', f.value); else root.style.removeProperty('--font-display');
  document.getElementById('fonts').innerHTML = FONTS.map((x) => `<button type="button" class="chip ${x.id === f.id ? 'active' : ''}" data-font-id="${x.id}" aria-pressed="${x.id === f.id}">${x.name}</button>`).join('');
  if (keepFocus) document.querySelector(`#fonts [data-font-id="${f.id}"]`)?.focus();
}
document.getElementById('fonts').addEventListener('click', (e) => {
  const id = e.target.closest('[data-font-id]')?.dataset.fontId;
  if (id) setFont(id, true);
});
setFont('app');

document.getElementById('themes').addEventListener('click', (e) => {
  const id = e.target.closest('[data-theme-id]')?.dataset.themeId;
  if (id) setTheme(id, true);
});

// ---------- amostras que dependem de JS ----------
document.getElementById('icon-buttons').innerHTML = `
  <button class="icon-btn primary" type="button" aria-label="Iniciar">${icon('play', 18)}</button>
  <button class="icon-btn neutral" type="button" aria-label="Editar">${icon('pencil', 18)}</button>
  <button class="icon-btn destructive" type="button" aria-label="Excluir">${icon('trash', 18)}</button>
  <button class="pill-btn primary" type="button">${icon('play', 14)} Iniciar</button>
  <button class="pill-btn success" type="button">${icon('check', 14)} Coletar</button>`;
document.getElementById('ic-card').innerHTML = icon('download', 18);
document.getElementById('categories').innerHTML = Object.entries(CATEGORY_LABELS)
  .map(([id, label]) => `<span class="badge category-${id}">${label}</span>`).join('');
document.getElementById('progress-slot').innerHTML = progressCardHTML(levelInfo(420), streakInfo([]));

document.querySelector('main').addEventListener('click', (e) => {
  if (e.target.closest('#open-congrats')) { showCongratsModal({ taskTitle: 'Tarefa de exemplo', points: 65, petBonus: { message: 'Fagulha ajudou: +5 pontos' }, streak: 4 }); return; }
  const feast = e.target.closest('[data-celebrate]')?.dataset.celebrate;
  if (feast) { celebrate(feast); return; }
  const kind = e.target.closest('[data-toast]')?.dataset.toast;
  if (kind === 'info') toast('Aviso de exemplo.');
  else if (kind === 'success') toast('Tudo certo!', 'success');
  else if (kind === 'error') toast('Algo deu errado.', 'error');
  else if (kind === 'action') toast('Item removido.', 'info', undefined, { label: 'Desfazer', onClick: () => toast('Desfeito!', 'success') });
  else if (e.target.closest('#open-modal')) {
    const modal = createModal();
    modal.panel.innerHTML = `
      <button class="modal-close" type="button" aria-label="Fechar" data-close>${icon('x', 18)}</button>
      <h2 class="modal-title">Janela de exemplo</h2>
      <div class="stack" style="padding-top:0.5rem">
        <p class="small">Esc fecha, o foco fica preso aqui dentro e volta ao botão que abriu.</p>
        <button class="btn-neon btn-block" type="button" data-close>Entendi</button>
      </div>`;
    modal.panel.addEventListener('click', (ev) => { if (ev.target.closest('[data-close]')) modal.close(); });
    modal.open();
  }
});

setTheme('papel');
buildContrastTable();
