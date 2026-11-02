# ⚡ Energy Based Planner
### Faça a tarefa certa para a energia de agora.

Um aplicativo de produtividade que adapta a organização das tarefas ao nível de energia do usuário, ajudando a transformar a rotina em uma experiência mais inteligente, flexível e motivadora.

O **Energy Based Planner** foi desenvolvido com a proposta de mudar a maneira tradicional de organizar tarefas. Em vez de apresentar uma lista infinita de atividades que precisam ser concluídas independentemente de como a pessoa está se sentindo, o aplicativo considera sua disposição atual e ajuda a encontrar atividades compatíveis com sua energia.

O objetivo é tornar a produtividade mais sustentável, respeitando os limites individuais e incentivando a consistência.

---

## 📌 Sobre o projeto

O Energy Based Planner é um aplicativo de gerenciamento de tarefas baseado em energia, com elementos de gamificação e organização de rotina.

A ideia surgiu da percepção de que nem sempre temos a mesma disposição para realizar atividades. Existem dias em que conseguimos executar tarefas complexas e dias em que precisamos de atividades mais simples.

Os aplicativos tradicionais de produtividade geralmente organizam as tarefas por prazo, prioridade ou categoria, mas nem sempre consideram a capacidade atual do usuário.

O Energy Based Planner procura resolver esse problema oferecendo uma experiência em que as atividades podem ser organizadas e realizadas de acordo com o nível de energia disponível.

Além do gerenciamento de tarefas, o aplicativo conta com sistema de recompensas, conquistas, níveis, sequência de dias, mascotes e personalização visual.

## 🎯 Objetivos

- Adaptar a realização de tarefas ao nível de energia do usuário.
- Facilitar a organização das atividades diárias.
- Incentivar hábitos e a consistência.
- Reduzir a sensação de sobrecarga causada por listas intermináveis.
- Tornar a produtividade mais motivadora por meio da gamificação.
- Oferecer uma experiência personalizável e acessível.
- Permitir que o usuário acompanhe seu progresso.

---

# 🚀 Funcionalidades

## 1. 🔐 Cadastro e login

O aplicativo possui um sistema de autenticação local para permitir que cada usuário tenha seu próprio espaço.

Funcionalidades:
- Criação de conta.
- Login com senha.
- Gerenciamento de sessão.
- Separação dos dados por usuário.
- Armazenamento local das credenciais com recursos de criptografia.

A autenticação funciona localmente no navegador, sem depender de um servidor externo.

## 2. 🏠 Home (Tela inicial)

A Home é o centro de controle do aplicativo.

É nela que o usuário acompanha sua situação atual e acessa as principais informações relacionadas à produtividade.

Funcionalidades:
- Visualização do progresso.
- Acompanhamento dos pontos de experiência (XP).
- Visualização do nível atual.
- Acompanhamento da sequência de dias.
- Acesso rápido às atividades.
- Indicação de tarefas e informações relevantes.
- Lembretes de backup dos dados.

A tela inicial também apresenta o lembrete de backup periódico, ajudando a evitar a perda das informações armazenadas.

## 3. ⚡ Sistema de energia

O sistema de energia é o principal conceito do Energy Based Planner.

Sua proposta é permitir que as tarefas sejam relacionadas a diferentes níveis de exigência, considerando a disposição necessária para realizá-las.

Cada tarefa possui um nível de energia de 1 a 5.

| Nível | Energia | Característica |
|---|---|---|
| 1 | Muito baixa | Atividades simples |
| 2 | Baixa | Atividades leves |
| 3 | Moderada | Atividades intermediárias |
| 4 | Alta | Atividades exigentes |
| 5 | Muito alta | Atividades de maior esforço |

A proposta é aproximar a organização das atividades da realidade do usuário, evitando que a produtividade dependa exclusivamente de listas tradicionais.

## 4. 📋 Gerenciamento de tarefas

A aba Tarefas permite cadastrar e organizar as atividades do usuário.

Cada tarefa possui informações próprias para facilitar sua identificação e organização.

Funcionalidades:
- Criar novas tarefas.
- Definir título.
- Definir categoria.
- Estabelecer duração estimada em minutos.
- Definir nível de energia necessário.
- Editar tarefas existentes.
- Excluir tarefas.
- Desfazer exclusões.
- Organizar atividades recorrentes.
- Acessar a opção "Outra missão".

As tarefas recorrentes permitem criar hábitos e programar novas ocorrências automaticamente após a conclusão da atividade.

O sistema também possui uma seção chamada **Agendadas**, na qual ficam disponíveis as próximas ocorrências das tarefas recorrentes.

## 5. ⏱️ Cronômetro com mascote

O aplicativo possui um cronômetro integrado à experiência de produtividade.

O recurso permite acompanhar o tempo dedicado à realização de uma atividade, acompanhado de um mascote.

Funcionalidades:
- Iniciar o cronômetro.
- Pausar a contagem.
- Retomar a atividade.
- Acompanhar o tempo restante.
- Exibir o tempo do cronômetro no título da aba do navegador.
- Emitir som ao finalizar.
- Utilizar vibração ao finalizar, quando suportada pelo dispositivo.
- Controlar as notificações sonoras e a vibração pelas configurações do Perfil.

Uma melhoria importante é que, ao pausar o cronômetro, o tempo realmente deixa de avançar, evitando inconsistências na contagem.

## 6. 🔄 Rotina e hábitos

A aba Rotina é dedicada à organização das atividades recorrentes.

O objetivo é ajudar o usuário a desenvolver consistência e transformar tarefas importantes em hábitos.

Funcionalidades:
- Cadastro de tarefas recorrentes.
- Organização das atividades habituais.
- Agendamento da próxima ocorrência.
- Visualização de atividades agendadas.
- Atualização automática após concluir uma ocorrência.

Quando uma tarefa recorrente é concluída, o aplicativo agenda sua próxima ocorrência para o dia correspondente.

## 7. 🛍️ Loja de recompensas

O Energy Based Planner possui uma loja interna que utiliza a gamificação para incentivar a realização das atividades.

Por meio da loja, o usuário pode utilizar seus pontos para adquirir itens e personalizações.

Funcionalidades:
- Visualização dos itens disponíveis.
- Compra de temas.
- Compra de mascotes.
- Gerenciamento do inventário.
- Personalização da experiência.
- Utilização dos pontos acumulados.

Os itens adquiridos passam a fazer parte do inventário do usuário.

## 8. 🎨 Temas e personalização

O aplicativo permite personalizar sua aparência por meio de diferentes temas.

Funcionalidades:
- Seleção de temas.
- Alteração da aparência da interface.
- Personalização visual.
- Utilização de temas adquiridos na loja.
- Integração da identidade visual com os componentes do aplicativo.

A logo também utiliza uma máscara CSS, permitindo que sua coloração acompanhe o gradiente do tema selecionado.

## 9. 🐾 Mascotes

Os mascotes fazem parte da identidade visual e da experiência de gamificação.

Eles acompanham o usuário durante sua jornada de produtividade, especialmente na experiência do cronômetro.

Os mascotes também estão integrados ao sistema de inventário e à loja de recompensas.

## 10. 🏆 Sistema de conquistas

O aplicativo possui um sistema de conquistas para reconhecer o progresso do usuário.

As conquistas são liberadas conforme determinadas condições e atividades são realizadas.

O sistema possui:
- Lista de conquistas.
- Regras específicas de desbloqueio.
- Acompanhamento das conquistas obtidas.
- Integração com a experiência de gamificação.
- Conquistas relacionadas aos níveis e à sequência de dias.

O projeto também conta com três novas conquistas relacionadas às melhorias do sistema de níveis e sequência.

## 11. ⭐ Sistema de níveis e XP

O Energy Based Planner possui um sistema de experiência (XP) que permite acompanhar a evolução do usuário.

Conforme o usuário progride, acumula experiência e pode avançar de nível.

O sistema está integrado à gamificação e ao acompanhamento do progresso.

## 12. 🔥 Sequência de dias (Streak)

O sistema de sequência acompanha a continuidade da utilização do aplicativo.

Ele permite visualizar a quantidade de dias consecutivos em que o usuário mantém sua sequência.

A funcionalidade utiliza uma representação visual com fogo (🔥) e está integrada ao sistema de conquistas.

## 13. 👤 Perfil do usuário

A aba Perfil reúne as configurações e informações individuais do usuário.

Funcionalidades:
- Visualização das informações do usuário.
- Configurações pessoais.
- Controle de som.
- Controle de vibração.
- Exportação de dados.
- Importação de dados.
- Visualização da data do último backup.
- Verificação da proteção do armazenamento local.

## 14. 💾 Backup e proteção de dados

Os dados do aplicativo ficam armazenados localmente no navegador, utilizando IndexedDB.

Para reduzir o risco de perda de informações, o Energy Based Planner possui um sistema de backup em JSON.

Funcionalidades:
- Exportação dos dados.
- Importação de arquivos JSON.
- Lembrete automático de backup a cada 14 dias.
- Opção "Lembrar depois".
- Adiamento do lembrete por 3 dias.
- Visualização da data do último backup.
- Solicitação de armazenamento persistente pelo navegador.

**Importante:** o backup deve ser realizado regularmente. Os dados não ficam automaticamente sincronizados com a nuvem.

## 15. 📥 Importação de dados do aplicativo original

O Energy Based Planner possui um recurso de migração para permitir que usuários tragam seus dados do aplicativo desenvolvido anteriormente no Lovable.

Processo de migração:

1. Acesse o aplicativo original.
2. Entre em Perfil.
3. Selecione Exportar Dados.
4. Baixe o arquivo JSON.
5. Abra o Energy Based Planner.
6. Crie uma nova conta.
7. Acesse Perfil > Importar Dados.
8. Selecione o arquivo JSON.
9. Confira a quantidade de informações identificadas.
10. Confirme a importação.

**Observações importantes:**
- As senhas não são exportadas.
- É necessário criar uma nova conta.
- Os pontos passam a ser os valores presentes no arquivo importado.
- Temas e mascotes comprados no aplicativo original não são transferidos, pois o sistema original não exportava o inventário.
- O Energy Based Planner atual já possui exportação do inventário para backups futuros.

## 16. 🛠️ Painel administrativo

O aplicativo possui um painel administrativo acessível por um mecanismo oculto na navegação.

Para acessar:

1. Toque oito vezes em "Home".
2. Faça isso dentro de um intervalo de cinco segundos.
3. Informe a senha administrativa.

A senha pode ser alterada no arquivo:

`js/components/admin-panel.js`

A senha fica visível no código-fonte. Portanto, esse mecanismo serve apenas para ocultar o acesso ao painel, não sendo um sistema de segurança adequado para proteger operações administrativas sensíveis.

## 17. ♿ Acessibilidade

O Energy Based Planner também recebeu melhorias de acessibilidade para facilitar sua utilização.

Entre elas:
- Melhorias no contraste entre elementos.
- Textos com tamanho mínimo de 12 px.
- Botões com altura mínima de 44 px.
- Gerenciamento adequado do foco em janelas.
- Suporte ao fechamento de modais pela tecla Esc.
- Integração com leitores de tela.

## 18. 🎉 Animações e feedback visual

O aplicativo utiliza recursos visuais para tornar as interações mais claras e motivadoras.

A comemoração de conclusão de atividades utiliza:
- Fagulhas.
- Anel de luz.
- Efeitos visuais em CSS.
- Manipulação do DOM.

Esses efeitos são implementados sem bibliotecas externas.

---

# 🧰 Tecnologias utilizadas

| Tecnologia | Utilização |
|---|---|
| HTML5 | Estrutura das páginas |
| CSS3 | Estilização, temas, animações e responsividade |
| JavaScript (ES Modules) | Lógica e funcionalidades |
| IndexedDB | Armazenamento local dos dados |
| JSON | Exportação e importação de dados |
| Service Worker | Funcionamento offline e cache |
| PWA | Instalação como aplicativo |
| SVG | Ícones e elementos gráficos |
| Node.js | Execução dos testes e ferramentas de desenvolvimento |

O projeto utiliza JavaScript modular, permitindo organizar as funcionalidades em arquivos independentes.

**Não é necessário executar um processo de build para utilizar o aplicativo.**

---

# 📂 Estrutura do projeto

```text
Energy-Based-Planner/
│
├── index.html
├── styleguide.html
├── manifest.webmanifest
├── sw.js
│
├── assets/
│   ├── logo-mark.png
│   ├── icon-*.png
│   ├── apple-touch-icon.png
│   └── favicon-*.png
│
├── css/
│   └── style.css
│
├── js/
│   ├── app.js
│   ├── router.js
│   ├── db.js
│   ├── backup.js
│   ├── auth.js
│   ├── crypto.js
│   ├── themes.js
│   ├── ui.js
│   ├── data-import.js
│   ├── achievements.js
│   ├── icons.js
│   │
│   ├── components/
│   │   ├── admin-panel.js
│   │   ├── modal.js
│   │   └── componentes auxiliares
│   │
│   └── pages/
│       ├── home.js
│       ├── tasks.js
│       ├── routine.js
│       ├── shop.js
│       ├── profile.js
│       └── login.js
│
├── docs/
│   └── PUBLICAR.md
│
└── package.json
```

### Responsabilidade dos principais arquivos

- `app.js`: inicialização do aplicativo.
- `router.js`: gerenciamento das rotas utilizando hash.
- `db.js`: banco de dados IndexedDB e migrações.
- `backup.js`: exportação, proteção e lembretes de backup.
- `auth.js`: autenticação local.
- `crypto.js`: funcionalidades criptográficas.
- `themes.js`: temas, mascotes e inventário.
- `ui.js`: notificações e funções auxiliares.
- `data-import.js`: leitura e validação dos arquivos JSON.
- `achievements.js`: conquistas e regras de desbloqueio.
- `icons.js`: ícones SVG.
- `components/`: componentes reutilizáveis.
- `pages/`: implementação das telas do aplicativo.

---

# 💻 Como executar o projeto

O Energy Based Planner não utiliza um processo de build. Entretanto, como utiliza módulos JavaScript ES, precisa ser executado por meio de um servidor local.

### Pré-requisitos

- Visual Studio Code (recomendado).
- Navegador atualizado.
- Node.js (necessário apenas para os testes automatizados e ferramentas de desenvolvimento).

### Opção 1: Live Server

1. Baixe ou clone o repositório.
2. Abra a pasta no Visual Studio Code.
3. Instale a extensão Live Server.
4. Clique com o botão direito no arquivo `index.html`.
5. Selecione Open with Live Server.

### Opção 2: Servidor Python

Dentro da pasta do projeto, execute:

```bash
python3 -m http.server 5500
```

Depois, abra:

http://localhost:5500

---

# 📱 Instalação como aplicativo (PWA)

O Energy Based Planner possui suporte a Progressive Web App (PWA).

Isso permite instalar o aplicativo diretamente no dispositivo, proporcionando uma experiência semelhante à de um aplicativo convencional.

**No computador:**
- Abra o aplicativo no Chrome ou Edge.
- Utilize a opção Instalar disponível na barra de endereço.

**No Android:**
- Abra o aplicativo no navegador.
- Selecione Adicionar à tela inicial.

**No iPhone:**
- Abra o aplicativo pelo Safari.
- Toque em Compartilhar.
- Selecione Adicionar à Tela de Início.

### Funcionamento offline

O aplicativo utiliza Service Worker para armazenar os arquivos necessários ao funcionamento.

O sistema prioriza a versão disponível na internet para os arquivos do aplicativo e utiliza a cópia armazenada quando estiver offline.

Algumas funcionalidades podem depender do navegador ou do dispositivo, mas as principais operações locais continuam disponíveis sem internet.

---

# 🧪 Testes automatizados

O projeto possui uma suíte de testes automatizados com **360 verificações**.

Os testes abrangem:

- Login.
- Home.
- Tarefas.
- Rotina.
- Loja.
- Perfil.
- Importação de dados.
- Painel administrativo.
- Acessibilidade.
- Pausa do cronômetro.
- Níveis.
- Sequência de dias.
- Hábitos.
- Backup.
- Versão do banco de dados.
- Publicação.

### Como executar os testes

É necessário ter Node.js instalado.

Na pasta do projeto, execute:

```bash
npm install
```

Depois:

```bash
npm test
```

### Verificação de código

Para executar o lint:

```bash
npm run lint
```

### Preparação para publicação

Para executar os testes e preparar a versão para publicação:

```bash
npm run release
```

Recomenda-se executar os testes depois de qualquer alteração no código.

---

# 🌐 Publicação

O aplicativo pode ser publicado em serviços de hospedagem estática, sem necessidade de configurar um servidor de aplicação.

Plataformas compatíveis:

- GitHub Pages.
- Netlify.
- Cloudflare Pages.

As instruções detalhadas estão disponíveis em:

`docs/PUBLICAR.md`

**Importante:** os caminhos dos arquivos devem permanecer relativos para que o aplicativo funcione corretamente em subpastas, como acontece no GitHub Pages.

---

# 🔒 Armazenamento e segurança

O Energy Based Planner utiliza armazenamento local por meio do IndexedDB.

Isso significa que:
- Os dados ficam associados ao navegador e à origem do aplicativo.
- Não existe sincronização automática entre dispositivos.
- A limpeza dos dados do navegador pode causar perda das informações.
- A publicação em outro endereço cria um armazenamento separado.
- Para transferir os dados entre endereços, é necessário exportar e importar um backup.

O sistema possui migrações versionadas para permitir alterações na estrutura do banco de dados sem modificar migrações antigas.

**Observação:** a autenticação local e o painel administrativo não equivalem a uma infraestrutura de segurança com autenticação e autorização em servidor.

---

# 💡 Diferenciais do projeto

O Energy Based Planner reúne recursos de produtividade, organização pessoal e gamificação em uma única aplicação.

Seus principais diferenciais são:

1. **Produtividade baseada em energia:** considera o nível de esforço necessário para cada tarefa.
2. **Organização flexível:** permite criar, editar e acompanhar atividades.
3. **Gamificação:** utiliza XP, níveis, conquistas, mascotes e recompensas.
4. **Construção de hábitos:** permite programar atividades recorrentes.
5. **Personalização:** oferece temas e mascotes.
6. **Cronômetro integrado:** auxilia na concentração durante as atividades.
7. **Funcionamento offline:** utiliza tecnologias PWA e armazenamento local.
8. **Portabilidade dos dados:** permite exportar e importar informações.
9. **Acessibilidade:** incorpora melhorias de contraste, foco e navegação.
10. **Arquitetura modular:** separa as funcionalidades em arquivos independentes.

---

# 🔮 Visão do projeto

O Energy Based Planner foi pensado para oferecer uma alternativa aos métodos tradicionais de produtividade.

Sua proposta não é fazer o usuário realizar o máximo de tarefas possível a qualquer custo, mas ajudá-lo a utilizar melhor a energia que possui em cada momento.

A ideia central é simples:

**Nem todos os dias são iguais. Sua produtividade também não precisa ser.**

O projeto busca evoluir continuamente, mantendo o foco em uma experiência que combine organização, flexibilidade, motivação e respeito aos limites individuais.

---

# 📄 Licença

Consulte as informações de licença disponíveis no repositório.

---

<p align="center">
  <strong>ENERGY BASED PLANNER</strong><br>
  Faça a tarefa certa para a energia de agora.
</p>
