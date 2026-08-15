import { scoreSleepSession } from "./sleepScoring.js";
import { buildRecommendations } from "./recommendations.js";
import { generateNarrativeInsight } from "./aiInsights.js";
import { saveSession, getUserById } from "../db.js";

/**
 * Turns raw epochs into a fully-scored session record and persists it.
 * @param {D1Database} db
 * @param {object} env Worker bindings, passed through to the AI narrative layer
 * @param {{userId: string, epochs: Array, meta?: object, daysAgo?: number}} input
 *   daysAgo backdates createdAt - only meaningful for the demo generator, so
 *   synthetic nights spread across the calendar instead of stacking on
 *   today. Real device ingest never passes this (defaults to "now").
 */
export async function processSession(db, env, { userId, epochs, meta = {}, daysAgo = 0 }) {
  const user = await getUserById(db, userId);
  const scored = scoreSleepSession(epochs, meta, { targetSleepHours: user?.targetSleepHours ?? 8 });
  const recommendations = buildRecommendations(scored);
  const narrative = await generateNarrativeInsight(scored, recommendations, env);

  const session = {
    id: crypto.randomUUID(),
    userId,
    createdAt: Date.now() - daysAgo * 24 * 60 * 60 * 1000,
    epochCount: epochs.length,
    epochs, // kept for the dashboard's motion timeline; stripped in history responses
    meta,
    ...scored,
    recommendations,
    narrative,
  };

  await saveSession(db, session);
  return session;
}
