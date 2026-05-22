# Code Style

Short opinionated guide. When in doubt, run `npm run check`.

## Language

- **JavaScript, CommonJS.** No TypeScript. No ESM migration yet — see
  ADR 002 in [`engineering-decisions.md`](./engineering-decisions.md).
- Target Node ≥ 24. Use modern syntax: `const`/`let`, arrow functions,
  `??`, optional chaining, `Object.freeze`, etc.
- Prefer the `node:` import prefix for built-ins (`require('node:http')`).

## Formatting

- **Prettier** is the source of truth. Do not hand-format.
- Two-space indentation, single quotes, trailing commas where Prettier
  inserts them.

## Linting

- ESLint flat config (`eslint.config.js`).
- Zero warnings on PRs.

## Naming

- `camelCase` for functions, variables, methods.
- `PascalCase` for classes (e.g. `Match`).
- `SCREAMING_SNAKE_CASE` for true constants exported from a module
  (`ROWS`, `COLS`, `MATE_SCORE`, `DIFFICULTY`).
- Module-private helpers start with `_` when called only from inside a
  class (`_commit`, `_recordCapture`).

## Modules

- One concern per file. If a file is doing two things, split it.
- Pure engine modules (`board`, `moves`, `game`, `ai`, `pst`, `pieces`,
  `constants`) must not depend on `ws`, `node:http`, or anything else
  that performs I/O.
- The session layer (`session.js`) glues the engine and the AI together
  but still does no I/O.
- Only `server.js` may touch sockets, HTTP, and the filesystem.

## Comments

- Comments explain **why**, not **what**.
- Use JSDoc for non-trivial public functions (`@param`, `@returns`).
- Avoid block comments that restate the next ten lines of code.

## Errors

- Throw `Error` (or a subclass) only for programmer mistakes
  (`assert`-style invariants).
- For protocol-level failures (illegal move, bad message), return an
  `error` message using `makeErrorMessage` from `src/protocol.js`. Do
  not throw inside the WebSocket handler.
- Always send a stable string `code` with errors (see
  `ERROR_CODES`).

## Logging

- `console.log` for normal startup and per-event log lines.
- `console.error` for failures.
- No log framework. No log levels beyond log/error.
- Log lines should be short and grep-friendly.

## Immutability

- Treat function arguments as immutable unless the function name
  obviously mutates (`applyMove`, `_commit`).
- Freeze module-level config objects (`Object.freeze(DIFFICULTY)`).

## Tests

- `node:test` + `node:assert/strict`.
- Each test is independent (no shared mutable state).
- One assertion per concept; multiple assertions in one test are fine
  when they verify the same behavior.
