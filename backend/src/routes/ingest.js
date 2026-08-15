import { Hono } from "hono";
import { processSession } from "../services/processSession.js";
import { getUserById } from "../db.js";

export const ingestRouter = new Hono();

// The band (or the Python device simulator in scripts/) posts a full night
// here as { userId, epochs: [{ts, motion, heartRate}], meta }.
//
// This is the device path, not the browser path - the ESP32 has no session
// cookie. It's authenticated by `userId` alone for now; production hardening
// should replace this with a per-device API key (see firmware/README.md).
ingestRouter.post("/ingest", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { userId, epochs, meta } = body;

  if (typeof userId !== "string" || !userId) {
    return c.json({ error: "userId (string) is required" }, 400);
  }
  if (!Array.isArray(epochs) || epochs.length === 0) {
    return c.json({ error: "epochs (non-empty array) is required" }, 400);
  }
  if (!(await getUserById(c.env.DB, userId))) {
    return c.json({ error: "Unknown userId" }, 404);
  }

  try {
    const session = await processSession(c.env.DB, c.env, { userId, epochs, meta });
    return c.json(session, 201);
  } catch (err) {
    console.error("ingest error:", err);
    return c.json({ error: err.message }, 400);
  }
});
