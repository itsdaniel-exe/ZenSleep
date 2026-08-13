// Rule-based recommendation generator. Runs first, always, with zero
// dependencies — this is the guaranteed baseline. aiInsights.js layers a
// narrative on top of (not instead of) this list.

const RULES = [
  {
    when: (m) => m.metrics.sleepLatencyMinutes > 30,
    tip: "It's taking a while to fall asleep. Try a consistent wind-down routine and dim screens 45+ minutes before bed.",
    severity: 3,
  },
  {
    when: (m) => (m.metrics.screenTimeMinutesBeforeBed ?? 0) > 60,
    tip: "High screen exposure before bed can delay sleep onset — consider a screen cutoff an hour before lights-off.",
    severity: 2,
  },
  {
    when: (m) => m.metrics.awakenings >= 4,
    tip: "Several awakenings were detected. Check room temperature, noise, and light levels for disturbances.",
    severity: 3,
  },
  {
    when: (m) => m.metrics.restlessnessRatio > 0.25,
    tip: "Restlessness was elevated through the night, which usually tracks with stress — a short breathing exercise before bed may help.",
    severity: 2,
  },
  {
    when: (m) => m.metrics.durationHours < 6,
    tip: "Total sleep time was under 6 hours. Aim for 7-9 hours by shifting bedtime earlier rather than wake time later.",
    severity: 3,
  },
  {
    when: (m) => m.metrics.durationHours > 9.5,
    tip: "Sleep duration was unusually long, which can itself indicate poor sleep quality or recovery from a deficit.",
    severity: 1,
  },
  {
    when: (m) => m.metrics.hrStdDev !== null && m.metrics.hrStdDev > 10,
    tip: "Heart rate was more variable than usual overnight, consistent with elevated stress or late caffeine intake.",
    severity: 2,
  },
  {
    when: (m) => m.stressLevel === "Low" && m.overallScore >= 80,
    tip: "Great night — this sleep pattern is worth repeating. Keep the same bedtime and wind-down routine.",
    severity: 0,
  },
];

/** @param {ReturnType<import("./sleepScoring.js").scoreSleepSession>} scored */
export function buildRecommendations(scored) {
  const matched = RULES.filter((r) => r.when(scored)).sort((a, b) => b.severity - a.severity);
  const tips = matched.slice(0, 4).map((r) => r.tip);
  if (tips.length === 0) {
    tips.push("Sleep metrics look balanced tonight — no specific action needed.");
  }
  return tips;
}
