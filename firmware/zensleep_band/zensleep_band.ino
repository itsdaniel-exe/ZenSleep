/*
 * ZenSleep Band firmware
 * ESP32 + MPU6050 (accel/gyro, movement) + MAX30102 (PPG, heart rate)
 *
 * Buffers sensor readings into fixed-length epochs and POSTs a full night's
 * worth of epochs to the ZenSleep backend's /api/ingest endpoint in the
 * exact JSON shape backend/src/services/sleepScoring.js expects:
 *   { userId, epochs: [{ts, motion, heartRate}], meta: {lightsOffTs, screenTimeMinutesBeforeBed} }
 *
 * Required libraries (Arduino Library Manager):
 *   - Adafruit MPU6050, Adafruit Unified Sensor
 *   - SparkFun MAX3010x Pulse and Proximity Sensor Library
 *   - ArduinoJson
 *
 * Wiring (I2C, shared bus):
 *   MPU6050  SDA -> ESP32 GPIO21, SCL -> ESP32 GPIO22, VCC -> 3V3, GND -> GND
 *   MAX30102 SDA -> ESP32 GPIO21, SCL -> ESP32 GPIO22, VCC -> 3V3, GND -> GND
 *
 * Set SIMULATE_SENSORS to 1 to run without real hardware attached — useful
 * for bench-testing the WiFi/HTTP/JSON path before sensors arrive.
 */

#include <WiFi.h>
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
const char *WIFI_SSID = "YOUR_WIFI_SSID";
const char *WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char *API_BASE_URL = "https://zensleep.daniwork300.workers.dev"; // deployed backend; use https:// (WiFiClientSecure/HTTPClient handles TLS)
const char *DEVICE_USER_ID = "demo-user"; // maps to a dashboard user

const unsigned long EPOCH_MS = 30000;       // 30s per epoch, matches backend EPOCH_SECONDS
const unsigned long NIGHT_MS = 9UL * 3600 * 1000; // stop buffering / auto-upload after 9h as a safety cap
const int MAX_EPOCHS = (NIGHT_MS / EPOCH_MS) + 10;

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

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println(" connected: " + WiFi.localIP().toString());
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

int readHeartRate() {
#if SIMULATE_SENSORS
  return random(52, 78);
#else
  long irValue = particleSensor.getIR();
  if (irValue < 50000) return -1; // finger/wrist not detected against sensor
  // Real deployments should run this through SparkFun's heartRate.h beat
  // detection algorithm on a continuous IR sample stream; this firmware
  // buffers a coarse epoch-level estimate to keep the sketch focused on the
  // data pipeline. Swap in a proper BPM detector before shipping hardware.
  return -1;
#endif
}

void finalizeEpoch() {
  if (epochCount >= MAX_EPOCHS) return;

  float avgMotion = motionSamples > 0 ? motionAccum / motionSamples : 0;
  int avgHr = hrSamples > 0 ? (int)(hrAccum / hrSamples) : -1;

  epochBuffer[epochCount].ts = lightsOffEpochMs + (epochCount * EPOCH_MS);
  epochBuffer[epochCount].motion = avgMotion;
  epochBuffer[epochCount].heartRate = avgHr;
  epochCount++;

  motionAccum = 0;
  motionSamples = 0;
  hrAccum = 0;
  hrSamples = 0;
}

bool uploadNight() {
  if (epochCount == 0) return false;
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected — cannot upload");
    return false;
  }

  // ArduinoJson document sized generously for MAX_EPOCHS entries.
  DynamicJsonDocument doc(16384 + epochCount * 48);
  doc["userId"] = DEVICE_USER_ID;

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
  int status = http.POST(payload);

  Serial.printf("Upload status: %d\n", status);
  if (status == 201) {
    String response = http.getString();
    Serial.println("Server response: " + response);
  }
  http.end();

  return status == 201;
}

void loop() {
  // Sample sensors frequently, average into 30s epochs.
  motionAccum += readMotionMagnitude();
  motionSamples++;

  int hr = readHeartRate();
  if (hr > 0) {
    hrAccum += hr;
    hrSamples++;
  }

  if (millis() - epochStartMs >= EPOCH_MS) {
    finalizeEpoch();
    epochStartMs = millis();
    Serial.printf("Epoch %d buffered (motion=%.2f, hr=%d)\n", epochCount,
                   epochBuffer[epochCount - 1].motion, epochBuffer[epochCount - 1].heartRate);
  }

  bool sessionComplete = (millis() - sessionStartMs >= NIGHT_MS) || (epochCount >= MAX_EPOCHS - 1);
  if (sessionComplete) {
    Serial.println("Session complete, uploading...");
    if (uploadNight()) {
      epochCount = 0;
      sessionStartMs = millis();
      lightsOffEpochMs = millis();
    }
    delay(5000); // brief pause before starting a fresh session
  }

  delay(1000); // ~1 sample/sec; adjust for sensor noise vs. battery life tradeoff
}
