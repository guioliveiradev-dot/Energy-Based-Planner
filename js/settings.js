// Preferências do usuário (guardadas no navegador).
// Para criar uma preferência nova: adicione em DEFAULTS e use getSetting/setSetting.

const KEY = 'energy-planner-settings';
const DEFAULTS = {
  alerts: true,   // som e vibração quando o cronômetro termina
  textSize: 'normal',   // tamanho do texto do app inteiro (veja TEXT_SIZES)
};

// Tamanho do texto: muda o tamanho base da página (tudo no CSS usa rem, então o app inteiro acompanha).
export const TEXT_SIZES = [
  { id: 'normal', label: 'Normal', percent: 100 },
  { id: 'large', label: 'Grande', percent: 115 },
  { id: 'xlarge', label: 'Muito grande', percent: 130 },
];

function readAll() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return { ...DEFAULTS }; }
}

export const getSetting = (name) => readAll()[name];

export function setSetting(name, value) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...readAll(), [name]: value })); } catch { /* sem armazenamento */ }
}

// Aplica o tamanho do texto (padrão: o que está salvo). Valor desconhecido volta para o normal.
export function applyTextSize(id = getSetting('textSize')) {
  const size = TEXT_SIZES.find((t) => t.id === id) || TEXT_SIZES[0];
  document.documentElement.style.fontSize = `${size.percent}%`;
  return size.id;
}
