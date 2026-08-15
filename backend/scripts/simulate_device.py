#!/usr/bin/env python3
"""
Stands in for the ESP32 wearable: generates one synthetic night of
30-second epochs and POSTs it to the ZenSleep API's /api/ingest endpoint,
in the exact JSON shape the real firmware (firmware/zensleep_band) sends.

Useful for testing the backend independently of the browser demo button,
or for load-testing ingest with many simulated users.

Usage:
    python scripts/simulate_device.py --host http://localhost:8787 --device-key zs_... --profile restless

--device-key comes from the dashboard: sign in, go to "Your band", and
"+ connect a band" - the key is only shown once at creation time.
"""
import argparse
import random
import time
import urllib.request
import json

EPOCH_SECONDS = 30
PROFILES = {
    "good": dict(awakening_chance=0.0012, base_hr=(56, 64), settle_epochs=(6, 16)),
    "restless": dict(awakening_chance=0.0055, base_hr=(60, 68), settle_epochs=(10, 25)),
    "stressed": dict(awakening_chance=0.011, base_hr=(68, 76), settle_epochs=(30, 60)),
}


def simulate_night(hours: float, profile: str):
    cfg = PROFILES[profile]
    epoch_count = round(hours * 3600 / EPOCH_SECONDS)
    start_ts = int(time.time() * 1000) - round(hours * 3600 * 1000)
    settle_epochs = random.randint(*cfg["settle_epochs"])
    base_hr = random.uniform(*cfg["base_hr"])

    epochs = []
    in_awakening = False
    awakening_remaining = 0

    for i in range(epoch_count):
        still_falling_asleep = i < settle_epochs

        if not in_awakening and not still_falling_asleep and random.random() < cfg["awakening_chance"]:
            in_awakening = True
            awakening_remaining = random.randint(2, 6)

        if still_falling_asleep:
            motion = max(0.0, min(1.0, random.uniform(0.3, 0.7) * (1 - i / settle_epochs) + random.uniform(0, 0.15)))
        elif in_awakening:
            motion = random.uniform(0.4, 0.9)
            awakening_remaining -= 1
            if awakening_remaining <= 0:
                in_awakening = False
        else:
            motion = max(0.0, min(1.0, random.uniform(0, 0.18) + (random.uniform(0, 0.2) if random.random() < 0.05 else 0)))

        hr_jitter = random.uniform(4, 12) if in_awakening else random.uniform(-3, 3)
        heart_rate = round(base_hr + hr_jitter + (random.uniform(0, 6) if still_falling_asleep else 0))

        epochs.append({
            "ts": start_ts + i * EPOCH_SECONDS * 1000,
            "motion": round(motion, 3),
            "heartRate": heart_rate,
        })

    meta = {
        "lightsOffTs": start_ts,
        "screenTimeMinutesBeforeBed": random.randint(60, 150) if profile == "stressed" else random.randint(0, 45),
    }
    return epochs, meta


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="http://localhost:8787")
    parser.add_argument("--device-key", required=True, help="Device API key from the dashboard's 'Your band' section")
    parser.add_argument("--hours", type=float, default=None, help="Night length; random 6.2-8.5h if omitted")
    parser.add_argument("--profile", choices=list(PROFILES), default="good")
    args = parser.parse_args()

    hours = args.hours if args.hours is not None else random.uniform(6.2, 8.5)
    epochs, meta = simulate_night(hours, args.profile)

    payload = json.dumps({"epochs": epochs, "meta": meta}).encode("utf-8")
    req = urllib.request.Request(
        f"{args.host}/api/ingest",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {args.device_key}",
            # *.workers.dev applies baseline bot protection that blocks
            # urllib's default "Python-urllib/x.y" User-Agent (403, Cloudflare
            # error 1010) - doesn't happen on a custom domain, and doesn't
            # affect a browser or the ESP32's own HTTPClient, just this script.
            "User-Agent": "ZenSleepDeviceSimulator/1.0",
        },
        method="POST",
    )

    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())
        print(f"Ingested {len(epochs)} epochs ({hours:.1f}h, profile={args.profile})")
        print(f"Score: {result['overallScore']}/100  Stress: {result['stressLevel']}")


if __name__ == "__main__":
    main()
