import { Hono } from "hono";
import { simulateNight } from "../services/simulate.js";
import { processSession } from "../services/processSession.js";

export const demoRouter = new Hono();

const PROFILES = ["good", "restless", "stressed"];

// One-click "Generate demo night" used by the web dashboard so the product
// can be demoed without real hardware or the Python simulator script.
demoRouter.post("/demo/:userId/generate", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const profile = PROFILES.includes(body?.profile) ? body.profile : PROFILES[Math.floor(Math.random() * PROFILES.length)];
  const { epochs, meta } = simulateNight({ profile });
  const session = await processSession(c.env.DB, c.env, { userId: c.req.param("userId"), epochs, meta });
  return c.json(session, 201);
});
