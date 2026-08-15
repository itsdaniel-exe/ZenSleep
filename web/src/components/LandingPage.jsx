import { useState } from "react";
import Logo from "./Logo.jsx";
import AuthForm from "./AuthForm.jsx";
import ScoreGauge from "./ScoreGauge.jsx";

const FEATURES = [
  {
    title: "Nothing to wear",
    body: "Movement and heart-rate sensing from a bedside band, not a wrist strap - no discomfort, no skin irritation, no charging anxiety.",
  },
  {
    title: "Insight, not just data",
    body: "A rule-based scoring engine turns raw motion and heart rate into a sleep score, a stress level, and specific next steps - explainable, not a black box.",
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
                ZenSleep is an AI-powered sleep intelligence platform: a non-wearable band
                captures overnight movement and heart rate, and turns it into a sleep score,
                a stress reading, and concrete recommendations - not just a chart.
              </p>
              <div className="hero-actions">
                <button className="btn-primary" onClick={() => setShowAuth(true)}>
                  Get started free
                </button>
                <span className="hero-hint">No credit card. No hardware required to try it.</span>
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
