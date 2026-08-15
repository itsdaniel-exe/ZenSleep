// D1 (SQLite) datastore. See migrations/*.sql for the schema.

/** @param {D1Database} db */
export async function createUser(db, { id, email, passwordHash, createdAt }) {
  await db
    .prepare(`INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)`)
    .bind(id, email, passwordHash, createdAt)
    .run();
}

/** @param {D1Database} db */
export async function getUserByEmail(db, email) {
  const row = await db.prepare(`SELECT * FROM users WHERE email = ?`).bind(email).first();
  if (!row) return null;
  return { id: row.id, email: row.email, passwordHash: row.password_hash, createdAt: row.created_at };
}

/** @param {D1Database} db */
export async function getUserById(db, id) {
  const row = await db.prepare(`SELECT id, email, created_at FROM users WHERE id = ?`).bind(id).first();
  if (!row) return null;
  return { id: row.id, email: row.email, createdAt: row.created_at };
}

/** @param {D1Database} db */
export async function createDevice(db, { id, userId, name, apiKeyHash, createdAt }) {
  await db
    .prepare(`INSERT INTO devices (id, user_id, name, api_key_hash, created_at) VALUES (?, ?, ?, ?, ?)`)
    .bind(id, userId, name, apiKeyHash, createdAt)
    .run();
}

/** @param {D1Database} db */
export async function getDevicesByUser(db, userId) {
  const { results } = await db
    .prepare(`SELECT id, name, created_at, last_seen_at FROM devices WHERE user_id = ? ORDER BY created_at DESC`)
    .bind(userId)
    .all();
  return results.map((r) => ({ id: r.id, name: r.name, createdAt: r.created_at, lastSeenAt: r.last_seen_at }));
}

/** @param {D1Database} db */
export async function getDeviceByApiKeyHash(db, apiKeyHash) {
  const row = await db.prepare(`SELECT * FROM devices WHERE api_key_hash = ?`).bind(apiKeyHash).first();
  if (!row) return null;
  return { id: row.id, userId: row.user_id, name: row.name, lastSeenAt: row.last_seen_at };
}

/** @param {D1Database} db */
export async function touchDeviceLastSeen(db, deviceId, ts) {
  await db.prepare(`UPDATE devices SET last_seen_at = ? WHERE id = ?`).bind(ts, deviceId).run();
}

/** @returns {Promise<boolean>} true if a device was actually deleted */
export async function deleteDevice(db, deviceId, userId) {
  const res = await db.prepare(`DELETE FROM devices WHERE id = ? AND user_id = ?`).bind(deviceId, userId).run();
  return res.meta.changes > 0;
}

/** @param {D1Database} db */
export async function saveSession(db, session) {
  await db
    .prepare(
      `INSERT INTO sessions
        (id, user_id, created_at, epoch_count, epochs, meta, overall_score, stress_level, subscores, metrics, recommendations, narrative)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      session.id,
      session.userId,
      session.createdAt,
      session.epochCount,
      JSON.stringify(session.epochs),
      JSON.stringify(session.meta),
      session.overallScore,
      session.stressLevel,
      JSON.stringify(session.subscores),
      JSON.stringify(session.metrics),
      JSON.stringify(session.recommendations),
      JSON.stringify(session.narrative)
    )
    .run();
  return session;
}

function rowToSummary(row) {
  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    epochCount: row.epoch_count,
    meta: JSON.parse(row.meta),
    overallScore: row.overall_score,
    stressLevel: row.stress_level,
    subscores: JSON.parse(row.subscores),
    metrics: JSON.parse(row.metrics),
    recommendations: JSON.parse(row.recommendations),
    narrative: JSON.parse(row.narrative),
  };
}

/** @param {D1Database} db */
export async function getLatestSession(db, userId) {
  const row = await db
    .prepare(`SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`)
    .bind(userId)
    .first();
  if (!row) return null;
  return { ...rowToSummary(row), epochs: JSON.parse(row.epochs) };
}

/** @param {D1Database} db */
export async function getHistory(db, userId, limit = 14) {
  // Most recent `limit` sessions, oldest-first, for the trend chart. epochs is
  // deliberately excluded from the SELECT - the history view doesn't need it
  // and it's the largest column by far.
  const { results } = await db
    .prepare(
      `SELECT id, user_id, created_at, epoch_count, meta, overall_score, stress_level, subscores, metrics, recommendations, narrative
       FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`
    )
    .bind(userId, limit)
    .all();
  return results.reverse().map(rowToSummary);
}
