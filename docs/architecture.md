# Architecture

Mini Chess 5x7 is a small, browser-first Node.js application. This
document describes the runtime topology, the responsibilities of each
layer, and the data flow between them.

For module-level detail on the engine see
[`game-engine.md`](./game-engine.md); for the wire format see
[`websocket-protocol.md`](./websocket-protocol.md); for the AI see
[`ai.md`](./ai.md).

---

## 1. Runtime topology

```text
+------------------------+         +-----------------------------+
|        Browser         |         |       Node.js process       |
|                        |         |                             |
|  Vue 3 single-file UI  | <-----> |  HTTP server (static files) |
|  (public/index.html)   |   WS    |  WebSocket server (ws)      |
|                        |         |     |                       |
|                        |         |     v                       |
|                        |         |  Match (src/session.js)     |
|                        |         |     |                       |
|                        |         |     v                       |
|                        |         |  Game engine + AI (pure)    |
+------------------------+         +-----------------------------+
```

One Node.js process serves both the HTML and the WebSocket. One
`Match` instance lives per WebSocket connection. The engine and the
AI are pure functions called from `Match`.

---

## 2. Layers

The codebase is split into three layers, each with a single
responsibility and a strict downstream-only dependency rule.

### 2.1 Transport — `src/server.js`

- Spawns an `http.Server` serving `public/`.
- Upgrades to WebSocket via `ws` and validates the `Origin` header
  against an allow-list.
- Reads `?side=` and `?level=` from the connection URL.
- Creates one `Match` per connection.
- For each inbound message: validates with `validateInbound`, dispatches
  to the right `Match` method, sends back a `state` or `error`.
- Knows nothing about chess rules.

### 2.2 Session — `src/session.js`

- `Match` class holds: board, whose-turn flag, captures, move history,
  AI configuration.
- Methods: `reset`, `setLevel`, `playerToMove`, `status`,
  `legalMovesForPlayer`, `legalMovesFrom`, `findLegalMove`,
  `applyPlayerMove`, `applyAiMove`, `snapshot`.
- Calls into the engine and AI but performs no I/O.
- Defines the contract between transport and engine.

### 2.3 Engine + AI (pure) — `src/board.js` … `src/ai.js`

- Pure functions. No I/O, no globals, no timers.
- `board`, `moves`, `game` form the rules layer.
- `ai`, `pst`, `pieces` form the decision layer.
- Driven by `Match` (in production) and by unit tests (in CI).

### 2.4 Constants and protocol

- `src/constants.js` holds board dimensions and file names.
- `src/protocol.js` holds WebSocket message types, validation, and the
  difficulty table. It is the contract between server and browser.

### 2.5 UI — `public/index.html`

- A single static file, served as-is. No bundler.
- Vue 3 loaded from a CDN.
- Reads `state` / `validMoves` / `error` messages and renders the
  board. Sends `getMoves` / `move` / `reset` / `config` back.

---

## 3. Data flow

A typical player-then-AI turn:

```text
Player clicks pawn
  → ws.send { type:"getMoves", row, col }
    → server.onmessage → validateInbound → Match.legalMovesFrom
    ← server.send  { type:"validMoves", fromRow, fromCol, moves }
Player clicks destination
  → ws.send { type:"move", fromRow, fromCol, toRow, toCol }
    → server.onmessage → validateInbound
        → Match.findLegalMove → Match.applyPlayerMove
            ← server.send { type:"state", ... }      (after player move)
        → Match.applyAiMove   (synchronous, blocks the event loop briefly)
            ← server.send { type:"state", ... }      (after AI move)
```

The server is **authoritative**: the browser never decides whether a
move is legal — it only renders what the server says.

---

## 4. Concurrency model

- The server is single-threaded and synchronous within a request.
- Each WebSocket connection has its own `Match`. Matches do not share
  state.
- The AI runs synchronously inside the message handler. At depth 3 on
  5×7 this is fast enough (tens of milliseconds) to be invisible to
  the user.
- There is no shared mutable state across connections. Multiple browser
  tabs play independent games against independent AI instances.

This is deliberate: any introduction of cross-connection state (e.g. a
lobby, a leaderboard) should be designed as an explicit module, not
bolted on as globals.

---

## 5. What lives where, summarized

| Concern                         | Lives in                       |
| ------------------------------- | ------------------------------ |
| Board representation, mutation  | `src/board.js`                 |
| Move generation, attack maps    | `src/moves.js`                 |
| Game-over detection, parsing    | `src/game.js`                  |
| Search, evaluation, ordering    | `src/ai.js`, `src/pst.js`      |
| Piece codes and values          | `src/pieces.js`                |
| Per-match state                 | `src/session.js`               |
| WebSocket protocol contract     | `src/protocol.js`              |
| HTTP + WebSocket transport      | `src/server.js`                |
| UI                              | `public/index.html`            |

---

## 6. Non-goals

- Multi-player networked play (no two browsers play each other today).
- Persistence (no database, no save/load).
- Authentication.
- Pluggable engines.

See [`roadmap.md`](./roadmap.md) for the full not-doing list.
