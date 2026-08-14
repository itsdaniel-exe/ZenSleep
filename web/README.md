# ZenSleep Web Dashboard

React (Vite) dashboard that shows sleep score, stress level, overnight
motion, score trend, and AI-generated recommendations from the
[backend API](../backend).

## Run it

```bash
npm install
cp .env.example .env
npm run dev
```

Opens at `http://localhost:5173`. Make sure the backend is running first
(`cd ../backend && npm start`) — default `VITE_API_URL` points at
`http://localhost:4790`.

## Demo mode

No hardware or account needed: the dashboard assigns a random `demo-*` user
id (stored in `localStorage`, see `src/firebase.js`) and the "Generate ___
night" buttons call the backend's synthetic-data endpoint to populate the
dashboard instantly.

## Going to production

- `src/firebase.js` documents exactly where to wire real Firebase Auth once
  you have project keys — the rest of the app is unaffected either way.
- `src/api.js` is the only file that talks to the backend; point
  `VITE_API_URL` at your deployed API.

## Linting & build

```bash
npm run lint
npm run build   # outputs to dist/
```
