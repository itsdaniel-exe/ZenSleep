# ZenSleep Band Firmware

Arduino sketch for the ESP32-based wearable: `zensleep_band/zensleep_band.ino`.

## Hardware

- ESP32 dev board
- MPU6050 (accelerometer/gyro) — movement/restlessness signal
- MAX30102 (PPG) — heart rate signal
- Both sensors share the I2C bus (SDA=GPIO21, SCL=GPIO22 by default)

## Setup

1. Open in Arduino IDE (or PlatformIO).
2. Install libraries: `Adafruit MPU6050`, `Adafruit Unified Sensor`,
   `SparkFun MAX3010x Pulse and Proximity Sensor Library`, `ArduinoJson`.
3. Edit the config block at the top of the `.ino`: WiFi SSID/password,
   `API_BASE_URL` (your backend's reachable address), `DEVICE_USER_ID`.
4. Flash to the board.

## No hardware yet?

Set `#define SIMULATE_SENSORS 1` at the top of the sketch to run the full
WiFi → epoch-buffering → HTTP POST pipeline with randomized sensor values —
useful for validating connectivity before sensors arrive. For a
no-microcontroller-at-all demo, use `backend/scripts/simulate_device.py` or
the web dashboard's "Generate demo night" buttons instead, which exercise
the exact same backend ingest endpoint.

## Known limitation

`readHeartRate()` currently returns the raw IR-good/no-signal check but not a
real BPM value — proper PPG beat detection (SparkFun's `heartRate.h`
algorithm run over a continuous IR sample stream) still needs to be wired in
before heart-rate data is meaningful from real hardware. Motion-based scoring
works standalone; heart-rate epochs are simply omitted (`null`) until this is
implemented, and the backend scoring engine already handles missing HR data
gracefully (see `hrStabilityScore` in `backend/src/services/sleepScoring.js`).
