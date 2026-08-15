// D1 (SQLite) datastore. See migrations/0001_initial_schema.sql for the schema.

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
