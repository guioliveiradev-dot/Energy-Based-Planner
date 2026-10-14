// Confete (biblioteca canvas-confetti, carregada por <script> no index.html).
// Se a biblioteca não tiver carregado, não faz nada.
export function confettiBurst(options) {
  if (typeof window.confetti === 'function') window.confetti(options);
}
