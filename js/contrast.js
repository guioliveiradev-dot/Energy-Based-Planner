// Contraste de cores (WCAG). Usado pelo guia de estilo e pelos testes.
// As cores do app são HSL sem o "hsl()", por exemplo "222 47% 11%".

export function hslToRgb(triplet) {
  const [h, s, l] = triplet.trim().split(/\s+/).map((v) => parseFloat(v));
  const sat = s / 100, lig = l / 100;
  const k = (n) => (n + h / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}
const lin = (c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const luminance = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Pares de cor que o app usa como texto. O guia de estilo mostra a tabela e o teste 30 exige 4,5 em todos os temas.
// Cada par: [rótulo, cor do texto, cor de fundo]. "card" é o fundo do cartão (60% sobre o fundo, ou sólido no Papel e no Grafite).
export const MIN_CONTRAST = 4.5;
export const SOLID_CARD_THEMES = ['papel', 'grafite'];
export const CONTRAST_PAIRS = [
  ['Texto no fundo', 'foreground', 'background'],
  ['Texto secundário no fundo', 'muted-foreground', 'background'],
  ['Texto no cartão', 'foreground', 'card'],
  ['Texto secundário no cartão', 'muted-foreground', 'card'],
  ['Texto do botão principal', 'primary-foreground', 'primary'],
  ['Texto do botão no fim do degradê', 'primary-foreground', 'accent'],
  ['Cor primária como texto (cartão)', 'primary', 'card'],
  ['Cor de destaque como texto (cartão)', 'accent', 'card'],
  ['Texto sobre destaque', 'accent-foreground', 'accent'],
  ['Texto sobre erro', 'destructive-foreground', 'destructive'],
  ['Sucesso como texto (cartão)', 'success', 'card'],
  ['Atenção como texto (cartão)', 'warning', 'card'],
  ['Erro como texto (cartão)', 'destructive', 'card'],
  ['Energia baixa como texto (cartão)', 'energy-low', 'card'],
  ['Energia média como texto (cartão)', 'energy-mid', 'card'],
  ['Energia alta como texto (cartão)', 'energy-high', 'card'],
];
const blend = (top, bottom, alpha) => top.map((c, i) => c * alpha + bottom[i] * (1 - alpha));
// vars: as cores do tema (HSL sem "hsl()"). Devolve [{ label, ratio }] na ordem de CONTRAST_PAIRS.
export function themeContrast(vars, solidCard) {
  const bg = hslToRgb(vars.background);
  const card = blend(hslToRgb(vars.card), bg, solidCard ? 1 : 0.6);
  const on = (k) => (k === 'card' ? card : hslToRgb(vars[k]));
  return CONTRAST_PAIRS.map(([label, fg, back]) => ({ label, ratio: contrast(hslToRgb(vars[fg]), on(back)) }));
}
