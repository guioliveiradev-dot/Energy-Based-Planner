// Aviso de "versão nova disponível". O app olha o version.json no servidor de tempos em tempos
// (ao abrir, a cada 15 min, ao voltar para a aba e ao voltar a internet). Se for diferente da versão
// que está rodando (js/version.js), mostra um aviso calmo no topo com "Atualizar agora" e "Depois".
// Nunca recarrega sozinho: quem está no meio de algo decide quando atualizar.

import { APP_VERSION } from './version.js';

export const CHECK_EVERY_MS = 15 * 60 * 1000;
export const FIRST_CHECK_MS = 8000;
export const SNOOZE_MS = 60 * 60 * 1000;

// Versão publicada, ou null se não deu para saber (sem internet, arquivo ausente).
export async function fetchLatestVersion(fetchImpl = (...args) => fetch(...args), url = 'version.json') {
  try {
    const res = await fetchImpl(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data && typeof data.version === 'string' && data.version ? data.version : null;
  } catch { return null; }
}

export const hasUpdate = (current, latest) => !!latest && latest !== current;

// 'new' | 'same' | 'unknown'
export async function checkForUpdate({ current = APP_VERSION, fetchImpl } = {}) {
  const latest = await fetchLatestVersion(fetchImpl);
  if (latest === null) return { status: 'unknown', latest: null };
  return { status: hasUpdate(current, latest) ? 'new' : 'same', latest };
}

// Mostra o aviso (um só). onLater: chamado quando a pessoa escolhe "Depois".
export function showUpdateBanner({ reload = () => location.reload(), onLater = () => {} } = {}) {
  const existing = document.querySelector('.update-banner');
  if (existing) return existing;
  const el = document.createElement('div');
  el.className = 'update-banner';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.innerHTML = `
    <p class="small"><strong>Versão nova disponível.</strong> Atualize para ver as novidades.</p>
    <div class="update-actions">
      <button type="button" class="btn-neon btn-sm" data-act="reload">Atualizar agora</button>
      <button type="button" class="btn btn-sm" data-act="later">Depois</button>
    </div>`;
  el.querySelector('[data-act="reload"]').addEventListener('click', () => reload());
  el.querySelector('[data-act="later"]').addEventListener('click', () => { el.remove(); onLater(); });
  document.body.appendChild(el);
  return el;
}

// Começa a vigiar. Devolve a função para parar.
export function startUpdateCheck({ current = APP_VERSION, fetchImpl, firstMs = FIRST_CHECK_MS, everyMs = CHECK_EVERY_MS, snoozeMs = SNOOZE_MS, reload, now = () => Date.now(), minGapMs = 2 * 60 * 1000 } = {}) {
  let snoozedUntil = 0;
  let lastCheck = 0;
  let stopped = false;

  async function check() {
    if (stopped) return;
    lastCheck = now();
    const { status } = await checkForUpdate({ current, fetchImpl });
    if (stopped || status !== 'new' || now() < snoozedUntil) return;
    showUpdateBanner({ reload, onLater: () => { snoozedUntil = now() + snoozeMs; } });
  }

  const first = setTimeout(check, firstMs);
  const interval = setInterval(check, everyMs);
  const onVisible = () => { if (document.visibilityState === 'visible' && now() - lastCheck >= minGapMs) check(); };
  const onOnline = () => check();
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('online', onOnline);

  return () => {
    stopped = true;
    clearTimeout(first);
    clearInterval(interval);
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('online', onOnline);
  };
}
