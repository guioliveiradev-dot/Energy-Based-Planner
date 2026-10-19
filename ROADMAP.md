# Roadmap do Energy Planner

Legenda: `[x]` feito · `[~]` pronto, falta uma ação sua · `[ ]` a fazer · tamanho **P** (pequeno), **M** (médio), **G** (grande) · `#n` = número da lista original de melhorias.
Este arquivo junta as minhas ideias com as suas. Ordem pensada para **não refazer trabalho** (veja "Por que esta ordem").

## Por que esta ordem
1. **Proteger os dados primeiro.** Os pets novos guardam dados novos e o redesign renomeia temas: sem versão do banco e sem backup, um erro custa tudo.
2. **Nova cara antes de pets e de telas novas.** Pets desenhados e telas novas seguem o estilo visual. Se fizermos antes, fazemos duas vezes.
3. **Pets antes das funções de rotina**, porque vários poderes dos pets (escudo de sequência, missão do dia, melhor horário) são justamente essas funções.

---

## Fase 0 · Proteger e preparar (pequena)
- [x] **#16 Backup** (P): feito. Pede armazenamento persistente (uma vez, quando já há tarefas; botão "Proteger armazenamento" no Perfil), lembrete gentil na Home a cada 14 dias ("Lembrar depois" adia 3 dias) e o Perfil mostra a data do último backup. Código em `js/backup.js` e `js/components/backup-reminder.js`.
- [x] **#17 Versão dos dados** (P/M): feito. `js/db.js` agora tem uma lista de migrações (v1, v2 e a nova v3, que cria a tabela `meta`). O arquivo de backup leva `schemaVersion`, e a importação recusa arquivo de versão mais nova. Os pets (B2) entram como a migração v4.
- [~] **#25 Publicar no GitHub Pages** (P): o código está pronto (caminhos relativos conferidos por teste, `.nojekyll`, passo a passo em `docs/PUBLICAR.md`). **Falta você**: ligar o Pages no GitHub, mover seus dados (exportar no localhost e importar no endereço novo) e testar no celular.
- [x] **A0 Guia de estilo `styleguide.html`** (P/M): feito. Abra `styleguide.html` no Live Server: mostra botões, cartões, formulários, abas, avisos e uma janela real em todos os temas, com tabela de contraste calculada na hora.
- [x] **#27 ESLint** (P): feito (`npm run lint`, extensão ESLint recomendada no VS Code). **Prettier ficou de fora de propósito**: formatar o código atual mexeria em 35 arquivos de uma vez e o histórico do git viraria ruído. Se quiser, adotamos só para arquivos novos.

## Fase 1 · Nova cara do app
**Direção (a partir das suas imagens e da logo):** calma e editorial, não futurista.
- Fundo creme quente (o mesmo tom do fundo da sua logo), texto quase preto, cinza quente no texto secundário.
- Botões pretos em formato de pílula (no escuro, botão creme). Cartões chapados, bordas finas, sombra suave, **sem brilho neon e sem vidro**.
- Títulos em fonte **serifada de alto contraste** (como nas imagens) e Inter no corpo do texto.
- A logo já é monocromática: aparece preta no claro e creme no escuro, sem gradiente.
- Um único **acento quente** usado com parcimônia (sugestão: âmbar, o raio da logo). Vermelho, amarelo e verde ficam só para significar energia e estados.
- **Cautela:** o visual de hoje **não é apagado**. Ele vira um tema grátis chamado "Neon (clássico)", e você troca entre os dois no Perfil.

- [~] **A1 Protótipo visual** (M): feito em `prototipo/index.html` (abra com o Live Server). **Falta você aprovar** (tema, fonte e cartões).
  Paleta travada: **Papel (claro)** fundo `#F7F6F2`, cartão `#FFFFFF`, tinta `#1C1A19`, texto secundário `#53514F`, borda `#E1E0DA`; **Grafite (escuro)** é o espelho: fundo `#100E0C`, cartão `#1A1816`, tinta `#EFEDE9`, secundário `#B1B0AA`, borda `#2A2723`. Acento dourado `#8A6414` / `#D8AE55`. Energia baixa `#B3382C` / `#EC6B5F`, média `#8F5B00` / `#E5B040`, alta `#2B7A4B` / `#5FBF86`. Todos os textos passam de 4,5.
  (descrição original:): 4 telas (Login, Home, Tarefas, Loja) em HTML estático nos temas Papel, Grafite e Neon. **Você aprova antes de eu mexer no app.**
- [ ] **A2 Separar "tema" de "estilo"** (M): hoje as variáveis de cor também carregam o jeito do app. Separar cores (tema) de tipografia, raio, brilho e vidro (estilo), sem mudar a aparência. Junto: **#28 organizar o CSS** por assunto.
- [ ] **A3 Seletor de aparência no Perfil** (M): Claro / Escuro / Automático (**#10**) e Estilo "Novo" / "Neon clássico", para comparar lado a lado.
- [ ] **A4 Aplicar o novo estilo** (G, em partes): 1) login e navegação, 2) Home, 3) Tarefas e Rotina, 4) Loja e Perfil, 5) janelas e avisos.
- [ ] **A5 Temas da Loja redesenhados** (M): cada tema com versão clara e escura, mantendo os **ids atuais** para ninguém perder o que comprou. Proposta de nomes: Areia (era Pôr do Sol), Musgo (Floresta), Névoa (Oceano), Ameixa (Meia-Noite), Prata, Ouro, mais o "Neon (clássico)".
- [x] **A6 Fontes hospedadas no app** (P, **#15**): feito (`fonts/` + `css/fonts.css`; Inter, Space Grotesk e Orbitron, só o conjunto latin; o service worker guarda as fontes para uso offline). Original: a fonte serifada e o Inter ficam junto dos arquivos, para o app abrir rápido e funcionar offline. Dá para baixar pelos pacotes `@fontsource` do npm.
- [ ] **A7 Contraste de todos os temas** (P, **#20**): a verificação automática já existe (tabela do guia de estilo). Situação de hoje: texto, texto secundário e botão principal passam em todos os temas. **17 de 77 pares falham**, todos em três cores: destaque (roxo) usado como texto, texto sobre o destaque, e vermelho de erro como texto. Corrigir ao aplicar o novo estilo (A4/A5) e transformar a tabela em teste que falha se algum par cair abaixo de 4,5.
- [ ] **A8 Computador e telas pequenas** (M): barra lateral no desktop (**#11**) e conferência em 320 px e zoom de 200% (**#23**).

## Fase 2 · Pets que valem a pena
**Princípios:** compensar gastar pontos; **"sem culpa"** (nenhum pet adoece, foge ou pune); cada pet ajuda de um jeito próprio; o pet evolui com o uso.

- [x] **B1 Desenho do sistema**: fechado. Regras do vínculo:
  - Cada tarefa concluída com um pet ativo soma **1** ao vínculo **daquele** pet. Trocar de pet não apaga nada, e o vínculo **nunca diminui** (sem culpa).
  - **5 níveis** de vínculo, entrando em **0, 5, 15, 35 e 70 tarefas** (com 3 tarefas por dia: ~2, ~5, ~12 e ~23 dias). Números ajustáveis em `BOND_THRESHOLDS` (`js/pets.js`).
  - Cada nível aumenta o poder do pet e libera acessórios (B5, B3). O vínculo **não** conta nos pontos nem no nível do usuário.
  - Um pet ativo por vez (o 2º espaço por nível entra no B7). Fagulha é o pet inicial grátis (B4).
- [x] **B2 Dados dos pets** (M): feito. Tabela `petBonds` no banco (migração **v4**, testada a partir da v2 e da v3), vínculo somado ao concluir tarefa (Home e Tarefas aviso de subida de nível), incluído no backup, na importação (nunca diminui o que a conta já tem) e apagado junto com a conta. O Perfil mostra o nível e quantas tarefas faltam. Código em `js/pets.js`.
- [~] **B3 Arte** (G): pets **ilustrados em SVG** (não emojis), com poses: parado, trabalhando, dormindo, comemorando. Os 6 atuais refeitos, mantendo os ids (`cat`, `dog`, `dragon`, `phoenix`, `robot`, `unicorn`) para quem já tem.
  - **Andamento:** a Fagulha está desenhada nos dois estilos (A chapado e B colorido), com 4 poses e 3 estágios, em `js/pet-art.js`. Prévia em `prototipo/pets.html`. **Estilo decidido: A (chapado) na versão "carvão suave"** (cinza quente, raio na cor de destaque do tema). As cores existem para os 9 temas (`--pet-*` no CSS) e um teste garante que o corpo tem contraste com o fundo e o rosto com o corpo em todos. Os 6 pets antigos ficam com **você e seu grupo desenhando**: quando enviarem os modelos, eu uso como base para o SVG (mesmos ids). Até lá eles seguem com emoji.
- [~] **B4 Mascote da logo: "Fagulha"** (M): um espírito pequeno em forma de chama, com o raio da logo na cabeça e a postura meditando. Evolui com o vínculo: Faísca → Chama → Aura.
  - **Andamento:** a arte e os estágios (Faísca nível 1-2, Chama nível 3-4, Aura nível 5) já existem. **Feito:** a Fagulha é o pet inicial grátis de todos (já vem ativa, não é vendida na Loja), aparece desenhada no Perfil e no cronômetro (trabalha rodando, dorme pausada, comemora ao terminar) e muda de forma com o vínculo (Faísca, Chama, Aura). Falta: Fagulha na Home com mensagem do dia (B6) e os poderes (B5).
- [x] **B5 Poderes aplicados** (M/G): feito. Os 7 pets têm poder (código em `js/pet-powers.js`):
  | Pet | Poder (nível 1 → nível 5) |
  |---|---|
  | Fagulha | +8% → +12% de pontos em toda tarefa |
  | Gato Cósmico | +25% → +40% em tarefa concluída sem pausar o cronômetro |
  | Dragão Neon | +40% → +60% em tarefa de energia 8 ou mais |
  | Unicórnio Mágico | baú-surpresa na 1ª tarefa do dia: 10 a 40 → 20 a 60 pontos |
  | Robô Quântico | missão do dia na Home: +30% → +50% na tarefa escolhida |
  | Cão Guardião | 1 escudo por semana (2 a partir do nível 4): protege a sequência se você perder um dia (só quando ela já tem 2 dias) |
  | Fênix Estelar | se a sequência quebrar, reacende 50% → 70% dela na próxima tarefa (1 vez a cada 30 dias) |
  - O bônus entra no saldo e **não** no nível. Nada pune: sem a regra cumprida, a tarefa vale os pontos de sempre. A janela de parabéns mostra o que o pet fez ("Fagulha ajudou: +5 pontos", "Fênix reacendeu 2 dias da sua sequência!").
  - **Economia reajustada:** a Fagulha (grátis) caiu de +10% para +8%, para os pets pagos valerem a pena. Preços: Gato, Dragão, Unicórnio e Robô **500**; Cão **800**; Fênix **1000** (antes: 1000, 1500, 2500, 2000, 1000, 2000). Cada pet pago se paga em 2 a 4 semanas de uso normal (conta no teste 18). Quem já comprou não perde nada.
  - **Descrição de cada pet** na Loja e no Inventário ("O que ele faz": explicação + o poder em cada nível).
  - **Painel admin para testar:** +100/+1000/+10000 pontos, +1/+5/+20/máximo/zerar vínculo do pet ativo, 3 cenários de sequência (viva, perdi ontem, quebrada), criar/limpar tarefas de teste, liberar o baú, zerar poderes.
- [~] **B6 Pet na Home e no cronômetro** (M, junto com **#12**): companheiro com mensagem do dia e animação no cronômetro.
  - **Feito:** cartão do pet na Home (arte, vínculo, mensagem do dia gentil que muda com a hora e o que você já fez, e a missão do Robô). **Falta:** animação no cronômetro além das poses e o cronômetro mais bonito (#12).
  - **Comemoração de nível:** quando o vínculo do pet sobe de nível (concluindo tarefa ou pelo painel admin), aparece uma animação com o pet, brilhos, o nível novo e o poder novo; a Fagulha "evolui" na tela quando muda de forma. Home, Perfil e Tarefas se atualizam sozinhas quando o painel admin muda algo (`js/events.js`).
- [ ] **B7 Conquistas de pets** (P) e, opcional, **2º espaço de pet liberado por nível** (dá um motivo extra para subir de nível).
- Substitui o **#8** (mais pets, pets que evoluem).

### Rascunho dos poderes (os números serão ajustados)
| Pet | Poder |
|---|---|
| **Fagulha** (a logo) | +10% de pontos em toda tarefa; muda de forma com o vínculo |
| Gato Cósmico | +15% em tarefas concluídas sem pausar o cronômetro (foco) |
| Cão Guardião | 1 **escudo por semana**: protege a sequência se você perder um dia |
| Dragão | +25% em tarefas de energia alta (8 ou mais) |
| Fênix Estelar | se a sequência quebra, recupera metade dela na próxima tarefa (1 vez por mês) |
| Robô Quântico | gera uma **missão do dia** extra com bônus; depois do #6, sugere o melhor horário |
| Unicórnio Mágico | **baú-surpresa** diário: 10 a 60 pontos ao concluir a 1ª tarefa do dia |

**Vínculo:** cada tarefa concluída com o pet ativo aumenta o vínculo; níveis de vínculo aumentam o poder e liberam acessórios.

### Equilíbrio da economia (conta feita)
Tarefa média = 65 pontos. Com 3 tarefas por dia (195 pontos/dia), **um bônus de 10% num pet de 1000 pontos leva ~51 dias para se pagar**, e 103 dias num pet de 2000. Isso não compensa, e percentual puro sobre pontos é fraco.
- **Meta:** o pet se paga em 2 a 3 semanas de uso normal.
- **Caminhos:** preços menores (300 a 800), bônus maiores (20 a 30%), e principalmente poderes que **valem mais que um percentual**: escudo de sequência, baú, missão do dia.
- O **nível do usuário conta só os pontos-base**: o bônus de pet não infla o nível.

## Fase 3 · Utilidade no dia a dia
- [ ] **#1 Estatísticas** (M): mapa de calor dos dias, tempo focado, tarefas por categoria, melhores dias, histórico de hábitos.
- [ ] **#3 Busca, ordenação e atrasadas** (P).
- [ ] **#2 Missão que respeita a rotina** (M): só sugere tarefas que cabem antes do próximo compromisso.
- [ ] **#5 Editar recompensas** (P).
- [ ] **#9 Subtarefas e notas** (M).
- [ ] **#7 Metas e desafios** (M): meta semanal e "missão do dia" (os pets entram aqui).
- [x] ~~**#4 Congelar sequência**~~: decidido, só como poder dos pets (veja a decisão 7). Entra no B5.
- [ ] **#6 Registro de energia ao longo do dia** (M/G): insights como "você rende mais de manhã" (o Robô usa).

## Fase 4 · Acabamento e acessibilidade
- [x] ~~Confete~~ trocado por **fagulhas de luz** (`js/celebrate.js`, sem biblioteca externa, funciona offline, com as cores do tema). Aparece ao concluir tarefa, subir o pet de nível, desbloquear conquista e comprar/resgatar.
- [ ] **#12 Cronômetro mais bonito** (P/M): anel de progresso e modo foco em tela cheia.
- [ ] **#13 Transições entre telas e telas vazias com ilustração** (P).
- [ ] **#14 Atalhos de teclado** (P): por exemplo **N** para nova tarefa.
- [ ] **#22 Setas nas abas e filtros; tamanho de texto ajustável** (P/M).
- [ ] **#21 Teste com leitor de tela de verdade** (P, feito por você no NVDA ou VoiceOver).
- [ ] **#26 Aviso de "nova versão disponível"** (P).
- [ ] **#19 Senha e painel admin** (P): trocar a senha escondida no código por algo melhor, ou remover o painel.
- [ ] **#24 Testes no navegador de verdade** (M): rodam na sua máquina. Eu não tenho navegador aqui, então não consigo executá-los, e isso me faria entregar testes sem ter visto passar. Por isso o guia de estilo (A0) e as suas capturas de tela são a nossa checagem visual.
- [ ] **#18 Sincronizar entre aparelhos** (G): só se você usar em mais de um aparelho. Exige servidor ou serviço externo.

## Atualização do visual (15/10/2026): feito no app
Você aprovou a paleta e pediu só cores e fonte. Ficou assim:
- **Papel (claro)** e **Grafite (escuro)** são dois temas **gratuitos e sempre disponíveis** em Perfil > Inventário (é assim que se alterna claro/escuro, sem botão novo). Padrão: Papel. A tela de login usa o último tema usado no aparelho.
- **Fonte dos títulos: Space Grotesk em todos os temas** (Papel, Grafite e os da Loja). **Só o Neon (clássico) usa Orbitron.** Corpo do texto continua Inter. O `styleguide.html` tem botões para comparar outras fontes sem mexer no app.
- O visual antigo virou **Neon (clássico)**, **vendido na Loja por 3500 pontos** (perto do Prata Lunar, 5000), com a fonte antiga (Orbitron). Quem já tinha conta ganhou o Neon de graça no inventário. Os temas antigos da Loja ficam como estavam (inclusive a fonte).
- Mudou o que era "decisão 1" abaixo: o Neon **não** é grátis, e não há modo automático (o aparelho não decide sozinho).
- Pendente (A5): redesenhar os 6 temas antigos da Loja. Pares de cor que ainda falham no contraste estão só neles (e no Neon).

## Decisões tomadas (15/10/2026)
Você me deixou decidir. Tudo abaixo é a minha escolha, com o motivo. **Dá para mudar qualquer uma; só a 8 depende de um fato seu e precisa de confirmação.**
1. **Aparência: Automático por padrão** (claro de dia, escuro se o aparelho estiver no escuro; dá para fixar Claro ou Escuro no Perfil). O visual atual vira o tema **"Neon (clássico)", grátis**. Quem já usa o app **continua no Neon** até trocar: ninguém acorda com o app diferente. Contas novas começam no estilo novo.
2. **Fonte serifada nos títulos: sim.** O protótipo A1 mostra 3 opções com a mesma tela (por exemplo Fraunces, Newsreader e DM Serif Display, todas livres) para você escolher olhando.
3. **Acento âmbar, com parcimônia.** Âmbar claro não tem contraste como texto sobre creme, então ele só aparece em preenchimentos, ícones e bordas, com texto escuro por cima. Nada de âmbar em texto pequeno.
4. **Poderes dos pets: rascunho aceito**, com um pet ativo por vez e o 2º espaço liberado por nível. Os números finais saem do cálculo de economia (preços de 300 a 800, poderes que valem mais que um percentual).
5. **Fagulha: pet inicial grátis para todos.** Ela é o mascote da logo e mostra o sistema de pets desde o primeiro dia. Liberar por sequência de 7 dias iria contra o tom "sem culpa" (perder um dia travaria o prêmio). O que cresce com o uso é o vínculo, não o acesso.
6. **Arte dos pets: silhuetas chapadas no estilo da logo, com uma cor de acento por pet.** Em SVG com `currentColor`, elas funcionam sozinhas no claro, no escuro e em qualquer tema, e cada pose nova custa pouco. O B3 começa com 1 pet nos dois estilos (chapado e colorido) para você confirmar antes de eu desenhar os outros.
7. **Congelar sequência: só como poder dos pets** (escudo semanal do Cão Guardião, Fênix). Como item avulso, o app passaria a vender alívio de uma pressão que ele mesmo criou. O **#4** sai da Fase 3 e é absorvido pelo B5.
8. **Vários aparelhos: assumi que NÃO** (confirme, por favor). Com isso o **#18 (sincronizar) fica fora do plano** e a barra lateral de computador (#11) segue com prioridade normal. O backup JSON é o jeito de levar dados de um aparelho para outro.

## Limites que você deve conhecer
- **Arte dos pets:** consigo desenhar personagens vetoriais simples e conferir como ficam, mas não tenho o acabamento de um ilustrador. Mostro prévias e ajustamos. Se preferir, você pode enviar ilustrações suas ou geradas por outra ferramenta, e eu integro.
- **Visual das telas:** não consigo ver o app rodando num navegador. Cada etapa visual depende da sua conferência.
- **Navegador de verdade:** não consegui abrir o app num navegador nem acessar o repositório do GitHub daqui (o site bloqueia acesso automatizado), então trabalhei no zip que você enviou.
- **Notificações com o app fechado** não dá para fazer sem servidor. **Timers em abas escondidas** podem atrasar o aviso sonoro (o tempo continua correto).

## Como trabalhar daqui para frente
- **Abra um chat novo** e cole `CONTEXTO.md` + este `ROADMAP.md`. Conversas muito longas pesam mais no plano.
- Peça uma fase ou item por vez (por exemplo, "Fase 0" ou "A1").
- Eu entrego **um zip só com os arquivos alterados** e um resumo curto, depois de rodar `npm test`.
