# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-05-22

### Added
- Browser-first Mini Chess 5x7 gameplay.
- WebSocket-based game state updates.
- Minimax AI with alpha-beta pruning and evaluation heuristics.
- Move highlighting, captured pieces, move history, movement feedback, and synthesized move sound.
- Documentation for rules, architecture, testing, AI, and development.

### Changed
- Finalized the project identity as Mini Chess 5x7.

### Removed
- Removed the previous terminal/CLI gameplay mode.

## [0.4.0] - 2026-05-22

### Changed
- Renamed the project from Simple Chess 5x7 to Mini Chess 5x7.
- Updated package metadata, documentation, generated docs, and public UI title to use the new name.


## [0.3.0] - 2026-05-21

### Changed

- Official board size changed to 5x7.
- Initial board setup changed to B-N-K-N-R (White) and r-n-k-n-b (Black).
- Project is now officially browser-first; terminal gameplay mode was removed.
- `npm start` now runs the web server by default.

### Removed

- Terminal gameplay mode (`src/cli.js` and `src/display.js`).
- 5x8 board logic and references.
- Terminal board image from documentation.

## [0.2.0] - 2026-05-21

### Added

- Balanced 5x7 board setup (initial implementation).
- Centered King between two Knights.
- One Rook per side.

## [0.1.2] - 2026-05-20

### Fixed

- Standalone documentation site links and board-web script.
- Repository clone URLs in README.

## [0.1.1] - 2026-05-20

### Added

- Modernized tooling (Node 24+, ESLint flat config, Prettier).
- Enhanced web/CLI parity.
- WebSocket server and Vue-based browser UI.

## [0.0.1] - 2026-05-19

### Added

- Initial 5x8 chess engine.
- Minimax AI with Alpha-Beta pruning.
- Coordinate-based move parsing.
- Basic terminal display.
