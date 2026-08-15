import { useCallback, useEffect, useState } from "react";
import { getMe, getLatest, getHistory, generateDemoNight, logout } from "./api.js";
import LandingPage from "./components/LandingPage.jsx";
import Header from "./components/Header.jsx";
import SleepReport from "./components/SleepReport.jsx";
import SleepDetails from "./components/SleepDetails.jsx";
import { SampleDataOnboarding, SampleDataUtility } from "./components/SampleDataPanel.jsx";

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [settingUp, setSettingUp] = useState(false);

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

  async function handleAuthenticated(newUser, { isNewAccount } = {}) {
    if (isNewAccount) {
      // Seed one night before the dashboard ever renders, so a brand-new
      // account lands on a working report instead of an empty page.
      setSettingUp(true);
      try {
        await generateDemoNight("good");
      } catch {
        // non-fatal - falls through to the normal empty state
      } finally {
        setSettingUp(false);
      }
    }
    setUser(newUser);
  }

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
    return <LandingPage onAuthenticated={handleAuthenticated} />;
  }

  if (settingUp) {
    return (
      <div className="app">
        <Header email={user.email} onSignOut={handleSignOut} />
        <p className="hint centered">Setting up your dashboard…</p>
      </div>
    );
  }

  const delta = history.length >= 2 ? history[history.length - 1].overallScore - history[history.length - 2].overallScore : null;

  return (
    <div className="app">
      <Header email={user.email} onSignOut={handleSignOut} />

      {error && <div className="error">{error}</div>}

      {loadingData ? (
        <p className="hint centered">Loading…</p>
      ) : !latest ? (
        <div className="empty-state">
          <h2>No sleep data yet</h2>
          <p>No band connected to this account yet. Once one is, nights will show up here automatically.</p>
          <SampleDataOnboarding onGenerate={handleGenerate} generating={generating} />
        </div>
      ) : (
        <main className="dashboard">
          <SleepReport session={latest} delta={delta} />
          <SleepDetails metrics={latest.metrics} epochs={latest.epochs} history={history} />
          <div className="dashboard-footer">
            <SampleDataUtility onGenerate={handleGenerate} generating={generating} />
          </div>
        </main>
      )}
    </div>
  );
}
