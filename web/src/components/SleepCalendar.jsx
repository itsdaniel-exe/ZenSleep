import { useMemo, useState } from "react";
import { STRESS_COLORS } from "./ScoreRing.jsx";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function dateKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export default function SleepCalendar({ history, selectedId, onSelectDay }) {
  const [viewDate, setViewDate] = useState(() => new Date());

  const sessionsByDay = useMemo(() => {
    const map = new Map();
    // history is oldest -> newest, so the last write per key naturally keeps
    // the most recent session on any day with more than one (e.g. testing).
    for (const s of history) map.set(dateKey(s.createdAt), s);
    return map;
  }, [history]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayKey = dateKey(today.getTime());
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);

  return (
    <section className="calendar">
      <div className="calendar-header">
        <h4 className="details-heading">History</h4>
        <div className="calendar-nav">
          <button className="icon-button" onClick={() => setViewDate(new Date(year, month - 1, 1))} aria-label="Previous month">
            ‹
          </button>
          <span className="calendar-month-label">
            {viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </span>
          <button
            className="icon-button"
            onClick={() => setViewDate(new Date(year, month + 1, 1))}
            disabled={isCurrentMonth}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {WEEKDAYS.map((w, i) => (
          <div className="calendar-weekday" key={i}>
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div className="calendar-cell empty" key={`e${i}`} />;
          const key = `${year}-${month}-${day}`;
          const session = sessionsByDay.get(key);
          const classes = ["calendar-cell"];
          if (key === todayKey) classes.push("today");
          if (session) classes.push("has-data");
          if (session && session.id === selectedId) classes.push("selected");

          return (
            <button
              key={key}
              type="button"
              className={classes.join(" ")}
              disabled={!session}
              onClick={() => session && onSelectDay(session)}
              title={session ? `${session.overallScore}/100 · ${session.stressLevel} stress` : undefined}
            >
              <span className="calendar-day-num">{day}</span>
              {session && <span className="calendar-dot" style={{ background: STRESS_COLORS[session.stressLevel] }} />}
            </button>
          );
        })}
      </div>
    </section>
  );
}
