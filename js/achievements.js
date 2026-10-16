// Lista de conquistas e regras para desbloqueá-las. Porte de AchievementNotification.tsx.
// Para criar uma conquista nova, adicione um item em ACHIEVEMENTS.
//   icon:  nome de um ícone em icons.js
//   check: (tarefas, histórico de resgates, pontos ganhos no total) => true/false
// Os cálculos de pontos, nível e sequência de dias ficam em progress.js.

import { totalPoints, streakInfo } from './progress.js';

const done = (t) => t.filter((x) => x.completed);

export const ACHIEVEMENTS = [
  { id: 'first_task', title: 'Primeiro Passo', description: 'Complete sua primeira tarefa', icon: 'star', color: 'hsl(45, 100%, 55%)', check: (t) => done(t).length >= 1 },
  { id: 'task_10', title: 'Produtivo', description: 'Complete 10 tarefas', icon: 'flame', color: 'hsl(20, 100%, 55%)', check: (t) => done(t).length >= 10 },
  { id: 'task_25', title: 'Imparável', description: 'Complete 25 tarefas', icon: 'zap', color: 'hsl(190, 100%, 50%)', check: (t) => done(t).length >= 25 },
  { id: 'task_50', title: 'Lendário', description: 'Complete 50 tarefas', icon: 'crown', color: 'hsl(265, 100%, 68%)', check: (t) => done(t).length >= 50 },
  { id: 'task_100', title: 'Centurião', description: 'Complete 100 tarefas', icon: 'swords', color: 'hsl(0, 85%, 55%)', check: (t) => done(t).length >= 100 },
  { id: 'task_200', title: 'Máquina', description: 'Complete 200 tarefas', icon: 'rocket', color: 'hsl(280, 80%, 60%)', check: (t) => done(t).length >= 200 },
  { id: 'pts_500', title: 'Acumulador', description: 'Ganhe 500 Pontos no total', icon: 'trophy', color: 'hsl(45, 100%, 55%)', check: (_t, _h, pts) => pts >= 500 },
  { id: 'pts_2000', title: 'Milionário', description: 'Ganhe 2000 Pontos no total', icon: 'award', color: 'hsl(150, 100%, 50%)', check: (_t, _h, pts) => pts >= 2000 },
  { id: 'pts_5000', title: 'Magnata', description: 'Ganhe 5000 Pontos no total', icon: 'gem', color: 'hsl(200, 100%, 55%)', check: (_t, _h, pts) => pts >= 5000 },
  { id: 'pts_10000', title: 'Bilionário', description: 'Ganhe 10000 Pontos no total', icon: 'crown', color: 'hsl(43, 90%, 55%)', check: (_t, _h, pts) => pts >= 10000 },
  { id: 'first_redeem', title: 'Merecido', description: 'Resgate sua primeira recompensa', icon: 'gift', color: 'hsl(265, 100%, 68%)', check: (_t, h) => h.length >= 1 },
  { id: 'redeem_5', title: 'Colecionador', description: 'Resgate 5 recompensas', icon: 'shield-check', color: 'hsl(190, 100%, 50%)', check: (_t, h) => h.length >= 5 },
  { id: 'redeem_15', title: 'Viciado em Recompensas', description: 'Resgate 15 recompensas', icon: 'heart', color: 'hsl(340, 80%, 55%)', check: (_t, h) => h.length >= 15 },
  { id: 'hard_task', title: 'Desafiador', description: 'Complete tarefa com energia 9+', icon: 'target', color: 'hsl(0, 85%, 55%)', check: (t) => t.some((x) => x.completed && x.energyCost >= 9) },
  { id: 'long_task', title: 'Maratonista', description: 'Complete tarefa de 2+ horas', icon: 'timer', color: 'hsl(190, 80%, 50%)', check: (t) => t.some((x) => x.completed && x.durationMinutes >= 120) },
  { id: 'streak_3', title: 'Em Chamas', description: 'Conclua tarefas 3 dias seguidos', icon: 'flame', color: 'hsl(20, 100%, 55%)', check: (t) => streakInfo(t).best >= 3 },
  { id: 'streak_7', title: 'Semana Perfeita', description: 'Conclua tarefas 7 dias seguidos', icon: 'calendar', color: 'hsl(190, 100%, 50%)', check: (t) => streakInfo(t).best >= 7 },
  { id: 'streak_30', title: 'Hábito de Aço', description: 'Conclua tarefas 30 dias seguidos', icon: 'shield-check', color: 'hsl(265, 100%, 68%)', check: (t) => streakInfo(t).best >= 30 },
  { id: 'marathon', title: 'Ultra Maratonista', description: 'Complete tarefa de 5+ horas', icon: 'book-open', color: 'hsl(150, 70%, 45%)', check: (t) => t.some((x) => x.completed && x.durationMinutes >= 300) },
];

// Pontos ganhos no total (soma dos pontos de todas as tarefas concluídas)
export const totalPointsEarned = totalPoints;

export function getUnlocked(tasks, history) {
  const pts = totalPointsEarned(tasks);
  return ACHIEVEMENTS.filter((a) => a.check(tasks, history, pts));
}
