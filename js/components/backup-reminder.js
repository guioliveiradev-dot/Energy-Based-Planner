// Lembrete gentil de backup (aparece na Home a cada 2 semanas, para quem já tem tarefas).
// Tom sem culpa: nada é cobrado, e "Lembrar depois" adia sem drama.

import { icon } from '../icons.js';
import { toast } from '../ui.js';
import { backupStatus, downloadBackup, snoozeBackup, SNOOZE_DAYS } from '../backup.js';

function messageFor({ days, never }) {
  return never
    ? `Seus dados ficam só neste navegador. Que tal baixar uma cópia de segurança? Você usa o app há ${days} dias.`
    : `Faz ${days} dias desde a última cópia de segurança. Quer baixar uma nova? Leva poucos segundos.`;
}

// Mostra o lembrete dentro de `slot` quando estiver na hora. Não faz nada (e não dá erro) se não estiver.
export async function mountBackupReminder(slot, userId, now = Date.now()) {
  let status;
  try { status = await backupStatus(userId, now); } catch { return; }
  if (!status.due || !slot.isConnected) return;

  slot.innerHTML = `
    <section class="glass-card pad stack backup-reminder" role="region" aria-label="Lembrete de backup">
      <div class="row text-primary">${icon('download', 18)}<strong class="small">Cópia de segurança</strong></div>
      <p class="small">${messageFor(status)}</p>
      <div class="backup-actions">
        <button type="button" class="btn-neon btn-sm" data-backup="download">Baixar cópia</button>
        <button type="button" class="btn" data-backup="later">Lembrar depois</button>
      </div>
    </section>`;

  slot.querySelector('.backup-actions').addEventListener('click', async (e) => {
    const act = e.target.closest('[data-backup]')?.dataset.backup;
    if (!act) return;
    try {
      if (act === 'download') {
        await downloadBackup(userId);
        toast('Cópia salva! Guarde o arquivo num lugar seguro (nuvem, e-mail ou pen drive).', 'success', 5000);
      } else {
        await snoozeBackup(userId);
        toast(`Tudo bem! Lembro de novo em ${SNOOZE_DAYS} dias.`);
      }
      slot.innerHTML = '';
    } catch (err) {
      console.error(err);
      toast('Não consegui salvar a cópia. Tente pelo Perfil.', 'error');
    }
  });
}
