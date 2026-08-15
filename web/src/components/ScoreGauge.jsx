import ScoreRing, { STRESS_COLORS } from "./ScoreRing.jsx";

/** Standalone, card-wrapped gauge - used for the landing page's hero visual only. */
export default function ScoreGauge({ score, stressLevel }) {
  const color = STRESS_COLORS[stressLevel] || "#8790a3";
  return (
    <div className="card gauge-card">
      <ScoreRing score={score} stressLevel={stressLevel} size={180} />
      <div className="stress-badge" style={{ backgroundColor: `${color}22`, color }}>
        {stressLevel} stress
      </div>
    </div>
  );
}
