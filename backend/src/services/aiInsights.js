// Pluggable AI narrative layer. If ANTHROPIC_API_KEY is set, asks Claude to
// turn the computed metrics into a short, personalized coaching note. With no
// key configured (the default), falls back to a deterministic template so the
// whole app runs fully offline out of the box.

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

function buildPrompt(scored, recommendations) {
  const { overallScore, stressLevel, metrics } = scored;
  return `You are ZenSleep's sleep coach. Write a warm, specific, 2-3 sentence overnight summary for a user based on this data. Do not repeat numbers as a list - weave them into natural language. End with one encouraging sentence.

Sleep score: ${overallScore}/100
Stress level: ${stressLevel}
Duration: ${metrics.durationHours}h
Sleep latency: ${metrics.sleepLatencyMinutes} min
Awakenings: ${metrics.awakenings}
Restlessness ratio: ${metrics.restlessnessRatio}
Existing recommendations already shown to the user separately: ${recommendations.join(" | ")}

Do not repeat the recommendations verbatim, just reference the underlying pattern.`;
}

function templateNarrative(scored) {
  const { overallScore, stressLevel, metrics } = scored;
  const quality = overallScore >= 80 ? "a strong" : overallScore >= 60 ? "a fair" : "a rough";
  const stressPhrase = {
    Low: "your body stayed relaxed through most of the night",
    Moderate: "there were signs of moderate overnight stress",
    High: "your signals point to significant overnight stress",
  }[stressLevel];

  const encouraging =
    overallScore >= 80 && stressLevel === "Low"
      ? "Keep this routine going — it's working."
      : "Small, consistent changes to your wind-down routine should help over the next few nights.";

  return (
    `You had ${quality} night, scoring ${overallScore}/100. ` +
    `You slept about ${metrics.durationHours}h with ${metrics.awakenings} awakening(s) and ${stressPhrase}. ` +
    encouraging
  );
}

/**
 * @param {ReturnType<import("./sleepScoring.js").scoreSleepSession>} scored
 * @param {string[]} recommendations
 * @param {{ANTHROPIC_API_KEY?: string, ANTHROPIC_MODEL?: string}} env Worker bindings (see wrangler.jsonc / `wrangler secret put`)
 * @returns {Promise<{text: string, source: "anthropic" | "template"}>}
 */
export async function generateNarrativeInsight(scored, recommendations, env) {
  const apiKey = env?.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { text: templateNarrative(scored), source: "template" };
  }

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
        max_tokens: 200,
        messages: [{ role: "user", content: buildPrompt(scored, recommendations) }],
      }),
    });

    if (!response.ok) throw new Error(`Anthropic API responded ${response.status}`);
    const data = await response.json();
    const text = data.content?.[0]?.text?.trim();
    if (!text) throw new Error("Empty response from Anthropic API");
    return { text, source: "anthropic" };
  } catch (err) {
    console.error("aiInsights: falling back to template narrative:", err.message);
    return { text: templateNarrative(scored), source: "template" };
  }
}
