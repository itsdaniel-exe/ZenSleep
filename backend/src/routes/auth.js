import { Hono } from "hono";
import { hashPassword, verifyPassword } from "../services/password.js";
import { createUser, getUserByEmail, getUserById, getPasswordHash, updateUserSettings, updateUserPassword } from "../db.js";
import { createSession, clearSession, readSession, requireAuth } from "../services/session.js";

export const authRouter = new Hono();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

authRouter.post("/auth/signup", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!EMAIL_RE.test(email)) return c.json({ error: "Enter a valid email address" }, 400);
  if (password.length < 8) return c.json({ error: "Password must be at least 8 characters" }, 400);

  const existing = await getUserByEmail(c.env.DB, email);
  if (existing) return c.json({ error: "An account with this email already exists" }, 409);

  const user = { id: crypto.randomUUID(), email, createdAt: Date.now() };
  const passwordHash = await hashPassword(password);
  await createUser(c.env.DB, { ...user, passwordHash });

  await createSession(c, user);
  return c.json({ id: user.id, email: user.email }, 201);
});

authRouter.post("/auth/login", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  const user = await getUserByEmail(c.env.DB, email);
  const valid = user && (await verifyPassword(password, user.passwordHash));
  if (!valid) return c.json({ error: "Incorrect email or password" }, 401);

  await createSession(c, user);
  return c.json({ id: user.id, email: user.email });
});

authRouter.post("/auth/logout", (c) => {
  clearSession(c);
  return c.json({ ok: true });
});

authRouter.get("/auth/me", async (c) => {
  const session = await readSession(c);
  if (!session) return c.json({ error: "Not authenticated" }, 401);
  const user = await getUserById(c.env.DB, session.sub);
  if (!user) return c.json({ error: "Not authenticated" }, 401);
  return c.json(user);
});

// A per-user sleep-duration goal that actually feeds the scoring engine
// (sleepScoring.js's durationScore), not a cosmetic setting - see
// docs/architecture.md. Defaults to 8h (migrations/0004_user_settings.sql).
authRouter.patch("/auth/me", requireAuth, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 60) || null : null;
  const targetSleepHours =
    typeof body.targetSleepHours === "number" && body.targetSleepHours >= 4 && body.targetSleepHours <= 12
      ? body.targetSleepHours
      : 8;

  await updateUserSettings(c.env.DB, c.get("userId"), { name, targetSleepHours });
  const user = await getUserById(c.env.DB, c.get("userId"));
  return c.json(user);
});

authRouter.post("/auth/change-password", requireAuth, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (newPassword.length < 8) return c.json({ error: "New password must be at least 8 characters" }, 400);

  const passwordHash = await getPasswordHash(c.env.DB, c.get("userId"));
  const valid = passwordHash && (await verifyPassword(currentPassword, passwordHash));
  if (!valid) return c.json({ error: "Current password is incorrect" }, 401);

  await updateUserPassword(c.env.DB, c.get("userId"), await hashPassword(newPassword));
  return c.json({ ok: true });
});

export { requireAuth };
