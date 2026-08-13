# Problem Statement

_Summarized from the team's YUKTI Innovation Challenge 2025 submission
(Proto ID IR2025-947774, AICTE Productization Fellowship)._

## The problem

Millions of individuals struggle with poor sleep quality but lack an
affordable, comfortable, non-wearable method to track and understand their
sleep patterns.

## Customer pain points

- Irregular sleep schedules from late nights, study/work pressure, or shift duties
- Sleep latency of 30-45 minutes (trouble falling asleep)
- 3-6 night-time awakenings per night
- Feeling tired and unrefreshed even after 6-8 hours in bed
- High screen exposure before bedtime (6-8 hours/day)
- Existing wearables cause discomfort — wrist pressure, skin irritation
- Existing sleep-tracking apps rely on limited signals (sound or basic
  motion only), give inconsistent/inaccurate results (20-35% deviation
  observed), and don't explain *why* sleep quality is poor
- High app drop-off within 30 days due to lack of personalization or
  actionable guidance

## Primary personas

- Students (18-25) with irregular sleep schedules — over half sleep after midnight
- Working professionals (22-45) with high stress and long screen exposure
- Shift workers with rotating schedules (up to 40% higher sleep disruption)
- Fitness/wellness-focused individuals tracking recovery
- Parents concerned about a child's sleep quality

## What existing solutions get wrong

- Depend only on sound or basic motion, with no behavioral/contextual analysis
- No personalization or actionable recommendations
- Premium wearables (₹20,000-₹40,000) price out most of the target market

## How ZenSleep addresses this

A non-wearable-friction band (ESP32 + motion/heart-rate sensors) captures
overnight movement and heart-rate signals, which a scoring engine converts
into a sleep score, a stress-level inference, and specific, prioritized
recommendations — not just raw numbers. See [`architecture.md`](architecture.md)
for how that pipeline is implemented in this repo, and
[`business-model.md`](business-model.md) for the go-to-market plan.
