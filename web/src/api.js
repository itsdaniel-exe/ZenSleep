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
    credentials: "include", // send/receive the session cookie, incl. cross-origin dev
    ...options,
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Request to ${path} failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export function signup(email, password) {
  return request("/api/auth/signup", { method: "POST", body: JSON.stringify({ email, password }) });
}

export function login(email, password) {
  return request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export function logout() {
  return request("/api/auth/logout", { method: "POST" });
}

export async function getMe() {
  try {
    return await request("/api/auth/me");
  } catch (err) {
    if (err.status === 401) return null;
    throw err;
  }
}

export function getLatest() {
  return request("/api/sleep/latest");
}

export function getHistory(limit = 14) {
  return request(`/api/sleep/history?limit=${limit}`);
}

export function generateDemoNight(profile, daysAgo = 0) {
  return request("/api/demo/generate", { method: "POST", body: JSON.stringify({ profile, daysAgo }) });
}

export function createDevice(name) {
  return request("/api/devices", { method: "POST", body: JSON.stringify({ name }) });
}

export function getDevices() {
  return request("/api/devices");
}

export function deleteDevice(id) {
  return request(`/api/devices/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function updateSettings(name, targetSleepHours) {
  return request("/api/auth/me", { method: "PATCH", body: JSON.stringify({ name, targetSleepHours }) });
}

export function changePassword(currentPassword, newPassword) {
  return request("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
