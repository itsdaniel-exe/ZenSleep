import { Router } from "express";
import { processSession } from "../services/processSession.js";

export const ingestRouter = Router();

// Wearable (or the Python device simulator in scripts/) posts a full night
// here as { userId, epochs: [{ts, motion, heartRate}], meta }.
ingestRouter.post("/ingest", async (req, res) => {
  const { userId, epochs, meta } = req.body ?? {};

  if (typeof userId !== "string" || !userId) {
    return res.status(400).json({ error: "userId (string) is required" });
  }
  if (!Array.isArray(epochs) || epochs.length === 0) {
    return res.status(400).json({ error: "epochs (non-empty array) is required" });
  }

  try {
    const session = await processSession({ userId, epochs, meta });
    res.status(201).json(session);
  } catch (err) {
    console.error("ingest error:", err);
    res.status(400).json({ error: err.message });
  }
});
