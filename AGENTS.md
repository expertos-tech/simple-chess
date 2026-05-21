# Simple Chess AGENTS

This repository is a browser-first Node.js chess variant. The CLI gameplay mode was removed. Do not reintroduce terminal gameplay unless explicitly requested. Use tests and the browser server as validation paths.

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

## 4. Fluxo de Desenvolvimento

Antes de alterar regras ou a arquitetura, leia:

- `src/constants.js`
- `src/board.js`
- `src/moves.js`
- `src/game.js`
- `test/` (sempre rode `npm test`)

---

## 5. Comandos Frequentes

| Comando          | Descrição                         |
| ---------------- | --------------------------------- |
| `npm start`      | Inicia o servidor web.            |
| `npm test`       | Executa os testes unitários.      |
| `npm run lint`   | Roda o ESLint.                    |
| `npm run format` | Roda o Prettier.                  |
| `npm run check`  | Roda lint, testes e format:check. |

---

## 6. Regras de Comunicação

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
