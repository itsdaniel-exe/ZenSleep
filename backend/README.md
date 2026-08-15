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

Auth (`src/routes/auth.js`, `src/services/session.js`) is a signed, httpOnly
JWT cookie - see [`../docs/architecture.md`](../docs/architecture.md#auth)
for how it works.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | — | `{email, password}` → creates an account, sets the session cookie |
| POST | `/api/auth/login` | — | `{email, password}` → sets the session cookie |
| POST | `/api/auth/logout` | — | Clears the session cookie |
| GET | `/api/auth/me` | cookie | Current user, or 401 |
| POST | `/api/devices` | cookie | `{name}` → pairs a new device, returns its API key (shown once, never again) |
| GET | `/api/devices` | cookie | List the logged-in user's devices with `lastSeenAt` |
| DELETE | `/api/devices/:id` | cookie | Revoke a device - its API key stops working immediately |
| POST | `/api/ingest` | device key | `{epochs, meta}` → scores and stores the night, updates the device's `lastSeenAt` |
| GET | `/api/sleep/latest` | cookie | Most recent scored session for the logged-in user |
| GET | `/api/sleep/history?limit=14` | cookie | Recent sessions, oldest first, for trend charts and the calendar |
| POST | `/api/demo/generate` | cookie | Generates and ingests a synthetic night for the logged-in user (`profile`: `good`\|`restless`\|`stressed`, `daysAgo`: backdates `createdAt` so repeated calls spread across the calendar instead of stacking on today) |

`/api/ingest` is the device path (the ESP32 has no browser session), so
it's authenticated by `Authorization: Bearer <device API key>` instead of
the cookie - see [`docs/architecture.md`](../docs/architecture.md#auth) for
how device pairing works.

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

## Sample data

```bash
# Option A: one-click, from the dashboard - sign up, then "+ add another
# sample night" (or the onboarding CTA on a brand-new account)

# Option B: from the command line - --device-key comes from the dashboard's
# "Your band" section ("+ connect a band"), shown once at creation time
python scripts/simulate_device.py --host http://localhost:8787 --device-key zs_... --profile stressed
```

## Tests & linting

```bash
npm test    # pure-function unit tests (node:test), no Workers runtime needed
npm run lint
```

## Storage

Sessions and user accounts persist to D1 (`migrations/`) — real, durable
storage that survives redeploys, unlike an in-memory or ephemeral-disk
store. `src/db.js` is a small functional interface
(`saveSession`/`getLatestSession`/`getHistory`/`createUser`/`getUserByEmail`/`getUserById`);
the rest of the app only depends on those. Passwords are hashed with PBKDF2
(`src/services/password.js`) - never stored or logged in plaintext.

## Deploying

```bash
cd ../web && npm run build
cd ../backend && npm run deploy
```

See [`../docs/deployment.md`](../docs/deployment.md) for one-time D1 setup.
