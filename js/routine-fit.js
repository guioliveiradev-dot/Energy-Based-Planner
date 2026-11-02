// Missão que respeita a rotina: quanto tempo livre existe até o próximo compromisso de hoje.
// Blocos da rotina: { dayOfWeek (0 = domingo), startTime: "HH:MM", endTime: "HH:MM", label }.
const toMin = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + m; };
const clock = (now) => { const d = new Date(now); return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() }; };

// Compromisso que está acontecendo agora (ou null).
export function currentCommitment(blocks, now = Date.now()) {
  const { day, min } = clock(now);
  return blocks.find((b) => b.dayOfWeek === day && toMin(b.startTime) <= min && toMin(b.endTime) > min) || null;
}

// Próximo compromisso de hoje: { label, startTime, minutes } com os minutos que faltam para ele começar (ou null).
export function nextCommitment(blocks, now = Date.now()) {
  const { day, min } = clock(now);
  const later = blocks.filter((b) => b.dayOfWeek === day && toMin(b.startTime) > min).sort((a, b) => toMin(a.startTime) - toMin(b.startTime))[0];
  return later ? { label: later.label || '', startTime: later.startTime, minutes: toMin(later.startTime) - min } : null;
}

// Tempo que realmente dá para usar: o que a pessoa informou, limitado pelo próximo compromisso.
export const fitMinutes = (available, next) => (next && next.minutes < available ? next.minutes : available);
