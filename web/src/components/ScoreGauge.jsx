const STRESS_COLORS = {
  Low: "#2fb380",
  Moderate: "#e0a52c",
  High: "#e0522c",
};

export default function ScoreGauge({ score, stressLevel }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = STRESS_COLORS[stressLevel] || "#6c7a89";

  return (
    <div className="card gauge-card">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#232b3a" strokeWidth="14" />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 90 90)"
        />
        <text x="90" y="86" textAnchor="middle" className="gauge-score">
          {score}
        </text>
        <text x="90" y="108" textAnchor="middle" className="gauge-label">
          / 100
        </text>
      </svg>
      <div className="stress-badge" style={{ backgroundColor: `${color}22`, color }}>
        {stressLevel} stress
      </div>
    </div>
  );
}
