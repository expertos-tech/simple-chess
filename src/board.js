const { ROWS, COLS, FILES } = require('./constants');

const EMPTY = '.';

// Board representation
// ====================
// The board is a ROWS x COLS array of single-character strings.
// Row 0 is rank 7 (Black's back rank); row ROWS-1 is rank 1 (White's back rank).
// Uppercase pieces are White, lowercase pieces are Black.
//   K/k = King, R/r = Rook, B/b = Bishop, N/n = Knight, P/p = Pawn
// '.' represents an empty square.
//
// @typedef {string[][]} Board
// @typedef {{ fromRow: number, fromCol: number, toRow: number, toCol: number, promotion?: string }} Move

const INITIAL_BOARD = [
  ['r', 'n', 'k', 'n', 'b'], // row 0 = rank 7 (black back rank)
  ['p', 'p', 'p', 'p', 'p'], // row 1 = rank 6
  ['.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.'],
  ['P', 'P', 'P', 'P', 'P'], // row 5 = rank 2
  ['B', 'N', 'K', 'N', 'R'], // row 6 = rank 1 (white back rank)
];

function createBoard() {
  return INITIAL_BOARD.map((row) => [...row]);
}

function cloneBoard(board) {
  return board.map((row) => [...row]);
}

function isWhite(piece) {
  return piece !== EMPTY && piece === piece.toUpperCase();
}

function isBlack(piece) {
  return piece !== EMPTY && piece === piece.toLowerCase();
}

function applyMove(board, move) {
  const { fromRow, fromCol, toRow, toCol, promotion } = move;
  const piece = board[fromRow][fromCol];

  board[toRow][toCol] = promotion || piece;
  board[fromRow][fromCol] = EMPTY;
}

function moveToStr(move) {
  const from = `${FILES[move.fromCol]}${ROWS - move.fromRow}`;
  const to = `${FILES[move.toCol]}${ROWS - move.toRow}`;
  return `${from}${to}${move.promotion || ''}`;
}

module.exports = {
  EMPTY,
  ROWS,
  COLS,
  createBoard,
  cloneBoard,
  isWhite,
  isBlack,
  applyMove,
  moveToStr,
};
