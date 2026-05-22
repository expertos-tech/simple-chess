#!/usr/bin/env node
// AI-vs-AI benchmark for Mini Chess 5x7.
//
// Plays N games between two AI configurations and reports:
//   - average move time
//   - average game length
//   - win / draw breakdown
//
// Usage:
//   node scripts/bench-ai.js                    # 5 games, depth 2 vs depth 2
//   node scripts/bench-ai.js --games 20         # 20 games
//   node scripts/bench-ai.js --white 3 --black 1  # depth 3 (white) vs depth 1 (black)
//   node scripts/bench-ai.js --max-moves 200    # cap per-game length
//
// This script does no I/O against the network; it imports the engine
// directly. It exists to make it easy to compare evaluator or
// search-tuning experiments without spinning up the server.

'use strict';

const { createBoard, cloneBoard, applyMove } = require('../src/board');
const { getStatus } = require('../src/game');
const { getAiMove } = require('../src/ai');

function parseArgs(argv) {
  const args = { games: 5, white: 2, black: 2, maxMoves: 150 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--games') args.games = Number(argv[++i]);
    else if (a === '--white') args.white = Number(argv[++i]);
    else if (a === '--black') args.black = Number(argv[++i]);
    else if (a === '--max-moves') args.maxMoves = Number(argv[++i]);
    else if (a === '--help' || a === '-h') {
      console.log('Usage: node scripts/bench-ai.js [--games N] [--white D] [--black D] [--max-moves M]');
      process.exit(0);
    } else {
      console.error(`Unknown arg: ${a}`);
      process.exit(2);
    }
  }
  return args;
}

function playGame({ whiteDepth, blackDepth, maxMoves }) {
  let board = createBoard();
  let whiteTurn = true;
  let moves = 0;
  let whiteTimeMs = 0;
  let blackTimeMs = 0;

  while (moves < maxMoves) {
    const status = getStatus(board, whiteTurn);
    if (status !== 'ongoing') {
      return { status, moves, whiteTimeMs, blackTimeMs };
    }
    const depth = whiteTurn ? whiteDepth : blackDepth;
    const t0 = process.hrtime.bigint();
    const move = getAiMove(board, whiteTurn, depth, { noise: 0 });
    const dt = Number(process.hrtime.bigint() - t0) / 1e6;
    if (whiteTurn) whiteTimeMs += dt;
    else blackTimeMs += dt;
    if (!move) return { status, moves, whiteTimeMs, blackTimeMs };
    board = cloneBoard(board);
    applyMove(board, move);
    whiteTurn = !whiteTurn;
    moves++;
  }
  return { status: 'unfinished', moves, whiteTimeMs, blackTimeMs };
}

function main() {
  const args = parseArgs(process.argv);
  const results = { white_wins: 0, black_wins: 0, stalemate: 0, unfinished: 0 };
  let totalMoves = 0;
  let totalWhiteMs = 0;
  let totalBlackMs = 0;

  console.log(
    `Playing ${args.games} game(s): White depth=${args.white}, Black depth=${args.black}, max ${args.maxMoves} moves`
  );

  for (let i = 0; i < args.games; i++) {
    const r = playGame({
      whiteDepth: args.white,
      blackDepth: args.black,
      maxMoves: args.maxMoves,
    });
    results[r.status] = (results[r.status] || 0) + 1;
    totalMoves += r.moves;
    totalWhiteMs += r.whiteTimeMs;
    totalBlackMs += r.blackTimeMs;
    console.log(
      `  Game ${i + 1}: ${r.status} in ${r.moves} moves ` +
        `(W ${r.whiteTimeMs.toFixed(0)} ms, B ${r.blackTimeMs.toFixed(0)} ms)`
    );
  }

  const totalAiMoves = totalMoves || 1;
  console.log('');
  console.log('Results:');
  console.log(`  white_wins: ${results.white_wins}`);
  console.log(`  black_wins: ${results.black_wins}`);
  console.log(`  stalemate : ${results.stalemate}`);
  console.log(`  unfinished: ${results.unfinished}`);
  console.log(`  avg moves : ${(totalMoves / args.games).toFixed(1)}`);
  console.log(
    `  avg ms/move (W): ${(totalWhiteMs / Math.ceil(totalAiMoves / 2)).toFixed(2)}`
  );
  console.log(
    `  avg ms/move (B): ${(totalBlackMs / Math.floor(totalAiMoves / 2 || 1)).toFixed(2)}`
  );
}

main();
