# Testing

## Overview

The project uses the built-in Node.js test runner. Tests are located in the `test/` directory.

## Running tests

```bash
npm test
```

To run a specific test file:

```bash
node --test test/board.test.js
```

## Coverage

- `test/board.test.js`: Validates board initialization, piece placement, and piece counts.
- `test/moves.test.js`: Validates move generation for all pieces, including promotion and check detection.
- `test/game.test.js`: Validates coordinate parsing and game status detection.
- `test/ai.test.js`: Validates AI move selection and basic tactical awareness.

## Validation Policy

Always run `npm run check` before submitting changes. This ensures that the code follows styling rules, passes all unit tests, and is properly formatted.
