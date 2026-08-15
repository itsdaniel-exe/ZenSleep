# Deployment (Cloudflare Workers)

ZenSleep deploys as a single Cloudflare Worker: [`backend/wrangler.jsonc`](../backend/wrangler.jsonc)
serves the API (`/api/*`, via Hono) and the built React dashboard (everything
else, via Workers Static Assets) from the same origin — no separate frontend
host, no CORS in production. Data lives in D1 (Cloudflare's SQLite).

**Live**: https://zensleep.daniwork300.workers.dev

## One-time setup

```bash
cd backend
npm install
npx wrangler login          # opens a browser to authorize the CLI
npx wrangler d1 create zensleep-db
```

Copy the `database_id` from the output into `backend/wrangler.jsonc`'s
`d1_databases[0].database_id` (it's currently set to the real database this
project already uses — only relevant if you're forking this to your own
Cloudflare account).

```bash
npx wrangler d1 migrations apply zensleep-db --remote
```

## Deploying

```bash
cd web && npm run build      # produces web/dist, which the Worker serves as static assets
cd ../backend && npm run deploy
```

That's it — one Worker, one command. Re-run both any time you change either
package; there's no separate frontend deploy step.

## Optional: real AI narrative insights

By default, narrative text comes from an offline template (see
[`backend/src/services/aiInsights.js`](../backend/src/services/aiInsights.js)).
To use Claude instead:

```bash
cd backend
npx wrangler secret put ANTHROPIC_API_KEY
```
(get a key from [console.anthropic.com](https://console.anthropic.com)).
Entirely optional — the app is fully functional without it.

## Local development

```bash
# Full unified stack (matches production exactly, incl. local D1):
cd web && npm run build && cd ../backend
npx wrangler d1 migrations apply zensleep-db --local   # first time only
npx wrangler dev                                        # http://localhost:8787
```

For fast frontend iteration (hot reload), run the Vite dev server separately
against `wrangler dev`'s API - see [`web/README.md`](../web/README.md).

## Why this shape

- **No cold starts, ever.** Unlike a traditional server that spins down when
  idle, Workers run on V8 isolates with sub-millisecond startup - the free
  tier has no "sleep after inactivity" tradeoff.
- **No card required, real free tier.** 100k Worker requests/day and D1's
  free tier (5GB storage, 5M rows read + 100k rows written per day) cover
  this app's usage many times over.
- **Real persistence.** Unlike a JSON file on ephemeral disk, D1 survives
  redeploys and restarts - verified by killing and restarting the Worker
  process mid-session and confirming session history was still there.
- **Same-origin by default.** Frontend and API are one deployment, so there's
  no CORS configuration needed in production (the `cors()` middleware in
  `backend/src/index.js` only matters for local dev, where the Vite dev
  server and `wrangler dev` run on different ports).

## Platform limits worth knowing

| Limit (free tier) | Value |
|---|---|
| Worker requests | 100,000/day |
| D1 storage | 5 GB total |
| D1 rows read | 5,000,000/day |
| D1 rows written | 100,000/day |
| D1 row size | 1 MB max |

Fetch current numbers from [developers.cloudflare.com](https://developers.cloudflare.com/) before relying on
specific figures - Cloudflare's limits do change over time.
