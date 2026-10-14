// Janela modal acessível (substitui o Dialog do shadcn).
//  - Esc fecha (só a janela de cima) e clicar fora também
//  - o foco fica preso dentro da janela e volta ao botão que a abriu
//  - o resto do app fica "inert" (leitores de tela e teclado ignoram) enquanto ela está aberta
// onRequestClose decide o que fazer ao tentar fechar (padrão: fechar).

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let locks = 0;
let uid = 0;
const stack = [];   // janelas abertas; a última é a de cima

// Bloqueia o fundo (#app) enquanto houver alguma janela aberta. Também usado pelo Onboarding.
export function lockBackground() {
  locks++;
  document.getElementById('app')?.setAttribute('inert', '');
}
export function unlockBackground() {
  locks = Math.max(0, locks - 1);
  if (locks === 0) document.getElementById('app')?.removeAttribute('inert');
}

export function createModal({ className = '', overlayClass = '', onRequestClose } = {}) {
  const overlay = document.createElement('div');
  overlay.className = `modal-overlay ${overlayClass}`;

  const panel = document.createElement('div');
  panel.className = `modal-panel glass-card ${className}`;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.tabIndex = -1;
  overlay.appendChild(panel);

  let isOpen = false;
  let opener = null;

  const request = () => (onRequestClose ? onRequestClose() : modal.close());
  const focusables = () => [...panel.querySelectorAll(FOCUSABLE)];

  const onKey = (e) => {
    if (stack[stack.length - 1] !== modal) return;        // só a janela de cima reage
    if (e.key === 'Escape') { e.preventDefault(); request(); return; }
    if (e.key !== 'Tab') return;
    const items = focusables();
    if (items.length === 0) { e.preventDefault(); panel.focus(); return; }
    const first = items[0], last = items[items.length - 1];
    const inside = panel.contains(document.activeElement);
    if (e.shiftKey && (!inside || document.activeElement === first || document.activeElement === panel)) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
      e.preventDefault(); first.focus();
    }
  };

  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) request(); });

  const modal = {
    panel,
    get isOpen() { return isOpen; },
    open() {
      if (isOpen) return;
      opener = document.activeElement;
      document.body.appendChild(overlay);
      document.addEventListener('keydown', onKey);
      stack.push(modal);
      lockBackground();
      isOpen = true;

      const title = panel.querySelector('.modal-title, h2');
      if (title) {
        if (!title.id) title.id = `modal-title-${++uid}`;
        panel.setAttribute('aria-labelledby', title.id);
      }
      // Foco inicial: primeiro campo/botão que não seja o "fechar" (quem abriu pode mudar depois)
      const first = focusables().find((el) => !el.classList.contains('modal-close')) || panel;
      first.focus();
    },
    close() {
      if (!isOpen) return;
      overlay.remove();
      document.removeEventListener('keydown', onKey);
      const i = stack.indexOf(modal);
      if (i >= 0) stack.splice(i, 1);
      unlockBackground();
      isOpen = false;
      if (opener && opener.isConnected && typeof opener.focus === 'function') opener.focus();
      opener = null;
    },
  };
  return modal;
}
