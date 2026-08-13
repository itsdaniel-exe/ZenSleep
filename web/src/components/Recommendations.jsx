export default function Recommendations({ narrative, recommendations }) {
  return (
    <div className="card">
      <h3>Tonight's insight</h3>
      {narrative && <p className="narrative">{narrative.text}</p>}
      <ul className="tips">
        {recommendations?.map((tip, i) => (
          <li key={i}>{tip}</li>
        ))}
      </ul>
    </div>
  );
}
