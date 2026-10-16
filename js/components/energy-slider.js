// Slider de nível de energia (1 a 10). Porte de EnergySlider.tsx.

import { icon } from '../icons.js';

export function getEnergyConfig(value) {
  if (value <= 3) return { color: 'hsl(var(--energy-low))',   colorDim: 'hsl(var(--energy-low) / 0.3)',   label: '⚡ Exausto', iconName: 'battery-low' };
  if (value <= 7) return { color: 'hsl(var(--energy-mid))', colorDim: 'hsl(var(--energy-mid) / 0.3)', label: '⚡ Bem',     iconName: 'battery-medium' };
  return            { color: 'hsl(var(--energy-high))', colorDim: 'hsl(var(--energy-high) / 0.3)', label: '⚡ Focado!', iconName: 'battery-full' };
}

export function createEnergySlider({ value = 5, onChange = () => {} } = {}) {
  const el = document.createElement('div');
  el.className = 'stack';
  el.innerHTML = `
    <div class="row-between">
      <div class="row">
        <span data-role="icon"></span>
        <span class="text-medium">Nível de Energia</span>
      </div>
      <div class="row" style="gap:0.375rem;align-items:baseline">
        <span data-role="value" class="energy-value"></span>
        <span class="muted xs">/ 10</span>
      </div>
    </div>
    <input class="energy-slider" type="range" min="1" max="10" step="1" aria-label="Nível de energia">
    <p class="center xs energy-label" data-role="label"></p>`;

  const input = el.querySelector('input');
  const iconSlot = el.querySelector('[data-role="icon"]');
  const valueEl = el.querySelector('[data-role="value"]');
  const labelEl = el.querySelector('[data-role="label"]');

  function paint(v) {
    const { color, colorDim, label, iconName } = getEnergyConfig(v);
    iconSlot.innerHTML = icon(iconName, 20);
    iconSlot.style.color = color;
    valueEl.textContent = v;
    valueEl.style.color = color;
    valueEl.style.textShadow = `0 0 10px ${color}`;
    labelEl.textContent = label;
    labelEl.style.color = color;
    input.value = v;
    input.setAttribute('aria-valuetext', `${v} de 10, ${label.replace('⚡', '').trim()}`);
    input.style.setProperty('--energy-color', color);
    input.style.setProperty('--energy-color-dim', colorDim);
    input.style.setProperty('--energy-percent', `${((v - 1) / 9) * 100}%`);
  }

  input.addEventListener('input', () => {
    const v = Number(input.value);
    paint(v);
    onChange(v);
  });

  paint(value);
  return el;
}

// Selo com raios de acordo com o custo de energia (usado nas tarefas).
export function energyBadge(cost) {
  const { color } = getEnergyConfig(cost);
  const bolts = Math.ceil(cost / 3);
  return `<span class="energy-badge" style="color:${color}">${'⚡'.repeat(bolts)} ${cost}</span>`;
}
