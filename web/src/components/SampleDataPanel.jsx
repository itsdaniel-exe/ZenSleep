import { useState } from "react";

const SECONDARY_PROFILES = [
  { key: "restless", label: "restless" },
  { key: "stressed", label: "stressed" },
];

/** Full version: one clear primary action, secondary variants tucked into small text links. */
export function SampleDataOnboarding({ onGenerate, generating }) {
  return (
    <div className="sample-onboarding">
      <button className="btn-primary" disabled={generating} onClick={() => onGenerate("good")}>
        {generating ? "Generating…" : "See it in action"}
      </button>
      <p className="sample-onboarding-hint">
        Simulates a night of band data so you can see how scoring works. Or try it{" "}
        {SECONDARY_PROFILES.map((p, i) => (
          <span key={p.key}>
            <button className="link-button" disabled={generating} onClick={() => onGenerate(p.key)}>
              {p.label}
            </button>
            {i < SECONDARY_PROFILES.length - 1 ? " / " : ""}
          </span>
        ))}
        .
      </p>
    </div>
  );
}

/** Compact version for once real data exists: a single tucked-away control, not a panel. */
export function SampleDataUtility({ onGenerate, generating }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button className="link-button sample-utility-toggle" onClick={() => setOpen(true)}>
        + add another sample night
      </button>
    );
  }

  return (
    <div className="sample-utility-open">
      <span>Add:</span>
      {["good", "restless", "stressed"].map((p) => (
        <button
          key={p}
          className="link-button"
          disabled={generating}
          onClick={() => {
            onGenerate(p);
            setOpen(false);
          }}
        >
          {p}
        </button>
      ))}
      <button className="link-button" onClick={() => setOpen(false)}>
        cancel
      </button>
    </div>
  );
}
