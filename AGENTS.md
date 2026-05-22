# Mini Chess 5x7 AGENTS

This repository is a browser-first Node.js chess variant. The CLI gameplay mode was removed. Do not reintroduce terminal gameplay unless explicitly requested. Use tests and the browser server as validation paths. Use `Mini Chess 5x7` as the public product name and `mini-chess-5x7` as the repository/package name. Do not reintroduce `Simple Chess` as the current project name.

---

## 1. Contexto

Variante de xadrez 5x7 rodando em Node.js com UI em Vue (browser).

## 2. Tecnologias Principais

- **Backend**: Node.js 24+, `ws` (WebSockets).
- **Frontend**: Vue 3 (via CDN em `public/index.html`).
- **Lógica de Jogo**: Geração de movimentos e IA Minimax (`src/`).

---

## 3. Estrutura de Arquivos

- `src/board.js`: Estado do tabuleiro (matriz 7x5).
- `src/moves.js`: Regras de movimento e detecção de xeque.
- `src/game.js`: Parser de coordenadas e status do jogo.
- `src/ai.js`: Inteligência artificial.
- `src/server.js`: Servidor WebSocket (entrypoint).
- `src/constants.js`: Constantes globais (ROWS, COLS, etc).
- `public/index.html`: UI do navegador.

---

## 4. Commit Message Convention

This project follows a semantic and functional commit pattern. Commits must be written in **English**.

- **Structure**: `type: short functional title` followed by a list of detailed bullets.
- **Tone**: Focus on "what" and "why" from a functional perspective rather than just listing files.
- **Types**:
  - `feat`: New features or rules.
  - `fix`: Bug fixes.
  - `docs`: Documentation updates.
  - `refactor`: Code changes that neither fix a bug nor add a feature.
  - `test`: Adding or updating tests.

**Example:**

```txt
feat: update initial board setup
- Change pieces to B-N-K-N-R formation
- Center the king between two knights
- Update rules documentation to match new layout
```

---

## 5. Functional Guidelines

- **Product First**: When describing changes, prioritize how they affect the game experience (e.g., "The game now starts faster" instead of "Optimized loop in server.js").
- **Language**: Use English for commits, changelogs, and internal documentation (like this section).
- **Simplicity**: Avoid over-engineering. Stick to the requested 5x7 browser-first scope.

---

## 6. Fluxo de Desenvolvimento

Antes de alterar regras ou a arquitetura, leia:

- `src/constants.js`
- `src/board.js`
- `src/moves.js`
- `src/game.js`
- `test/` (sempre rode `npm test`)

---

## 7. Comandos Frequentes

| Comando          | Descrição                         |
| ---------------- | --------------------------------- |
| `npm start`      | Inicia o servidor web.            |
| `npm test`       | Executa os testes unitários.      |
| `npm run lint`   | Roda o ESLint.                    |
| `npm run format` | Roda o Prettier.                  |
| `npm run check`  | Roda lint, testes e format:check. |

---

## 8. Regras de Comunicação

- Responda em Português por padrão.
- Use linguagem direta e técnica.
- Referencie arquivos pelo path completo (ex: `src/server.js`).

---

## Project Overview

Browser-first 5x7 chess variant.

**Board:** 5 columns (a-e) x 7 rows (1-7). No castling. No en passant. Pawns move one square. Promotion to rook.

**Initial position:**

- White (row 1): Bishop(a1) Knight(b1) King(c1) Knight(d1) Rook(e1)
- Black (row 7): Rook(a7) Knight(b7) King(c7) Knight(d7) Bishop(e7)
- Pawns: row 2 (White) / row 6 (Black)

**Architecture:**

- Browser UI -> WebSocket server -> game engine -> AI / move generation
- `src/server.js` - HTTP/WebSocket server
- `src/board.js` - 7x5 matrix state
- `src/moves.js` - legal move generation
- `src/ai.js` - Minimax Alpha-Beta pruning
- `src/game.js` - turn management and status detection
