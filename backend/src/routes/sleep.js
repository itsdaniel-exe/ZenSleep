import { Hono } from "hono";
import { getLatestSession, getHistory } from "../db.js";

export const sleepRouter = new Hono();

sleepRouter.get("/sleep/:userId/latest", async (c) => {
  const session = await getLatestSession(c.env.DB, c.req.param("userId"));
  if (!session) return c.json({ error: "No sessions found for this user yet" }, 404);
  return c.json(session);
});

sleepRouter.get("/sleep/:userId/history", async (c) => {
  const limit = Number(c.req.query("limit")) || 14;
  const sessions = await getHistory(c.env.DB, c.req.param("userId"), limit);
  return c.json(sessions);
});
