import { Hono } from "hono";
import { simulateNight } from "../services/simulate.js";
import { processSession } from "../services/processSession.js";
import { requireAuth } from "../services/session.js";

export const demoRouter = new Hono();

const PROFILES = ["good", "restless", "stressed"];

demoRouter.use("/demo/*", requireAuth);

// One-click sample-night generation for the logged-in user, used to
// explore the product without real hardware or the Python simulator script.
demoRouter.post("/demo/generate", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const profile = PROFILES.includes(body?.profile) ? body.profile : PROFILES[Math.floor(Math.random() * PROFILES.length)];
  const daysAgo = Number.isInteger(body?.daysAgo) && body.daysAgo >= 0 && body.daysAgo <= 365 ? body.daysAgo : 0;
  const { epochs, meta } = simulateNight({ profile });
  const session = await processSession(c.env.DB, c.env, { userId: c.get("userId"), epochs, meta, daysAgo });
  return c.json(session, 201);
});
