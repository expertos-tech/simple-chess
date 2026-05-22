// Mini Chess 5x7 AI.
//
// Negamax-style minimax in explicit max/min form, with alpha-beta pruning,
// a cheap evaluation function (material + piece-square tables + pseudo-mobility),
// and MVV-LVA move ordering. The depth defaults to 3 (the "hard" level);
// callers may pass a smaller depth for easier play.
//
// The AI is intentionally simple and didactic. See `docs/ai.md`.

const { cloneBoard, applyMove, isWhite, EMPTY } = require('./board');
const { ROWS, COLS } = require('./constants');
const { getLegalMoves, isInCheck, pseudoMoves } = require('./moves');
const { AI_PIECE_VALUES } = require('./pieces');
const { PST } = require('./pst');

const MATE_SCORE = 9000;

function pstValue(piece, row, col) {
  const table = PST[piece.toLowerCase()];
  if (!table) return 0;
  // PST is written from White's perspective (row 0 = back rank for Black).
  // For White pieces we mirror vertically so row 6 (White's back rank) maps to PST row 0.
  const r = isWhite(piece) ? ROWS - 1 - row : row;
  return table[r][col];
}

function evaluate(board) {
  let score = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c];
      if (p === EMPTY) continue;
      const v = AI_PIECE_VALUES[p.toLowerCase()] || 0;
      const pst = pstValue(p, r, c);
      score += isWhite(p) ? v + pst : -(v + pst);
    }
  }
  // Cheap pseudo-mobility (no legality filter, no board clones).
  score += pseudoMoves(board, true).length;
  score -= pseudoMoves(board, false).length;
  return score;
}

// MVV-LVA: most valuable victim, least valuable attacker.
function moveOrderScore(board, move) {
  const victim = board[move.toRow][move.toCol];
  if (victim === EMPTY) return move.promotion ? 50 : 0;
  const attacker = board[move.fromRow][move.fromCol];
  const vv = AI_PIECE_VALUES[victim.toLowerCase()] || 0;
  const av = AI_PIECE_VALUES[attacker.toLowerCase()] || 1;
  return 1000 + vv * 10 - av;
}

function orderedLegalMoves(board, whiteTurn) {
  const moves = getLegalMoves(board, whiteTurn);
  return moves
    .map((m) => ({ m, s: moveOrderScore(board, m) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.m);
}

function minimax(board, depth, alpha, beta, whiteTurn) {
  const moves = orderedLegalMoves(board, whiteTurn);

  if (depth === 0 || moves.length === 0) {
    if (moves.length === 0) {
      if (isInCheck(board, whiteTurn)) {
        // Prefer faster mates: shallower mates are better for the winning side.
        return whiteTurn ? -MATE_SCORE - depth : MATE_SCORE + depth;
      }
      return 0;
    }
    return evaluate(board);
  }

  if (whiteTurn) {
    let best = -Infinity;
    for (const move of moves) {
      const copy = cloneBoard(board);
      applyMove(copy, move);
      const score = minimax(copy, depth - 1, alpha, beta, false);
      if (score > best) best = score;
      if (score > alpha) alpha = score;
      if (beta <= alpha) break;
    }
    return best;
  }
  let best = Infinity;
  for (const move of moves) {
    const copy = cloneBoard(board);
    applyMove(copy, move);
    const score = minimax(copy, depth - 1, alpha, beta, true);
    if (score < best) best = score;
    if (score < beta) beta = score;
    if (beta <= alpha) break;
  }
  return best;
}

// `opts.noise` adds a small random epsilon to each move's root score
// so easier levels avoid playing the exact same line every game.
// `opts.rng` is a deterministic RNG hook for tests; defaults to Math.random.
function getAiMove(board, whiteTurn, depth = 3, opts = {}) {
  const moves = orderedLegalMoves(board, whiteTurn);
  if (moves.length === 0) return null;

  const noise = Number.isFinite(opts.noise) ? opts.noise : 0;
  const rng = typeof opts.rng === 'function' ? opts.rng : Math.random;

  let bestMove = null;
  let bestScore = whiteTurn ? -Infinity : Infinity;

  for (const move of moves) {
    const copy = cloneBoard(board);
    applyMove(copy, move);
    let score = minimax(copy, depth - 1, -Infinity, Infinity, !whiteTurn);
    if (noise > 0) score += (rng() - 0.5) * 2 * noise;
    if (whiteTurn ? score > bestScore : score < bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

module.exports = { getAiMove, evaluate };
