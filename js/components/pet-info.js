// Descrição do que cada pet faz (usada na Loja e no Inventário): explicação + o poder em cada nível de vínculo.
import { PET_POWERS, powerHow, powerLevels } from '../pet-powers.js';
import { BOND_THRESHOLDS } from '../pets.js';
import { ALL_PETS } from '../themes.js';

// level: nível de vínculo atual (destaca a linha); 0 = não destacar (Loja).
// variant: 'footer' = rodapé dentro do cartão (Loja); 'attached' = cartão colado embaixo do botão do pet (Inventário).
export function petInfoHTML(petId, level = 0, variant = 'footer') {
  if (!PET_POWERS[petId]) return '';
  const name = ALL_PETS.find((p) => p.id === petId)?.name ?? 'o pet';
  const rows = powerLevels(petId).map((text, i) =>
    `<li${level === i + 1 ? ' aria-current="true" class="current"' : ''}>Nível ${i + 1} (${BOND_THRESHOLDS[i]} tarefas): ${text}</li>`).join('');
  const cls = variant === 'attached' ? 'pet-info pet-info-attached glass-card' : 'pet-info pet-info-footer';
  return `<details class="${cls}"><summary aria-label="Detalhes do poder de ${name}">Detalhes do poder</summary>
    <p class="small">${powerHow(petId)}</p>
    <p class="muted xs">O vínculo sobe 1 a cada tarefa concluída com ele ativo e nunca diminui.</p>
    <ol class="xs">${rows}</ol></details>`;
}
