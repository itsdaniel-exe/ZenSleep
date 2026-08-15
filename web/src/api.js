// Empty string = relative fetch ("/api/...") against the current origin.
// That's correct both in production (the Worker serves the API and the
// built dashboard from the same origin) and when running `wrangler dev`
// directly. Only set VITE_API_URL when the frontend is served from a
// different origin than the API - e.g. Vite's own dev server on :5173
// talking to `wrangler dev` on :8787.
const BASE_URL = import.meta.env.VITE_API_URL || "";

async function request(path, options) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "content-type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request to ${path} failed (${res.status})`);
  }
  return res.json();
}

export function getLatest(userId) {
  return request(`/api/sleep/${encodeURIComponent(userId)}/latest`);
}

export function getHistory(userId, limit = 14) {
  return request(`/api/sleep/${encodeURIComponent(userId)}/history?limit=${limit}`);
}

export function generateDemoNight(userId, profile) {
  return request(`/api/demo/${encodeURIComponent(userId)}/generate`, {
    method: "POST",
    body: JSON.stringify({ profile }),
  });
}
