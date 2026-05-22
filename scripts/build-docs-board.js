#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

function parseArgs(argv) {
  const args = {
    out: path.join(__dirname, '..', 'docs', 'board-web.html'),
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') args.out = argv[++i];
    else if (a === '--help' || a === '-h') args.help = true;
    else throw new Error(`Unknown arg: ${a}`);
  }

  return args;
}

function usage() {
  return [
    'Usage: node scripts/build-docs-board.js [--out <file>]',
    '',
    'Copies the web board UI into the docs folder for GitHub Pages.',
    '',
    'Options:',
    '  --out <file>     Output HTML path (default: docs/board-web.html)',
  ].join('\n');
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    process.exit(0);
  }

  const repoRoot = path.join(__dirname, '..');
  const srcPath = path.join(repoRoot, 'public', 'index.html');
  const outPath = path.isAbsolute(args.out) ? args.out : path.join(process.cwd(), args.out);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.copyFileSync(srcPath, outPath);
  process.stdout.write(`Wrote ${outPath}\n`);
}

main();
