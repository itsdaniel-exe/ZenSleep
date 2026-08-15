import { scoreSleepSession } from "./sleepScoring.js";
import { buildRecommendations } from "./recommendations.js";
import { generateNarrativeInsight } from "./aiInsights.js";
import { saveSession } from "../db.js";

/**
 * Turns raw epochs into a fully-scored session record and persists it.
 * @param {D1Database} db
 * @param {object} env Worker bindings, passed through to the AI narrative layer
 * @param {{userId: string, epochs: Array, meta?: object}} input
 */
export async function processSession(db, env, { userId, epochs, meta = {} }) {
  const scored = scoreSleepSession(epochs, meta);
  const recommendations = buildRecommendations(scored);
  const narrative = await generateNarrativeInsight(scored, recommendations, env);

  const session = {
    id: crypto.randomUUID(),
    userId,
    createdAt: Date.now(),
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
