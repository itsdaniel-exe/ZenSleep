import { Router } from "express";
import { simulateNight } from "../services/simulate.js";
import { processSession } from "../services/processSession.js";

export const demoRouter = Router();

const PROFILES = ["good", "restless", "stressed"];

// One-click "Generate demo night" used by the web dashboard so the product
// can be demoed without real hardware or the Python simulator script.
demoRouter.post("/demo/:userId/generate", async (req, res) => {
  const profile = PROFILES.includes(req.body?.profile) ? req.body.profile : PROFILES[Math.floor(Math.random() * PROFILES.length)];
  const { epochs, meta } = simulateNight({ profile });
  const session = await processSession({ userId: req.params.userId, epochs, meta });
  res.status(201).json(session);
});
