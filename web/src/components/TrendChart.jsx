import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function TrendChart({ history }) {
  if (!history || history.length === 0) return null;

  const data = history.map((s) => ({
    date: new Date(s.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    score: s.overallScore,
  }));

  return (
    <div className="detail-block">
      <h3>Score trend</h3>
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#232b3a" />
          <XAxis dataKey="date" stroke="#6c7a89" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} stroke="#6c7a89" tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ background: "#151b26", border: "1px solid #232b3a" }} />
          <Line type="monotone" dataKey="score" stroke="#2fb380" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
