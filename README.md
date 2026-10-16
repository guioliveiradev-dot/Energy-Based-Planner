# Energy Planner (HTML + CSS + JS)

Versão sem build do app, feita para editar direto no VS Code.

## Como abrir
Os arquivos usam módulos ES (`import`), então **não funcionam com duplo clique no index.html**.
Use um servidor local:

- VS Code: instale a extensão **Live Server**, clique com o botão direito em `index.html` > "Open with Live Server".
- Ou, no terminal, dentro da pasta: `python3 -m http.server 5500` e abra http://localhost:5500

## Estrutura
- `index.html` — página única
- `css/style.css` — cores, temas, componentes e layout
- `js/app.js` — ponto de entrada (carregando, login ou app)
- `js/router.js` — rotas por hash (`#/tasks`)
- `js/db.js` — IndexedDB (mesmo banco do app original) com migrações versionadas
- `js/backup.js` — backup em JSON, lembrete a cada 14 dias e armazenamento persistente
- `styleguide.html` — guia de estilo: todos os componentes e o contraste em todos os temas
- `js/auth.js`, `js/crypto.js` — login local
- `js/themes.js` — temas, pets e inventário
- `js/ui.js` — toast e funções de apoio
- `js/data-import.js` — lê e valida o JSON de importação
- `js/achievements.js` — lista de conquistas e regras (edite aqui para criar novas)
- `js/icons.js` — ícones SVG (estilo lucide)
- `js/components/*.js` — slider de energia, cronômetro com pet, modais
- `js/pages/*.js` — uma tela por arquivo (home, tasks, routine, shop, profile, login)

## Publicar
Passo a passo do GitHub Pages em [`docs/PUBLICAR.md`](docs/PUBLICAR.md). Também serve Netlify ou Cloudflare Pages. Não precisa de build.

## Levar seus dados do Lovable para cá
1. No app do Lovable: Perfil > Exportar Dados (baixa um .json).
2. Neste app: crie uma conta (senhas não são exportadas) e vá em Perfil > Importar Dados.
3. Confira a contagem na janela e confirme. Seus pontos passam a ser os do arquivo.

Temas e pets comprados no Lovable não vêm no arquivo (o app original não exporta o inventário).
Você pode comprá-los de novo na Loja. Este app já exporta o inventário, então daqui para frente vai junto.

Os dados ficam no navegador e são separados por endereço. Se publicar em outro endereço, exporte e importe de novo.

## Testes automáticos
São 360 verificações (login, Home, Tarefas, Rotina, Loja, Perfil, importação, admin, acessibilidade, pausa do cronômetro, níveis, sequência, hábitos, backup, versão do banco e publicação).
Precisa do Node.js. Na pasta do projeto: `npm install` (uma vez) e depois `npm test`.
Rode depois de editar qualquer coisa: se algo quebrou, ele diz qual. O app em si não usa npm.
`npm run lint` aponta erros de código (instale a extensão ESLint no VS Code para ver os avisos enquanto edita).

## Regras para editar sem quebrar
- Para mudar o banco (tabela nova, campo novo que precisa de valor nos registros antigos), crie uma migração nova em `MIGRATIONS` no `js/db.js`. Nunca edite uma migração antiga. Veja o comentário no topo do arquivo.
- Use sempre caminhos relativos (`css/style.css`, nunca `/css/style.css`): no GitHub Pages o app mora numa subpasta.
- Todo texto que o usuário digita e vai para dentro de `innerHTML` deve passar por `escapeHtml()` (`js/ui.js`).
- Janelas: use `createModal()` (`js/components/modal.js`). Ela já cuida de foco, Esc e leitor de tela.
- Avisos: `toast('mensagem')`. Com botão de desfazer: `toast('Removido.', 'info', undefined, { label: 'Desfazer', onClick })`.
- Textos de no mínimo 12 px (0.75rem) e botões de no mínimo 44 px (2.75rem).
- Preferências novas: adicione em `js/settings.js`.

## Logo e ícones
- `assets/logo-mark.png`: o símbolo da logo, preto com fundo transparente. No app ele é usado como
  **máscara** (classe `.logo-mark` em `css/style.css`), então a cor vem do CSS: no login ele fica com o gradiente
  do tema e muda junto com os temas da loja. Para usar em outro lugar: `<span class="logo-mark" style="--s:3rem"></span>`.
- `assets/icon-*.png`, `apple-touch-icon.png`, `favicon-*.png`: ícones do app (símbolo preto em fundo creme).
- Para trocar a logo, substitua esses arquivos mantendo os nomes.

## Instalar como app (PWA)
O app tem `manifest.webmanifest` e `sw.js`. No Chrome/Edge aparece o botão "Instalar" na barra de endereço;
no Android, "Adicionar à tela inicial"; no iPhone (Safari), Compartilhar > "Adicionar à Tela de Início".
O service worker tenta sempre a internet primeiro para os arquivos do app, então suas edições aparecem
na hora. Só usa a cópia guardada quando está offline. Se o navegador parecer mostrar versão antiga,
aumente `VERSION` em `sw.js` ou, no DevTools (F12) > Application > Service Workers, clique em "Unregister".
O service worker só funciona em `localhost` ou em endereço `https://`.

## Painel admin
Toque 8 vezes em "Home" na barra inferior, em até 5 segundos. A senha está no topo de
`js/components/admin-panel.js` (`ADMIN_PASSWORD`) e pode ser trocada. Ela é visível no código,
então serve só para esconder o painel.

## Backup
Os dados ficam só neste navegador. A cada 14 dias a Home mostra um lembrete gentil para baixar uma cópia (JSON); "Lembrar depois" adia 3 dias. Em Perfil > Exportar Dados aparece a data do último backup, e o cartão "Proteção dos dados" mostra se o navegador prometeu não apagar o armazenamento sozinho. Para restaurar: Perfil > Importar Dados.

## Status
Todas as telas do app original estão portadas: login, Home, Tarefas, Rotina, Loja, Perfil,
conquistas, onboarding, cronômetro com pet e painel admin.
Além do original: importação de dados, instalável (PWA), botão "Outra missão", editar tarefas,
excluir recompensas, "Desfazer" ao excluir, som e vibração ao fim do cronômetro (com chave no Perfil),
tempo do cronômetro no título da aba, melhorias de acessibilidade, pausa do cronômetro que não deixa o tempo correr,
níveis de XP e sequência de dias (🔥) com 3 conquistas novas e tarefas recorrentes (hábitos):
ao concluir, a próxima ocorrência fica agendada para o dia certo (seção "Agendadas").

Observação: o confete usa a biblioteca canvas-confetti, carregada por CDN no index.html.
Sem internet o app funciona normalmente, só sem confete.
