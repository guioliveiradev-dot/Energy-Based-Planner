# Contexto do projeto (para colar no início de uma conversa nova com o Claude)

**Energy Planner**: app de tarefas por nível de energia, feito em HTML, CSS e JS puro (sem build, módulos ES),
migrado do Lovable. Dados no navegador (IndexedDB + localStorage). Instalável (PWA). Roda com Live Server na porta 5500.

## Estrutura
- `index.html`, `css/style.css`, `css/progress.css`, `manifest.webmanifest`, `sw.js` (internet primeiro, cópia offline)
- `js/app.js` (entrada, menu, roteador por hash), `router.js`, `auth.js`, `db.js` (IndexedDB com lista de migrações, hoje v3), `backup.js` (backup, lembrete de 14 dias, armazenamento persistente), `crypto.js`, `themes.js`, `settings.js`, `alerts.js`, `contrast.js`
- `js/progress.js` (pontos, níveis, sequência de dias), `js/recurrence.js` (tarefas recorrentes: `repeat` e `availableFrom`), `achievements.js` (19 conquistas), `task-time.js` (tempo com pausa)
- `js/pages/` (home, tasks, routine, shop, profile, login), `js/components/` (modal, task-timer, progress-card, onboarding, backup-reminder, ...), `styleguide.html` (guia de estilo com contraste de todos os temas)
- `tests/` (`npm install` uma vez; `npm test` roda 391 verificações com jsdom; `npm run lint` roda o ESLint)

## Regras
- Texto do usuário em `innerHTML` sempre passa por `escapeHtml()`. Janelas usam `createModal()`.
- Textos de no mínimo 12 px e botões de no mínimo 44 px. Acessibilidade importa (rótulos, foco, aria).
- Pausa do cronômetro fica gravada na tarefa (`startedAt`, `pausedAt`, `pauseOffset`).
- Pontos da tarefa = energia × 10 + minutos × 0,5. Nível vem dos pontos ganhos (não cai ao gastar na Loja).

- Mudar o banco = nova migração em `MIGRATIONS` (`js/db.js`) + teste em `tests/10-versao-do-banco.mjs`. Nunca editar uma migração já publicada.
- Caminhos sempre relativos (o app roda em subpasta no GitHub Pages). Um teste confere isso.

- Temas: `papel` (padrão) e `grafite` são gratuitos; `neon` (o visual antigo, variáveis em `:root`) e os outros 6 são da Loja. Cores só por variáveis CSS (`--energy-*`, `--brand-gradient`), nunca fixas no JS.

## Como quero receber as mudanças
Um .zip só com os arquivos alterados (mesma estrutura de pastas) e um resumo curto. Testar antes com `npm test`.
