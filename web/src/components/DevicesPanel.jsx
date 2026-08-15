import { useEffect, useState } from "react";
import { createDevice, getDevices, deleteDevice } from "../api.js";

const STALE_AFTER_MS = 20 * 60 * 1000; // no epoch in 20+ min = probably not actively worn/synced

function relativeTime(ts) {
  if (!ts) return "never connected";
  const diffMs = Date.now() - ts;
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function DeviceRow({ device, onRemove }) {
  const online = device.lastSeenAt && Date.now() - device.lastSeenAt < STALE_AFTER_MS;
  return (
    <div className="device-row">
      <span className={online ? "device-dot online" : "device-dot"} title={online ? "Recently synced" : "Not recently synced"} />
      <div className="device-info">
        <div className="device-name">{device.name}</div>
        <div className="device-meta">Last synced {relativeTime(device.lastSeenAt)}</div>
      </div>
      <button className="link-button" onClick={() => onRemove(device.id)}>
        remove
      </button>
    </div>
  );
}

export default function DevicesPanel() {
  const [devices, setDevices] = useState(null); // null = loading
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getDevices()
      .then((d) => setDevices(d || []))
      .catch((err) => setError(err.message));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    try {
      const device = await createDevice(name || "My band");
      setNewKey(device.apiKey);
      setDevices((prev) => [{ id: device.id, name: device.name, createdAt: device.createdAt, lastSeenAt: null }, ...(prev || [])]);
      setName("");
      setAdding(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemove(id) {
    try {
      await deleteDevice(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(newKey);
      setCopied(true);
    } catch {
      // clipboard permission denied - the key is still selectable/visible in the box
    }
  }

  if (devices === null) return null;

  return (
    <section className="devices">
      <h4 className="details-heading">Your band</h4>

      {error && <div className="error">{error}</div>}

      {newKey && (
        <div className="device-key-box">
          <p>
            <strong>Copy this API key now</strong> — it won't be shown again. Paste it into
            <code> DEVICE_API_KEY</code> in <code>firmware/zensleep_band/zensleep_band.ino</code>.
          </p>
          <div className="device-key-value">
            <code>{newKey}</code>
            <button className="btn-outline btn-small" onClick={copyKey}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <button className="link-button" onClick={() => setNewKey(null)}>
            done
          </button>
        </div>
      )}

      {devices.length > 0 && (
        <div className="device-list">
          {devices.map((d) => (
            <DeviceRow key={d.id} device={d} onRemove={handleRemove} />
          ))}
        </div>
      )}

      {!newKey &&
        (adding ? (
          <form className="device-add-form" onSubmit={handleCreate}>
            <input
              type="text"
              placeholder="Band name (e.g. Bedside Band)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn-outline btn-small">
              Generate key
            </button>
            <button type="button" className="link-button" onClick={() => setAdding(false)}>
              cancel
            </button>
          </form>
        ) : (
          <button className="link-button" onClick={() => setAdding(true)}>
            + connect a band
          </button>
        ))}
    </section>
  );
}
