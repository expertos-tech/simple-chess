// Coordinate parsing and game status detection.

const { getLegalMoves, isInCheck } = require('./moves');
const { ROWS, FILES } = require('./constants');

const COL_MAP = Object.freeze(
  FILES.split('').reduce((acc, file, idx) => {
    acc[file] = idx;
    return acc;
  }, {})
);

// Parses move strings like "a2a3" or with optional promotion suffix "a6a7R".
// Returns a `Move` object or `null` if the input is malformed.
function parseMove(str) {
  if (!str || str.length < 4 || str.length > 5) return null;
  const fromCol = COL_MAP[str[0]];
  const fromRank = parseInt(str[1], 10);
  const toCol = COL_MAP[str[2]];
  const toRank = parseInt(str[3], 10);

  if (fromCol === undefined || toCol === undefined) return null;
  if (!Number.isFinite(fromRank) || !Number.isFinite(toRank)) return null;
  if (fromRank < 1 || fromRank > ROWS || toRank < 1 || toRank > ROWS) return null;

  const move = { fromRow: ROWS - fromRank, fromCol, toRow: ROWS - toRank, toCol };
  if (str.length === 5) {
    const promo = str[4];
    if (!/^[RrBbNnQq]$/.test(promo)) return null;
    move.promotion = promo;
  }
  return move;
}

// Returns 'ongoing' | 'white_wins' | 'black_wins' | 'stalemate'.
function getStatus(board, whiteTurn) {
  const moves = getLegalMoves(board, whiteTurn);
  if (moves.length > 0) return 'ongoing';
  return isInCheck(board, whiteTurn) ? (whiteTurn ? 'black_wins' : 'white_wins') : 'stalemate';
}

module.exports = { parseMove, getStatus };
