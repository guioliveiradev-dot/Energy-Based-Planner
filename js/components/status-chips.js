// Faixa de situação da Home: 3 atalhos pequenos (nível, sequência de dias e pontos). O detalhe fica em Perfil, Metas e Loja.
import { icon } from '../icons.js';

export const fmtPoints = (n) => Number(n || 0).toLocaleString('pt-BR');

export function statusChipsHTML({ level, streak, xp }) {
  const dias = streak.current === 1 ? 'dia' : 'dias';
  return `<div class="chips-row">
    <a class="status-chip lvl" href="#/profile" aria-label="Nível ${level.level}, ${level.title}. Abrir o Perfil">${icon('trophy', 18, 'ico')}<span><span class="v">Nv ${level.level}</span><br><span class="l">${level.title}</span></span></a>
    <a class="status-chip ${streak.alive ? 'warm' : ''}" href="#/goals" aria-label="Sequência de ${streak.current} ${dias}. Abrir Metas">${icon('flame', 18, 'ico')}<span><span class="v">${streak.current}</span><br><span class="l">${dias}</span></span></a>
    <a class="status-chip pts" href="#/shop" aria-label="Pontos Planner. Abrir a Loja">${icon('sparkles', 18, 'ico')}<span><span class="v" id="xp">${fmtPoints(xp)}</span><br><span class="l">pontos</span></span></a>
  </div>`;
}
