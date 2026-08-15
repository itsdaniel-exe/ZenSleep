import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRouter } from "./routes/auth.js";
import { ingestRouter } from "./routes/ingest.js";
import { sleepRouter } from "./routes/sleep.js";
import { demoRouter } from "./routes/demo.js";
import { devicesRouter } from "./routes/devices.js";

const app = new Hono();

// The dashboard and API are served from the same Worker in production (see
// wrangler.jsonc's assets config), so this is really only needed for local
// dev, where the Vite dev server (port 5173) and `wrangler dev` (port 8787)
// are different origins. credentials:true + echoing the request origin (not
// "*") is required for the session cookie to work across those two ports.
app.use(
  "/api/*",
  cors({
    origin: (origin) => origin,
    credentials: true,
  })
);

app.get("/api/health", (c) => c.json({ status: "ok" }));

app.route("/api", authRouter);
app.route("/api", ingestRouter);
app.route("/api", sleepRouter);
app.route("/api", demoRouter);
app.route("/api", devicesRouter);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
