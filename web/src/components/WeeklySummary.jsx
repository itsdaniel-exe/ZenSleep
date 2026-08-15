function average(sessions) {
  if (!sessions.length) return null;
  return Math.round(sessions.reduce((sum, s) => sum + s.overallScore, 0) / sessions.length);
}

/** @param {Array} history oldest-first, as returned by getHistory() */
export default function WeeklySummary({ history }) {
  if (!history || history.length < 2) return null;

  const last7 = history.slice(-7);
  const prior7 = history.slice(-14, -7);

  const thisWeekAvg = average(last7);
  const priorWeekAvg = average(prior7);
  const delta = priorWeekAvg !== null ? thisWeekAvg - priorWeekAvg : null;

  const best = last7.reduce((a, b) => (b.overallScore > a.overallScore ? b : a));
  const worst = last7.reduce((a, b) => (b.overallScore < a.overallScore ? b : a));
  const stressyNights = last7.filter((s) => s.stressLevel !== "Low").length;

  const fmt = (ts) => new Date(ts).toLocaleDateString(undefined, { weekday: "short" });

  return (
    <section className="weekly">
      <h4 className="details-heading">This week</h4>
      <div className="weekly-row">
        <div className="weekly-stat">
          <div className="weekly-value">{thisWeekAvg}</div>
          <div className="weekly-label">
            avg score
            {delta !== null && (
              <span className={delta >= 0 ? "weekly-delta up" : "weekly-delta down"}>
                {" "}
                {delta >= 0 ? "+" : ""}
                {delta} vs last week
              </span>
            )}
          </div>
        </div>
        <div className="weekly-stat">
          <div className="weekly-value">{best.overallScore}</div>
          <div className="weekly-label">best night ({fmt(best.createdAt)})</div>
        </div>
        <div className="weekly-stat">
          <div className="weekly-value">{worst.overallScore}</div>
          <div className="weekly-label">roughest night ({fmt(worst.createdAt)})</div>
        </div>
        <div className="weekly-stat">
          <div className="weekly-value">
            {stressyNights}/{last7.length}
          </div>
          <div className="weekly-label">nights above Low stress</div>
        </div>
      </div>
    </section>
  );
}
