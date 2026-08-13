import { Router } from "express";
import { getLatestSession, getHistory } from "../db.js";

export const sleepRouter = Router();

sleepRouter.get("/sleep/:userId/latest", async (req, res) => {
  const session = await getLatestSession(req.params.userId);
  if (!session) return res.status(404).json({ error: "No sessions found for this user yet" });
  res.json(session);
});

sleepRouter.get("/sleep/:userId/history", async (req, res) => {
  const limit = Number(req.query.limit) || 14;
  const sessions = await getHistory(req.params.userId, limit);
  res.json(sessions);
});
