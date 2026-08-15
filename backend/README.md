# ZenSleep API

Cloudflare Worker (Hono) that ingests wearable sleep signals, scores each
night, infers a stress level, and generates recommendations + a narrative
insight. Also serves the built dashboard (`web/dist`) as static assets from
the same Worker - see [`wrangler.jsonc`](wrangler.jsonc). See
[`src/services/sleepScoring.js`](src/services/sleepScoring.js) for the
scoring algorithm.

## Run it

```bash
npm install
npx wrangler d1 migrations apply zensleep-db --local   # first time only, creates the local D1 sqlite file
npx wrangler dev
```

Listens on `http://localhost:8787` and serves both the API and (if
`../web/dist` exists — run `npm run build` in `web/` first) the dashboard.
Health check: `GET /api/health`.

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
narrative if `ANTHROPIC_API_KEY` is set (`npx wrangler secret put
ANTHROPIC_API_KEY` in production, or a `.dev.vars` file locally - see
[`.dev.vars.example`](.dev.vars.example)). With no key, it falls back to a
deterministic template — the app is fully functional offline either way.
Recommendations (`src/services/recommendations.js`) are always rule-based and
never depend on an external API.

## Testing without hardware

```bash
# Option A: one-click, from the web dashboard's "Generate demo night" button

# Option B: from the command line
python scripts/simulate_device.py --host http://localhost:8787 --user demo-user --profile stressed
```

## Tests & linting

```bash
npm test    # pure-function unit tests (node:test), no Workers runtime needed
npm run lint
```

## Storage

Sessions persist to D1 (`migrations/0001_initial_schema.sql`) — real,
durable storage that survives redeploys, unlike an in-memory or
ephemeral-disk store. `src/db.js` is a 3-function interface
(`saveSession`/`getLatestSession`/`getHistory`); the rest of the app only
depends on those.

## Deploying

```bash
cd ../web && npm run build
cd ../backend && npm run deploy
```

See [`../docs/deployment.md`](../docs/deployment.md) for one-time D1 setup.
