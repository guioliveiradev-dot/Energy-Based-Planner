// Funções de apoio para a interface.

// Sempre use escapeHtml ao colocar texto do usuário dentro de innerHTML.
export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// type: 'info' | 'success' | 'error'
// action (opcional): { label: 'Desfazer', onClick: () => ... }  -> mostra um botão no aviso
export function toast(message, type = 'info', duration, action) {
  const host = document.getElementById('toasts');
  if (!host) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const text = document.createElement('span');
  text.textContent = message;
  el.appendChild(text);
  if (action) {
    el.classList.add('has-action');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast-action';
    btn.textContent = action.label;
    btn.addEventListener('click', () => { el.remove(); action.onClick(); });
    el.appendChild(btn);
  }
  host.appendChild(el);
  setTimeout(() => el.remove(), duration ?? (action ? 6000 : 3000));
}

export const spinnerHTML = '<div class="screen-center"><div class="spinner" role="status" aria-label="Carregando"></div></div>';

// 90 -> "1h 30min", 30 -> "30min", 120 -> "2h"
export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h > 0 ? `${h}h` : ''}${h > 0 && m > 0 ? ' ' : ''}${m > 0 || h === 0 ? `${m}min` : ''}`;
}

// "dd/MM/yyyy HH:mm"
export function formatDateTime(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
