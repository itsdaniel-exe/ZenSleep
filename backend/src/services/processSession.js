import { nanoid } from "nanoid";
import { scoreSleepSession } from "./sleepScoring.js";
import { buildRecommendations } from "./recommendations.js";
import { generateNarrativeInsight } from "./aiInsights.js";
import { saveSession } from "../db.js";

/**
 * Turns raw epochs into a stored, fully-scored session record.
 * @param {{userId: string, epochs: Array, meta?: object}} input
 */
export async function processSession({ userId, epochs, meta = {} }) {
  const scored = scoreSleepSession(epochs, meta);
  const recommendations = buildRecommendations(scored);
  const narrative = await generateNarrativeInsight(scored, recommendations);

  const session = {
    id: nanoid(),
    userId,
    createdAt: Date.now(),
    epochCount: epochs.length,
    epochs, // kept for the dashboard's motion timeline; stripped in history responses
    meta,
    ...scored,
    recommendations,
    narrative,
  };

  await saveSession(session);
  return session;
}
