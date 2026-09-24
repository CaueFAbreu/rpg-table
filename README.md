# RPG Table

Mesa virtual para RPG de mesa, com sincronização em tempo real entre todos os participantes. Criado inicialmente para campanhas de Ordem Paranormal, o projeto também oferece predefinições para D&D 5e, Tormenta 20 e um modo genérico.

A aplicação é construída com React e utiliza Firebase Authentication (login anônimo) e Cloud Firestore para manter personagens, jogadores, rolagens, NPCs e iniciativa sincronizados.

## Funcionalidades

### Salas e jogadores

- Salas privadas identificadas por um código aleatório de 10 caracteres, sem caracteres ambíguos. O código funciona como convite: as regras do Firestore não permitem listar salas.
- Lobby para criar uma sala, escolhendo o sistema de jogo, ou entrar em uma sala existente pelo código. Quem cria a sala torna-se o mestre.
- Link de convite (`?sala=`) e QR code exibido na tela do mestre, destinado ao público.
- Modo visitante (`?visitante=1`): permite acompanhar a mesa e rolar dados, sem registrar presença nem criar personagens.
- Identificação de cada jogador por login anônimo do Firebase.
- Papel de mestre por sala, com possibilidade de transferência para outro jogador.
- Lista de jogadores com indicador de presença, com atualização espaçada para reduzir o consumo da cota do Firestore.

### Fichas de personagem

- Marcadores configuráveis (Vida, Sanidade, Esforço, PM etc.), com valores iniciais definidos pelo sistema da sala.
- Condições rápidas, com sugestões ("Sangrando", "Apavorado" etc.) ou texto livre.
- Ataques pré-configurados, com margem de crítico e multiplicador de dano.
- Inventário, link para a ficha completa e envio de avatar com recorte; as imagens são comprimidas antes de serem salvas.
- Criação, edição e exclusão de personagens pelo próprio jogador.

### Mesa

- Rolador de dados genérico, que respeita a regra de d20 de cada sistema (maior resultado ou soma).
- Histórico de rolagens sincronizado, exibindo as 50 mais recentes; o mestre pode limpar o histórico.
- Controle de iniciativa com personagens e NPCs, contagem de rodadas e passagem de turno.
- Navegação por abas ("Fichas" e "Mesa") em dispositivos móveis.

### Painel do mestre

- Pontos de Medo (regra da casa), visíveis apenas para o mestre.
- Visão geral de todos os personagens, com marcadores e condições de cada um.
- Remoção de jogadores (os personagens do jogador são excluídos junto) e readmissão posterior.

## Tecnologias

- React 19 com Create React App (`react-scripts`)
- Tailwind CSS 3
- Firebase Authentication, Cloud Firestore e Firebase Hosting
- react-easy-crop e qrcode
- Jest e Testing Library; `@firebase/rules-unit-testing` para as regras do Firestore

## Pré-requisitos

- Node.js 20 ou superior
- Um projeto no Firebase
- Firebase CLI, para deploy e para os testes das regras
- Java (JDK 21 ou superior), apenas para executar o emulador do Firestore

## Configuração local

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie o arquivo de ambiente a partir do exemplo:

   ```bash
   cp .env.example .env.local
   ```

   No Prompt de Comando do Windows, use `copy .env.example .env.local`.

3. Preencha o `.env.local` com a configuração do aplicativo Web do Firebase:

   ```env
   REACT_APP_FIREBASE_API_KEY=
   REACT_APP_FIREBASE_AUTH_DOMAIN=
   REACT_APP_FIREBASE_PROJECT_ID=
   REACT_APP_FIREBASE_STORAGE_BUCKET=
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
   REACT_APP_FIREBASE_APP_ID=
   ```

4. No Console do Firebase, habilite:

   - Authentication > Método de login > Anônimo
   - Firestore Database
   - Firebase Hosting, caso a publicação seja feita pelo Firebase

5. Inicie a aplicação:

   ```bash
   npm start
   ```

   A aplicação estará disponível em `http://localhost:3000`.

## Testes

Testes unitários dos utilitários e componentes em `src/`:

```bash
npm test -- --watchAll=false
```

Testes das regras de segurança do Firestore, executados contra o emulador local, sem acessar o projeto real:

```bash
npm run test:rules
```

Os testes das regras ficam em `tests/firestore.rules.test.js` e usam uma configuração própria do Jest (`jest.rules.config.js`).

### Integração contínua

O workflow `.github/workflows/ci.yml` executa os testes unitários e o build de produção a cada push e pull request. Para que o build tenha acesso ao Firebase, cadastre as variáveis `REACT_APP_FIREBASE_*` em **Settings > Secrets and variables > Actions**.

## Estrutura do projeto

```text
src/
├── App.js              Telas da aplicação (lobby, sala, acesso removido)
├── firebase.js         Inicialização do Firebase
├── hooks/
│   ├── useAuth.js          Login anônimo e nome do jogador
│   ├── useSala.js          Sala atual, convite, criação, entrada e saída
│   ├── usePresenca.js      Indicador de presença dos jogadores
│   ├── usePersonagens.js   Personagens da sala e personagem ativo
│   ├── useRolls.js         Histórico de rolagens e rolagens de ataque
│   └── useMestre.js        Pontos de Medo e remoção/readmissão de jogadores
├── components/         Ficha, rolador de dados, iniciativa, painel do mestre etc.
└── utils/              Regras de negócio puras (dados, marcadores, sistemas etc.), com testes
tests/
└── firestore.rules.test.js   Testes das regras de segurança
firestore.rules         Regras de segurança do Firestore
```

## Regras do Firestore

As regras de segurança ficam em `firestore.rules`. Antes de publicá-las, execute `npm run test:rules`. Para publicar somente as regras:

```bash
npm run deploy:rules
```

## Build e deploy

Os scripts de deploy exigem o Firebase CLI instalado e autenticado:

```bash
npm install -g firebase-tools
firebase login
```

| Comando | Descrição |
| --- | --- |
| `npm run build` | Gera o build de produção na pasta `build/` |
| `npm run deploy` | Gera o build e publica tudo no Firebase |
| `npm run deploy:hosting` | Gera o build e publica somente o Hosting |
| `npm run deploy:rules` | Publica somente as regras do Firestore |

## Como compartilhar uma sala

Crie uma sala pelo lobby ou entre com um código existente. Dentro da sala, clique em **Link** para copiar a URL de convite:

```text
https://seu-projeto.web.app/?sala=codigodasala
```

Quem abrir o link entra diretamente na sala. Para o público, o mestre dispõe de um QR code que leva ao modo visitante.

## Limitações conhecidas e próximos passos

- Substituir os ícones padrão do Create React App por uma identidade visual própria.
- As imagens são armazenadas comprimidas no próprio Firestore; para imagens maiores ou em maior quantidade, o ideal é migrar para o Firebase Storage.
- O modo visitante é uma restrição apenas da interface: as regras do Firestore não distinguem visitantes. Para torná-lo uma restrição efetiva, é necessário refleti-lo em `firestore.rules`.
- Ampliar a cobertura de testes para `App.js` e para os hooks; hoje os testes automatizados cobrem os utilitários, o painel do mestre e as regras do Firestore.
- Extrair para hooks a edição da campanha (nome, capa, combate e papel de mestre), os NPCs e a lista de jogadores, que ainda estão em `App.js`.
