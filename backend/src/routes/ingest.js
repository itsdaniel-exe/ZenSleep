import { Hono } from "hono";
import { processSession } from "../services/processSession.js";
import { requireDeviceAuth } from "./devices.js";

export const ingestRouter = new Hono();

ingestRouter.use("/ingest", requireDeviceAuth);

// The band posts a full night here as { epochs: [{ts, motion, heartRate}], meta }.
// Authenticated by its own API key (see routes/devices.js), which is how the
// userId is determined - the device can't ingest data for any account but
// its own, and doesn't need to know its owner's id at all.
ingestRouter.post("/ingest", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { epochs, meta } = body;

  if (!Array.isArray(epochs) || epochs.length === 0) {
    return c.json({ error: "epochs (non-empty array) is required" }, 400);
  }

  try {
    const session = await processSession(c.env.DB, c.env, { userId: c.get("userId"), epochs, meta });
    return c.json(session, 201);
  } catch (err) {
    console.error("ingest error:", err);
    return c.json({ error: err.message }, 400);
  }
});
