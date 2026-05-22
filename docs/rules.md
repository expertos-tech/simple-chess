# Rules

Mini Chess 5x7 is a compact chess variant. This document is the
authoritative rule reference.

## Board

- **5 files × 7 ranks** (5 columns × 7 rows).
- Files are labeled `a–e` from left to right.
- Ranks are labeled `1–7` from White's side outward.
- White starts on rank 1. Black starts on rank 7.

## Starting position

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

Uppercase = White, lowercase = Black.

Each side has:

- 1 King
- 1 Rook
- 1 Bishop
- 2 Knights
- 5 Pawns

No queens.

## Piece moves

Piece moves are the same as in standard chess, with two simplifications
described below.

| Piece  | Move |
| ------ | ---- |
| King   | One square in any direction. Cannot move into check. |
| Rook   | Any number of squares along a rank or file. |
| Bishop | Any number of squares along a diagonal. |
| Knight | L-shape: 2+1 squares. Jumps over other pieces. |
| Pawn   | One square forward (no two-square first move). Captures one square diagonally forward. |

## Simplifications vs. standard chess

The following standard rules are **not** implemented:

- **No castling.** There is no rook–king special move.
- **No two-square pawn advance** on the first move.
- **No en passant.**
- **No queen promotion.** When a pawn reaches the last rank, it
  promotes to a **rook** automatically (`P → R`, `p → r`). The
  protocol leaves room for other promotion codes but the engine never
  generates them.

## Check and checkmate

Same definitions as standard chess:

- A king is **in check** when an opposing piece attacks its square.
- A move that leaves the moving side's own king in check is illegal.
- **Checkmate**: side to move is in check and has no legal moves →
  the other side wins.
- **Stalemate**: side to move is not in check and has no legal moves →
  the game is a draw.

The engine returns these as `white_wins`, `black_wins`, or `stalemate`
in the `status` field.

## Draw rules not implemented

- No threefold repetition.
- No fifty-move rule.
- No insufficient-material claim.

These may be added later — see [`roadmap.md`](./roadmap.md).

## Notation

Moves are written as the source square concatenated with the
destination square (`a2a3`). Promotions append a piece code: `a6a7R`.
The engine accepts both forms via `parseMove` and produces them via
`moveToStr`.
