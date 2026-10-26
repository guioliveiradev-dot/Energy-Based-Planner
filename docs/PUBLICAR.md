# Publicar no GitHub Pages

O app é estático (sem build), então o GitHub Pages serve a pasta como está.
Endereço final: **https://guioliveiradev-dot.github.io/Energy-Based-Planner/**

## 1. Ligar o Pages (uma vez)
1. No GitHub, abra o repositório > **Settings** > **Pages**.
2. Em **Build and deployment**, escolha **Source: Deploy from a branch**.
3. Branch **main**, pasta **/ (root)**, clique em **Save**.
4. Espere 1 a 2 minutos e abra o endereço acima. A cada `git push` na `main`, o site atualiza sozinho.

## 2. Levar seus dados (importante)
Os dados ficam no navegador e são **separados por endereço**: o que você tem no `localhost:5500` não aparece no endereço novo.
1. No `localhost:5500`: **Perfil > Exportar Dados** (baixa um .json).
2. No endereço do GitHub Pages: crie a conta (com o mesmo e-mail) e vá em **Perfil > Importar Dados**.
3. Confira a contagem na janela e confirme. Tema e pet comprados vão junto no arquivo.

Não apague os dados do `localhost` até conferir que tudo chegou.

## 3. Testar no celular de verdade
- **Android (Chrome):** abra o endereço, menu ⋮ > **Instalar app** (ou "Adicionar à tela inicial").
- **iPhone (Safari):** botão Compartilhar > **Adicionar à Tela de Início**.
- Abra pelo ícone novo, entre, crie uma tarefa e feche o app. Abra de novo: a tarefa deve estar lá.
- Ligue o modo avião e abra o app: ele deve abrir (cópia offline) depois de ter sido aberto uma vez com internet.
- Em **Perfil**, veja o cartão "Proteção dos dados". Se aparecer "Ainda não protegido", toque em **Proteger armazenamento**.
  No Chrome, ter o app instalado ajuda o navegador a aceitar.

## 4. Publicar uma atualização (e avisar quem está com o app aberto)
Antes de cada `git push` com mudanças, rode **uma vez**:

```
npm run release
```

Ele roda os testes; se tudo passar, carimba uma versão nova (`version.json` e `js/version.js`). Depois:

```
git add .
git commit -m "sua mensagem"
git push
```

O que acontece com seus amigos: o app confere a versão publicada ao abrir, a cada 15 minutos, ao voltar para a aba e quando a internet volta. Se for diferente da que está rodando, aparece um aviso calmo no topo: **"Versão nova disponível"**, com **Atualizar agora** e **Depois**. O app nunca recarrega sozinho. Em **Perfil > Verificar atualização** dá para conferir na hora (e ver o número da versão).

Se você esquecer o `npm run release`, o app continua atualizando normalmente na próxima abertura, só não aparece o aviso para quem já estava com ele aberto.

Se mesmo assim alguém ficar com a versão antiga: recarregue com **Ctrl+Shift+R** ou aumente `VERSION` em `sw.js`. O Pages pode levar alguns minutos para entregar o arquivo novo.

## O que já foi conferido por teste
- Nenhum arquivo usa endereço começando com `/` (que quebraria na subpasta).
- O manifest e todos os ícones usam caminhos relativos e os arquivos existem.
- O `.nojekyll` evita que o GitHub processe os arquivos como site Jekyll.

## Painel admin no site publicado
O painel admin (8 toques em "Home") **só abre no seu computador** (`localhost`). No endereço do GitHub Pages ele fica desligado de propósito, para ninguém mexer nos dados por ali. Se quiser liberar para amigos testarem, acrescente o endereço em `ADMIN_HOSTS`, no arquivo `js/config.js`.
