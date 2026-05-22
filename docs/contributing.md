# Contributing

Thanks for considering a contribution to Mini Chess 5x7. The project
is intentionally small. The bar for new code is therefore high on
*clarity*, not on novelty.

## Philosophy

- **Browser-first.** The official entry point is `npm start`. Do not
  reintroduce a CLI mode.
- **Small and didactic.** Prefer the shortest readable solution. Avoid
  adding dependencies, build steps, or frameworks unless they buy
  something concrete.
- **Pure engine.** Anything under `src/board.js`, `src/moves.js`,
  `src/game.js`, `src/ai.js`, `src/pst.js`, `src/pieces.js` and
  `src/constants.js` must remain free of I/O.
- **Documentation is part of the product.** Engine or protocol changes
  must update the corresponding doc in the same PR.

See [`engineering-decisions.md`](./engineering-decisions.md) for the
trail of past decisions.

## Workflow

1. Fork and create a feature branch.
2. `npm install` then `npm run check` to confirm a clean baseline.
3. Make your change, with tests. Tests live in `test/*.test.js` and use
   `node:test`.
4. `npm run check` again before opening the PR.
5. Open a PR with a clear, functional description ("the AI now prefers
   captures on equal-score moves"), not a file-by-file changelog.

## Commit conventions

Commit messages use semantic prefixes in English:

- `feat:` user-facing functionality.
- `fix:` bug fix.
- `refactor:` no behavior change.
- `test:` tests only.
- `docs:` documentation only.
- `chore:` tooling, config, scripts.

Pattern: `type: short functional title`, followed by an optional
bullet list of functional bullets in the body.

Example:

```text
feat: expose AI difficulty over the WebSocket protocol

- Add easy / medium / hard levels (depth 1/2/3 + noise).
- Accept `?level=` query parameter at connection time.
- Allow `{ "type": "config", "level": ... }` mid-game.
- Document the new flow in docs/websocket-protocol.md.
```

## Code style

- Run `npm run format` before pushing. Prettier is the source of truth.
- Run `npm run lint`. Fix every warning unless you can justify it in
  the PR.
- Comments should explain *why*, not *what*. Avoid block comments that
  restate the code; favor short JSDoc on public functions.
- Prefer pure functions and immutable values. Mutating arguments must
  be obvious from the name (`applyMove`, `_commit`).
- Constants over magic numbers. Add to `src/constants.js` or to the
  closest module-private `const` if not shared.

## Tests

- Use `node:test` and `node:assert/strict`.
- One file per area (`game.test.js`, `ai.test.js`, …).
- Hand-build boards from `createBoard()` + cell assignments, not from
  notation strings. It is more verbose but unambiguous.
- Prefer property-style tests where useful (e.g. `parseMove(moveToStr(m))`
  round-trip). Do not pull in a property-testing library for it.

## Pull request checklist

- [ ] `npm run check` passes locally.
- [ ] New behavior has at least one test.
- [ ] Public API changes are documented in `docs/`.
- [ ] If the change is architectural, an ADR is added to
      `engineering-decisions.md`.
- [ ] Commit messages follow the convention above.

## Reporting issues

Open a GitHub issue with:

- What you did (steps to reproduce).
- What you expected.
- What happened (screenshots or logs welcome).
- Node version (`node --version`) and OS.

Security-sensitive issues: please do not open a public issue; email the
maintainer instead.
