# ZenSleep Web Dashboard

React (Vite) dashboard: a per-night report (score, stress, narrative,
recommendations), a calendar to browse past nights, and detail charts
(overnight motion, score trend), all from the [backend API](../backend). In
production it's served by the same Cloudflare Worker as the API (same
origin, no CORS) — see [`../docs/deployment.md`](../docs/deployment.md).

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
needed to try it though: signing up auto-generates one sample night before
the dashboard ever renders, so a new account lands on a working report
instead of an empty page. `src/components/SampleDataPanel.jsx` exports the
two places you can add more afterwards - `SampleDataOnboarding` (empty
state, one primary CTA) and `SampleDataUtility` (a small tucked-away
control once data exists) - both call the backend's synthetic-data
endpoint rather than requiring a real band.

## Structure

- `src/api.js` is the only file that talks to the backend.
- `App.jsx` switches between `LandingPage` (logged out) and the dashboard
  (logged in) based on `GET /api/auth/me`, and owns which session is
  "selected" (latest by default, or whatever calendar day was clicked).
- `components/SleepReport.jsx` - the hero panel (ring, headline, narrative,
  recommendations) for whichever night is selected.
- `components/SleepCalendar.jsx` - month grid, color-coded by stress level;
  clicking a day updates the selection in `App.jsx`.
- `components/SleepDetails.jsx` - metrics, motion timeline (latest night
  only - see `docs/architecture.md`), and the score trend chart.
- `components/ScoreRing.jsx` / `ScoreGauge.jsx` - the score ring is a bare,
  embeddable SVG (`ScoreRing`); `ScoreGauge` wraps it in a card for the
  landing page's hero visual only.

## Linting & build

```bash
npm run lint
npm run build   # outputs to dist/, which backend/wrangler.jsonc serves as static assets
```
