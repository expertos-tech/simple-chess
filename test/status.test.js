// Round-trip and game-status tests beyond the smoke tests in game.test.js.

const test = require('node:test');
const assert = require('node:assert/strict');

const { parseMove, getStatus } = require('../src/game');
const { ROWS, COLS, createBoard, EMPTY } = require('../src/board');
const { moveToStr } = require('../src/board');

function emptyBoard() {
  const board = createBoard();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) board[r][c] = EMPTY;
  return board;
}

test('parseMove(moveToStr(m)) round-trips for a simple move', () => {
  const m = { fromRow: 5, fromCol: 0, toRow: 4, toCol: 0 };
  assert.deepEqual(parseMove(moveToStr(m)), m);
});

test('parseMove accepts promotion suffix', () => {
  const parsed = parseMove('a6a7R');
  assert.ok(parsed);
  assert.equal(parsed.promotion, 'R');
});

test('parseMove rejects bogus promotion suffix', () => {
  assert.equal(parseMove('a6a7X'), null);
});

test('getStatus detects checkmate (back-rank mate)', () => {
  const board = emptyBoard();
  // White king on c1, boxed in by its own pawns; Black rook delivers mate on c1.
  board[6][2] = 'K';
  board[5][1] = 'P';
  board[5][2] = 'P';
  board[5][3] = 'P';
  board[6][4] = 'r'; // attacks c1 along rank 1
  // Black king somewhere safe.
  board[0][0] = 'k';
  assert.equal(getStatus(board, true), 'black_wins');
});

test('getStatus detects stalemate', () => {
  const board = emptyBoard();
  // White king a1; black king c2 covers b1/b2; black bishop c4 covers a2 along
  // the diagonal c4-b3-a2 without attacking a1, so white has no legal move.
  board[6][0] = 'K';
  board[5][2] = 'k';
  board[3][2] = 'b';
  assert.equal(getStatus(board, true), 'stalemate');
});

test('getStatus is ongoing after a quiet opening move', () => {
  const board = createBoard();
  // 1. c2-c3 (white)
  board[5][2] = EMPTY;
  board[4][2] = 'P';
  assert.equal(getStatus(board, false), 'ongoing');
});
