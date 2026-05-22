# Engineering Decisions

## 001 - Node.js baseline

Decision:

- Use Node.js 24 LTS as the project baseline.
- Set `package.json` engines to `>=24`.
- Provide `.nvmrc` as `24`.

Rationale:

- Node 24 is the conservative LTS baseline for production stability in 2026.
- Node 26 is Current and is expected to enter LTS in October 2026.

Sources:

- https://nodejs.org/en/about/previous-releases

## 002 - Modules (CommonJS vs ESM)

Decision:

- Keep the codebase in CommonJS in this wave.

Rationale:

- The current repo already uses `require` and `module.exports` consistently.
- Avoid a noisy migration while focusing on tests, scripts, and consistency.

## 003 - Test runner

Decision:

- Use Node's built-in test runner (`node --test` / `node:test`).

Rationale:

- Avoids adding Jest/Vitest for a small project.

Sources:

- https://nodejs.org/api/test.html

## 004 - Lint and formatting

Decision:

- Use ESLint with flat config (`eslint.config.js`).
- Use Prettier installed locally with repo config.

Sources:

- https://eslint.org/docs/latest/use/configure/configuration-files-new
- https://prettier.io/docs/en/install

## 005 - Browser auto-open

Decision:

- Do not auto-open a browser from the server.

Rationale:

- The previous `open` invocation is macOS-specific and can fail on other OSes.
- Printing the URL is predictable and cross-platform.

## 006 - Queen and en passant support

Decision:

- Remove unused code paths related to queens and en passant.

Rationale:

- Rules and initial position have no queens.
- The engine does not generate en passant moves.

## 007 - Official board size changed to 5x7

Decision:
The game is now officially a 5x7 chess variant.

Rationale:
The previous 5x8 setup with two rooks per side made rooks too dominant on a compact board. The 5x7 setup with one rook, one bishop, two knights and the king centered between the knights creates a more tactical and balanced game (originally implemented for Simple Chess 5x7).

Consequences:

- Board rank range is now 1-7.
- Initial board has 7 rows.
- White back rank is B N K N R.
- Black back rank is r n k n b.
- Promotion rows are 0 for White and ROWS - 1 for Black.

## 008 - Browser-first 5x7 game

Decision:
The project is now officially a browser-first 5x7 chess variant (originally implemented for Simple Chess 5x7). The terminal gameplay mode was removed.

Rationale:
The browser UI is the product experience. The previous CLI mode was useful during early engine validation, but keeping it as a public mode created duplicated documentation, extra scripts, and unnecessary maintenance. The engine remains fully testable through automated tests.

Consequences:

- `npm start` now runs the web server.
- `src/cli.js` and `src/display.js` were removed.
- The official architecture is Browser UI -> WebSocket server -> game engine.
- The official board size is 5x7.

## 009 - Project renamed to Mini Chess 5x7

Decision:
The project was renamed from Simple Chess 5x7 to Mini Chess 5x7.

Rationale:
Mini Chess 5x7 better communicates that this is a compact chess variant, not only a simplified implementation. The `5x7` suffix keeps the name precise and avoids ambiguity with other mini chess variants.

Consequences:

- Repository name is now `mini-chess-5x7`.
- Package name is now `mini-chess-5x7`.
- Public title is now `Mini Chess 5x7`.
- Documentation, GitHub Pages links, and clone commands must use the new name.

## 010 - Match class owns per-game state

Decision:

- Per-game state lives in `src/session.js` inside a `Match` class.
- `src/server.js` is reduced to transport: HTTP, WebSocket upgrade, message dispatch.

Rationale:

- The previous `server.js` accumulated board, turn flag, captures, history, AI configuration, and the per-message dispatcher in a single ~300-line file.
- Separating session state from transport makes the engine pipeline reusable (tests, future scripts, benchmarks) without coupling to `ws`.

Consequences:

- The engine + AI + session form a pure pipeline driven by `Match.*` calls.
- Server-side validation and Origin checks are the only concerns left in `server.js`.

## 011 - WebSocket protocol extracted into its own module

Decision:

- All WebSocket message types, validators, error codes, and the difficulty table live in `src/protocol.js`.
- Outbound messages are constructed via `makeStateMessage`, `makeValidMovesMessage`, `makeErrorMessage`.
- A `PROTOCOL_VERSION` integer is exported and included in every `state` message.

Rationale:

- The protocol used to be stringly typed and validated inline. Moving it into a module gives a single source of truth that both the server and the documentation point at.
- A protocol version lets future clients fail fast if the server changes incompatibly.

Consequences:

- Adding or renaming a message type is a one-file change plus a doc update.
- `docs/websocket-protocol.md` is generated from the same vocabulary the code uses.

## 012 - Origin allow-list on WebSocket upgrade

Decision:

- The WebSocket server rejects upgrade requests whose `Origin` is not in `DEFAULT_ALLOWED_ORIGINS` (localhost variants and `https://expertos-tech.github.io`).
- The allow-list is overridable via the `ALLOWED_ORIGINS` environment variable.

Rationale:

- The previous server accepted any Origin, which made it possible for arbitrary web pages to connect to a local instance via cross-site WebSocket hijacking.
- A small allow-list is sufficient for a single-player local game and costs almost nothing.

Consequences:

- Hosting the UI on a new domain requires updating `ALLOWED_ORIGINS` or extending the default list.
- Non-browser clients (curl, integration tests) that do not send an `Origin` are still accepted, which matches the threat model.

## 013 - AI evaluation uses piece-square tables and MVV-LVA ordering

Decision:

- The evaluator combines material (`AI_PIECE_VALUES`), piece-square tables (`src/pst.js`), and pseudo-mobility (`pseudoMoves`).
- The search orders moves with MVV-LVA before recursing.

Rationale:

- Material-only evaluation made the AI ignore positional considerations entirely (e.g. central knights, advanced pawns).
- Without move ordering, alpha-beta pruning was nearly worthless because random move order rarely produced cutoffs.

Consequences:

- The AI is noticeably stronger at hard, without raising the search depth.
- Adding new piece types in the future requires both an entry in `AI_PIECE_VALUES` and a PST.

## 014 - Configurable AI difficulty (easy / medium / hard)

Decision:

- Three levels are exposed through the protocol: `easy` (depth 1, noise 5), `medium` (depth 2, noise 2), `hard` (depth 3, noise 0).
- The level can be set per connection via `?level=` or mid-game via a `config` message.

Rationale:

- A single, fixed AI strength frustrates beginners and bores stronger players.
- Adjusting depth alone is too coarse; small score noise on easy/medium adds variety without making the AI obviously bad.

Consequences:

- Easy/medium are non-deterministic by design; tests for AI behavior pass `{ noise: 0 }` explicitly.

## 015 - AI evaluator uses pseudo-mobility, not legal mobility

Decision:

- The mobility term in `evaluate` calls `pseudoMoves(board, whiteTurn)` instead of `getLegalMoves`.

Rationale:

- `getLegalMoves` clones the board for every candidate move to filter out moves that leave the king in check. Calling it from inside `evaluate` made every leaf evaluation O(b · clone), which dominated the search cost.
- Pseudo-mobility is an approximation but is cheap and self-cancelling across symmetric positions.

Consequences:

- The search is several times faster at depth 3.
- The eval can be slightly noisy when one side has many pseudo-legal but illegal moves (e.g. pinned pieces). The effect is small enough to be acceptable for a didactic engine.
