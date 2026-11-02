// Categorias de tarefa (as cores estão no CSS: .category-work, .category-study, ...).
import { icon } from './icons.js';

export const CATEGORY_LABELS = {
  work: 'Trabalho', study: 'Estudo', personal: 'Pessoal', health: 'Saúde',
  finance: 'Finanças', leisure: 'Lazer', social: 'Social', creative: 'Criativo',
};
// Ícones do app (js/icons.js), no lugar de emoji.
export const CATEGORY_ICON = {
  work: 'briefcase', study: 'book-open', personal: 'home', health: 'dumbbell',
  finance: 'wallet', leisure: 'gamepad-2', social: 'users', creative: 'palette',
};
export function categoryIcon(id, size = 14) {
  return CATEGORY_ICON[id] ? icon(CATEGORY_ICON[id], size, 'ico') : '';
}
