import { useState } from "react";
import Logo from "./Logo.jsx";
import AuthForm from "./AuthForm.jsx";
import ScoreGauge from "./ScoreGauge.jsx";

const FEATURES = [
  {
    title: "Pair your own band",
    body: "Generate a private API key from your dashboard, paste it into the firmware, done. Revoke it any time and the band stops working immediately - no shared IDs, no guessing.",
  },
  {
    title: "Insight, not just data",
    body: "A rule-based scoring engine turns raw motion and heart rate into a sleep score, a stress level, and specific next steps - explainable, not a black box.",
  },
  {
    title: "Track it over time",
    body: "A calendar of every night, color-coded by stress level - click any day to pull up that night's full report, not just today's.",
  },
  {
    title: "Know if it's actually connected",
    body: "Your band's last-synced time shows right on the dashboard, so you know it's working without checking a serial monitor.",
  },
  {
    title: "This week at a glance",
    body: "Average score vs. last week, your best and roughest nights, how many nights ran hot on stress - the digest, not just a chart.",
  },
  {
    title: "Built for irregular sleepers",
    body: "Designed around students and shift workers with late nights and inconsistent schedules, not idealized 8-hours-on-a-fixed-clock routines.",
  },
];

export default function LandingPage({ onAuthenticated }) {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="landing">
      <header className="landing-nav">
        <Logo />
        {!showAuth && (
          <button className="btn-primary btn-small" onClick={() => setShowAuth(true)}>
            Get started
          </button>
        )}
      </header>

      {showAuth ? (
        <div className="landing-auth">
          <AuthForm onAuthenticated={onAuthenticated} onCancel={() => setShowAuth(false)} />
        </div>
      ) : (
        <>
          <section className="hero">
            <div className="hero-copy">
              <h1>
                We turn sleep data into daily, personalized actions that
                actually <span className="accent-text">improve sleep.</span>
              </h1>
              <p className="hero-sub">
                ZenSleep is an AI-powered sleep intelligence platform: a band captures
                overnight movement and heart rate, and turns it into a sleep score,
                a stress reading, and concrete recommendations - not just a chart.
              </p>
              <div className="hero-actions">
                <button className="btn-primary" onClick={() => setShowAuth(true)}>
                  Get started free
                </button>
                <span className="hero-hint">No credit card required.</span>
              </div>
            </div>
            <div className="hero-visual">
              <ScoreGauge score={87} stressLevel="Low" />
            </div>
          </section>

          <section className="features">
            {FEATURES.map((f) => (
              <div className="feature-card" key={f.title}>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </section>

          <footer className="landing-footer">
            <p>
              Built from the ZenSleep team's YUKTI Innovation Challenge 2025 submission
              (AICTE Productization Fellowship).
            </p>
          </footer>
        </>
      )}
    </div>
  );
}
