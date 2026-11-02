
// Missão que respeita a rotina: só sugere tarefas que cabem antes do próximo compromisso de hoje.
import 'fake-indexeddb/auto';
import { JSDOM } from 'jsdom';

const dom = new JSDOM(
  '<!doctype html><html><head><title>Base</title></head><body><div id="app"></div><div id="toasts"></div></body></html>',
  { url: 'http://localhost/' }
);

const w = dom.window;

for (const k of ['window', 'document', 'location', 'navigator']) {
  Object.defineProperty(globalThis, k, {
    value: k === 'window' ? w : w[k],
    configurable: true
  });
}

Object.defineProperty(globalThis, 'localStorage', {
  value: w.localStorage,
  configurable: true
});

const base = new URL('../js/', import.meta.url).href;

const auth = await import(base + 'auth.js');
const db = await import(base + 'db.js');
const T = await import(base + 'themes.js');
const R = await import(base + 'routine-fit.js');
const { renderHome } = await import(base + 'pages/home.js');

const wait = (ms = 60) =>
  new Promise((r) => setTimeout(r, ms));

const ok = (c, m) => {
  console.log((c ? 'OK   ' : 'FALHA'), m);
  if (!c) process.exitCode = 1;
};

// ---------- cálculo (quarta-feira 14/10/2026, 13:00) ----------

const at = (h, m = 0, day = 14) =>
  new Date(2026, 9, day, h, m).getTime();

const blocks = [
  { dayOfWeek: 3, startTime: '14:00', endTime: '15:00', label: 'Reunião' },
  { dayOfWeek: 3, startTime: '18:30', endTime: '19:30', label: 'Aula' },
  { dayOfWeek: 3, startTime: '09:00', endTime: '10:00', label: 'Café' },
  { dayOfWeek: 4, startTime: '13:10', endTime: '14:00', label: 'Outro dia' },
];

let n = R.nextCommitment(blocks, at(13));

ok(
  n && n.label === 'Reunião' && n.startTime === '14:00' && n.minutes === 60,
  'Próximo compromisso: 14:00 (Reunião), daqui a 60 min; blocos de outro dia e já passados não contam'
);

n = R.nextCommitment(blocks, at(13, 50));

ok(
  n.minutes === 10,
  'Próximo compromisso: às 13:50 faltam 10 min'
);

n = R.nextCommitment(blocks, at(15));

ok(
  n.label === 'Aula' && n.minutes === 210,
  'Próximo compromisso: depois da reunião, o seguinte é a Aula (210 min)'
);

ok(
  R.nextCommitment(blocks, at(20)) === null &&
  R.nextCommitment([], at(13)) === null,
  'Próximo compromisso: nenhum depois das 19:30 (ou sem rotina) devolve null'
);

ok(
  R.nextCommitment(blocks, at(14)) === null ||
  R.nextCommitment(blocks, at(14)).label === 'Aula',
  'Próximo compromisso: o que começa agora não é "próximo" (já está acontecendo)'
);

ok(
  R.currentCommitment(blocks, at(14, 30)).label === 'Reunião' &&
  R.currentCommitment(blocks, at(15)) === null &&
  R.currentCommitment(blocks, at(13)) === null,
  'Compromisso agora: dentro do horário sim; no minuto em que termina, não'
);

ok(
  R.fitMinutes(120, { minutes: 45 }) === 45 &&
  R.fitMinutes(30, { minutes: 45 }) === 30 &&
  R.fitMinutes(30, null) === 30 &&
  R.fitMinutes(45, { minutes: 45 }) === 45,
  'Tempo útil: o menor entre o que a pessoa tem e o que falta para o compromisso'
);

ok(
  R.nextCommitment(
    [{ dayOfWeek: 3, startTime: '14:00', endTime: '15:00' }],
    at(13)
  ).label === '',
  'Compromisso sem nome: rótulo vazio (a tela fala "um compromisso")'
);

// ---------- Home (horário real; pulado perto da meia-noite) ----------

await auth.register('Ana', 'ana@x.com', 'segredo1');

const uid = auth.state.user.id;

T.setActivePetStorage(uid, null);

const mk = (id, o = {}) => ({
  id,
  userId: uid,
  title: id,
  energyCost: 5,
  durationMinutes: 30,
  deadline: null,
  category: 'work',
  completed: false,
  completedAt: null,
  startedAt: null,
  pausedAt: null,
  pauseOffset: 0,
  createdAt: Date.now(),
  ...o
});

const nowD = new Date();
const nowMin = nowD.getHours() * 60 + nowD.getMinutes();

const hhmm = (m) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

if (nowMin + 50 > 23 * 60 + 50) {
  ok(
    true,
    'Home: pulado (muito perto da meia-noite para criar um compromisso daqui a 45 min no mesmo dia)'
  );
} else {
  const root = document.getElementById('app');

  const generate = async (hours) => {
    root.querySelector('#hours').value = String(hours);
    root.querySelector('#hours').dispatchEvent(new w.Event('input'));
    root.querySelector('#generate').click();
    await wait(150);
  };

  const result = () => root.querySelector('#result').textContent;

  await db.createTask(mk('Curta de 30 min'));
  await db.createTask(
    mk('Longa de 120 min', { durationMinutes: 120 })
  );

  await db.createRoutineBlock({
    id: 'b1',
    userId: uid,
    dayOfWeek: nowD.getDay(),
    startTime: hhmm(nowMin + 45),
    endTime: hhmm(nowMin + 80),
    label: 'Reunião'
  });

  let cleanup = await renderHome(root);
  await wait(150);

  root.querySelector('[data-time="other"]').click();
  await generate(3);

  ok(
    /Curta de 30 min/.test(result()) &&
    !/Longa de 120 min/.test(result()),
    'Home: com 3 h livres mas um compromisso daqui a 45 min, só sugere a tarefa de 30 min'
  );

  ok(
    /Reunião/.test(result()) &&
    new RegExp(hhmm(nowMin + 45)).test(result()) &&
    /Exibindo somente tarefas que cabem no período disponível./.test(result()),
    'Home: avisa do compromisso (nome, horário) e que sugeriu só o que cabe antes'
  );

  ok(
    !/falhou|atrasad|perdeu|culp/i.test(result()),
    'Tom sem culpa: nada de cobrança no aviso'
  );

  cleanup?.();
  root.innerHTML = '';

  await db.deleteTask('Curta de 30 min');

  cleanup = await renderHome(root);
  await wait(150);

  root.querySelector('[data-time="other"]').click();
  await generate(3);

  ok(
    /Nenhuma tarefa cabe antes do compromisso "Reunião"/.test(result()) &&
    !!root.querySelector('#result [data-action="bypass"]') &&
    !/Longa de 120 min/.test(result()),
    'Home: se nada cabe, explica o motivo e oferece ver as tarefas sem considerar a rotina'
  );

  root.querySelector('#result [data-action="bypass"]').click();
  await wait(150);

  ok(
    /Longa de 120 min/.test(result()) &&
    !/Exibindo somente tarefas que cabem no período disponível./.test(result()),
    'Home: "sem considerar a rotina" mostra a tarefa longa, sem o aviso'
  );

  cleanup?.();
  root.innerHTML = '';

  // Compromisso mais longe do que o tempo informado: não muda nada

  await db.deleteRoutineBlock('b1');

  await db.createRoutineBlock({
    id: 'b2',
    userId: uid,
    dayOfWeek: nowD.getDay(),
    startTime: hhmm(Math.min(nowMin + 600, 23 * 60 + 58)),
    endTime: '23:59',
    label: 'Longe'
  });

  await db.createTask(mk('Curta de 30 min'));

  cleanup = await renderHome(root);
  await wait(150);

  root.querySelector('[data-time="other"]').click();
  await generate(2);

  ok(
    !/Exibindo somente tarefas que cabem no período disponível./.test(result()) &&
    /Curta de 30 min|Longa de 120 min/.test(result()),
    'Home: compromisso mais longe do que o tempo livre não limita nem avisa'
  );

  cleanup?.();
  root.innerHTML = '';

  // Dentro de um compromisso: segue o aviso de sempre

  await db.createRoutineBlock({
    id: 'b3',
    userId: uid,
    dayOfWeek: nowD.getDay(),
    startTime: hhmm(Math.max(0, nowMin - 5)),
    endTime: hhmm(Math.min(nowMin + 20, 23 * 60 + 59)),
    label: 'Agora'
  });

  cleanup = await renderHome(root);
  await wait(150);

  root.querySelector('#generate').click();
  await wait(150);

  ok(
    /Horário Bloqueado/.test(result()) &&
    !!root.querySelector('#result [data-action="bypass"]'),
    'Home: dentro de um compromisso continua mostrando "Horário Bloqueado" com a opção de gerar mesmo assim'
  );

  cleanup?.();
}
