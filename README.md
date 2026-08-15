# ZenSleep

[![CI](https://github.com/itsdaniel-exe/ZenSleep/actions/workflows/ci.yml/badge.svg)](https://github.com/itsdaniel-exe/ZenSleep/actions/workflows/ci.yml)

**Intelligent stress inference from behavioral sleep signals.**

**Live**: https://zensleep.daniwork300.workers.dev

ZenSleep is a non-wearable-friction sleep tracker: an ESP32 band captures
overnight motion and heart-rate signals, a backend scores the night and
infers a stress level, and a web dashboard presents the result with
prioritized, actionable recommendations — built from the team's YUKTI
Innovation Challenge 2025 submission (AICTE Productization Fellowship,
Proto ID IR2025-947774).

This repo is a working, from-scratch implementation of that pitch: a
functioning scoring engine, API, dashboard, and firmware sketch, deployed as
a single Cloudflare Worker with a D1 database.

## Repository layout

```
firmware/   ESP32 + MPU6050 + MAX30102 Arduino sketch
backend/    Cloudflare Worker (Hono) — sleep scoring, stress inference, recommendations, AI narrative, D1 storage
web/        React (Vite) dashboard, served by the same Worker as static assets
docs/       Problem statement, business model, architecture, deployment (from the pitch deck + this build)
```

## Quick start (no hardware needed)

```bash
cd web && npm install && npm run build   # produces web/dist

cd ../backend
npm install
npx wrangler d1 migrations apply zensleep-db --local   # first time only
npx wrangler dev                                        # http://localhost:8787
```

Open `http://localhost:8787` and click "Generate good/restless/stressed
night" — this simulates a night of wearable data server-side and runs it
through the real scoring pipeline, no ESP32 required. See
[`backend/README.md`](backend/README.md) for the API and
[`web/README.md`](web/README.md) for the dashboard (including fast-HMR
frontend-only iteration).

To exercise the same ingest endpoint from the command line instead:

```bash
python backend/scripts/simulate_device.py --host http://localhost:8787 --user demo-user --profile stressed
```

## How scoring works

`backend/src/services/sleepScoring.js` turns 30-second motion/heart-rate
epochs into a 0-100 sleep score (duration, continuity, sleep latency, HR
stability) and a Low/Moderate/High stress inference, entirely rule-based and
explainable — no external API required. An optional AI layer
(`backend/src/services/aiInsights.js`) adds a narrative summary on top if an
`ANTHROPIC_API_KEY` secret is configured; without one, a deterministic
template is used instead. See [`docs/architecture.md`](docs/architecture.md)
for the full data flow and the reasoning behind these choices.

## Firmware

`firmware/zensleep_band/zensleep_band.ino` is the real ESP32 sketch for
actual hardware — see [`firmware/README.md`](firmware/README.md) for wiring,
required libraries, and its one known limitation (heart-rate beat detection
isn't wired up yet; motion-based scoring works standalone).

## Deploying

One Cloudflare Worker, one command:

```bash
cd web && npm run build
cd ../backend && npm run deploy
```

See [`docs/deployment.md`](docs/deployment.md) for one-time setup (D1
database creation, migrations) and why this shape was chosen over a
traditional server host.

## Development

Each package has its own tests/lint:

```bash
cd backend && npm test && npm run lint
cd web && npm run lint && npm run build
```

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs both, plus a
Worker bundle dry-run, on every push and pull request against `main`/`master`.

## Docs

- [`docs/problem-statement.md`](docs/problem-statement.md) — who this is for and why
- [`docs/business-model.md`](docs/business-model.md) — revenue, market sizing, IP strategy
- [`docs/architecture.md`](docs/architecture.md) — system design and where this implementation
  intentionally diverges from the original AWS/Firebase-based pitch
- [`docs/deployment.md`](docs/deployment.md) — hosting on Cloudflare Workers + D1, step by step

## License

All rights reserved — see [`LICENSE`](LICENSE). The pitch deck's business
plan calls for trade-secret/patent protection on the AI scoring logic, so
this repo defaults to a proprietary notice rather than an open-source
license. See the IP strategy note in
[`docs/business-model.md`](docs/business-model.md) if that needs to change
for specific components later.
