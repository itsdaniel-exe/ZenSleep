const ICONS = {
  duration: (
    <path d="M15.5 13.5A6.5 6.5 0 0 1 7.8 5.2a7 7 0 1 0 7.7 8.3Z" />
  ),
  awakenings: (
    <path d="M2 12h3l2-5 3 10 3-13 2 8h5" strokeLinejoin="round" />
  ),
  latency: (
    <>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 5.5V10l3.2 2" strokeLinejoin="round" />
    </>
  ),
  heart: (
    <path d="M10 16.8s-6.2-3.9-6.2-8.4A3.6 3.6 0 0 1 10 6.1a3.6 3.6 0 0 1 6.2 2.3c0 4.5-6.2 8.4-6.2 8.4Z" strokeLinejoin="round" />
  ),
};

function Icon({ name }) {
  return (
    <svg className="stat-icon" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      {ICONS[name]}
    </svg>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="stat">
      <Icon name={icon} />
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export default function MetricStrip({ metrics }) {
  if (!metrics) return null;
  return (
    <div className="card metric-strip">
      <Stat icon="duration" label="Duration" value={`${metrics.durationHours}h`} />
      <Stat icon="awakenings" label="Awakenings" value={metrics.awakenings} />
      <Stat icon="latency" label="Sleep latency" value={`${metrics.sleepLatencyMinutes}m`} />
      <Stat icon="heart" label="Avg heart rate" value={metrics.hrMean ? `${metrics.hrMean} bpm` : "—"} />
    </div>
  );
}
