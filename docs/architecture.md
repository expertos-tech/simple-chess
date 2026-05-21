# Architecture

## Overview

Simple Chess 5x7 is a browser-first application. The architecture is composed of a Vue 3 frontend that communicates via WebSockets with a Node.js backend.

## Flow

`Browser UI -> WebSocket server -> Game Engine -> AI / Move Generation`

## Modules

- `src/server.js`: HTTP server (serves static files) and WebSocket protocol management. Official entry point.
- `src/board.js`: Board representation (7x5 matrix) and state helpers.
- `src/moves.js`: Legal move generation, validation, and check detection.
- `src/game.js`: Coordinate parsing (`a2a3`), turn management, and game status detection (win/draw).
- `src/ai.js`: Minimax algorithm with Alpha-Beta pruning for computer moves.
- `src/constants.js`: Shared global constants like `ROWS` and `COLS`.
- `public/index.html`: Browser UI powered by Vue 3 (CDN).

## Data model

- Board is a 7x5 matrix of single-character strings.
- `ROWS = 7`
- `COLS = 5`
- `.` is empty.
- Uppercase pieces are White, lowercase pieces are Black.
- Coordinates use files `a-e` and ranks `1-7`.

## Browser flow

- `src/server.js` serves `public/index.html`.
- Browser connects via WebSocket.
- Server sends a `state` message after connect and after each move.
- Player moves are sent as `move` messages; server validates and responds with updated state.
