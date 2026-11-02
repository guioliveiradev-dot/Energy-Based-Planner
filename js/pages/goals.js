// Página Metas: meta da semana, sequência de dias (com os 7 últimos dias) e desafios da semana.
import * as auth from '../auth.js';
import { mountGoals } from '../components/goal-cards.js';
import { onDataChanged } from '../events.js';

export async function renderGoals(container) {
  const user = auth.state.user;
  container.innerHTML = `
    <section class="page">
      <h1 class="page-title">Metas</h1>
      <div id="goals-slot"></div>
    </section>`;
  const slot = container.querySelector('#goals-slot');
  const show = () => mountGoals(slot, { userId: user.id, awardXP: auth.addXP, withChallenges: true, withStreak: true });
  await show();
  // Quando o painel admin (ou outra parte) muda tarefas ou sequência, a página se atualiza sozinha
  return onDataChanged(() => { show().catch((e) => console.error(e)); });
}
