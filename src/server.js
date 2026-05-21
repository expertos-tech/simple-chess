const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const { createBoard, applyMove, moveToStr } = require('./board');
const { getLegalMoves, isInCheck } = require('./moves');
const { getAiMove } = require('./ai');
const { getStatus } = require('./game');
const { PIECE_VALUES } = require('./pieces');

const DEFAULT_PORT = 3000;

function captureScore(pieces) {
  return pieces.reduce((sum, p) => sum + (PIECE_VALUES[p.toLowerCase()] || 0), 0);
}

function makeState(
  board,
  whiteTurn,
  status,
  lastMove,
  capturedByWhite,
  capturedByBlack,
  moveHistory
) {
  return JSON.stringify({
    type: 'state',
    board,
    whiteTurn,
    status,
    lastMove,
    inCheck: status === 'ongoing' && isInCheck(board, whiteTurn),
    capturedByWhite,
    capturedByBlack,
    moveHistory,
    scoreWhite: captureScore(capturedByWhite),
    scoreBlack: captureScore(capturedByBlack),
  });
}

function start(opts = {}) {
  const portFromEnv = process.env.PORT ? Number(process.env.PORT) : null;
  const port = Number.isFinite(opts.port)
    ? opts.port
    : Number.isFinite(portFromEnv)
      ? portFromEnv
      : DEFAULT_PORT;
  const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
      const filePath = path.join(__dirname, '..', 'public', 'index.html');
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
      });
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, request) => {
    const url = new URL(request.url || '/', 'http://localhost');
    const side = (url.searchParams.get('side') || 'white').toLowerCase();
    const playerIsWhite = side !== 'black';

    let board = createBoard();
    let whiteTurn = true;
    let lastMove = null;
    let capturedByWhite = []; // black pieces taken by white
    let capturedByBlack = []; // white pieces taken by black
    let moveHistory = []; // [{ move: 'a2a3', isWhite: true, num: 1 }, ...]
    let moveCount = 1;

    const playerToMove = () => (playerIsWhite ? whiteTurn : !whiteTurn);

    const sendState = (statusOverride = null) => {
      const status = statusOverride || getStatus(board, whiteTurn);
      ws.send(
        makeState(board, whiteTurn, status, lastMove, capturedByWhite, capturedByBlack, moveHistory)
      );
    };

    const applyCapture = (capturedPiece, moverIsWhite) => {
      if (capturedPiece === '.') return;
      if (moverIsWhite) capturedByWhite.push(capturedPiece);
      else capturedByBlack.push(capturedPiece);
    };

    const maybePlayAi = () => {
      if (getStatus(board, whiteTurn) !== 'ongoing') return;
      if (playerToMove()) return;

      setImmediate(() => {
        const aiMove = getAiMove(board, whiteTurn);
        if (!aiMove) return;

        applyCapture(board[aiMove.toRow][aiMove.toCol], whiteTurn);
        applyMove(board, aiMove);
        lastMove = aiMove;

        moveHistory.push({ move: moveToStr(aiMove), isWhite: whiteTurn, num: moveCount });
        if (!whiteTurn) moveCount++;

        whiteTurn = !whiteTurn;
        sendState();
      });
    };

    sendState();
    if (!playerIsWhite) maybePlayAi();

    ws.on('message', (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }

      if (msg.type === 'getMoves') {
        const { row, col } = msg;
        if (!playerToMove()) return;
        const moves = getLegalMoves(board, whiteTurn)
          .filter((m) => m.fromRow === row && m.fromCol === col)
          .map((m) => ({ toRow: m.toRow, toCol: m.toCol }));
        ws.send(JSON.stringify({ type: 'validMoves', fromRow: row, fromCol: col, moves }));
      } else if (msg.type === 'move') {
        if (!playerToMove()) return;
        const { fromRow, fromCol, toRow, toCol } = msg;
        const match = getLegalMoves(board, whiteTurn).find(
          (m) =>
            m.fromRow === fromRow && m.fromCol === fromCol && m.toRow === toRow && m.toCol === toCol
        );
        if (!match) {
          ws.send(JSON.stringify({ type: 'error', message: 'Illegal move' }));
          return;
        }

        applyCapture(board[match.toRow][match.toCol], whiteTurn);
        applyMove(board, match);
        lastMove = match;
        moveHistory.push({ move: moveToStr(match), isWhite: whiteTurn, num: moveCount });
        if (!whiteTurn) moveCount++;

        whiteTurn = !whiteTurn;

        const statusAfterPlayer = getStatus(board, whiteTurn);
        sendState(statusAfterPlayer);
        if (statusAfterPlayer !== 'ongoing') return;

        maybePlayAi();
      } else if (msg.type === 'reset') {
        board = createBoard();
        whiteTurn = true;
        lastMove = null;
        capturedByWhite = [];
        capturedByBlack = [];
        moveHistory = [];
        moveCount = 1;
        sendState('ongoing');
        if (!playerIsWhite) maybePlayAi();
      }
    });
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.error(
        `Port ${port} is already in use. Try another port with: PORT=3001 npm run start:browser`
      );
      process.exit(1);
    }
    throw err;
  });

  server.listen(port, () => {
    console.log(`\nBrowser mode: http://localhost:${port}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = { start };
