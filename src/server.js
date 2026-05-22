// HTTP + WebSocket entry point for Mini Chess 5x7.
//
// Responsibilities are kept narrow:
//   - serve `public/index.html` over HTTP,
//   - upgrade WebSocket connections,
//   - validate inbound messages (`./protocol`),
//   - delegate game logic to a `Match` instance (`./session`).

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { WebSocketServer } = require('ws');

const {
  INBOUND,
  OUTBOUND,
  ERROR_CODES,
  validateInbound,
  makeStateMessage,
  makeValidMovesMessage,
  makeErrorMessage,
} = require('./protocol');
const { Match } = require('./session');
const { STATUS } = require('./protocol');

const DEFAULT_PORT = 3000;
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost',
  'http://127.0.0.1',
  'https://expertos-tech.github.io',
];

function isOriginAllowed(origin, allowList) {
  if (!origin) return true; // non-browser clients (e.g. tests, curl)
  return allowList.some((prefix) => origin === prefix || origin.startsWith(`${prefix}:`));
}

function resolveLevel(searchParams) {
  const raw = (searchParams.get('level') || '').toLowerCase();
  return ['easy', 'medium', 'hard'].includes(raw) ? raw : 'hard';
}

function resolveSide(searchParams) {
  const side = (searchParams.get('side') || 'white').toLowerCase();
  return side === 'black' ? 'black' : 'white';
}

function start(opts = {}) {
  const portFromEnv = process.env.PORT ? Number(process.env.PORT) : null;
  const port = Number.isFinite(opts.port)
    ? opts.port
    : Number.isFinite(portFromEnv)
      ? portFromEnv
      : DEFAULT_PORT;
  const allowedOrigins = Array.isArray(opts.allowedOrigins)
    ? opts.allowedOrigins
    : DEFAULT_ALLOWED_ORIGINS;

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

  const wss = new WebSocketServer({
    server,
    verifyClient: (info, done) => {
      const origin = info.origin || info.req.headers.origin;
      if (!isOriginAllowed(origin, allowedOrigins)) {
        done(false, 403, 'Forbidden origin');
        return;
      }
      done(true);
    },
  });

  wss.on('connection', (ws, request) => {
    const url = new URL(request.url || '/', 'http://localhost');
    const side = resolveSide(url.searchParams);
    const level = resolveLevel(url.searchParams);
    const match = new Match({ playerIsWhite: side === 'white', level });

    const send = (payload) => {
      if (ws.readyState === ws.OPEN) ws.send(payload);
    };
    const sendState = () => send(makeStateMessage(match.snapshot()));
    const sendError = (code, message) => send(makeErrorMessage(code, message));

    const maybePlayAi = () => {
      if (match.status() !== STATUS.ONGOING) return;
      if (match.playerToMove()) return;
      setImmediate(() => {
        const move = match.applyAiMove();
        if (move) sendState();
      });
    };

    sendState();
    if (!match.playerToMove()) maybePlayAi();

    ws.on('message', (raw) => {
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        sendError(ERROR_CODES.BAD_JSON, 'Malformed JSON');
        return;
      }

      const validation = validateInbound(parsed);
      if (!validation.ok) {
        sendError(validation.code);
        return;
      }
      const msg = validation.msg;

      if (msg.type === INBOUND.GET_MOVES) {
        if (!match.playerToMove()) {
          send(makeValidMovesMessage(msg.row, msg.col, []));
          return;
        }
        send(makeValidMovesMessage(msg.row, msg.col, match.legalMovesFrom(msg.row, msg.col)));
        return;
      }

      if (msg.type === INBOUND.MOVE) {
        if (!match.playerToMove()) {
          sendError(ERROR_CODES.NOT_YOUR_TURN);
          return;
        }
        const ok = match.applyPlayerMove(msg.fromRow, msg.fromCol, msg.toRow, msg.toCol);
        if (!ok) {
          sendError(ERROR_CODES.ILLEGAL_MOVE, 'Illegal move');
          return;
        }
        sendState();
        if (match.status() !== STATUS.ONGOING) return;
        maybePlayAi();
        return;
      }

      if (msg.type === INBOUND.RESET) {
        match.reset();
        sendState();
        if (!match.playerToMove()) maybePlayAi();
        return;
      }

      if (msg.type === INBOUND.CONFIG) {
        if (typeof msg.level === 'string') match.setLevel(msg.level);
        sendState();
        return;
      }
    });
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Try another port with: PORT=3001 npm start`);
      process.exit(1);
    }
    console.error('Server error:', err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`\nBrowser mode: http://localhost:${port}`);
  });

  return { server, wss };
}

if (require.main === module) {
  start();
}

module.exports = { start };
// Convenience re-exports preserved for legacy consumers / tests.
module.exports.OUTBOUND = OUTBOUND;
