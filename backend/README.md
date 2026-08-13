# ZenSleep API

Node.js/Express service that ingests wearable sleep signals, scores each
night, infers a stress level, and generates recommendations + a narrative
insight. See [`src/services/sleepScoring.js`](src/services/sleepScoring.js)
for the scoring algorithm.

## Run it

```bash
npm install
cp .env.example .env
npm start
```

The API listens on `http://localhost:4000` by default. Health check:
`GET /api/health`.

## Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/ingest` | Submit a night of epochs (`{userId, epochs, meta}`), returns the scored session |
| GET | `/api/sleep/:userId/latest` | Most recent scored session for a user |
| GET | `/api/sleep/:userId/history?limit=14` | Recent sessions, oldest first, for trend charts |
| POST | `/api/demo/:userId/generate` | Generates and ingests a synthetic night (`profile`: `good`\|`restless`\|`stressed`) — no hardware needed |

## Data model

An **epoch** is a fixed 30-second window: `{ ts, motion: 0..1, heartRate: bpm|null }`.
A full night is an array of epochs plus `meta` (`lightsOffTs`, `screenTimeMinutesBeforeBed`).
This is exactly what [`firmware/zensleep_band`](../firmware/zensleep_band) sends from real hardware.

## AI narrative insight

`src/services/aiInsights.js` calls the Anthropic API for a personalized
narrative if `ANTHROPIC_API_KEY` is set in `.env`. With no key, it falls back
to a deterministic template — the app is fully functional offline either way.
Recommendations (`src/services/recommendations.js`) are always rule-based and
never depend on an external API.

## Testing without hardware

```bash
# Option A: one-click, from the web dashboard's "Generate demo night" button

# Option B: from the command line
python scripts/simulate_device.py --user demo-user --profile stressed
```

## Tests

```bash
npm test
```

## Storage

Sessions persist to `data/db.json` (gitignored) via lowdb — enough for a
demo/prototype. Swap `src/db.js` for a real database (DynamoDB, Postgres,
Firestore) before going to production; the rest of the app only depends on
the four exported functions in that file.
