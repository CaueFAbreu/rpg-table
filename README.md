# 🎲 RPG Table

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow?style=for-the-badge)

> Mesa virtual para sessões de RPG de mesa, desenvolvida em React. Focada no sistema **Ordem Paranormal RPG**, com gerenciamento de personagens, rolagem de dados, tracker de iniciativa e inventário — tudo salvo automaticamente no navegador.

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Como Executar](#-como-executar)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Autor](#-autor)

---

## 📖 Sobre o Projeto

Aplicação web para auxiliar sessões de RPG de mesa, especialmente voltada para o sistema **Ordem Paranormal**. Permite que múltiplos jogadores gerenciem seus personagens em tempo real na mesma tela, com fichas completas, rolador de dados customizável e controle de combate com iniciativa.

Todos os dados são persistidos automaticamente via **localStorage**, sem necessidade de banco de dados ou login.

---

## ✅ Funcionalidades

- [x] **Fichas de personagem** com Vida, Sanidade e Esforço com barras de progresso
- [x] **Edição inline** de todos os campos da ficha (clique direto para editar)
- [x] **Upload e recorte de avatar** com editor de imagem integrado (react-easy-crop)
- [x] **Rolador de dados** com suporte a expressões customizadas (ex: `2d8 + 1d4 + 5`)
- [x] **Detecção de crítico e falha crítica** no D20
- [x] **Histórico de rolls** com nome do personagem, expressão e resultado
- [x] **Tracker de iniciativa** com ordenação automática por valor
- [x] **Suporte a inimigos/NPCs** no tracker de iniciativa
- [x] **Controle de turnos** de combate (Iniciar, Passar Turno, Encerrar)
- [x] **Inventário** por personagem com adição e remoção de itens
- [x] **Criação de personagens** via modal com todos os atributos
- [x] **Imagem de capa** da campanha personalizável
- [x] **Persistência automática** via localStorage
- [ ] Modo multiplayer online (em desenvolvimento)
- [ ] Sistema de habilidades e rituais

---

## 🛠️ Tecnologias

- **React 19** — interface e gerenciamento de estado
- **Tailwind CSS 3** — estilização utilitária
- **react-easy-crop** — editor de recorte de imagens
- **localStorage** — persistência local dos dados

---

## 🚀 Como Executar

**1. Clone o repositório:**
```bash
git clone https://github.com/CaueFAbreu/rpg-table.git
cd rpg-table
```

**2. Instale as dependências:**
```bash
npm install
```

**3. Inicie o servidor de desenvolvimento:**
```bash
npm start
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

**Para build de produção:**
```bash
npm run build
```

---

## 📁 Estrutura do Projeto

```
📦 rpg-table
 ┣ 📂 public/
 ┃ ┗ 📄 index.html
 ┣ 📂 src/
 ┃ ┣ 📂 components/
 ┃ ┃ ┣ 📄 CharacterCard.jsx       # Ficha completa do personagem com edição inline
 ┃ ┃ ┣ 📄 DiceRoller.jsx          # Rolador de dados com suporte a expressões livres
 ┃ ┃ ┣ 📄 EditorImagem.jsx        # Modal de recorte de avatar (react-easy-crop)
 ┃ ┃ ┣ 📄 IniciativaTracker.jsx   # Tracker de iniciativa e controle de turnos
 ┃ ┃ ┣ 📄 Inventario.jsx          # Gerenciamento de inventário do personagem
 ┃ ┃ ┗ 📄 NovoPersonagem.jsx      # Modal de criação de personagem
 ┃ ┣ 📂 utils/
 ┃ ┃ ┗ 📄 ImagemEditada.js        # Utilitário de recorte de imagem via Canvas API
 ┃ ┣ 📄 App.js                    # Componente raiz com estado global e persistência
 ┃ ┗ 📄 index.js
 ┣ 📄 tailwind.config.js
 ┣ 📄 postcss.config.js
 ┗ 📄 package.json
```

---

## 👤 Autor

**Cauê F. Abreu**

[![GitHub](https://img.shields.io/badge/GitHub-CaueFAbreu-181717?style=flat&logo=github)](https://github.com/CaueFAbreu)

---

<p align="center">Feito com ☕, React e muitos dados de 20</p>
