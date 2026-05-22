// Move generation and check detection for Mini Chess 5x7.
//
// The engine generates pseudo-legal moves first (`pseudoMoves`) and then
// filters them through a legality check (`getLegalMoves`) that drops any
// move that would leave the moving side's king in check.

const { EMPTY, isWhite, isBlack, cloneBoard, applyMove } = require('./board');
const { ROWS, COLS } = require('./constants');

const ROOK_DIRS = Object.freeze([
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
]);

const BISHOP_DIRS = Object.freeze([
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
]);

const KNIGHT_DIRS = Object.freeze([
  [-2, -1],
  [-2, 1],
  [-1, -2],
  [-1, 2],
  [1, -2],
  [1, 2],
  [2, -1],
  [2, 1],
]);

const KING_DIRS = Object.freeze([
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
]);

function inBounds(row, col) {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

function isOwn(board, row, col, whiteTurn) {
  const p = board[row][col];
  return whiteTurn ? isWhite(p) : isBlack(p);
}

function isEnemy(board, row, col, whiteTurn) {
  const p = board[row][col];
  return whiteTurn ? isBlack(p) : isWhite(p);
}

function addPawnMoves(board, row, col, whiteTurn, moves) {
  const dir = whiteTurn ? -1 : 1;
  const promRow = whiteTurn ? 0 : ROWS - 1;
  const promos = whiteTurn ? ['R'] : ['r'];
  const nr = row + dir;

  if (!inBounds(nr, col)) return;

  if (board[nr][col] === EMPTY) {
    if (nr === promRow) {
      promos.forEach((p) =>
        moves.push({ fromRow: row, fromCol: col, toRow: nr, toCol: col, promotion: p })
      );
    } else {
      moves.push({ fromRow: row, fromCol: col, toRow: nr, toCol: col });
    }
  }

  for (const dc of [-1, 1]) {
    const nc = col + dc;
    if (!inBounds(nr, nc)) continue;
    if (isEnemy(board, nr, nc, whiteTurn)) {
      if (nr === promRow) {
        promos.forEach((p) =>
          moves.push({ fromRow: row, fromCol: col, toRow: nr, toCol: nc, promotion: p })
        );
      } else {
        moves.push({ fromRow: row, fromCol: col, toRow: nr, toCol: nc });
      }
    }
  }
}

function addSliding(board, row, col, whiteTurn, moves, dirs) {
  for (const [dr, dc] of dirs) {
    let nr = row + dr;
    let nc = col + dc;
    while (inBounds(nr, nc)) {
      if (board[nr][nc] === EMPTY) {
        moves.push({ fromRow: row, fromCol: col, toRow: nr, toCol: nc });
      } else if (isEnemy(board, nr, nc, whiteTurn)) {
        moves.push({ fromRow: row, fromCol: col, toRow: nr, toCol: nc });
        break;
      } else {
        break;
      }
      nr += dr;
      nc += dc;
    }
  }
}

function addStepping(board, row, col, whiteTurn, moves, dirs) {
  for (const [dr, dc] of dirs) {
    const nr = row + dr;
    const nc = col + dc;
    if (inBounds(nr, nc) && !isOwn(board, nr, nc, whiteTurn)) {
      moves.push({ fromRow: row, fromCol: col, toRow: nr, toCol: nc });
    }
  }
}

function pseudoMoves(board, whiteTurn) {
  const moves = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const piece = board[row][col];
      if (piece === EMPTY) continue;
      if (whiteTurn && isBlack(piece)) continue;
      if (!whiteTurn && isWhite(piece)) continue;

      const t = piece.toLowerCase();
      if (t === 'p') addPawnMoves(board, row, col, whiteTurn, moves);
      else if (t === 'r') addSliding(board, row, col, whiteTurn, moves, ROOK_DIRS);
      else if (t === 'b') addSliding(board, row, col, whiteTurn, moves, BISHOP_DIRS);
      else if (t === 'n') addStepping(board, row, col, whiteTurn, moves, KNIGHT_DIRS);
      else if (t === 'k') addStepping(board, row, col, whiteTurn, moves, KING_DIRS);
    }
  }
  return moves;
}

// True if (row, col) is attacked by any piece of the given colour.
function isSquareAttacked(board, row, col, byWhite) {
  return pseudoMoves(board, byWhite).some((m) => m.toRow === row && m.toCol === col);
}

function findKing(board, whiteTurn) {
  const king = whiteTurn ? 'K' : 'k';
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] === king) return { row: r, col: c };
    }
  }
  return null;
}

function isInCheck(board, whiteTurn) {
  const k = findKing(board, whiteTurn);
  if (!k) return true; // king gone — treat as in check (defensive guard)
  return isSquareAttacked(board, k.row, k.col, !whiteTurn);
}

function getLegalMoves(board, whiteTurn) {
  return pseudoMoves(board, whiteTurn).filter((move) => {
    const copy = cloneBoard(board);
    applyMove(copy, move);
    return !isInCheck(copy, whiteTurn);
  });
}

module.exports = {
  pseudoMoves,
  getLegalMoves,
  isInCheck,
  isSquareAttacked,
  findKing,
};
