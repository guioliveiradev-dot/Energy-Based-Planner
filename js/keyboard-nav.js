// Setas do teclado em abas e filtros (padrão "roving tabindex").
// Marque o grupo com data-roving="tabs" (as setas trocam de aba) ou data-roving="buttons"
// (as setas só movem o foco, como nos filtros). A tecla Tab entra no grupo uma vez só,
// parando no item ativo; Home e End vão para o primeiro e o último.
// Chame enableArrowNav(elemento) uma vez num elemento que fica na tela; ele cuida dos grupos
// que aparecerem ou forem redesenhados dentro dele.

const ITEM = 'button:not([disabled]):not([hidden])';
const isOn = (b) => b.getAttribute('aria-selected') === 'true' || b.getAttribute('aria-pressed') === 'true' || b.classList.contains('active');

function sync(root) {
  root.querySelectorAll('[data-roving]').forEach((group) => {
    const items = [...group.querySelectorAll(ITEM)];
    const stop = items.find(isOn) || items[0];
    items.forEach((b) => b.setAttribute('tabindex', b === stop ? '0' : '-1'));
  });
}

export function enableArrowNav(root) {
  if (!root) return () => {};
  const onKey = (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const group = e.target.closest?.('[data-roving]');
    if (!group || !root.contains(group)) return;
    const items = [...group.querySelectorAll(ITEM)];
    const i = items.indexOf(e.target.closest(ITEM));
    if (i < 0) return;
    let next = null;
    if (e.key === 'ArrowRight') next = items[(i + 1) % items.length];
    else if (e.key === 'ArrowLeft') next = items[(i - 1 + items.length) % items.length];
    else if (e.key === 'Home') next = items[0];
    else if (e.key === 'End') next = items[items.length - 1];
    if (!next) return;
    e.preventDefault();
    if (group.dataset.roving === 'tabs' && next !== items[i]) next.click();   // abas: a seta já abre a aba
    if (next.isConnected) next.focus();   // se a tela redesenhou as abas, ela mesma devolve o foco
  };
  root.addEventListener('keydown', onKey);
  const mo = new MutationObserver(() => sync(root));
  mo.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'aria-selected', 'aria-pressed', 'hidden'] });
  sync(root);
  return () => { root.removeEventListener('keydown', onKey); mo.disconnect(); };
}
