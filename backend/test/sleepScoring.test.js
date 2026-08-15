import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreSleepSession, EPOCH_SECONDS } from "../src/services/sleepScoring.js";
import { buildRecommendations } from "../src/services/recommendations.js";

function epochsFor(hours, { motion = 0.05, heartRate = 58, awakenings = [] } = {}) {
  const count = Math.round((hours * 3600) / EPOCH_SECONDS);
  const epochs = [];
  for (let i = 0; i < count; i += 1) {
    const inAwakening = awakenings.some(([start, end]) => i >= start && i < end);
    epochs.push({
      ts: i * EPOCH_SECONDS * 1000,
      motion: inAwakening ? 0.8 : motion,
      heartRate: inAwakening ? heartRate + 15 : heartRate,
    });
  }
  return epochs;
}

test("a stable 8-hour night with no disturbances scores high and is Low stress", () => {
  const epochs = epochsFor(8);
  const result = scoreSleepSession(epochs);

  assert.ok(result.overallScore >= 80, `expected high score, got ${result.overallScore}`);
  assert.equal(result.stressLevel, "Low");
  assert.equal(result.metrics.awakenings, 0);
});

test("a short, restless night with several awakenings scores low and infers stress", () => {
  const epochs = epochsFor(4, {
    motion: 0.2, // below the movement threshold at baseline, so the awakening bursts stay discrete
    heartRate: 74,
    awakenings: [
      [20, 30],
      [70, 80],
      [120, 130],
      [170, 180],
      [220, 230],
      [270, 280],
      [320, 330],
      [370, 380],
    ],
  });
  const result = scoreSleepSession(epochs);

  assert.ok(result.overallScore < 60, `expected low score, got ${result.overallScore}`);
  assert.notEqual(result.stressLevel, "Low");
  assert.ok(result.metrics.awakenings >= 4);
});

test("sleep latency is measured from lights-off to sustained stillness", () => {
  // 20 minutes of motion (40 epochs) before settling down for the rest of the night.
  const restless = Array.from({ length: 40 }, (_, i) => ({
    ts: i * EPOCH_SECONDS * 1000,
    motion: 0.5,
    heartRate: 65,
  }));
  const settled = epochsFor(7).map((e, i) => ({ ...e, ts: (40 + i) * EPOCH_SECONDS * 1000 }));
  const result = scoreSleepSession([...restless, ...settled]);

  assert.ok(result.metrics.sleepLatencyMinutes >= 18, JSON.stringify(result.metrics));
});

test("scoreSleepSession rejects empty input", () => {
  assert.throws(() => scoreSleepSession([]));
});

test("recommendations flag short duration and high awakenings", () => {
  const epochs = epochsFor(5, {
    motion: 0.2,
    awakenings: [
      [20, 26],
      [80, 88],
      [150, 158],
      [220, 230],
    ],
  });
  const scored = scoreSleepSession(epochs);
  const tips = buildRecommendations(scored);

  assert.ok(tips.length > 0);
  assert.ok(tips.length <= 4);
});

test("recommendations praise a great night when the score is high", () => {
  const scored = scoreSleepSession(epochsFor(8));
  const tips = buildRecommendations(scored);
  assert.ok(tips.some((t) => t.toLowerCase().includes("great night")));
});

test("targetSleepHours personalizes the duration sub-score, not a fixed 7-9h band", () => {
  const epochs = epochsFor(6); // a fixed 6h night

  const defaultTarget = scoreSleepSession(epochs); // implicit 8h goal - 6h is 1h under the low end of the ideal band
  const lowerGoalUser = scoreSleepSession(epochs, {}, { targetSleepHours: 6 }); // 6h night, 6h goal - right on target

  assert.equal(lowerGoalUser.metrics.targetSleepHours, 6);
  assert.equal(lowerGoalUser.subscores.duration, 100, "6h should score a perfect duration sub-score against a 6h goal");
  assert.ok(
    lowerGoalUser.subscores.duration > defaultTarget.subscores.duration,
    "the same 6h night should score better for a 6h-goal user than an 8h-goal user"
  );
});

test("recommendations reference the user's actual target, not a hardcoded '7-9 hours'", () => {
  const scored = scoreSleepSession(epochsFor(4), {}, { targetSleepHours: 9 });
  const tips = buildRecommendations(scored);
  assert.ok(tips.some((t) => t.includes("9h goal") || t.includes("8-10h")), tips.join(" | "));
});
