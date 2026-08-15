CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  epoch_count INTEGER NOT NULL,
  epochs TEXT NOT NULL,           -- JSON array; only read back for the "latest" endpoint (motion timeline)
  meta TEXT NOT NULL,             -- JSON object: {lightsOffTs, screenTimeMinutesBeforeBed}
  overall_score INTEGER NOT NULL,
  stress_level TEXT NOT NULL,
  subscores TEXT NOT NULL,        -- JSON object: {duration, continuity, latency, hrStability}
  metrics TEXT NOT NULL,          -- JSON object, see sleepScoring.js
  recommendations TEXT NOT NULL,  -- JSON array of strings
  narrative TEXT NOT NULL         -- JSON object: {text, source}
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_created ON sessions(user_id, created_at);
