import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const MOVEMENT_THRESHOLD = 0.3;

export default function MotionTimeline({ epochs }) {
  if (!epochs || epochs.length === 0) return null;

  const data = epochs.map((e, i) => ({
    minute: Math.round((i * 30) / 60),
    motion: e.motion,
    heartRate: e.heartRate,
  }));

  return (
    <div className="detail-block">
      <h3>Overnight motion</h3>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="motionFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6c9bff" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#6c9bff" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#232b3a" />
          <XAxis
            dataKey="minute"
            tickFormatter={(m) => `${Math.floor(m / 60)}h${m % 60}`}
            stroke="#6c7a89"
            tick={{ fontSize: 11 }}
          />
          <YAxis domain={[0, 1]} stroke="#6c7a89" tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value, name) => [name === "motion" ? value.toFixed(2) : `${value} bpm`, name]}
            labelFormatter={(m) => `${Math.floor(m / 60)}h ${m % 60}m in`}
            contentStyle={{ background: "#151b26", border: "1px solid #232b3a" }}
          />
          <Area type="monotone" dataKey="motion" stroke="#6c9bff" fill="url(#motionFill)" strokeWidth={1.5} />
        </AreaChart>
      </ResponsiveContainer>
      <p className="hint">Above {MOVEMENT_THRESHOLD} is counted as movement/awakening.</p>
    </div>
  );
}
