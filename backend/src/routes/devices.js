import { Hono } from "hono";
import { requireAuth } from "../services/session.js";
import { generateApiKey, hashApiKey } from "../services/apiKey.js";
import {
  createDevice,
  getDevicesByUser,
  getDeviceByApiKeyHash,
  touchDeviceLastSeen,
  deleteDevice,
} from "../db.js";

export const devicesRouter = new Hono();

devicesRouter.use("/devices/*", requireAuth);
devicesRouter.use("/devices", requireAuth);

// Pairing a device: the raw API key is only ever returned here, once. Only
// its SHA-256 hash is persisted - if this response is missed, the only fix
// is revoking and creating a new device, same as any other API key UX.
devicesRouter.post("/devices", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 60) : "My band";

  const apiKey = generateApiKey();
  const device = {
    id: crypto.randomUUID(),
    userId: c.get("userId"),
    name,
    apiKeyHash: await hashApiKey(apiKey),
    createdAt: Date.now(),
  };
  await createDevice(c.env.DB, device);

  return c.json({ id: device.id, name: device.name, createdAt: device.createdAt, apiKey }, 201);
});

devicesRouter.get("/devices", async (c) => {
  const devices = await getDevicesByUser(c.env.DB, c.get("userId"));
  return c.json(devices);
});

devicesRouter.delete("/devices/:id", async (c) => {
  const ok = await deleteDevice(c.env.DB, c.req.param("id"), c.get("userId"));
  if (!ok) return c.json({ error: "Device not found" }, 404);
  return c.json({ ok: true });
});

/**
 * Hono middleware for the device (non-browser) path: authenticates via
 * `Authorization: Bearer <api key>` instead of the session cookie, and
 * resolves the request to the device's owning user. Also records a
 * last-seen timestamp, which is how the dashboard knows a band is
 * actually connected rather than just registered.
 */
export async function requireDeviceAuth(c, next) {
  const header = c.req.header("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return c.json({ error: "Missing device API key (Authorization: Bearer <key>)" }, 401);

  const device = await getDeviceByApiKeyHash(c.env.DB, await hashApiKey(match[1]));
  if (!device) return c.json({ error: "Invalid device API key" }, 401);

  c.set("userId", device.userId);
  c.set("deviceId", device.id);
  await touchDeviceLastSeen(c.env.DB, device.id, Date.now());
  await next();
}
