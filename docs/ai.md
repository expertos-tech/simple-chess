# AI

This document explains how the Mini Chess 5x7 AI works, why it works that way,
and how to evolve it without losing the project's didactic simplicity.

> **Audience:** contributors and curious readers who want to understand
> minimax, alpha-beta, evaluation, move ordering, and how those concepts
> show up in a small (≈ 120-line) JavaScript file.

---

## 1. Goals

The AI is intentionally small. It is meant to:

1. Be **understandable in one sitting**. Every important idea is in
   [`src/ai.js`](../src/ai.js) and the supporting tables in
   [`src/pst.js`](../src/pst.js) and [`src/pieces.js`](../src/pieces.js).
2. Play **plausible chess** on a 5×7 board at three difficulty levels
   (easy / medium / hard) without being trivially bad.
3. Stay **fast enough to feel synchronous** from the browser, even on a
   modest laptop. Practical target: < 200 ms per move at hard.
4. Be a **teaching surface** for minimax, alpha-beta, piece-square tables,
   and MVV-LVA ordering.

It is **not** trying to be a strong chess engine. It has no transposition
table, no quiescence search, no iterative deepening, no opening book.

---

## 2. Search

### 2.1 Negamax in max/min form

The search is a standard minimax over legal moves, written in explicit
max/min form for readability:

```text
minimax(board, depth, alpha, beta, whiteTurn)
  if no legal moves:
      if in check: return ±MATE_SCORE - depth   (faster mates score better)
      else:        return 0                     (stalemate is a draw)
  if depth == 0:   return evaluate(board)
  for each move (ordered):
      score = minimax(child, depth - 1, alpha, beta, !whiteTurn)
      update best, alpha/beta
      if beta <= alpha: break    // alpha-beta cutoff
  return best
```

The root function `getAiMove(board, whiteTurn, depth, opts)` walks the
legal moves at the root, calls `minimax` on each child, and returns the
move with the best score from the moving side's perspective.

### 2.2 Alpha-beta pruning

Alpha-beta is a soundness-preserving optimization: any branch whose
result cannot improve the bound for the player to move is skipped. With
good move ordering, it can cut effective branching factor from `b` to
roughly `√b`, which is huge in practice.

In `src/ai.js` it shows up as:

```js
if (score > alpha) alpha = score;
if (beta <= alpha) break;
```

(mirrored for the minimizing side).

### 2.3 Mate distance

When a side has no legal moves and is in check, the search returns
`±MATE_SCORE ± depth`. The `± depth` term means **shallower mates score
better for the winning side**, so the engine plays the *shortest* mate
it can see and the *longest* defense it can find.

`MATE_SCORE = 9000` is well outside the range of any plausible material
score, so a mate always dominates any positional consideration.

---

## 3. Move ordering (MVV-LVA)

Alpha-beta only prunes well if the best moves are tried first. We use a
classic chess heuristic, **MVV-LVA** — *Most Valuable Victim, Least
Valuable Attacker*:

```text
score(move) = 1000 + 10 * value(victim) - value(attacker)
```

This is cheap to compute and provides a strong first-pass ordering:
captures of high-value pieces by low-value pieces (e.g. `PxR`, "pawn
takes rook") are tried before quiet moves. Promotions get a small
bonus too.

See `moveOrderScore` and `orderedLegalMoves` in `src/ai.js`.

> **Why not full Static Exchange Evaluation (SEE)?** SEE simulates the
> capture sequence on a square and gives a much more accurate ordering.
> It is also much more code. For a 5×7 board with shallow depth, MVV-LVA
> is plenty.

---

## 4. Evaluation

The evaluation function returns a single integer score from White's
perspective: positive favors White, negative favors Black.

It combines three terms:

### 4.1 Material

Piece values come from [`src/pieces.js`](../src/pieces.js):

```js
AI_PIECE_VALUES = {
  k: 1000,  // never traded; large so the king dominates
  r: 5,
  b: 3,
  n: 3,
  p: 1,
};
```

These are the textbook values from standard chess. They are still
reasonable on 5×7, but see [§ 8](#8-piece-strength-on-a-57-board) for
caveats.

### 4.2 Piece-square tables (PST)

Each piece type has a small 7×5 table in [`src/pst.js`](../src/pst.js)
giving a static positional bonus per square. Tables are written from
**White's perspective** (row 0 = the promotion rank) and mirrored for
White pieces so that the engine reads them naturally:

```js
function pstValue(piece, row, col) {
  const r = isWhite(piece) ? ROWS - 1 - row : row;
  return PST[piece.toLowerCase()][r][col];
}
```

What the tables encode:

- **Pawn**: prefer advancing, big bonus on the promotion rank.
- **Knight**: prefer the center (3 central files on 5×7).
- **Bishop**: prefer long diagonals, slight bonus for central squares.
- **Rook**: prefer the 7th rank (well-known motif) and central files.
- **King**: prefer the back rank early; penalize wandering to the
  center where it would be exposed.

PST values are deliberately small (single digits) so they refine
material decisions without ever outweighing a real piece trade.

### 4.3 Pseudo-mobility

A side that has more move options is, on average, in a better position.
We approximate mobility with `pseudoMoves(board, whiteTurn).length` — the
number of **pseudo-legal** moves (i.e. without filtering out moves that
leave the own king in check).

This is significantly cheaper than `getLegalMoves` because it avoids
cloning the board and re-running attack checks once per candidate move.
The error introduced by counting illegal moves is small and
self-cancelling across symmetric positions.

> Historical note: the previous AI called `getLegalMoves` from inside
> `evaluate`, which made every leaf evaluation re-run the whole legality
> filter. Switching to `pseudoMoves` made the search several times
> faster.

---

## 5. Difficulty levels

[`src/protocol.js`](../src/protocol.js) defines three levels:

| Level   | Search depth | Score noise |
| ------- | ------------ | ----------- |
| easy    | 1            | ± 5         |
| medium  | 2            | ± 2         |
| hard    | 3            | 0           |

The "noise" term is a tiny random offset added to each root score:

```js
score += (rng() - 0.5) * 2 * noise;
```

It prevents the AI from playing literally the same line every game at
easy/medium, without making it visibly wrong. At hard it is zero, so
hard is deterministic for any given input.

The browser can pick a level via a query string (`?level=easy`) or by
sending a `config` message at runtime; see
[`docs/websocket-protocol.md`](./websocket-protocol.md).

---

## 6. Cost and depth

Approximate worst-case branching factor on 5×7 is around 20 in the
opening, dropping as pieces are exchanged. Without ordering, depth 3 is
≈ 20³ = 8 000 leaf evaluations. With alpha-beta and MVV-LVA, real cost
is typically a few hundred leaves and completes in single-digit
milliseconds.

Empirically on a modest laptop:

| Depth | Typical time | Plays like |
| ----- | ------------ | ---------- |
| 1     | < 1 ms       | obvious captures only |
| 2     | a few ms     | 1-move tactics |
| 3     | tens of ms   | small combinations, mate-in-1, sometimes mate-in-2 |
| 4     | hundreds of ms | the same but slower; gain is small without quiescence |

Going beyond depth 3 without a quiescence search makes the AI play
"horizon" moves: it might capture and end the search just before the
opponent recaptures, leading to bad trades. That is why hard is
capped at depth 3.

---

## 7. Integration with the server

The AI is a pure function. It does not know about WebSockets, sessions,
or timers. The [`Match`](../src/session.js) class is the integration
point:

```js
applyAiMove() {
  if (this.status() !== STATUS.ONGOING) return null;
  const move = getAiMove(this.board, this.whiteTurn, this.aiDepth, {
    noise: this.aiNoise,
  });
  if (!move) return null;
  this._commit(move);
  return move;
}
```

Server-side, the AI runs synchronously inside the WebSocket message
handler. On 5×7 at depth 3 this is fast enough that the user perceives
it as instantaneous, and we keep the server single-threaded and simple.

---

## 8. Piece strength on a 5×7 board

Standard chess piece values were calibrated on 8×8. They translate
reasonably well to 5×7, but with a few practical biases worth knowing
when you debug AI decisions or rewrite the PST:

- **Pawn** (value 1): the board is shorter, so pawns are *closer to
  promotion*. This boosts their effective value, which the pawn PST
  partially reflects.
- **Knight** (value 3): shines on a small board because it does not need
  long open lines. Two knights per side is plenty of tactical fuel.
- **Bishop** (value 3): the board is narrow (5 files) so long diagonals
  are short. Bishops are slightly weaker than knights in practice on
  5×7, but the engine still scores them at 3 to keep the eval simple.
- **Rook** (value 5): one rook per side, and files are short. Still the
  strongest non-king piece, especially on the 7th rank.
- **King** (value 1000): non-tradeable; the value only matters so the
  engine prefers checkmating over winning material.

If you wanted to be more aggressive about positional play, you could
tune the PST further. We have intentionally not done so — the goal is a
clear, didactic baseline, not a competition engine.

---

## 9. Debugging AI decisions

A few tricks for when the AI plays something surprising:

1. **Reproduce deterministically.** Use hard (noise 0) or pass
   `{ noise: 0, rng: () => 0.5 }` to `getAiMove`.
2. **Drop the depth to 1.** If a bug shows at depth 3 but not depth 1,
   the issue is in deeper search (e.g. horizon effect).
3. **Print evaluations.** Wrap `evaluate(board)` temporarily and log the
   score for the position before and after the suspect move.
4. **Inspect ordering.** Log `orderedLegalMoves(board, whiteTurn)` to
   confirm the heuristic ranks the obvious capture first.
5. **Confirm `pseudoMoves` is not lying.** It does not filter out moves
   that leave the king in check, so it is a noisy proxy. If a position
   has many such illegal moves for one side, mobility can mislead the
   eval; switch to `getLegalMoves` temporarily to compare.

---

## 10. Limitations

Known limitations of the current AI:

- **No quiescence search.** Tactical mistakes at the horizon are
  possible (e.g. capturing a defended piece and stopping just before
  recapture).
- **No transposition table.** Repeated positions are re-evaluated.
- **No iterative deepening.** Search is fixed-depth.
- **No opening book.** The first few moves are pure search, which can
  feel mechanical.
- **No endgame heuristics.** Pawn endgames in particular are hard for
  fixed-depth minimax.
- **Pseudo-mobility is approximate.** See § 9, point 5.

None of these are bugs. They are deliberate scope decisions: each one
would multiply the code budget without proportionate value for a
didactic engine.

---

## 11. Roadmap

Suggested evolution, in waves. Each wave is small enough to ship and
review independently.

**Wave A — Documentation and tests (no behavior change)**

- This document.
- Tests pinning the current behavior (mate-in-1, prefer-capture, etc.).
- An `scripts/bench-ai.js` benchmark that runs AI-vs-AI for N games and
  reports average time/move and win rate.

**Wave B — Cheap correctness wins**

- Add a tiny quiescence search: only extend on captures, capped at a
  shallow ply.
- Cache `pseudoMoves` per (board, side) inside the search via a small
  WeakMap or by computing on the fly only when material changed.

**Wave C — Stronger ordering**

- Add killer moves and a history heuristic to push refutation moves to
  the top.
- Promotions before quiet moves (already partially done).

**Wave D — Difficulty refinement**

- Make easy/medium also reduce search width (e.g. truncate the move
  list) instead of just adding noise.
- Add a `"random"` level for beginners.

**Wave E — Optional advanced features (probably not worth doing yet)**

- Transposition table with Zobrist hashing.
- Iterative deepening with time-based cutoff.
- A miniature opening book hand-tuned for 5×7.

> The bar for adopting any item above is: *does it make the code
> significantly stronger without making it significantly harder to
> read?* If not, skip it.
