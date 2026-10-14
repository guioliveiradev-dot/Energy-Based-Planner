// Temas, pets e inventário da loja.
// As cores de cada tema estão em css/style.css ([data-theme="..."]).
// O inventário, tema ativo e pet ativo ficam no localStorage, como no original.

export const SHOP_THEMES = [
  { id: 'sunset',   name: 'Pôr do Sol',      cost: 800,   type: 'theme', preview: 'linear-gradient(135deg, hsl(20 100% 55%), hsl(340 100% 60%))' },
  { id: 'forest',   name: 'Floresta',        cost: 800,   type: 'theme', preview: 'linear-gradient(135deg, hsl(150 80% 40%), hsl(90 60% 45%))' },
  { id: 'ocean',    name: 'Oceano Profundo', cost: 800,   type: 'theme', preview: 'linear-gradient(135deg, hsl(200 100% 50%), hsl(240 70% 60%))' },
  { id: 'midnight', name: 'Meia-Noite',      cost: 1500,  type: 'theme', preview: 'linear-gradient(135deg, hsl(250 60% 25%), hsl(280 50% 40%))' },
  { id: 'silver',   name: 'Prata Lunar',     cost: 5000,  type: 'theme', preview: 'linear-gradient(135deg, hsl(210 10% 65%), hsl(220 15% 45%))' },
  { id: 'gold',     name: 'Ouro Imperial',   cost: 10000, type: 'theme', preview: 'linear-gradient(135deg, hsl(43 90% 55%), hsl(30 80% 40%))' },
];

export const SHOP_PETS = [
  { id: 'cat',     name: 'Gato Cósmico',      emoji: '🐱', cost: 1000, type: 'pet', description: 'Ronrona enquanto você trabalha' },
  { id: 'dog',     name: 'Cão Guardião',      emoji: '🐶', cost: 1000, type: 'pet', description: 'Te encoraja a continuar' },
  { id: 'dragon',  name: 'Dragão Neon',       emoji: '🐉', cost: 1500, type: 'pet', description: 'Cospe fogo de motivação' },
  { id: 'phoenix', name: 'Fênix Estelar',     emoji: '🦅', cost: 2000, type: 'pet', description: 'Renasce das cinzas com você' },
  { id: 'robot',   name: 'Robô Quântico',     emoji: '🤖', cost: 2000, type: 'pet', description: 'Calcula seu sucesso' },
  { id: 'unicorn', name: 'Unicórnio Mágico',  emoji: '🦄', cost: 2500, type: 'pet', description: 'Espalha magia e arco-íris' },
];

const key = (userId, name) => `energy-planner-${name}-${userId}`;

export function getInventory(userId) {
  try {
    return JSON.parse(localStorage.getItem(key(userId, 'inventory')) || '[]');
  } catch {
    return [];
  }
}

export function addToInventory(userId, itemId) {
  const inv = getInventory(userId);
  if (!inv.includes(itemId)) {
    inv.push(itemId);
    localStorage.setItem(key(userId, 'inventory'), JSON.stringify(inv));
  }
}

export function getActiveTheme(userId) {
  return localStorage.getItem(key(userId, 'theme')) || 'default';
}

export function setActiveThemeStorage(userId, themeId) {
  localStorage.setItem(key(userId, 'theme'), themeId);
  applyTheme(themeId);
}

export function getActivePet(userId) {
  return localStorage.getItem(key(userId, 'pet')) || null;
}

export function setActivePetStorage(userId, petId) {
  if (petId) localStorage.setItem(key(userId, 'pet'), petId);
  else localStorage.removeItem(key(userId, 'pet'));
}

export function applyTheme(themeId) {
  if (themeId === 'default') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', themeId);
}

export function clearUserInventory(userId) {
  localStorage.removeItem(key(userId, 'inventory'));
  localStorage.removeItem(key(userId, 'theme'));
  localStorage.removeItem(key(userId, 'pet'));
  applyTheme('default');
}
