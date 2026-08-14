# Deployment (Render)

[`render.yaml`](../render.yaml) is a Render Blueprint that provisions both
services from this one repo:

- `zensleep-backend` — Node web service (the API)
- `zensleep-web` — static site (the built dashboard)

## Steps

1. **Sign up at [render.com](https://render.com)** (free, no credit card —
   "Sign up with GitHub" is the fastest path since you'll be connecting a
   GitHub repo anyway).
2. **New > Blueprint**, connect the `itsdaniel-exe/ZenSleep` repo. Render
   reads `render.yaml` and shows both services it's about to create.
3. It will prompt for two values it can't guess (marked `sync: false` in the
   blueprint) — leave both blank for now, you'll fill them in after:
   - `ANTHROPIC_API_KEY` — optional, see step 6
   - `VITE_API_URL` — filled in in step 5, once the backend has a URL
4. Click **Apply**. Both services start deploying. The backend
   (`zensleep-backend`) will go live first — takes a few minutes on the free
   tier. Copy its URL from the Render dashboard, something like
   `https://zensleep-backend-xxxx.onrender.com`.
5. Open the **`zensleep-web`** service > **Environment**, set
   `VITE_API_URL` to the backend URL from step 4 (include `https://`, no
   trailing slash), and save. This triggers a rebuild — **required**,
   because Vite bakes `VITE_*` env vars in at build time, not runtime.
6. Optional — for real AI-generated narrative insights instead of the
   built-in offline template: open `zensleep-backend` > **Environment**, set
   `ANTHROPIC_API_KEY` to a key from
   [console.anthropic.com](https://console.anthropic.com), save (triggers a
   redeploy). Entirely optional — the app is fully functional without it.
7. Once `zensleep-web` finishes rebuilding, open its URL. Click "Generate
   good/restless/stressed night" to confirm the whole pipeline works live.

## Tightening CORS (optional but recommended)

The blueprint defaults `CORS_ORIGIN` to `*` so the two services can find
each other without knowing URLs in advance on first deploy. Once both are
live, go to `zensleep-backend` > **Environment**, set `CORS_ORIGIN` to the
exact `zensleep-web` URL (e.g. `https://zensleep-web-xxxx.onrender.com`),
save. There's no user data or auth in this app, so leaving it as `*` isn't a
security hole — this is just tidier.

## Free-tier behavior to expect

- **Cold starts**: the backend spins down after ~15 minutes idle. The first
  request after that takes 30-60s to wake it back up; the dashboard's
  "Loading…" state handles this, it just looks slow, not broken.
- **Data resets on cold start**: `backend/data/db.json` (see
  [`backend/README.md`](../backend/README.md)) lives on ephemeral disk on
  Render's free plan — sleep history is lost whenever the service restarts
  from idle or redeploys. For a demo this is fine (the dashboard's empty
  state handles it gracefully); for real user data, swap `backend/src/db.js`
  for a real database (Render's own Postgres, e.g.) before this is used by
  actual users. That's a contained change — see the note in
  `backend/README.md`'s Storage section.

## Redeploying after code changes

Render auto-deploys both services on every push to `master` by default
(configurable per-service under **Settings > Auto-Deploy**). No action
needed beyond `git push`.
