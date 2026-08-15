import { useCallback, useEffect, useState } from "react";
import { getMe, getLatest, getHistory, generateDemoNight, logout } from "./api.js";
import LandingPage from "./components/LandingPage.jsx";
import Header from "./components/Header.jsx";
import SleepReport from "./components/SleepReport.jsx";
import SleepCalendar from "./components/SleepCalendar.jsx";
import SleepDetails from "./components/SleepDetails.jsx";
import { SampleDataOnboarding, SampleDataUtility } from "./components/SampleDataPanel.jsx";

const HISTORY_LIMIT = 90; // enough to populate a few months of the calendar

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [settingUp, setSettingUp] = useState(false);

  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedId, setSelectedId] = useState(null); // null = show latest
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
      const [latestSession, hist] = await Promise.all([getLatest(), getHistory(HISTORY_LIMIT)]);
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
      // Spread synthetic nights across recent days (today, yesterday, ...)
      // instead of stacking every generated night on today - otherwise the
      // calendar below would only ever show one populated day. That means a
      // newly generated night isn't necessarily the most recent by
      // timestamp once today is already taken, so explicitly show whatever
      // was just created rather than "the latest" - otherwise clicking
      // "stressed" would silently add history without ever showing it.
      const created = await generateDemoNight(profile, history.length);
      await loadDashboard();
      setSelectedId(created.id);
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
    setSelectedId(null);
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

  // Prefer the full `latest` object whenever the selection resolves to it -
  // history entries never carry epochs (stripped for size), even for the
  // same night, so falling through to a history entry here would silently
  // lose the motion timeline for today.
  const displayed = (selectedId && selectedId !== latest?.id && history.find((s) => s.id === selectedId)) || latest;
  const displayedIndex = displayed ? history.findIndex((s) => s.id === displayed.id) : -1;
  const delta = displayedIndex > 0 ? displayed.overallScore - history[displayedIndex - 1].overallScore : null;
  const isLatestSelected = !displayed || !latest || displayed.id === latest.id;

  return (
    <div className="app">
      <Header email={user.email} onSignOut={handleSignOut} />

      {error && <div className="error">{error}</div>}

      {loadingData ? (
        <p className="hint centered">Loading…</p>
      ) : !displayed ? (
        <div className="empty-state">
          <h2>No sleep data yet</h2>
          <p>No band connected to this account yet. Once one is, nights will show up here automatically.</p>
          <SampleDataOnboarding onGenerate={handleGenerate} generating={generating} />
        </div>
      ) : (
        <main className="dashboard">
          <SleepReport session={displayed} delta={delta} />
          {history.length > 1 && (
            <SleepCalendar history={history} selectedId={displayed.id} onSelectDay={(s) => setSelectedId(s.id)} />
          )}
          <SleepDetails
            metrics={displayed.metrics}
            epochs={displayed.epochs}
            hasEpochsElsewhere={!isLatestSelected}
            history={history.slice(-14)}
          />
          <div className="dashboard-footer">
            <SampleDataUtility onGenerate={handleGenerate} generating={generating} />
          </div>
        </main>
      )}
    </div>
  );
}
