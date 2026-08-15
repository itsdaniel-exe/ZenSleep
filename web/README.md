# ZenSleep Web Dashboard

React (Vite) dashboard that shows sleep score, stress level, overnight
motion, score trend, and AI-generated recommendations from the
[backend API](../backend). In production it's served by the same Cloudflare
Worker as the API (same origin, no CORS) — see
[`../docs/deployment.md`](../docs/deployment.md).

## Run it (unified, matches production)

```bash
npm install && npm run build
cd ../backend && npx wrangler dev
```

Opens at `http://localhost:8787` — API and dashboard from one server, no env
vars needed (`src/api.js` defaults to relative `/api/...` requests).

## Run it (fast iteration, hot reload)

```bash
# terminal 1
cd backend && npx wrangler dev          # http://localhost:8787

# terminal 2
cd web
npm install
cp .env.example .env                     # sets VITE_API_URL=http://localhost:8787
npm run dev                              # http://localhost:5173, HMR
```

These are different origins (5173 vs 8787), which is why `VITE_API_URL` and
CORS (`backend/src/index.js`) exist at all — neither is needed in production.

## Accounts

Real signup/login (`src/components/AuthForm.jsx`), backed by D1 - see
[`../docs/architecture.md#auth`](../docs/architecture.md#auth). No hardware
needed to try it though: once logged in, an empty account shows a small
"try it with sample data" panel (`src/components/SampleDataPanel.jsx`) that
calls the backend's synthetic-data endpoint, rather than requiring a real
band to see the dashboard work.

## Structure

- `src/api.js` is the only file that talks to the backend.
- `App.jsx` switches between `LandingPage` (logged out) and the dashboard
  (logged in) based on `GET /api/auth/me`.

## Linting & build

```bash
npm run lint
npm run build   # outputs to dist/, which backend/wrangler.jsonc serves as static assets
```
