// Temas, pets e inventário da loja.
// As cores de cada tema estão em css/style.css ([data-theme="..."]).
// Papel (claro) e Grafite (escuro) são gratuitos e sempre aparecem no Perfil.
// O visual antigo do app virou o tema "Neon (clássico)", vendido na Loja (as variáveis dele ficam em :root).
// O inventário, tema ativo e pet ativo ficam no localStorage, como no original.

export const DEFAULT_THEME = 'papel';

export const FREE_THEMES = [
  { id: 'papel',   name: 'Papel (claro)',    type: 'theme', preview: 'linear-gradient(135deg, #F7F6F2 50%, #1C1A19 50%)' },
  { id: 'grafite', name: 'Grafite (escuro)', type: 'theme', preview: 'linear-gradient(135deg, #100E0C 50%, #EFEDE9 50%)' },
];

export const SHOP_THEMES = [
  { id: 'sunset',   name: 'Pôr do Sol',      cost: 800,   type: 'theme', preview: 'linear-gradient(135deg, hsl(20 100% 55%), hsl(340 100% 60%))' },
  { id: 'forest',   name: 'Floresta',        cost: 800,   type: 'theme', preview: 'linear-gradient(135deg, hsl(150 80% 40%), hsl(90 60% 45%))' },
  { id: 'ocean',    name: 'Oceano Profundo', cost: 800,   type: 'theme', preview: 'linear-gradient(135deg, hsl(200 100% 50%), hsl(240 70% 60%))' },
  { id: 'midnight', name: 'Meia-Noite',      cost: 1500,  type: 'theme', preview: 'linear-gradient(135deg, hsl(250 60% 25%), hsl(280 50% 40%))' },
  { id: 'neon',     name: 'Neon (clássico)', cost: 3500,  type: 'theme', preview: 'linear-gradient(135deg, hsl(190 100% 50%), hsl(265 100% 68%))' },
  { id: 'silver',   name: 'Prata Lunar',     cost: 5000,  type: 'theme', preview: 'linear-gradient(135deg, hsl(210 10% 65%), hsl(220 15% 45%))' },
  { id: 'gold',     name: 'Ouro Imperial',   cost: 10000, type: 'theme', preview: 'linear-gradient(135deg, hsl(43 90% 55%), hsl(30 80% 40%))' },
];

// Pet inicial: de graça para todos, não aparece na Loja. Desenhada em SVG (js/pet-art.js).
export const DEFAULT_PET = 'fagulha';
export const FREE_PETS = [
  { id: 'fagulha', name: 'Fagulha', emoji: '🔥', cost: 0, type: 'pet', free: true, description: 'O espírito da sua logo: medita com você e cresce com o vínculo' },
];

export const SHOP_PETS = [
  { id: 'cat',     name: 'Gato Cósmico',      emoji: '🐱', cost: 500, type: 'pet', description: 'Ronrona enquanto você trabalha' },
  { id: 'dragon',  name: 'Dragão Neon',       emoji: '🐉', cost: 500, type: 'pet', description: 'Cospe fogo de motivação' },
  { id: 'unicorn', name: 'Unicórnio Mágico',  emoji: '🦄', cost: 500, type: 'pet', description: 'Espalha magia e arco-íris' },
  { id: 'robot',   name: 'Robô Quântico',     emoji: '🤖', cost: 500, type: 'pet', description: 'Calcula seu sucesso' },
  { id: 'dog',     name: 'Cão Guardião',      emoji: '🐶', cost: 800, type: 'pet', description: 'Te encoraja a continuar' },
  { id: 'phoenix', name: 'Fênix Estelar',     emoji: '🦅', cost: 1000, type: 'pet', description: 'Renasce das cinzas com você' },
];

export const ALL_PETS = [...FREE_PETS, ...SHOP_PETS];

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

const KNOWN_THEMES = () => [...FREE_THEMES, ...SHOP_THEMES].map((t) => t.id);

// Tema do usuário. Sem escolha (ou com o antigo 'default') cai no Papel.
export function getActiveTheme(userId) {
  const saved = localStorage.getItem(key(userId, 'theme'));
  return KNOWN_THEMES().includes(saved) ? saved : DEFAULT_THEME;
}

// Último tema aplicado neste aparelho: é o que a tela de login mostra antes de entrar.
export function getLastTheme() {
  const saved = localStorage.getItem('energy-planner-last-theme');
  return KNOWN_THEMES().includes(saved) ? saved : DEFAULT_THEME;
}

// Quem já tinha conta antes desta versão usava o visual neon. Para ninguém perder esse visual,
// ele entra de graça no inventário (uma vez). O tema ativo passa para o Papel.
const NEON_GIFT_BEFORE = Date.UTC(2026, 9, 16);
export function migrateThemes(user) {
  const flag = key(user.id, 'themes-v2');
  if (localStorage.getItem(flag)) return;
  localStorage.setItem(flag, '1');
  if ((user.createdAt || 0) < NEON_GIFT_BEFORE) addToInventory(user.id, 'neon');
  if (localStorage.getItem(key(user.id, 'theme')) === 'default') localStorage.removeItem(key(user.id, 'theme'));
}

export function setActiveThemeStorage(userId, themeId) {
  localStorage.setItem(key(userId, 'theme'), themeId);
  applyTheme(themeId);
}

// Pet ativo. Sem escolha, é a Fagulha. "Nenhum pet" fica gravado como 'none'.
export function getActivePet(userId) {
  const saved = localStorage.getItem(key(userId, 'pet'));
  if (saved === 'none') return null;
  return ALL_PETS.some((p) => p.id === saved) ? saved : DEFAULT_PET;
}

export function setActivePetStorage(userId, petId) {
  localStorage.setItem(key(userId, 'pet'), petId || 'none');
}

// remember: false não grava como "último tema" (usado pelo guia de estilo).
export function applyTheme(themeId, { remember = true } = {}) {
  const id = KNOWN_THEMES().includes(themeId) ? themeId : DEFAULT_THEME;
  const root = document.documentElement;
  root.setAttribute('data-theme', id);
  if (!remember) return;
  try { localStorage.setItem('energy-planner-last-theme', id); } catch { /* sem armazenamento */ }
  try {   // cor da barra do navegador acompanha o fundo do tema
    const bg = getComputedStyle(root).getPropertyValue('--background').trim();
    if (bg) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', `hsl(${bg})`);
  } catch { /* sem estilo calculado */ }
}

export function clearUserInventory(userId) {
  localStorage.removeItem(key(userId, 'inventory'));
  localStorage.removeItem(key(userId, 'theme'));
  localStorage.removeItem(key(userId, 'pet'));
  applyTheme(DEFAULT_THEME);
}
