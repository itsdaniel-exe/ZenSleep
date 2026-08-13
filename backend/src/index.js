import "dotenv/config";
import express from "express";
import cors from "cors";
import { ingestRouter } from "./routes/ingest.js";
import { sleepRouter } from "./routes/sleep.js";
import { demoRouter } from "./routes/demo.js";

const app = express();
const PORT = process.env.PORT || 4790;
const corsOrigin = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",");

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "2mb" })); // a full night of 30s epochs is small, but leave headroom

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api", ingestRouter);
app.use("/api", sleepRouter);
app.use("/api", demoRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`ZenSleep API listening on http://localhost:${PORT}`);
});
