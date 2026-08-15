import { Hono } from "hono";
import { getLatestSession, getHistory } from "../db.js";
import { requireAuth } from "../services/session.js";

export const sleepRouter = new Hono();

sleepRouter.use("/sleep/*", requireAuth);

sleepRouter.get("/sleep/latest", async (c) => {
  const session = await getLatestSession(c.env.DB, c.get("userId"));
  if (!session) return c.json({ error: "No sessions found yet" }, 404);
  return c.json(session);
});

sleepRouter.get("/sleep/history", async (c) => {
  const limit = Number(c.req.query("limit")) || 14;
  const sessions = await getHistory(c.env.DB, c.get("userId"), limit);
  return c.json(sessions);
});
