# WebSocket Protocol

The browser UI and the Node.js server communicate over a single
WebSocket connection per browser tab. There is **no REST API** — every
state-mutating action and every state update goes through this socket.

The current protocol version is **`1`**, exported as
`PROTOCOL_VERSION` from [`src/protocol.js`](../src/protocol.js).

---

## 1. Connection lifecycle

1. Browser opens `GET /`. The server returns `public/index.html`.
2. Browser opens a WebSocket against the same host. Two optional query
   parameters tweak the new match:
   - `?side=white` (default) or `?side=black` — which color the human plays.
   - `?level=easy|medium|hard` (default `hard`) — AI difficulty.
3. The server creates a new [`Match`](../src/session.js), then sends one
   `state` message with the initial position.
4. If the human plays Black, the server immediately plays the AI's
   first move and sends another `state`.

The server also validates the `Origin` header (allow-list in
`DEFAULT_ALLOWED_ORIGINS` in `src/server.js`). Requests from unknown
origins are rejected before the WebSocket handshake completes.

---

## 2. Message envelope

All messages are JSON, with a required string `type` field:

```json
{ "type": "move", "fromRow": 5, "fromCol": 4, "toRow": 4, "toCol": 4 }
```

Outbound `state` messages also carry `"protocolVersion": 1`.

Anything that fails JSON parsing or whose `type` is unknown is replied
to with an `error` message; the connection is **not** closed.

---

## 3. Inbound messages (browser → server)

| `type`     | Payload fields                                  | Effect |
| ---------- | ----------------------------------------------- | ------ |
| `getMoves` | `row` (int), `col` (int)                        | Server replies with `validMoves` for that square. |
| `move`     | `fromRow`, `fromCol`, `toRow`, `toCol` (ints)   | Apply the move if legal. Server replies with `state`. If it is now the AI's turn, the AI moves and a second `state` follows. |
| `reset`    | —                                               | Reset the match; reply with a fresh `state`. |
| `config`   | optional `level` ∈ `{easy, medium, hard}`       | Update AI difficulty for subsequent moves. Reply with `state`. |

All integer coordinates are bounds-checked against `ROWS=7` / `COLS=5`.
Unknown fields are ignored. Invalid payloads produce an `error` with
code `INVALID_PAYLOAD`.

---

## 4. Outbound messages (server → browser)

### 4.1 `state`

Sent after every state change.

```json
{
  "type": "state",
  "protocolVersion": 1,
  "board": [["r","n","k","n","b"], ...],
  "whiteTurn": true,
  "status": "ongoing",
  "lastMove": { "fromRow": 5, "fromCol": 4, "toRow": 4, "toCol": 4 },
  "inCheck": false,
  "capturedByWhite": [],
  "capturedByBlack": [],
  "moveHistory": [],
  "scoreWhite": 0,
  "scoreBlack": 0,
  "level": "hard"
}
```

Fields:

- **`board`**: 7×5 matrix of single-character piece codes; `.` is empty.
- **`whiteTurn`**: who has the move *next*.
- **`status`**: `"ongoing" | "white_wins" | "black_wins" | "stalemate"`.
- **`lastMove`**: the move that just produced this state, or `null` for the initial position.
- **`inCheck`**: whether the side to move is in check (always `false` if status ≠ ongoing).
- **`capturedByWhite` / `capturedByBlack`**: lists of captured piece codes.
- **`moveHistory`**: array of `{ move: "a2a3", isWhite: true, num: 1 }`.
- **`scoreWhite` / `scoreBlack`**: sum of captured piece values per side.
- **`level`**: current AI difficulty.

### 4.2 `validMoves`

Reply to `getMoves`. Used by the UI to highlight legal destinations.

```json
{
  "type": "validMoves",
  "fromRow": 5,
  "fromCol": 4,
  "moves": [{ "toRow": 4, "toCol": 4 }, { "toRow": 3, "toCol": 4 }]
}
```

If the square is empty, has an opposing piece, or has no legal moves,
`moves` is an empty array. The server does not raise an error in that
case.

### 4.3 `error`

```json
{ "type": "error", "code": "ILLEGAL_MOVE", "message": "ILLEGAL_MOVE" }
```

Codes are stable strings exported as `ERROR_CODES` in
[`src/protocol.js`](../src/protocol.js):

| Code              | Meaning |
| ----------------- | ------- |
| `BAD_JSON`        | Message was not valid JSON. |
| `UNKNOWN_TYPE`    | `type` is missing or unknown. |
| `INVALID_PAYLOAD` | Fields missing or out of range. |
| `NOT_YOUR_TURN`   | Player tried to move on the AI's turn. |
| `ILLEGAL_MOVE`    | The requested move is not legal in the current position. |

The browser uses `error` to clear its "AI thinking..." indicator so
that the human can try again immediately.

---

## 5. Example session

Player (White), opens the connection:

```text
S → C  { "type": "state", "protocolVersion": 1, "whiteTurn": true, ... }
C → S  { "type": "getMoves", "row": 5, "col": 4 }
S → C  { "type": "validMoves", "fromRow": 5, "fromCol": 4, "moves": [...] }
C → S  { "type": "move", "fromRow": 5, "fromCol": 4, "toRow": 4, "toCol": 4 }
S → C  { "type": "state", ... whiteTurn: false }   // after player's move
S → C  { "type": "state", ... whiteTurn: true  }   // after AI's reply
```

Reset:

```text
C → S  { "type": "reset" }
S → C  { "type": "state", "lastMove": null, ... }
```

Change difficulty mid-game:

```text
C → S  { "type": "config", "level": "easy" }
S → C  { "type": "state", "level": "easy", ... }
```

---

## 6. Versioning

`PROTOCOL_VERSION` is a single integer. Bump it on any
**incompatible** wire change (renamed field, removed field, changed
semantics). Backward-compatible additions (new optional field, new
inbound `type`) do not bump the version; clients are expected to
ignore unknown fields.

The browser tolerates unknown outbound fields by design (Vue templates
read each field individually), so adding new fields to `state` is
always safe.

---

## 7. Why no REST?

A single WebSocket gives us:

- **Push.** AI moves arrive without the client having to poll.
- **One source of state.** The server is authoritative; the browser is
  a thin renderer.
- **Symmetric error handling.** Every action and every notification
  goes through the same envelope.

For a single-player local game this is dramatically simpler than a
REST + polling design and keeps `src/server.js` under 200 lines.
