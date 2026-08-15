const PROFILES = [
  { key: "good", label: "Good night" },
  { key: "restless", label: "Restless night" },
  { key: "stressed", label: "Stressed night" },
];

export default function SampleDataPanel({ onGenerate, generating, compact }) {
  return (
    <div className={compact ? "sample-panel sample-panel-compact" : "sample-panel"}>
      <div className="sample-panel-label">
        {compact ? "Add another sample night" : "No band connected yet - try it with sample data"}
      </div>
      <div className="sample-panel-buttons">
        {PROFILES.map((p) => (
          <button
            key={p.key}
            className="btn-outline btn-small"
            disabled={generating}
            onClick={() => onGenerate(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
