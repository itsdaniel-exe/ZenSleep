import { Hono } from "hono";
import { hashPassword, verifyPassword } from "../services/password.js";
import { createUser, getUserByEmail, getUserById } from "../db.js";
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

export { requireAuth };
