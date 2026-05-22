// Per-game session state and lifecycle for Mini Chess 5x7.
//
// A `Match` owns the board, whose-turn flag, captures, move history
// and the AI configuration. The WebSocket server holds one `Match`
// per connection; the rest of the engine is pure and stateless.

const { createBoard, applyMove, moveToStr, isWhite } = require('./board');
const { getLegalMoves, isInCheck } = require('./moves');
const { getStatus } = require('./game');
const { getAiMove } = require('./ai');
const { PIECE_VALUES } = require('./pieces');
const { DIFFICULTY, STATUS } = require('./protocol');

const EMPTY_SQUARE = '.';

function captureScore(pieces) {
  return pieces.reduce((sum, p) => sum + (PIECE_VALUES[p.toLowerCase()] || 0), 0);
}

class Match {
  constructor({ playerIsWhite = true, level = 'hard' } = {}) {
    this.playerIsWhite = !!playerIsWhite;
    this.setLevel(level);
    this.reset();
  }

  setLevel(level) {
    const cfg = DIFFICULTY[level] || DIFFICULTY.hard;
    this.level = level in DIFFICULTY ? level : 'hard';
    this.aiDepth = cfg.depth;
    this.aiNoise = cfg.noise;
  }

  reset() {
    this.board = createBoard();
    this.whiteTurn = true;
    this.lastMove = null;
    this.capturedByWhite = []; // black pieces taken by white
    this.capturedByBlack = []; // white pieces taken by black
    this.moveHistory = [];
    this.moveCount = 1;
  }

  playerToMove() {
    return this.playerIsWhite ? this.whiteTurn : !this.whiteTurn;
  }

  status() {
    return getStatus(this.board, this.whiteTurn);
  }

  legalMovesForPlayer() {
    return getLegalMoves(this.board, this.whiteTurn);
  }

  legalMovesFrom(row, col) {
    return this.legalMovesForPlayer()
      .filter((m) => m.fromRow === row && m.fromCol === col)
      .map((m) => ({ toRow: m.toRow, toCol: m.toCol }));
  }

  // Returns the matching legal move object, or null.
  findLegalMove(fromRow, fromCol, toRow, toCol) {
    return (
      this.legalMovesForPlayer().find(
        (m) =>
          m.fromRow === fromRow &&
          m.fromCol === fromCol &&
          m.toRow === toRow &&
          m.toCol === toCol
      ) || null
    );
  }

  _recordCapture(capturedPiece, moverIsWhite) {
    if (capturedPiece === EMPTY_SQUARE) return;
    if (moverIsWhite) this.capturedByWhite.push(capturedPiece);
    else this.capturedByBlack.push(capturedPiece);
  }

  _commit(move) {
    const moverIsWhite = this.whiteTurn;
    this._recordCapture(this.board[move.toRow][move.toCol], moverIsWhite);
    applyMove(this.board, move);
    this.lastMove = move;
    this.moveHistory.push({
      move: moveToStr(move),
      isWhite: moverIsWhite,
      num: this.moveCount,
    });
    if (!moverIsWhite) this.moveCount++;
    this.whiteTurn = !this.whiteTurn;
  }

  applyPlayerMove(fromRow, fromCol, toRow, toCol) {
    const match = this.findLegalMove(fromRow, fromCol, toRow, toCol);
    if (!match) return false;
    this._commit(match);
    return true;
  }

  applyAiMove() {
    if (this.status() !== STATUS.ONGOING) return null;
    const move = getAiMove(this.board, this.whiteTurn, this.aiDepth, { noise: this.aiNoise });
    if (!move) return null;
    this._commit(move);
    return move;
  }

  // Pure snapshot suitable for `state` messages.
  snapshot() {
    const status = this.status();
    return {
      board: this.board,
      whiteTurn: this.whiteTurn,
      status,
      lastMove: this.lastMove,
      inCheck: status === STATUS.ONGOING && isInCheck(this.board, this.whiteTurn),
      capturedByWhite: this.capturedByWhite,
      capturedByBlack: this.capturedByBlack,
      moveHistory: this.moveHistory,
      scoreWhite: captureScore(this.capturedByWhite),
      scoreBlack: captureScore(this.capturedByBlack),
      level: this.level,
    };
  }
}

module.exports = { Match, captureScore };
// `isWhite` re-exported for downstream convenience.
module.exports.isWhite = isWhite;
