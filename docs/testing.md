# Testing

The project uses Node's built-in test runner (`node:test`). Tests live
in `test/` and are run with:

```bash
npm test
```

## Philosophy

- **Tests are documentation.** Each test name should describe a
  behavior, not an internal detail.
- **Hand-build positions.** Tests start from `createBoard()` and assign
  cells explicitly. This is more verbose than parsing strings, but it
  is unambiguous and survives refactors of the parser.
- **No mocks.** The engine is pure; nothing needs mocking. The session
  layer is also pure. The server is the only layer that touches I/O,
  and it is tested via a real WebSocket client when needed.
- **One test file per concern.** New rules → new test file or new test
  in the closest existing one. Resist mega-files.

## Current test suite

| File                     | Covers |
| ------------------------ | ------ |
| `test/board.test.js`     | Board factory, deep clone, applyMove, coordinate conversion. |
| `test/moves.test.js`     | Pseudo-legal and legal move generation per piece. |
| `test/game.test.js`      | Coordinate parsing, basic game status. |
| `test/status.test.js`    | Checkmate / stalemate / ongoing detection, parse round-trip. |
| `test/ai.test.js`        | AI returns legal moves, prefers obvious captures, finds smothered mate-in-1. |
| `test/protocol.test.js`  | Validator, message factories, error codes, difficulty levels. |
| `test/session.test.js`   | `Match` lifecycle: reset, apply, rejection of illegal moves, AI reply. |

## Conventional matrix

When adding tests, aim to cover this matrix for any new rule or piece:

- **Legality**: the move generator includes the move when it should.
- **Illegality**: the move generator excludes the move when it should.
- **King safety**: the move is filtered out when it leaves the king in
  check.
- **Capture**: capturing variants are generated and recorded.
- **Edge of board**: behavior on rows/cols 0 and the maxima.
- **End of game**: positions that should be mate/stalemate are
  classified correctly.

For the AI, the matrix is:

- **Returns legal moves only** in any position.
- **Prefers winning material** when material gain is obvious.
- **Finds short mates** when they exist within search depth.
- **Returns `null`** when there are no legal moves.

For the protocol, the matrix is:

- **Accepts** each well-formed inbound message.
- **Rejects** missing or out-of-range fields with the expected
  `ERROR_CODE`.
- **Frames** outbound messages with the required `type` and (for
  `state`) `protocolVersion`.

## Suggested additions

These are not required today but would tighten coverage and are tracked
in [`roadmap.md`](./roadmap.md):

- A property-style test for `parseMove(moveToStr(m))` round-trip across
  a generated set of pseudo-legal moves on random positions.
- A property-style test for `applyMove` reversibility (apply on a clone,
  compare to original).
- A server smoke test that opens a real `ws` client on an ephemeral
  port, plays a few moves, and asserts on the responses.
- A test that exercises `?level=` and the `config` message and asserts
  the resulting `aiDepth` / `aiNoise` on the `Match`.

## Conventions

- `node:test` + `node:assert/strict`. No `chai`, no `expect`.
- One assertion per concept; multiple assertions per test are fine when
  they verify the same behavior.
- Test names start with the subject and a verb:
  - `"getStatus detects checkmate (back-rank mate)"`
  - `"AI prefers capturing a free rook over a quiet move"`
- Avoid sharing state between tests. Each test starts from a fresh
  board.

## Running a single file

```bash
node --test test/ai.test.js
```

## Running with a watcher

```bash
node --test --watch
```

(Node ≥ 24 supports `--watch` natively for the test runner.)
