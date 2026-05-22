// WebSocket protocol for Mini Chess 5x7.
//
// All messages are JSON objects with a required `type` string.
// Inbound messages are sent by the browser client; outbound messages
// are sent by the server. See `docs/websocket-protocol.md` for the
// human-readable specification.

const { ROWS, COLS } = require('./constants');

const PROTOCOL_VERSION = 1;

const INBOUND = Object.freeze({
  GET_MOVES: 'getMoves',
  MOVE: 'move',
  RESET: 'reset',
  CONFIG: 'config',
});

const OUTBOUND = Object.freeze({
  STATE: 'state',
  VALID_MOVES: 'validMoves',
  ERROR: 'error',
});

const STATUS = Object.freeze({
  ONGOING: 'ongoing',
  WHITE_WINS: 'white_wins',
  BLACK_WINS: 'black_wins',
  STALEMATE: 'stalemate',
});

const ERROR_CODES = Object.freeze({
  BAD_JSON: 'BAD_JSON',
  UNKNOWN_TYPE: 'UNKNOWN_TYPE',
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  NOT_YOUR_TURN: 'NOT_YOUR_TURN',
  ILLEGAL_MOVE: 'ILLEGAL_MOVE',
});

const DIFFICULTY = Object.freeze({
  easy: { depth: 1, noise: 5 },
  medium: { depth: 2, noise: 2 },
  hard: { depth: 3, noise: 0 },
});

function isInt(v) {
  return Number.isInteger(v);
}

function isRow(v) {
  return isInt(v) && v >= 0 && v < ROWS;
}

function isCol(v) {
  return isInt(v) && v >= 0 && v < COLS;
}

// Returns { ok: true, msg } or { ok: false, code }.
function validateInbound(msg) {
  if (!msg || typeof msg !== 'object') {
    return { ok: false, code: ERROR_CODES.INVALID_PAYLOAD };
  }
  switch (msg.type) {
    case INBOUND.GET_MOVES:
      if (!isRow(msg.row) || !isCol(msg.col)) {
        return { ok: false, code: ERROR_CODES.INVALID_PAYLOAD };
      }
      return { ok: true, msg };
    case INBOUND.MOVE:
      if (
        !isRow(msg.fromRow) ||
        !isCol(msg.fromCol) ||
        !isRow(msg.toRow) ||
        !isCol(msg.toCol)
      ) {
        return { ok: false, code: ERROR_CODES.INVALID_PAYLOAD };
      }
      return { ok: true, msg };
    case INBOUND.RESET:
      return { ok: true, msg };
    case INBOUND.CONFIG:
      if (msg.level !== undefined && !Object.prototype.hasOwnProperty.call(DIFFICULTY, msg.level)) {
        return { ok: false, code: ERROR_CODES.INVALID_PAYLOAD };
      }
      return { ok: true, msg };
    default:
      return { ok: false, code: ERROR_CODES.UNKNOWN_TYPE };
  }
}

function makeStateMessage(snapshot) {
  return JSON.stringify({
    type: OUTBOUND.STATE,
    protocolVersion: PROTOCOL_VERSION,
    ...snapshot,
  });
}

function makeValidMovesMessage(fromRow, fromCol, moves) {
  return JSON.stringify({
    type: OUTBOUND.VALID_MOVES,
    fromRow,
    fromCol,
    moves,
  });
}

function makeErrorMessage(code, message) {
  return JSON.stringify({
    type: OUTBOUND.ERROR,
    code,
    message: message || code,
  });
}

module.exports = {
  PROTOCOL_VERSION,
  INBOUND,
  OUTBOUND,
  STATUS,
  ERROR_CODES,
  DIFFICULTY,
  validateInbound,
  makeStateMessage,
  makeValidMovesMessage,
  makeErrorMessage,
};
