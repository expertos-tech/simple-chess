# Roadmap

This document captures *what we plan to do next* and *what we have
explicitly chosen not to do*. It is a living document — open a PR to
suggest additions.

## Recently shipped

- Extraction of `Match` into `src/session.js` (decoupled state from
  transport).
- Stable WebSocket protocol with version, validation, and error codes
  in `src/protocol.js`.
- AI: piece-square tables, MVV-LVA move ordering, mate-distance,
  configurable difficulty (`easy` / `medium` / `hard`).
- `Origin` allow-list on the WebSocket upgrade.
- Documentation set: `ai.md`, `websocket-protocol.md`, `game-engine.md`,
  `development.md`, `contributing.md`, `code-style.md`, this roadmap.

## Next up (small, useful)

- **AI benchmark script.** `scripts/bench-ai.js` to run AI-vs-AI for
  N games and report time/move, decisive-game rate, and average move
  count.
- **Quiescence search.** A tiny capture-only extension at the leaves
  to remove horizon-effect blunders.
- **Property-style tests.** A small generator of legal positions so we
  can fuzz `parseMove ↔ moveToStr` and `applyMove` undo equivalence.
- **More rules.** Insufficient material (K vs K, K+N vs K, K+B vs K),
  fifty-move rule, threefold repetition. Track in `Match`.
- **Spectator mode.** A read-only WebSocket endpoint that streams state
  for a given match id (preparation for future networked play, without
  actually shipping multiplayer).

## Medium term

- **Move logger.** Log all moves to a structured file so games can be
  replayed and used as test fixtures.
- **Opening hints for 5×7.** A small hand-written table of solid opening
  moves shown as suggestions in the UI (not enforced).
- **Accessibility pass on the UI.** Keyboard navigation, ARIA labels,
  focus management.

## Things we have intentionally not picked up

These are good ideas in general, but out of scope for the project's
"small, didactic, browser-first" identity. Reopen the discussion only
with a compelling reason.

- **TypeScript migration.** The current codebase is ~600 lines of
  CommonJS. The TS toolchain cost outweighs the typing benefit at this
  size. We rely on JSDoc and `node --check` for safety.
- **Bundler.** The UI is a single HTML file with Vue from a CDN. Adding
  Vite/webpack would multiply complexity for no user-visible win.
- **Framework swap.** Vue stays. React / Svelte / Solid are not
  considered.
- **Runtime swap.** Node stays. Deno / Bun are not considered.
- **Real-time multiplayer.** Two-human play over the network would
  require accounts, matchmaking, anti-cheat, and persistence. None of
  those fit the scope.
- **Persistent storage.** No database. Match state lives in memory for
  the duration of a WebSocket connection. The next match is a fresh
  `Match` object.
- **Authentication.** No accounts, no sessions, no cookies.
- **Heavy AI features.** Transposition tables, Zobrist hashing,
  iterative deepening, NNUE, opening books. See `ai.md` § 11 for the
  reasoning.
- **CLI / terminal mode.** Removed in ADR 008 and not coming back.

## How to propose a change

Open an issue describing the user-visible problem and the proposed
direction. If it lands, the change should:

1. Update this roadmap.
2. Add an ADR to `engineering-decisions.md` if the change is
   architectural.
3. Carry tests and documentation in the same PR.
