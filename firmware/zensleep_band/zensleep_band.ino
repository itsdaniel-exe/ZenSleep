/*
 * ZenSleep Band firmware
 * ESP32 + MPU6050 (accel/gyro, movement) + MAX30102 (PPG, heart rate)
 *
 * Buffers sensor readings into fixed-length epochs and POSTs a full night's
 * worth of epochs to the ZenSleep backend's /api/ingest endpoint in the
 * exact JSON shape backend/src/services/sleepScoring.js expects:
 *   { epochs: [{ts, motion, heartRate}], meta: {lightsOffTs, screenTimeMinutesBeforeBed} }
 * authenticated via an Authorization: Bearer <device API key> header (see
 * DEVICE_API_KEY below) - the backend resolves which account this is from
 * the key itself, so the firmware never needs to know a user id.
 *
 * Required libraries (Arduino Library Manager):
 *   - Adafruit MPU6050, Adafruit Unified Sensor
 *   - SparkFun MAX3010x Pulse and Proximity Sensor Library
 *   - ArduinoJson
 *   - WiFiManager (tzapu/WiFiManager) - captive-portal WiFi setup
 *
 * Wiring (I2C, shared bus):
 *   MPU6050  SDA -> ESP32 GPIO21, SCL -> ESP32 GPIO22, VCC -> 3V3, GND -> GND
 *   MAX30102 SDA -> ESP32 GPIO21, SCL -> ESP32 GPIO22, VCC -> 3V3, GND -> GND
 *
 * First boot: the ESP32 opens a WiFi access point named "ZenSleep-Setup" -
 * connect a phone to it, a setup page opens automatically (or browse to
 * 192.168.4.1), pick your WiFi network and enter its password. Credentials
 * are saved to flash and reused automatically on every boot after that; to
 * re-provision, call wm.resetSettings() once (temporarily uncomment the
 * line in setup() below, flash, then comment it back out and reflash).
 *
 * Set SIMULATE_SENSORS to 1 to run without real sensors attached — useful
 * for bench-testing the WiFi/HTTP/JSON path independent of the hardware.
 */

#include <WiFi.h>
#include <WiFiManager.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>

#define SIMULATE_SENSORS 0

#if !SIMULATE_SENSORS
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <MAX30105.h>
Adafruit_MPU6050 mpu;
MAX30105 particleSensor;
#endif

// ---- Configuration ----------------------------------------------------
const char *API_BASE_URL = "https://zensleep.daniwork300.workers.dev"; // deployed backend
const char *DEVICE_API_KEY = "REPLACE_WITH_YOUR_DEVICE_API_KEY"; // dashboard -> Your band -> connect a band

const unsigned long EPOCH_MS = 30000;       // 30s per epoch, matches backend EPOCH_SECONDS
const unsigned long NIGHT_MS = 9UL * 3600 * 1000; // stop buffering / auto-upload after 9h as a safety cap
const int MAX_EPOCHS = (NIGHT_MS / EPOCH_MS) + 10;
const unsigned long MOTION_SAMPLE_INTERVAL_MS = 200; // 5Hz - plenty for restlessness, unlike heart rate below

struct Epoch {
  unsigned long ts;
  float motion;
  int heartRate; // -1 if unavailable this epoch
};

Epoch epochBuffer[MAX_EPOCHS];
int epochCount = 0;
unsigned long sessionStartMs = 0;
unsigned long lightsOffEpochMs = 0; // unix ms of session start, sent as meta.lightsOffTs

// Per-epoch accumulators
float motionAccum = 0;
int motionSamples = 0;
long hrAccum = 0;
int hrSamples = 0;
unsigned long epochStartMs = 0;
unsigned long lastMotionSampleMs = 0;

void connectWiFi() {
  WiFiManager wm;
  // wm.resetSettings(); // uncomment + flash once to force re-provisioning, then comment out again

  Serial.println("Starting WiFi setup (opens 'ZenSleep-Setup' AP if no saved network works)...");
  if (!wm.autoConnect("ZenSleep-Setup")) {
    Serial.println("WiFi setup timed out - restarting to try again");
    delay(1000);
    ESP.restart();
  }
  Serial.println("WiFi connected: " + WiFi.localIP().toString());
}

void setup() {
  Serial.begin(115200);
  delay(200);

#if !SIMULATE_SENSORS
  Wire.begin();
  if (!mpu.begin()) {
    Serial.println("MPU6050 not found — check wiring");
  }
  mpu.setAccelerometerRange(MPU6050_RANGE_4_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);

  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30102 not found — check wiring");
  } else {
    particleSensor.setup(); // default sensor settings, low-power sleep-tracking use case
  }
#endif

  connectWiFi();

  sessionStartMs = millis();
  lightsOffEpochMs = (unsigned long)(millis()); // device has no RTC; backend timestamps are relative offsets from this
  epochStartMs = millis();
  lastMotionSampleMs = millis();
}

float readMotionMagnitude() {
#if SIMULATE_SENSORS
  return random(0, 100) / 100.0; // uniform noise stands in for real accel data
#else
  sensors_event_t accel, gyro, temp;
  mpu.getEvent(&accel, &gyro, &temp);
  // Magnitude of acceleration deviation from gravity (1g), normalized to a
  // rough 0..1 "restlessness" scale. Tune the divisor against real sleep
  // data once hardware is on-body.
  float dx = accel.acceleration.x;
  float dy = accel.acceleration.y;
  float dz = accel.acceleration.z - 9.8;
  float magnitude = sqrt(dx * dx + dy * dy + dz * dz);
  return constrain(magnitude / 6.0, 0.0, 1.0);
#endif
}

// ---- Heart rate: PPG peak detection ------------------------------------
// The IR reading from the MAX30102 has a slow-moving DC component (tissue
// + ambient light) with a small pulsatile (AC) ripple riding on top of it -
// each ripple peak is one heartbeat. This tracks the DC baseline with an
// exponential moving average, watches for the AC signal crossing above a
// threshold above that baseline (a beat), enforces a refractory period so
// a single beat can't double-trigger, and averages the last few inter-beat
// intervals into a stable BPM reading. Same family of approach as
// SparkFun's heartRate.h, written directly against getIR() instead of
// pulling in that whole library for one function.
//
// This needs a much higher sample rate than motion does (called every loop
// iteration, not on the 200ms motion timer) - heartbeats are ~1-2Hz, so
// under-sampling misses peaks entirely rather than just being noisy.
#if SIMULATE_SENSORS
int currentHeartRate() {
  return random(52, 78);
}
void sampleHeartRate() {
  // no-op - currentHeartRate() fabricates a value directly in simulate mode
}
#else
const long HR_MIN_IR = 50000;               // below this, no finger/wrist contact
const float HR_BASELINE_ALPHA = 0.95;        // EMA smoothing factor for the DC baseline
const float HR_AC_THRESHOLD = 150.0;         // empirical; retune against real skin-contact data
const unsigned long HR_MIN_BEAT_INTERVAL_MS = 300; // caps detection at 200bpm, rejects double-triggers
const int HR_RATE_WINDOW = 4;                // rolling average over the last N beats

float hrBaseline = 0;
bool hrBaselineInit = false;
bool hrAboveThreshold = false;
unsigned long hrLastBeatMs = 0;
float hrRates[HR_RATE_WINDOW];
int hrRateCount = 0;
int hrRateIndex = 0;

void sampleHeartRate() {
  long irValue = particleSensor.getIR();
  if (irValue < HR_MIN_IR) {
    hrBaselineInit = false; // contact lost - reset so we don't fire a false beat when it resumes
    hrRateCount = 0;        // stale readings from before contact was lost shouldn't count
    return;
  }

  if (!hrBaselineInit) {
    hrBaseline = irValue;
    hrBaselineInit = true;
    return;
  }

  hrBaseline = HR_BASELINE_ALPHA * hrBaseline + (1 - HR_BASELINE_ALPHA) * irValue;
  float acSignal = irValue - hrBaseline;
  unsigned long now = millis();

  if (!hrAboveThreshold && acSignal > HR_AC_THRESHOLD) {
    hrAboveThreshold = true;
    if (hrLastBeatMs > 0 && (now - hrLastBeatMs) > HR_MIN_BEAT_INTERVAL_MS) {
      float instantBpm = 60000.0 / (now - hrLastBeatMs);
      if (instantBpm >= 30 && instantBpm <= 220) { // physiological sanity bounds
        hrRates[hrRateIndex] = instantBpm;
        hrRateIndex = (hrRateIndex + 1) % HR_RATE_WINDOW;
        if (hrRateCount < HR_RATE_WINDOW) hrRateCount++;
      }
    }
    hrLastBeatMs = now;
  } else if (hrAboveThreshold && acSignal < HR_AC_THRESHOLD * 0.5) {
    hrAboveThreshold = false; // back below threshold, ready to detect the next rising edge
  }
}

int currentHeartRate() {
  if (hrRateCount == 0) return -1;
  float sum = 0;
  for (int i = 0; i < hrRateCount; i++) sum += hrRates[i];
  return (int)(sum / hrRateCount);
}
#endif

void finalizeEpoch() {
  if (epochCount >= MAX_EPOCHS) return;

  float avgMotion = motionSamples > 0 ? motionAccum / motionSamples : 0;
  int hr = currentHeartRate(); // already a rolling average of beats detected during this epoch

  epochBuffer[epochCount].ts = lightsOffEpochMs + (epochCount * EPOCH_MS);
  epochBuffer[epochCount].motion = avgMotion;
  epochBuffer[epochCount].heartRate = hr;
  epochCount++;

  motionAccum = 0;
  motionSamples = 0;
}

bool uploadNight() {
  if (epochCount == 0) return false;
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected — cannot upload");
    return false;
  }

  DynamicJsonDocument doc(16384 + epochCount * 48);

  JsonArray epochs = doc["epochs"].to<JsonArray>();
  for (int i = 0; i < epochCount; i++) {
    JsonObject e = epochs.add<JsonObject>();
    e["ts"] = epochBuffer[i].ts;
    e["motion"] = epochBuffer[i].motion;
    if (epochBuffer[i].heartRate > 0) {
      e["heartRate"] = epochBuffer[i].heartRate;
    } else {
      e["heartRate"] = nullptr;
    }
  }

  JsonObject meta = doc["meta"].to<JsonObject>();
  meta["lightsOffTs"] = lightsOffEpochMs;
  meta["screenTimeMinutesBeforeBed"] = 0; // wire up to a companion app / manual entry later

  String payload;
  serializeJson(doc, payload);

  HTTPClient http;
  http.begin(String(API_BASE_URL) + "/api/ingest");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + DEVICE_API_KEY);
  // *.workers.dev applies baseline bot protection that blocks requests with
  // no/generic User-Agent (Cloudflare error 1010) - harmless on a custom
  // domain, but cheap to avoid here too.
  http.addHeader("User-Agent", "ZenSleepBand/1.0 (ESP32)");
  int status = http.POST(payload);

  Serial.printf("Upload status: %d\n", status);
  if (status == 201) {
    String response = http.getString();
    Serial.println("Server response: " + response);
  } else if (status == 401) {
    Serial.println("Device API key rejected - re-pair from the dashboard and update DEVICE_API_KEY");
  }
  http.end();

  return status == 201;
}

void loop() {
  // Heart rate needs a high sample rate to catch each pulse peak - called
  // every loop iteration, unlike motion below which is sampled on a timer.
  sampleHeartRate();

  unsigned long now = millis();

  if (now - lastMotionSampleMs >= MOTION_SAMPLE_INTERVAL_MS) {
    motionAccum += readMotionMagnitude();
    motionSamples++;
    lastMotionSampleMs = now;
  }

  if (now - epochStartMs >= EPOCH_MS) {
    finalizeEpoch();
    epochStartMs = now;
    Serial.printf("Epoch %d buffered (motion=%.2f, hr=%d)\n", epochCount,
                   epochBuffer[epochCount - 1].motion, epochBuffer[epochCount - 1].heartRate);
  }

  bool sessionComplete = (now - sessionStartMs >= NIGHT_MS) || (epochCount >= MAX_EPOCHS - 1);
  if (sessionComplete) {
    Serial.println("Session complete, uploading...");
    if (uploadNight()) {
      epochCount = 0;
      sessionStartMs = millis();
      lightsOffEpochMs = millis();
    }
    delay(5000); // brief pause before starting a fresh session
  }

  delay(5); // small yield; heart-rate sampling above needs this loop running fast, not throttled to ~1Hz
}
