# ZenSleep Band Firmware

Arduino sketch for the ESP32-based band: `zensleep_band/zensleep_band.ino`.

## Hardware

- ESP32 dev board
- MPU6050 (accelerometer/gyro) — movement/restlessness signal
- MAX30102 (PPG) — heart rate signal
- Both sensors share the I2C bus (SDA=GPIO21, SCL=GPIO22 by default)

## Setup

1. Open in Arduino IDE (or PlatformIO).
2. Install libraries: `Adafruit MPU6050`, `Adafruit Unified Sensor`,
   `SparkFun MAX3010x Pulse and Proximity Sensor Library`, `ArduinoJson`,
   `WiFiManager` (tzapu/WiFiManager).
3. In the dashboard, go to **Your band > connect a band**, name it, and
   copy the generated API key (shown once). Paste it into `DEVICE_API_KEY`
   at the top of the `.ino`. Adjust `API_BASE_URL` if you're pointing at a
   different deployment than the default.
4. Flash to the board.
5. First boot: the ESP32 opens a WiFi access point named `ZenSleep-Setup`.
   Connect a phone or laptop to it - a setup page opens automatically (or
   browse to `192.168.4.1`), pick your real WiFi network and enter its
   password. Credentials are saved to flash and reused on every boot after
   that. To re-provision (new WiFi network), uncomment the
   `wm.resetSettings()` line in `connectWiFi()`, reflash once, then comment
   it back out and reflash again.

## How heart rate is measured

`sampleHeartRate()` runs real PPG peak detection on the MAX30102's IR
reading, not a stub: it tracks the slow-moving DC baseline (tissue +
ambient light) with an exponential moving average, detects each pulse as
the faster-moving AC signal crossing a threshold above that baseline,
enforces a refractory period so one beat can't double-count, and averages
the last few inter-beat intervals into a stable BPM. It needs a much
higher sample rate than motion does - `loop()` calls it every iteration
(no throttling), while motion is sampled on its own 200ms timer.

`HR_AC_THRESHOLD` is an empirical starting point; retune it against real
skin-contact readings once the band is on-body (log raw IR values over
serial and look at the actual pulse amplitude you get).

## Bench-testing without sensors attached

Set `#define SIMULATE_SENSORS 1` at the top of the sketch to run the full
WiFi → epoch-buffering → HTTP POST pipeline with randomized sensor values —
useful for validating connectivity independent of the sensors. For a
no-microcontroller-at-all demo, use `backend/scripts/simulate_device.py` or
the web dashboard's sample-night controls instead (the onboarding CTA on a
new account, or "+ add another sample night" once data exists), which
exercise the same scoring pipeline without going through the device path
at all.
