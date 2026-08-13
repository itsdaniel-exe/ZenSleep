import { useCallback, useEffect, useState } from "react";
import { getLatest, getHistory, generateDemoNight } from "./api.js";
import { getDemoUserId, firebaseEnabled } from "./firebase.js";
import ScoreGauge from "./components/ScoreGauge.jsx";
import MetricStrip from "./components/MetricStrip.jsx";
import MotionTimeline from "./components/MotionTimeline.jsx";
import TrendChart from "./components/TrendChart.jsx";
import Recommendations from "./components/Recommendations.jsx";

const PROFILES = ["good", "restless", "stressed"];

export default function App() {
  const userId = getDemoUserId();
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [latestSession, hist] = await Promise.all([getLatest(userId), getHistory(userId)]);
      setLatest(latestSession);
      setHistory(hist || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleGenerate(profile) {
    setGenerating(true);
    try {
      await generateDemoNight(userId, profile);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="app">
      <header>
        <h1>ZenSleep</h1>
        <p className="subtitle">Intelligent stress inference from behavioral sleep signals</p>
      </header>

      <div className="demo-bar">
        <span>Demo user: {userId}</span>
        {!firebaseEnabled && <span className="badge">local demo mode</span>}
        <div className="demo-buttons">
          {PROFILES.map((p) => (
            <button key={p} disabled={generating} onClick={() => handleGenerate(p)}>
              Generate {p} night
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <p className="hint">Loading…</p>
      ) : !latest ? (
        <div className="empty-state">
          <p>No sleep data yet. This app has no real hardware connected right now, so click a button above to</p>
          <p>simulate a night from an ESP32 wearable and see the full pipeline run end to end.</p>
        </div>
      ) : (
        <main className="grid">
          <ScoreGauge score={latest.overallScore} stressLevel={latest.stressLevel} />
          <MetricStrip metrics={latest.metrics} />
          <Recommendations narrative={latest.narrative} recommendations={latest.recommendations} />
          <MotionTimeline epochs={latest.epochs} />
          <TrendChart history={history} />
        </main>
      )}
    </div>
  );
}
