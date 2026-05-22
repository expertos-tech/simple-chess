# Game Engine

The Mini Chess 5x7 engine is the **pure**, transport-agnostic core of
the project. It knows nothing about WebSockets, browsers, or sessions.
It only knows about boards, pieces, moves, and game status.

This is what makes the engine easy to test (`node --test`) and easy to
reason about — the same functions that decide whether a move is legal
during real play are the ones called from unit tests.

---

## 1. Module map

| Module                | Responsibility |
| --------------------- | -------------- |
| `src/constants.js`    | `ROWS`, `COLS`, `FILES`. |
| `src/pieces.js`       | Piece display values and AI material values. |
| `src/board.js`        | Board factory, deep clone, applying moves, coordinate helpers. |
| `src/moves.js`        | Pseudo-legal moves, legal moves, check / attack detection. |
| `src/game.js`         | Coordinate parsing and game status (`ongoing` / `*_wins` / `stalemate`). |
| `src/pst.js`          | Piece-square tables used by the evaluator. |
| `src/ai.js`           | Negamax search, evaluation, MVV-LVA ordering. |

All seven modules are pure: no I/O, no globals, no timers. Anything
stateful (a match, a connection, a clock) lives outside the engine in
[`src/session.js`](../src/session.js) or higher layers.

---

## 2. Board representation

A board is a plain JavaScript array of length `ROWS=7`, each row an
array of length `COLS=5`. Each cell is a single character:

- `.` — empty square.
- Uppercase: White piece.
- Lowercase: Black piece.

Piece codes: `K/k` king, `R/r` rook, `B/b` bishop, `N/n` knight,
`P/p` pawn.

Coordinates:

- **Row 0** is the top of the displayed board (Black's back rank).
- **Row 6** is the bottom (White's back rank).
- **Column 0** is file `a`; **column 4** is file `e`.

Algebraic notation is built from `FILES = ['a','b','c','d','e']` and
rank = `ROWS - row` (so row 6 ↔ rank 1, row 0 ↔ rank 7).

### 2.1 Initial position

```text
7 | r n k n b
6 | p p p p p
5 | . . . . .
4 | . . . . .
3 | . . . . .
2 | P P P P P
1 | B N K N R
    a b c d e
```

White's back rank is `B N K N R`; Black's is mirrored (`r n k n b`).
There is one rook and one bishop per side. No queens, no castling, no
en passant.

---

## 3. Move objects

A move is a plain object:

```js
{ fromRow, fromCol, toRow, toCol, promotion? }
```

`promotion` is present only when a pawn reaches the promotion rank,
and is `"R"` (white) or `"r"` (black). The engine always promotes to
a rook; the wire format reserves room for other promotion codes but
the server does not generate them today.

### 3.1 Move generation

- `pseudoMoves(board, whiteTurn)` returns every move a side *could*
  play if king safety were ignored. Used by the evaluator's
  pseudo-mobility term — cheap, no board cloning.
- `getLegalMoves(board, whiteTurn)` returns the subset of pseudo-legal
  moves that do not leave the moving side's king in check. This is
  the canonical source of truth for legality.
- `isInCheck(board, whiteTurn)` returns whether the side to move is
  currently in check.
- `isSquareAttacked(board, row, col, byWhite)` is the underlying
  primitive used by both `isInCheck` and king-safety filtering.

### 3.2 Applying a move

`applyMove(board, move)` mutates the board in place. The session layer
clones the board (or accepts mutation) as it sees fit. The engine
itself never holds onto a board reference between calls.

---

## 4. Game status

`getStatus(board, whiteTurn)` returns one of:

- `"ongoing"` — at least one legal move.
- `"white_wins"` — Black is in check and has no legal moves.
- `"black_wins"` — White is in check and has no legal moves.
- `"stalemate"` — side to move has no legal moves but is not in check.

There is no rule for draw by repetition, fifty-move rule, or
insufficient material in the current engine. These are useful future
additions (see [`roadmap.md`](./roadmap.md)).

---

## 5. Coordinate parsing

`parseMove(str)` accepts strings like:

- `"a2a3"` — quiet move.
- `"a6a7R"` — pawn promotion with an explicit promotion code.

It returns `null` for any malformed input. The inverse,
`moveToStr(move)`, always produces a 4- or 5-character string.

`parseMove(moveToStr(m))` is guaranteed to round-trip for any move
produced by the engine (see `test/status.test.js`).

---

## 6. Why pure?

Every design decision in the engine flows from one rule: **no hidden
state**. Concretely:

- Tests can hand-craft a board, call any function, and assert on the
  return value. No setup, no teardown, no mocks.
- The AI never needs to "undo" a move — it clones the board.
- The same code works whether you are playing in the browser, scripting
  a benchmark, or driving an AI-vs-AI tournament.

The cost is some extra allocation per AI move (one board clone per
search node). On 5×7 this is negligible.

---

## 7. Extending the engine

If you add a new rule (e.g. fifty-move rule, draw by repetition):

1. Add the relevant tracking to [`src/session.js`](../src/session.js).
   The pure engine should remain a stateless function of `(board, side)`.
2. If the rule is purely positional (e.g. insufficient material) it can
   live in `src/game.js` instead.
3. Add tests in `test/` covering both the triggering and the
   non-triggering case.
4. Document the rule in [`rules.md`](./rules.md).

If you add a new piece type or change the initial layout:

1. Update [`src/constants.js`](../src/constants.js) if the board shape
   changes (rare).
2. Update `createBoard` in [`src/board.js`](../src/board.js).
3. Add or change move generation in
   [`src/moves.js`](../src/moves.js).
4. Add an entry in both `PIECE_VALUES` (display) and `AI_PIECE_VALUES`
   (engine) in [`src/pieces.js`](../src/pieces.js).
5. Add a PST in [`src/pst.js`](../src/pst.js).
6. Record an ADR in
   [`engineering-decisions.md`](./engineering-decisions.md).
