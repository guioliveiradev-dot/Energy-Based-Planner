// Comemoração do app: fagulhas de luz que sobem e se apagam, um anel que se abre e um brilho suave no fundo.
// Tudo em CSS e DOM, sem imagens e sem bibliotecas externas (funciona offline) e com as cores do tema (--accent).
// Combina com a Fagulha: é a "faísca" do app, em vez de papel colorido caindo.
//
// kind:  'task' (concluir tarefa) | 'level' (pet subiu de nível) | 'achievement' (conquista) | 'reward' (compra e resgate)
// Quem pediu "menos movimento" no sistema não vê nada (a janela de comemoração continua funcionando).

export const CELEBRATE_MS = 3400;

const PRESETS = {
  task: { sparks: 14, spread: 150, ring: true },
  level: { sparks: 22, spread: 210, ring: true },
  achievement: { sparks: 18, spread: 190, ring: true },
  reward: { sparks: 10, spread: 130, ring: false },
};

const between = (rng, a, b) => a + rng() * (b - a);

// origin: posição do centro da comemoração em frações da tela (0 a 1). Devolve o elemento, ou null se não animou.
export function celebrate(kind = 'task', { origin = { x: 0.5, y: 0.55 }, rng = Math.random, duration = CELEBRATE_MS } = {}) {
  if (typeof document === 'undefined') return null;
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  const preset = PRESETS[kind] || PRESETS.task;

  const layer = document.createElement('div');
  layer.className = 'celebrate-layer';
  layer.setAttribute('aria-hidden', 'true');
  layer.style.setProperty('--ox', `${origin.x * 100}%`);
  layer.style.setProperty('--oy', `${origin.y * 100}%`);

  let html = '<div class="celebrate-glow"></div>';
  if (preset.ring) html += '<div class="celebrate-ring"></div>';
  for (let i = 0; i < preset.sparks; i++) {
    const size = between(rng, 6, 15).toFixed(1);
    const vars = [
      `--x:${between(rng, -preset.spread, preset.spread).toFixed(0)}px`,
      `--dx:${between(rng, -45, 45).toFixed(0)}px`,
      `--rise:${between(rng, 110, 340).toFixed(0)}px`,
      `--size:${size}px`,
      `--dur:${between(rng, 1.8, 2.9).toFixed(2)}s`,
      `--delay:${between(rng, 0, 0.75).toFixed(2)}s`,
    ].join(';');
    html += `<span class="celebrate-spark${i % 3 === 0 ? ' soft' : ''}" style="${vars}"></span>`;
  }
  layer.innerHTML = html;
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), duration);
  return layer;
}
