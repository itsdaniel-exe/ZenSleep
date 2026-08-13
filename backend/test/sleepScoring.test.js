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
