# Roadmap do Energy Based Planner (atualizado)

Legenda: `[x]` feito · `[~]` pronto, falta uma ação sua · `[ ]` a fazer · tamanho **P** (pequeno), **M** (médio), **G** (grande) · `#n` = número da lista original de melhorias.

## Já feito (resumo)
- **Fase 0, proteger e preparar:** backup (arquivo JSON, lembrete gentil a cada 14 dias, pedido de armazenamento persistente), banco com versão e migrações (hoje **v4**), guia de estilo `styleguide.html` (componentes e contraste de todos os temas), ESLint (Prettier ficou de fora de propósito: reformataria o projeto todo). **#25 GitHub Pages: código pronto** (`[~]` falta você publicar, mover os dados e testar no celular; veja `docs/PUBLICAR.md`).
- **Visual (do jeito que você pediu: só cores e fonte):** **Papel (claro)** e **Grafite (escuro)** são temas gratuitos (Perfil > Inventário); o visual antigo virou **Neon (clássico)**, vendido por 3500 pontos; fonte dos títulos **Space Grotesk em todos os temas** (Orbitron só no Neon), texto em Inter; fontes hospedadas no app (`fonts/`, funciona offline). Paleta travada nos arquivos `css/style.css` (temas `papel` e `grafite`).
- **Pets (Fase 2 inteira, menos a arte dos 6 antigos):**
  - Vínculo: cada tarefa concluída com o pet ativo soma 1; 5 níveis em 0, 5, 15, 35 e 70 tarefas; nunca diminui.
  - **Fagulha** (mascote da logo): pet inicial grátis, desenhada em SVG (estilo "carvão suave", 4 poses, 3 formas: Faísca, Chama, Aura), com cores para os 9 temas.
  - **Poderes dos 7 pets** (`js/pet-powers.js`): Fagulha +8% a +12% em toda tarefa; Gato +25% a +40% sem pausar; Dragão +40% a +60% em energia 8+; Unicórnio baú diário 10-40 a 20-60 pontos; Robô missão do dia +30% a +50%; Cão 1 escudo por semana (2 no nível 4) que protege a sequência; Fênix reacende 50% a 70% da sequência quebrada (1x a cada 30 dias). O bônus entra no saldo, **não** no nível.
  - Preços: Gato, Dragão, Unicórnio e Robô 500; Cão 800; Fênix 1000. Fagulha grátis.
  - Descrição "Detalhes do poder" na Loja e no Inventário; cartão do pet com mensagem do dia na Home; comemoração animada quando o pet sobe de nível (a Fagulha "evolui"); 5 conquistas de pets (24 no total).
  - **Um pet ativo por vez** (2º espaço de pet descartado por decisão sua).
- **Fase 3:** #3 busca, ordenação (7 opções) e aviso calmo de prazo; #5 editar recompensas; #1 estatísticas (aba no Perfil: mapa de calor, tempo focado, categorias, melhores dias e horários, hábitos); #9 etapas e notas nas tarefas; #19 painel admin só em localhost (`js/config.js`).
- **Fase 4:** #12 cronômetro com anel de progresso e modo foco em tela cheia; #26 aviso de versão nova (`npm run release` carimba a versão antes de publicar).
- **Extras que você pediu fora do roadmap:** nome completo "Energy Based Planner"; animação fluida na troca Login/Cadastro; validação de e-mail (formato e erros de digitação comuns; não dá para provar que a caixa existe sem servidor); conquistas e janelas em **fila** (nunca uma por cima da outra); comemoração de **fagulhas de luz** (nível do pet, conquista, compra) no lugar do confete; conclusão de tarefa com **visto que se desenha** e pontos contando; telas que se atualizam sozinhas quando o painel admin muda algo; painel admin com ferramentas de teste (pontos, vínculo, cenários de sequência, tarefas de teste).

- **Contraste dos temas (A7 + A5):** os 6 temas antigos da Loja e o Neon passam em 4,5 em todos os pares (mesmos ids); a tabela do guia de estilo virou o teste 30.
- **Ícones no lugar de emoji:** a interface usa os ícones do app (categorias, abas, energia, sequência, avisos); só os 6 pets antigos mantêm emoji até a arte chegar. O teste 31 avisa se um emoji voltar.
- **Sequência e Estatísticas refeitas:** cartão da sequência com os 7 últimos dias; Estatísticas em 4 abas (Resumo, Dias e horários, Categorias, Hábitos), sem o mapa de calor, com "Esta semana" e "Semana a semana".
- **Home mais leve:** faixa de situação (nível, sequência, pontos), energia e tempo em 2 passos com atalhos (15 min, 30 min, 1 h, 2 h, Outro), meta numa linha e pet compacto.
- **#7 Metas e desafios:** meta da semana (3, 5, 7, 10 ou 15 tarefas; +50 pontos) e 3 desafios opcionais por semana (+20 a +40), com anel na nova página **Metas** do menu (junto da sequência de dias). Os pontos vão para o saldo, não para o nível. Pets ficaram de fora desta primeira versão (ideia: o Robô escolher o desafio do dia).

## Pendente (ordem sugerida)
1. **#2 Missão que respeita a rotina** (M): só sugerir tarefas que cabem antes do próximo compromisso.
2. **#6 Registro de energia ao longo do dia** (M/G): insights como "você rende mais de manhã" (o Robô pode usar).
3. **#14 Atalhos de teclado** (P, por exemplo **N** para nova tarefa), **#13 transições entre telas e telas vazias com ilustração** (P), **#22 setas nas abas e filtros e tamanho de texto ajustável** (P/M).
4. **A8 Computador e telas pequenas** (M): barra lateral no desktop (#11) e conferência em 320 px e zoom de 200% (#23).
5. **B3 Arte dos 6 pets antigos** (G): **aguardando os modelos do grupo do usuário**. Quando chegarem, desenhar em SVG no estilo da Fagulha (silhueta chapada "carvão suave", cores por tema via variáveis `--pet-*`, 4 poses: parado, trabalhando, dormindo, comemorando), mantendo os ids `cat`, `dog`, `dragon`, `phoenix`, `robot`, `unicorn`. A base está em `js/pet-art.js` e `prototipo/pets.html`.
6. **Ações do usuário:** publicar no GitHub Pages; testar no celular de verdade; **#21** teste com leitor de tela (NVDA ou VoiceOver); **#24** testes no navegador de verdade (rodam na máquina dele).
7. **Sem prazo:** **#18** sincronizar entre aparelhos (assumido que usa um aparelho só; exigiria servidor). Se um dia houver servidor, a confirmação de e-mail entra junto.

## Descartado ou resolvido de outro jeito
- A2, A3 e A4 (separar tema de estilo, seletor de aparência, aplicar o "novo estilo" por partes): não foram necessários, porque você pediu só mudar cores e fonte. Claro/escuro é feito escolhendo o tema Papel ou Grafite.
- 2º espaço de pet; congelar sequência como item avulso (virou poder dos pets); confete (virou fagulhas de luz).

## Decisões vigentes
- Tom do app: **sem culpa** (nada pune, nada acusa; só mostra o que foi feito).
- Aparência padrão: Papel. Sem modo "automático" que siga o aparelho.
- Acento dourado, só em preenchimentos, ícones e bordas (nunca em texto pequeno sobre claro).
- Os dados ficam no navegador de cada pessoa (sem servidor). O backup JSON é o jeito de levar dados entre aparelhos e endereços.
- O painel admin só abre em `localhost`/`127.0.0.1`; para liberar a amigos, acrescentar o endereço em `ADMIN_HOSTS` (`js/config.js`).
- Mudar o banco exige nova migração em `js/db.js` e teste em `tests/10-versao-do-banco.mjs`.

## Limites que você deve conhecer
- Não consigo abrir o app num navegador nem o GitHub (o site bloqueia acesso automatizado): cada etapa visual depende da conferência do usuário. Para desenhos em SVG consigo renderizar uma imagem e conferir.
- Notificações com o app fechado não dá para fazer sem servidor. Timers em abas escondidas podem atrasar o aviso sonoro (o tempo continua correto).
- O e-mail não é verificado de verdade (sem servidor).

## Como trabalhar daqui para frente
- Abra um chat novo com `PROMPT-NOVO-CHAT.txt`, `CONTEXTO.md`, este `ROADMAP.md` e o zip do projeto.
- Peça um item por vez. A entrega é **um zip só com os arquivos alterados** (mesma estrutura de pastas) e um resumo curto, depois de rodar `npm test` e `npm run lint`.
