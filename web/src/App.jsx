import { useCallback, useEffect, useState } from "react";
import { getMe, getLatest, getHistory, generateDemoNight, logout } from "./api.js";
import LandingPage from "./components/LandingPage.jsx";
import Header from "./components/Header.jsx";
import ScoreGauge from "./components/ScoreGauge.jsx";
import MetricStrip from "./components/MetricStrip.jsx";
import MotionTimeline from "./components/MotionTimeline.jsx";
import TrendChart from "./components/TrendChart.jsx";
import Recommendations from "./components/Recommendations.jsx";
import SampleDataPanel from "./components/SampleDataPanel.jsx";

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMe()
      .then(setUser)
      .finally(() => setAuthChecked(true));
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoadingData(true);
    try {
      setError(null);
      const [latestSession, hist] = await Promise.all([getLatest(), getHistory()]);
      setLatest(latestSession);
      setHistory(hist || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadDashboard();
  }, [user, loadDashboard]);

  async function handleGenerate(profile) {
    setGenerating(true);
    try {
      await generateDemoNight(profile);
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSignOut() {
    await logout().catch(() => {});
    setUser(null);
    setLatest(null);
    setHistory([]);
  }

  if (!authChecked) {
    return <div className="app-loading" />;
  }

  if (!user) {
    return <LandingPage onAuthenticated={setUser} />;
  }

  return (
    <div className="app">
      <Header email={user.email} onSignOut={handleSignOut} />

      {error && <div className="error">{error}</div>}

      {loadingData ? (
        <p className="hint">Loading…</p>
      ) : !latest ? (
        <div className="empty-state">
          <h2>No sleep data yet</h2>
          <p>No band connected to this account yet. Once one is, nights will show up here automatically.</p>
          <SampleDataPanel onGenerate={handleGenerate} generating={generating} />
        </div>
      ) : (
        <main className="grid">
          <ScoreGauge score={latest.overallScore} stressLevel={latest.stressLevel} />
          <MetricStrip metrics={latest.metrics} />
          <Recommendations narrative={latest.narrative} recommendations={latest.recommendations} />
          <MotionTimeline epochs={latest.epochs} />
          <TrendChart history={history} />
          <SampleDataPanel onGenerate={handleGenerate} generating={generating} compact />
        </main>
      )}
    </div>
  );
}
