// Roteador por hash (#/tasks). Funciona em qualquer hospedagem estática.
// Cada página exporta: async function render(container) { ... return cleanup?; }

let routes = {};
let fallback = '/';
let outlet = null;
let onChange = () => {};
let cleanup = null;
let renderId = 0;
let onRendered = () => {};
let firstRender = true;

export const currentPath = () => location.hash.replace(/^#/, '') || '/';
export const navigate = (path) => { location.hash = '#' + path; };

async function renderCurrent() {
  const id = ++renderId;
  let path = currentPath();
  if (!routes[path]) path = fallback;

  if (typeof cleanup === 'function') cleanup();
  cleanup = null;
  outlet.innerHTML = '';
  onChange(path);

  const result = await routes[path](outlet);
  // Se o usuário trocou de página enquanto esta carregava, descarta.
  if (id !== renderId) { if (typeof result === 'function') result(); return; }
  cleanup = result;
  onRendered(path, firstRender);
  firstRender = false;
}

export function startRouter({ routes: map, fallback: fb = '/', outlet: el, onChange: cb, onRendered: done }) {
  routes = map;
  fallback = fb;
  outlet = el;
  onChange = cb || (() => {});
  onRendered = done || (() => {});
  firstRender = true;
  window.addEventListener('hashchange', renderCurrent);
  renderCurrent();
}

export function stopRouter() {
  window.removeEventListener('hashchange', renderCurrent);
  if (typeof cleanup === 'function') cleanup();
  cleanup = null;
  renderId++;
}
