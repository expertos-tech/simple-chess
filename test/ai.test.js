const test = require('node:test');
const assert = require('node:assert/strict');

const { getAiMove } = require('../src/ai');
const { ROWS, COLS, EMPTY, createBoard } = require('../src/board');
const { getLegalMoves } = require('../src/moves');

function emptyBoard() {
  const board = createBoard();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) board[r][c] = EMPTY;
  return board;
}

test('getAiMove returns null when no legal moves', () => {
  const board = emptyBoard();
  // With no pieces for the side to move, there are no legal moves.
  const move = getAiMove(board, false);
  assert.equal(move, null);
});

test('getAiMove returns a legal move when available', () => {
  const board = emptyBoard();
  board[0][2] = 'k';
  board[1][2] = 'p';
  board[6][2] = 'K';
  const move = getAiMove(board, false, 1);
  assert.ok(move);

  const legal = getLegalMoves(board, false);
  assert.ok(legal.some((m) => JSON.stringify(m) === JSON.stringify(move)));
});

test('AI does not return a move that leaves own king in check', () => {
  const board = emptyBoard();
  board[0][2] = 'k';
  board[0][1] = 'r';
  board[6][2] = 'K';
  board[6][4] = 'R';
  const move = getAiMove(board, false, 2);
  assert.ok(move);

  const legal = getLegalMoves(board, false);
  assert.ok(legal.some((m) => JSON.stringify(m) === JSON.stringify(move)));
});

test('AI prefers capturing a free rook over a quiet move', () => {
  const board = emptyBoard();
  // White to move. White rook on a1 (board[6][0]) can take the black rook on a4 (board[3][0])
  // along the open a-file. A quiet alternative would be moving the king.
  board[6][0] = 'R';
  board[3][0] = 'r';
  board[6][2] = 'K';
  board[0][4] = 'k';
  // Use deterministic, depth-1 (no noise on hard).
  const move = getAiMove(board, true, 1, { noise: 0 });
  assert.ok(move);
  assert.equal(move.fromRow, 6);
  assert.equal(move.fromCol, 0);
  assert.equal(move.toRow, 3);
  assert.equal(move.toCol, 0);
});

test('AI finds a smothered mate-in-1', () => {
  const board = emptyBoard();
  // Black king cornered at a7 with own pieces blocking every escape.
  // White knight on a5 can deliver Nc6#: it checks a7, no piece can capture
  // the knight, and the king has no legal square to flee to.
  board[0][0] = 'k'; // a7
  board[0][1] = 'n'; // b7 blocks
  board[1][1] = 'n'; // b6 blocks
  board[1][0] = 'b'; // a6 blocks
  board[2][0] = 'N'; // a5 -> c6 mate
  board[6][4] = 'K'; // distant white king
  const move = getAiMove(board, true, 2, { noise: 0 });
  assert.ok(move);
  assert.equal(move.fromRow, 2);
  assert.equal(move.fromCol, 0);
  assert.equal(move.toRow, 1);
  assert.equal(move.toCol, 2);
});
