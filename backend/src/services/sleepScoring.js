// Rule-based sleep scoring and stress-inference engine.
//
// Input is a night broken into fixed-length epochs (default 30s), each with a
// motion magnitude (0..1, from the wearable's accelerometer/gyro) and an
// optional heart-rate sample (bpm, from the PPG sensor). This mirrors what a
// real ESP32 + MPU6050 + MAX30102 wearable would report — see firmware/.

export const EPOCH_SECONDS = 30;
const MOVEMENT_THRESHOLD = 0.3;
const SUSTAINED_STILL_EPOCHS = 10; // 5 min of stillness = "fell asleep"
const AWAKENING_MIN_EPOCHS = 2; // 1 min of motion = one awakening event

function mean(values) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values) {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = mean(values.map((v) => (v - m) ** 2));
  return Math.sqrt(variance);
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

/** Count discrete awakening events: runs of >= AWAKENING_MIN_EPOCHS consecutive high-motion epochs. */
function countAwakenings(epochs) {
  let awakenings = 0;
  let run = 0;
  for (const e of epochs) {
    if (e.motion > MOVEMENT_THRESHOLD) {
      run += 1;
    } else {
      if (run >= AWAKENING_MIN_EPOCHS) awakenings += 1;
      run = 0;
    }
  }
  if (run >= AWAKENING_MIN_EPOCHS) awakenings += 1;
  return awakenings;
}

/** Minutes from lights-off until the first sustained still period (sleep onset). */
function sleepLatencyMinutes(epochs) {
  let stillRun = 0;
  for (let i = 0; i < epochs.length; i += 1) {
    if (epochs[i].motion <= MOVEMENT_THRESHOLD) {
      stillRun += 1;
      if (stillRun >= SUSTAINED_STILL_EPOCHS) {
        const onsetIndex = i - SUSTAINED_STILL_EPOCHS + 1;
        return Math.round((onsetIndex * EPOCH_SECONDS) / 60);
      }
    } else {
      stillRun = 0;
    }
  }
  // Never settled — treat whole night as latency, capped for sanity.
  return Math.round((epochs.length * EPOCH_SECONDS) / 60);
}

function durationScore(hours) {
  if (hours >= 7 && hours <= 9) return 100;
  const deviation = hours < 7 ? 7 - hours : hours - 9;
  return clamp(100 - deviation * 18);
}

function continuityScore(restlessnessRatio, awakenings) {
  const restPenalty = restlessnessRatio * 140; // ratio is 0..1
  const wakePenalty = awakenings * 8;
  return clamp(100 - restPenalty - wakePenalty);
}

function latencyScore(minutes) {
  if (minutes <= 20) return 100;
  return clamp(100 - (minutes - 20) * 2);
}

function hrStabilityScore(hrValues) {
  if (hrValues.length < 5) return 70; // no reliable HR signal — neutral score
  const m = mean(hrValues);
  const sd = stdDev(hrValues);
  const coefficientOfVariation = sd / m;
  return clamp(100 - coefficientOfVariation * 400);
}

function inferStressLevel({ restlessnessRatio, awakenings, latency, hrCoefficientOfVariation }) {
  let points = 0;
  if (restlessnessRatio > 0.25) points += 2;
  else if (restlessnessRatio > 0.15) points += 1;

  if (awakenings >= 5) points += 2;
  else if (awakenings >= 3) points += 1;

  if (latency > 45) points += 2;
  else if (latency > 25) points += 1;

  if (hrCoefficientOfVariation !== null) {
    if (hrCoefficientOfVariation > 0.16) points += 2;
    else if (hrCoefficientOfVariation > 0.1) points += 1;
  }

  if (points >= 5) return "High";
  if (points >= 2) return "Moderate";
  return "Low";
}

/**
 * @param {Array<{ts:number, motion:number, heartRate:number|null}>} epochs
 * @param {{lightsOffTs?: number, screenTimeMinutesBeforeBed?: number}} [meta]
 */
export function scoreSleepSession(epochs, meta = {}) {
  if (!Array.isArray(epochs) || epochs.length === 0) {
    throw new Error("epochs must be a non-empty array");
  }

  const durationHours = (epochs.length * EPOCH_SECONDS) / 3600;
  const restlessEpochs = epochs.filter((e) => e.motion > MOVEMENT_THRESHOLD).length;
  const restlessnessRatio = restlessEpochs / epochs.length;
  const awakenings = countAwakenings(epochs);
  const latency = sleepLatencyMinutes(epochs);

  const hrValues = epochs.map((e) => e.heartRate).filter((v) => typeof v === "number");
  const hrMean = mean(hrValues);
  const hrSd = stdDev(hrValues);
  const hrCoefficientOfVariation = hrValues.length >= 5 ? hrSd / hrMean : null;

  const subscores = {
    duration: Math.round(durationScore(durationHours)),
    continuity: Math.round(continuityScore(restlessnessRatio, awakenings)),
    latency: Math.round(latencyScore(latency)),
    hrStability: Math.round(hrStabilityScore(hrValues)),
  };

  const overallScore = Math.round(
    subscores.duration * 0.3 +
      subscores.continuity * 0.3 +
      subscores.latency * 0.2 +
      subscores.hrStability * 0.2
  );

  const stressLevel = inferStressLevel({
    restlessnessRatio,
    awakenings,
    latency,
    hrCoefficientOfVariation,
  });

  return {
    overallScore,
    stressLevel,
    subscores,
    metrics: {
      durationHours: Math.round(durationHours * 10) / 10,
      restlessnessRatio: Math.round(restlessnessRatio * 1000) / 1000,
      awakenings,
      sleepLatencyMinutes: latency,
      hrMean: hrMean !== null ? Math.round(hrMean) : null,
      hrStdDev: hrValues.length ? Math.round(hrSd * 10) / 10 : null,
      screenTimeMinutesBeforeBed: meta.screenTimeMinutesBeforeBed ?? null,
    },
  };
}
