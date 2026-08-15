import MetricStrip from "./MetricStrip.jsx";
import MotionTimeline from "./MotionTimeline.jsx";
import TrendChart from "./TrendChart.jsx";

export default function SleepDetails({ metrics, epochs, hasEpochsElsewhere, history }) {
  return (
    <section className="details">
      <h4 className="details-heading">The details</h4>
      <MetricStrip metrics={metrics} />
      <div className="details-charts">
        {epochs ? (
          <MotionTimeline epochs={epochs} />
        ) : hasEpochsElsewhere ? (
          <div className="detail-block">
            <h3>Overnight motion</h3>
            <p className="hint">Minute-by-minute detail is only kept for the most recent night.</p>
          </div>
        ) : null}
        <TrendChart history={history} />
      </div>
    </section>
  );
}
