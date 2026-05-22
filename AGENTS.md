# Mini Chess 5x7 — Guia para Agentes

Este repositório é uma variante de xadrez 5x7 **browser-first** em Node.js. O modo terminal/CLI foi removido e não deve ser reintroduzido sem solicitação explícita. Use os testes (`npm test`) e o servidor browser (`npm start`) como caminhos oficiais de validação.

Nome público do produto: `Mini Chess 5x7`. Nome do pacote/repositório: `mini-chess-5x7`. Não reintroduza o nome antigo `Simple Chess`.

---

## 1. Contexto

Variante compacta de xadrez 5×7 (5 colunas, 7 linhas) rodando como servidor Node.js com interface Vue 3 no navegador.

## 2. Tecnologias principais

- **Backend**: Node.js 24+, biblioteca `ws` para WebSockets.
- **Frontend**: Vue 3 carregado via CDN em `public/index.html`.
- **Lógica de jogo**: geração de movimentos pura e IA Minimax/Alpha-Beta em `src/`.

---

## 3. Estrutura de arquivos

```
src/
  constants.js   ROWS, COLS, FILES
  board.js       estado do tabuleiro (matriz 7x5) e operações puras
  moves.js       movimentos pseudo-legais, legais e detecção de xeque
  game.js        parser de coordenadas e status (ongoing/mate/stalemate)
  pieces.js      tabelas de valor (display e engine)
  pst.js         piece-square tables para a avaliação da IA
  ai.js          minimax + alpha-beta + ordenação de jogadas
  protocol.js    constantes e validação do protocolo WebSocket
  session.js     classe Match (estado de uma partida)
  server.js      servidor HTTP + WebSocket (entrypoint)
public/
  index.html     UI Vue 3 single-page
test/
  *.test.js      testes com node:test
docs/
  *.md           documentação técnica
```

---

## 4. Convenção de commits

Mensagens em **inglês**, com prefixo semântico:

- `feat`: nova funcionalidade.
- `fix`: correção de bug.
- `docs`: documentação.
- `refactor`: mudança sem alteração de comportamento.
- `test`: testes.
- `chore`: ferramental, scripts, configuração.

Estrutura: `type: short functional title`, seguido (quando útil) por bullets descrevendo o impacto funcional.

Exemplo:

```txt
feat: expose AI difficulty via the WebSocket protocol
- Add `easy`, `medium`, `hard` levels mapped to depths 1/2/3
- Add tiny score noise on easy/medium so games vary
- Document the new `config` message in docs/websocket-protocol.md
```

---

## 5. Diretrizes funcionais

- **Foco no produto**: descreva mudanças pela experiência ("o jogo começa mais rápido"), não pelos arquivos.
- **Idioma**: inglês para commits e changelogs; português para documentação interna (este arquivo, comentários voltados a contribuidores).
- **Simplicidade**: evite overengineering. O escopo é uma variante 5×7 didática, browser-first.
- **Sem CLI**: não recrie `src/cli.js` ou `src/display.js`.
- **Sem framework pesado**, sem TypeScript, sem banco de dados, sem multiplayer real — veja `docs/roadmap.md` para a lista oficial de não-objetivos.

---

## 6. Fluxo de desenvolvimento

Antes de alterar regras ou arquitetura, leia, na ordem:

1. `src/constants.js`
2. `src/board.js` e `src/moves.js`
3. `src/game.js`
4. `src/session.js` e `src/protocol.js`
5. `src/ai.js`
6. `test/` (sempre execute `npm test`)
7. `docs/architecture.md` e `docs/game-engine.md`

Para mudanças na IA, leia também `docs/ai.md`. Para mudanças no protocolo WebSocket, leia `docs/websocket-protocol.md` e atualize-o no mesmo PR.

---

## 7. Comandos frequentes

| Comando             | Descrição                                       |
| ------------------- | ----------------------------------------------- |
| `npm start`         | Inicia o servidor browser em http://localhost:3000 |
| `npm run dev`       | Mesmo que `start` com `node --watch` (auto-reload) |
| `npm test`          | Executa os testes unitários (`node --test`)     |
| `npm run lint`      | Roda o ESLint                                   |
| `npm run format`    | Aplica o Prettier                               |
| `npm run check`     | Lint + testes + format:check                    |

---

## 8. Regras de comunicação

- Responda em **português** por padrão.
- Use linguagem direta e técnica.
- Referencie arquivos pelo caminho completo (ex: `src/server.js`).
- Cite linhas (`src/ai.js:42`) quando for útil.

---

## 9. Visão geral do projeto

**Tabuleiro**: 5 colunas (`a-e`) × 7 linhas (`1-7`). Sem roque. Sem en passant. Peões andam uma casa por vez. Promoção para torre.

**Posição inicial**:

- Brancas (linha 1): Bispo (a1), Cavalo (b1), Rei (c1), Cavalo (d1), Torre (e1).
- Negras (linha 7): Torre (a7), Cavalo (b7), Rei (c7), Cavalo (d7), Bispo (e7).
- Peões: linha 2 (brancas) e linha 6 (negras).

**Arquitetura**:

```
Browser UI → WebSocket server → Match (session) → game engine → AI / move generation
```

- `src/server.js` — servidor HTTP + WebSocket (apenas transporte).
- `src/session.js` — classe `Match`, estado de uma partida.
- `src/protocol.js` — constantes e validação de mensagens WebSocket.
- `src/board.js`, `src/moves.js`, `src/game.js` — engine pura.
- `src/ai.js`, `src/pst.js`, `src/pieces.js` — IA.
