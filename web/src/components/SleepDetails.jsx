import MetricStrip from "./MetricStrip.jsx";
import MotionTimeline from "./MotionTimeline.jsx";
import TrendChart from "./TrendChart.jsx";

export default function SleepDetails({ metrics, epochs, history }) {
  return (
    <section className="details">
      <h4 className="details-heading">The details</h4>
      <MetricStrip metrics={metrics} />
      <div className="details-charts">
        <MotionTimeline epochs={epochs} />
        <TrendChart history={history} />
      </div>
    </section>
  );
}
