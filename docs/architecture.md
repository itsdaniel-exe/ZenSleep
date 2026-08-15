# Architecture

ZenSleep is a hardware-to-dashboard pipeline: a non-wearable-friendly band
captures raw motion + heart-rate signals, a backend turns them into a sleep
score and stress inference, and a web dashboard presents the result with
personalized recommendations. Everything server-side runs as a single
Cloudflare Worker - see [`deployment.md`](deployment.md).

```mermaid
flowchart LR
    subgraph Wearable["ESP32 Band (firmware/)"]
        MPU["MPU6050\nmotion/restlessness"]
        MAX["MAX30102\nheart rate"]
        FW["Epoch buffer\n30s windows"]
        MPU --> FW
        MAX --> FW
    end

    subgraph Worker["Cloudflare Worker (backend/)"]
        Ingest["/api/ingest (Hono)"]
        Score["Sleep scoring engine\n(duration, continuity,\nlatency, HR stability)"]
        Stress["Stress inference"]
        Rec["Rule-based\nrecommendations"]
        AI["AI narrative insight\n(Claude, optional)"]
        DB[("D1 (SQLite)")]
        Assets["Static assets\n(web/dist)"]
        Ingest --> Score --> Stress
        Score --> Rec
        Score --> AI
        Stress --> DB
        Rec --> DB
        AI --> DB
    end

    subgraph Web["Dashboard (web/)"]
        UI["React + Recharts\nscore, trend, timeline,\nrecommendations"]
    end

    FW -- "HTTPS POST JSON" --> Ingest
    DB -- "GET /api/sleep/:userId/latest\nGET /api/sleep/:userId/history" --> UI
    Assets -. "same origin, same deploy" .-> UI
```

## Why this shape

- **Epochs, not raw samples.** The wearable pre-aggregates into 30-second
  windows before sending, keeping payloads small and battery use low —
  matches the pitch's non-wearable-comfort and long-battery-life goals.
- **Scoring is deterministic and local to the backend**, not delegated to an
  LLM. The AI layer only adds a narrative gloss on top of numbers that are
  already trustworthy and explainable — important for a health-adjacent
  product where users (and investors) will ask "why this score?"
- **AI is additive, not load-bearing.** `backend/src/services/aiInsights.js`
  falls back to a template if no API key is configured, so the product works
  fully offline and the core IP (the scoring/stress-inference logic) doesn't
  depend on an external vendor.
- **The dashboard has no hardware dependency.** `/api/demo/:userId/generate`
  lets the web app (and this whole repo) be demoed convincingly with zero
  physical devices, which matters for pitching to evaluators/investors who
  won't have a band on them.
- **One deployment, one origin.** The Worker serves both `/api/*` (Hono) and
  the built dashboard (Workers Static Assets, `run_worker_first: ["/api/*"]`
  in `backend/wrangler.jsonc`) - no CORS in production, no separate frontend
  host to keep in sync, no cold starts.

## Where this diverges from the original pitch deck

The deck names AWS serverless + Firebase specifically. This implementation
uses Cloudflare Workers + D1 instead - same "serverless, no server to
manage" spirit, different vendor. `backend/src/db.js` is a 3-function
interface (`saveSession`/`getLatestSession`/`getHistory`); swapping the
underlying store is a contained change that doesn't touch scoring, routing,
or the frontend. See [`backend/README.md`](../backend/README.md).
