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
