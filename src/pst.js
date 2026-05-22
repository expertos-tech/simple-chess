// Piece-square tables for the AI's evaluation, tuned for the 5x7 board.
//
// All tables are written from White's perspective: row 0 is White's far side
// (i.e. the promotion rank for White), row 6 is White's back rank.
// `src/ai.js` mirrors the row index for Black pieces.
//
// Values are intentionally small relative to material (a pawn is 10, a knight 30)
// so the tables nudge positional play without dwarfing tactics.

const PAWN = [
  [0, 0, 0, 0, 0], // row 0: promotion rank (unreachable: pawn promotes)
  [9, 9, 9, 9, 9], // row 1: one square from promotion — push hard
  [6, 6, 7, 6, 6],
  [3, 4, 5, 4, 3],
  [1, 2, 3, 2, 1],
  [0, 0, 0, 0, 0], // row 5: starting rank for White pawns
  [0, 0, 0, 0, 0],
];

// Encourage knights toward the center files/ranks.
const KNIGHT = [
  [-3, -1, -1, -1, -3],
  [-1, 1, 2, 1, -1],
  [-1, 2, 3, 2, -1],
  [-1, 2, 3, 2, -1],
  [-1, 1, 2, 1, -1],
  [-1, 0, 1, 0, -1],
  [-3, -1, -1, -1, -3],
];

// Bishops like long diagonals; on 5x7 the long diagonal passes through the centre.
const BISHOP = [
  [-1, 0, 0, 0, -1],
  [0, 1, 1, 1, 0],
  [0, 1, 2, 1, 0],
  [0, 1, 2, 1, 0],
  [0, 1, 1, 1, 0],
  [0, 0, 1, 0, 0],
  [-1, 0, 0, 0, -1],
];

const ROOK = [
  [3, 3, 4, 3, 3], // 7th rank for White is row 0 — very strong
  [1, 1, 2, 1, 1],
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
];

// Keep the king at home; penalize wandering to the centre.
const KING = [
  [-5, -5, -5, -5, -5],
  [-4, -4, -4, -4, -4],
  [-3, -3, -3, -3, -3],
  [-2, -2, -2, -2, -2],
  [-1, -1, -1, -1, -1],
  [0, 1, 1, 1, 0],
  [1, 2, 0, 2, 1],
];

const PST = Object.freeze({
  p: PAWN,
  n: KNIGHT,
  b: BISHOP,
  r: ROOK,
  k: KING,
});

module.exports = { PST };
