// Comemoração de quando o pet sobe de nível de vínculo: pet animado, brilhos, nome do nível e o poder novo.
// A Fagulha, quando muda de forma (Faísca, Chama, Aura), "evolui" na tela.

import { createModal } from './modal.js';
import { petFaceHTML, bondLevel, MAX_BOND_LEVEL } from '../pets.js';
import { ALL_PETS } from '../themes.js';
import { PET_POWERS, levelText } from '../pet-powers.js';
import { fagulhaStage, FAGULHA_STAGE_NAMES } from '../pet-art.js';
import { escapeHtml } from '../ui.js';
import { celebrate } from '../celebrate.js';

// result: { petId, before, after } (vínculo em tarefas). Devolve null se o nível não subiu.
export function levelUpInfo(result) {
  const pet = result && ALL_PETS.find((p) => p.id === result.petId);
  if (!pet) return null;
  const from = bondLevel(result.before), to = bondLevel(result.after);
  if (to <= from) return null;
  const formChanged = pet.id === 'fagulha' && fagulhaStage(from) !== fagulhaStage(to);
  return {
    pet, from, to, before: result.before, after: result.after, formChanged,
    form: pet.id === 'fagulha' ? FAGULHA_STAGE_NAMES[fagulhaStage(to)] : null,
    power: PET_POWERS[pet.id] ? levelText(pet.id, to) : null,
  };
}

const SPARKS = [[-70, -50], [70, -55], [-85, 5], [85, 0], [-45, 60], [50, 62]];

// Bloco da comemoração (usado na janela própria e dentro da janela de parabéns).
// Para a Fagulha que vai mudar de forma, mostra a forma antiga primeiro (a troca acontece em showPetLevelUp).
export function petLevelUpHTML(info, { size = 112, evolving = false } = {}) {
  const bond = evolving ? info.before : info.after;
  const name = escapeHtml(info.pet.name);
  const notes = [];
  if (info.formChanged) notes.push(`Nova forma: agora é ${escapeHtml(info.form)}!`);
  if (info.to >= MAX_BOND_LEVEL) notes.push('O vínculo chegou ao nível máximo!');
  if (notes.length === 0) notes.push('O vínculo de vocês ficou mais forte.');
  return `
    <div class="levelup-stage">
      ${SPARKS.map(([dx, dy], i) => `<span class="levelup-spark" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${i * 0.18}s" aria-hidden="true"></span>`).join('')}
      <span class="levelup-pet" data-role="pet">${petFaceHTML(info.pet, { bond, pose: 'cheer', size })}</span>
    </div>
    <p class="levelup-badge">Nível ${info.to}</p>
    <h2 class="modal-title levelup-title">${name} subiu para o nível ${info.to}!</h2>
    <p class="small muted">${notes.join(' ')}</p>
    ${info.power ? `<p class="levelup-power small">${escapeHtml(PET_POWERS[info.pet.id].title)}: ${escapeHtml(info.power)}</p>` : ''}`;
}

// Abre a janela de comemoração. Devolve a janela, ou null se o nível não subiu.
export function showPetLevelUp(result) {
  const info = levelUpInfo(result);
  if (!info) return null;
  const modal = createModal({ className: 'levelup-panel neon-glow', overlayClass: 'soft' });
  const render = (evolving) => `${petLevelUpHTML(info, { evolving })}
    <div class="sr-only" role="status">${escapeHtml(info.pet.name)} subiu para o nível ${info.to} de vínculo.</div>
    <button class="btn-neon btn-block" data-role="ok" style="margin-top:0.75rem">Continuar</button>`;
  modal.panel.innerHTML = render(info.formChanged);
  const bind = () => modal.panel.querySelector('[data-role="ok"]').addEventListener('click', () => modal.close());
  bind();
  modal.open();
  modal.panel.querySelector('[data-role="ok"]').focus();
  celebrate('level', { origin: { x: 0.5, y: 0.42 } });
  if (info.formChanged) {   // a Fagulha evolui: troca a forma antiga pela nova depois de um instante
    setTimeout(() => {
      if (!modal.isOpen) return;
      const pet = modal.panel.querySelector('[data-role="pet"]');
      pet.innerHTML = petFaceHTML(info.pet, { bond: info.after, pose: 'cheer', size: 112 });
      pet.classList.add('levelup-flash');
    }, 1100);
  }
  return modal;
}
