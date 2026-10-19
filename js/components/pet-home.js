// Cartão do pet na Home: carinha, mensagem do dia e, para o Robô, a missão do dia.
import { petFaceHTML, bondLevel } from '../pets.js';
import { getActivePet, ALL_PETS } from '../themes.js';
import { getUserPetBonds } from '../db.js';
import { streakInfo, dayKey } from '../progress.js';
import { getStreakExtra, robotMission } from '../pet-powers.js';
import { dailyMessage } from '../pet-messages.js';
import { fagulhaStage, FAGULHA_STAGE_NAMES } from '../pet-art.js';
import { escapeHtml } from '../ui.js';

export async function mountPetHome(slot, userId, tasks, now = Date.now()) {
  const pet = ALL_PETS.find((p) => p.id === getActivePet(userId));
  if (!pet) { slot.innerHTML = ''; return; }
  const bond = ((await getUserPetBonds(userId)).find((b) => b.petId === pet.id) || { bond: 0 }).bond;
  const streak = streakInfo(tasks, now, await getStreakExtra(userId));
  const hour = new Date(now).getHours();
  const pose = streak.doneToday ? 'cheer' : hour >= 22 || hour < 5 ? 'sleep' : 'idle';
  const level = bondLevel(bond);
  const form = pet.id === 'fagulha' ? ` · ${FAGULHA_STAGE_NAMES[fagulhaStage(level)]}` : '';
  const message = dailyMessage({ hour, doneToday: streak.doneToday, streak: streak.current, seed: `${dayKey(now)}:${userId}` });
  const mission = await robotMission(userId, tasks, now);
  const missionHTML = mission ? `
    <div class="pet-mission" role="group" aria-label="Missão do dia">
      <p class="muted xs">Missão do dia</p>
      <p class="small"><strong>${escapeHtml(mission.task.title)}</strong></p>
      <p class="xs">${mission.done ? 'Missão cumprida! 🎉' : `Concluir essa tarefa dá +${mission.pct}% de pontos extras.`}</p>
      ${mission.done ? '' : '<a class="btn btn-sm" href="#/tasks">Ver em Tarefas</a>'}
    </div>` : '';
  slot.innerHTML = `
    <section class="glass-card pad stack pet-home" aria-label="${escapeHtml(pet.name)}, seu pet">
      <div class="row" style="gap:0.75rem">
        <span class="pet-thumb pet-thumb-lg">${petFaceHTML(pet, { bond, pose, size: 72 })}</span>
        <div><p class="small"><strong>${escapeHtml(pet.name)}</strong><span class="muted"> · vínculo nível ${level}${form}</span></p>
        <p class="small muted">${message}</p></div>
      </div>${missionHTML}
    </section>`;
}
