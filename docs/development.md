# Development

Practical guide for running, testing, and iterating on Mini Chess 5x7
locally.

## Prerequisites

- **Node.js ≥ 24** (see `.nvmrc`). Node 24 is the supported baseline;
  newer versions should work.
- A modern browser (Chrome, Firefox, Safari, Edge — anything that
  supports ES2020 and WebSockets).

No native build steps. No bundler. No database. No external services.

## Install

```bash
npm install
```

This installs `ws`, the only runtime dependency, plus the lint/format/test
tooling.

## Run the game

```bash
npm start
```

Open <http://localhost:3000> in your browser. The server logs every
WebSocket connection and every applied move.

For automatic restart on file changes:

```bash
npm run dev
```

This wraps the start command with `node --watch`.

## Run the tests

```bash
npm test
```

Tests are written with Node's built-in test runner (`node:test`). No
Jest, no Vitest, no transpilation. Add new tests as `test/*.test.js`.

## Lint and format

```bash
npm run lint       # ESLint flat config (eslint.config.js)
npm run format     # Prettier — write
npm run check      # Lint + format check + tests
```

Run `npm run check` before every PR.

## Useful environment variables

The server reads a couple of env vars in [`src/server.js`](../src/server.js):

| Variable           | Default | Effect |
| ------------------ | ------- | ------ |
| `PORT`             | `3000`  | HTTP/WebSocket port. |
| `ALLOWED_ORIGINS`  | localhost + GitHub Pages | Comma-separated list of allowed `Origin` prefixes. |

Example:

```bash
PORT=8080 ALLOWED_ORIGINS=http://localhost,http://192.168.1.10 npm start
```

## Choosing the AI side / difficulty

Open the browser with a query string:

- `http://localhost:3000/?side=black` — play Black; AI moves first.
- `http://localhost:3000/?level=easy` — easy AI (depth 1 + noise).
- Both: `http://localhost:3000/?side=black&level=medium`.

You can also change difficulty mid-game by sending a `config` message
over the WebSocket; see [`websocket-protocol.md`](./websocket-protocol.md).

## Pointing the page at a different server

The browser uses `window.location.host` by default. To point a hosted
copy of `public/index.html` (e.g. GitHub Pages) at a remote server,
set the override before the page loads or pass `?ws=` in the URL:

```js
window.MINI_CHESS_WS = 'wss://example.com';   // or
// http://localhost:3000/?ws=wss://example.com
```

The legacy global `window.SIMPLE_CHESS_WS` is still honored for
backward compatibility but is deprecated.

## Folder layout

```
src/         Server + engine + AI (pure Node, CommonJS).
public/      Single HTML file with the Vue 3 UI; served as-is.
test/        node:test suites.
docs/        Documentation (this folder).
scripts/     Tooling scripts (not part of the runtime).
```

Anything under `scripts/` is dev-time only and never required at
runtime. Anything under `public/` is shipped to browsers as-is.
