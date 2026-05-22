const test = require('node:test');
const assert = require('node:assert/strict');

const {
  INBOUND,
  OUTBOUND,
  ERROR_CODES,
  DIFFICULTY,
  validateInbound,
  makeStateMessage,
  makeValidMovesMessage,
  makeErrorMessage,
  PROTOCOL_VERSION,
} = require('../src/protocol');

test('protocol exposes a stable version number', () => {
  assert.equal(typeof PROTOCOL_VERSION, 'number');
  assert.ok(PROTOCOL_VERSION >= 1);
});

test('difficulty levels cover easy/medium/hard', () => {
  for (const key of ['easy', 'medium', 'hard']) {
    assert.ok(DIFFICULTY[key], `missing level ${key}`);
    assert.equal(typeof DIFFICULTY[key].depth, 'number');
  }
});

test('validateInbound accepts a well-formed move', () => {
  const res = validateInbound({ type: INBOUND.MOVE, fromRow: 5, fromCol: 0, toRow: 4, toCol: 0 });
  assert.equal(res.ok, true);
});

test('validateInbound rejects unknown types', () => {
  const res = validateInbound({ type: 'wat' });
  assert.equal(res.ok, false);
  assert.equal(res.code, ERROR_CODES.UNKNOWN_TYPE);
});

test('validateInbound rejects move without payload', () => {
  const res = validateInbound({ type: INBOUND.MOVE });
  assert.equal(res.ok, false);
  assert.equal(res.code, ERROR_CODES.INVALID_PAYLOAD);
});

test('validateInbound rejects non-object input', () => {
  assert.equal(validateInbound(null).ok, false);
  assert.equal(validateInbound('hello').ok, false);
});

test('makeStateMessage tags the outbound type and version', () => {
  const msg = JSON.parse(makeStateMessage({ board: [], whiteTurn: true }));
  assert.equal(msg.type, OUTBOUND.STATE);
  assert.equal(msg.protocolVersion, PROTOCOL_VERSION);
});

test('makeValidMovesMessage carries coordinates', () => {
  const msg = JSON.parse(makeValidMovesMessage(1, 2, [{ toRow: 3, toCol: 2 }]));
  assert.equal(msg.type, OUTBOUND.VALID_MOVES);
  assert.equal(msg.fromRow, 1);
  assert.equal(msg.fromCol, 2);
  assert.equal(msg.moves.length, 1);
});

test('makeErrorMessage includes both code and human message', () => {
  const msg = JSON.parse(makeErrorMessage(ERROR_CODES.ILLEGAL_MOVE, 'nope'));
  assert.equal(msg.type, OUTBOUND.ERROR);
  assert.equal(msg.code, ERROR_CODES.ILLEGAL_MOVE);
  assert.equal(msg.message, 'nope');
});
