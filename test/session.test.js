const test = require('node:test');
const assert = require('node:assert/strict');

const { Match } = require('../src/session');

test('Match starts at the canonical opening position', () => {
  const m = new Match();
  const snap = m.snapshot();
  assert.equal(snap.whiteTurn, true);
  assert.equal(snap.status, 'ongoing');
  assert.equal(snap.moveHistory.length, 0);
  assert.equal(snap.scoreWhite, 0);
  assert.equal(snap.scoreBlack, 0);
});

test('Match.setLevel falls back to hard for unknown levels', () => {
  const m = new Match({ level: 'wat' });
  assert.equal(m.level, 'hard');
  assert.equal(m.aiDepth, 3);
});

test('Match accepts a legal player move and toggles the turn', () => {
  const m = new Match();
  const moves = m.legalMovesForPlayer();
  const first = moves[0];
  const ok = m.applyPlayerMove(first.fromRow, first.fromCol, first.toRow, first.toCol);
  assert.equal(ok, true);
  assert.equal(m.whiteTurn, false);
  assert.equal(m.moveHistory.length, 1);
});

test('Match rejects illegal moves without mutating state', () => {
  const m = new Match();
  const ok = m.applyPlayerMove(0, 0, 6, 4);
  assert.equal(ok, false);
  assert.equal(m.whiteTurn, true);
  assert.equal(m.moveHistory.length, 0);
});

test('Match.reset restores the opening position', () => {
  const m = new Match();
  const first = m.legalMovesForPlayer()[0];
  m.applyPlayerMove(first.fromRow, first.fromCol, first.toRow, first.toCol);
  m.reset();
  assert.equal(m.whiteTurn, true);
  assert.equal(m.moveHistory.length, 0);
  assert.equal(m.lastMove, null);
});

test('Match.applyAiMove returns a move on the opening position', () => {
  const m = new Match({ level: 'easy' });
  // Player plays first; then AI must reply.
  const first = m.legalMovesForPlayer()[0];
  m.applyPlayerMove(first.fromRow, first.fromCol, first.toRow, first.toCol);
  const aiMove = m.applyAiMove();
  assert.ok(aiMove, 'AI should produce a move');
  assert.equal(m.whiteTurn, true);
});

test('Match.legalMovesFrom returns destinations only', () => {
  const m = new Match();
  // White pawn at e2 = board[5][4] should be able to advance.
  const dests = m.legalMovesFrom(5, 4);
  assert.ok(dests.length > 0);
  for (const d of dests) {
    assert.equal(typeof d.toRow, 'number');
    assert.equal(typeof d.toCol, 'number');
    assert.equal(d.fromRow, undefined);
  }
});
