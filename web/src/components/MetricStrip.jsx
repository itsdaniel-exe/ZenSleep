function Stat({ label, value }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function MetricStrip({ metrics }) {
  if (!metrics) return null;
  return (
    <div className="card metric-strip">
      <Stat label="Duration" value={`${metrics.durationHours}h`} />
      <Stat label="Awakenings" value={metrics.awakenings} />
      <Stat label="Sleep latency" value={`${metrics.sleepLatencyMinutes}m`} />
      <Stat label="Avg heart rate" value={metrics.hrMean ? `${metrics.hrMean} bpm` : "—"} />
    </div>
  );
}
