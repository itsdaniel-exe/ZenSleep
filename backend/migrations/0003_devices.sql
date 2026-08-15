CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  api_key_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_devices_user ON devices(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_api_key_hash ON devices(api_key_hash);
