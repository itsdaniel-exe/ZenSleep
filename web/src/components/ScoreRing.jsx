export const STRESS_COLORS = {
  Low: "#3ddba0",
  Moderate: "#f0b429",
  High: "#f2545b",
};

export default function ScoreRing({ score, stressLevel, size = 148 }) {
  const radius = (size / 180) * 70;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = STRESS_COLORS[stressLevel] || "#8790a3";
  const strokeWidth = (size / 180) * 13;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="score-ring">
      <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${progress} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
      />
      <text x={center} y={center - 4} textAnchor="middle" className="gauge-score" style={{ fontSize: size * 0.24 }}>
        {score}
      </text>
      <text x={center} y={center + size * 0.14} textAnchor="middle" className="gauge-label" style={{ fontSize: size * 0.075 }}>
        / 100
      </text>
    </svg>
  );
}
