<div align="center">

# 🌙 ZenSleep

**Intelligent stress inference from behavioral sleep signals.**

A band captures overnight movement and heart rate, and turns it into a sleep
score and a stress reading — with real accounts to track it over time.

[**→ Live demo**](https://zensleep.daniwork300.workers.dev)

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-API-E36002?logo=hono&logoColor=white)
![D1](https://img.shields.io/badge/D1-SQLite-F38020?logo=cloudflare&logoColor=white)
[![CI](https://github.com/itsdaniel-exe/ZenSleep/actions/workflows/ci.yml/badge.svg)](https://github.com/itsdaniel-exe/ZenSleep/actions/workflows/ci.yml)

</div>

---

## What it does

- 🌙 **Sleep Scoring Engine** — turns 30-second motion/heart-rate epochs into a 0–100 score across duration, continuity, latency, and HR stability, entirely rule-based and explainable
- 😰 **Stress Inference** — a Low/Moderate/High reading from restlessness, awakenings, and heart-rate variability
- 🤖 **AI Narrative Insight** — optional Claude-generated nightly summary, with a deterministic offline template as fallback
- 📅 **Sleep Calendar** — month grid color-coded by stress level; click any day to pull up that night's full report
- 👤 **Real Accounts** — signup/login with PBKDF2-hashed passwords and a signed session cookie, data scoped per account
- 📈 **Score Trend** — night-over-night delta plus a rolling trend chart
- 🎛️ **Sample Data** — one click seeds a realistic night so the dashboard has something to show right away
- 🔌 **ESP32 Firmware** — MPU6050 + MAX30102 Arduino sketch for the band itself

Built from the team's YUKTI Innovation Challenge 2025 submission (AICTE Productization
Fellowship, Proto ID IR2025-947774) — this repo is a working, from-scratch implementation
of that pitch, deployed as a single Cloudflare Worker with a D1 database.

## Try it

[**zensleep.daniwork300.workers.dev**](https://zensleep.daniwork300.workers.dev)

---

## Running it yourself

```bash
cd web && npm install && npm run build   # produces web/dist

cd ../backend
npm install
npx wrangler d1 migrations apply zensleep-db --local   # first time only
npx wrangler dev                                        # http://localhost:8787
```

Sign up with any email/password (it's your own local D1 instance) — a new account
auto-generates one sample night so you land straight on a working dashboard. Use
"+ add another sample night" to add more. See [`backend/README.md`](backend/README.md)
and [`web/README.md`](web/README.md) for the API and dashboard in more detail.

## How scoring works

`backend/src/services/sleepScoring.js` turns motion/heart-rate epochs into the score
and stress inference above — no external API required. An optional AI layer
(`backend/src/services/aiInsights.js`) adds a narrative summary on top if an
`ANTHROPIC_API_KEY` secret is configured; without one, a deterministic template is used
instead. See [`docs/architecture.md`](docs/architecture.md) for the full data flow.

## Deploying

One Cloudflare Worker, one command:

```bash
cd web && npm run build
cd ../backend && npm run deploy
```

See [`docs/deployment.md`](docs/deployment.md) for one-time setup (D1 database
creation, migrations).

## Docs

- [`docs/problem-statement.md`](docs/problem-statement.md) — who this is for and why
- [`docs/business-model.md`](docs/business-model.md) — revenue, market sizing, IP strategy
- [`docs/architecture.md`](docs/architecture.md) — system design, and where this
  implementation diverges from the original AWS/Firebase-based pitch
- [`docs/deployment.md`](docs/deployment.md) — hosting on Cloudflare Workers + D1
