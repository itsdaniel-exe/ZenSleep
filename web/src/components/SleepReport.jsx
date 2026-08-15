import ScoreRing, { STRESS_COLORS } from "./ScoreRing.jsx";

function headline(score) {
  if (score >= 85) return "Great night";
  if (score >= 70) return "Solid night";
  if (score >= 50) return "Rough night";
  return "Tough night";
}

export default function SleepReport({ session, delta }) {
  const { overallScore, stressLevel, narrative, recommendations, createdAt } = session;
  const color = STRESS_COLORS[stressLevel] || "#8790a3";
  const date = new Date(createdAt).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

  return (
    <section className="report">
      <div className="report-eyebrow">
        <span>{date}</span>
        <span className="stress-badge" style={{ backgroundColor: `${color}22`, color }}>
          {stressLevel} stress
        </span>
      </div>

      <div className="report-main">
        <div className="report-ring">
          <ScoreRing score={overallScore} stressLevel={stressLevel} />
          {delta !== null && delta !== undefined && (
            <div className={delta >= 0 ? "report-delta up" : "report-delta down"}>
              {delta >= 0 ? "+" : ""}
              {delta} vs. last night
            </div>
          )}
        </div>

        <div className="report-copy">
          <h2>{headline(overallScore)}</h2>
          {narrative && <p className="narrative">{narrative.text}</p>}

          {recommendations?.length > 0 && (
            <ul className="tips">
              {recommendations.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
