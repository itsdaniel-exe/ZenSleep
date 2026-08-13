// Generates a synthetic night of wearable epochs so the product can be
// demoed end-to-end without real hardware. The shape matches exactly what
// firmware/zensleep_band.ino posts to /api/ingest.
import { EPOCH_SECONDS } from "./sleepScoring.js";

function rand(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * @param {{hours?: number, profile?: "good"|"restless"|"stressed"}} [opts]
 */
export function simulateNight({ hours = rand(6.2, 8.5), profile = "good" } = {}) {
  const epochCount = Math.round((hours * 3600) / EPOCH_SECONDS);
  const startTs = Date.now() - Math.round(hours * 3600 * 1000);

  const settleEpochs = profile === "stressed" ? Math.round(rand(30, 60)) : Math.round(rand(6, 16));
  const baseHr = profile === "stressed" ? rand(68, 76) : rand(56, 64);
  // Tuned so a full night lands roughly in the 0-2 (good) / 3-5 (restless) / 5-8 (stressed)
  // awakening range described in the pitch deck's problem statement.
  const awakeningChance = { good: 0.0012, restless: 0.0055, stressed: 0.011 }[profile];

  const epochs = [];
  let inAwakening = false;
  let awakeningRemaining = 0;

  for (let i = 0; i < epochCount; i += 1) {
    const stillFallingAsleep = i < settleEpochs;

    if (!inAwakening && !stillFallingAsleep && Math.random() < awakeningChance) {
      inAwakening = true;
      awakeningRemaining = Math.round(rand(2, 6));
    }

    let motion;
    if (stillFallingAsleep) {
      motion = clamp01(rand(0.3, 0.7) * (1 - i / settleEpochs) + rand(0, 0.15));
    } else if (inAwakening) {
      motion = rand(0.4, 0.9);
      awakeningRemaining -= 1;
      if (awakeningRemaining <= 0) inAwakening = false;
    } else {
      motion = clamp01(rand(0, 0.18) + (Math.random() < 0.05 ? rand(0, 0.2) : 0));
    }

    const hrJitter = inAwakening ? rand(4, 12) : rand(-3, 3);
    const heartRate = Math.round(baseHr + hrJitter + (stillFallingAsleep ? rand(0, 6) : 0));

    epochs.push({
      ts: startTs + i * EPOCH_SECONDS * 1000,
      motion: Math.round(motion * 1000) / 1000,
      heartRate,
    });
  }

  return {
    epochs,
    meta: {
      lightsOffTs: startTs,
      screenTimeMinutesBeforeBed:
        profile === "stressed" ? Math.round(rand(60, 150)) : Math.round(rand(0, 45)),
    },
  };
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}
