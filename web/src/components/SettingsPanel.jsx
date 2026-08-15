import { useState } from "react";
import { updateSettings, changePassword } from "../api.js";

export default function SettingsPanel({ user, onUpdated }) {
  const [name, setName] = useState(user.name || "");
  const [targetSleepHours, setTargetSleepHours] = useState(user.targetSleepHours ?? 8);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState(null);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError(null);
    setProfileSaved(false);
    try {
      const updated = await updateSettings(name, Number(targetSleepHours));
      onUpdated(updated);
      setProfileSaved(true);
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordError(null);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setShowPasswordForm(false);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <section className="settings">
      <h4 className="details-heading">Settings</h4>

      <form className="settings-form" onSubmit={handleSaveProfile}>
        <label>
          Display name
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" />
        </label>
        <label>
          Sleep goal (hours/night)
          <input
            type="number"
            min="4"
            max="12"
            step="0.5"
            value={targetSleepHours}
            onChange={(e) => setTargetSleepHours(e.target.value)}
          />
        </label>
        {profileError && <div className="error">{profileError}</div>}
        <div className="settings-row">
          <button type="submit" className="btn-outline btn-small" disabled={savingProfile}>
            {savingProfile ? "Saving…" : "Save"}
          </button>
          {profileSaved && <span className="settings-saved">Saved — your score and tips now use this goal.</span>}
        </div>
      </form>

      {!showPasswordForm ? (
        <button className="link-button" onClick={() => setShowPasswordForm(true)}>
          change password
        </button>
      ) : (
        <form className="settings-form" onSubmit={handleChangePassword}>
          <label>
            Current password
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <label>
            New password
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          {passwordError && <div className="error">{passwordError}</div>}
          <div className="settings-row">
            <button type="submit" className="btn-outline btn-small" disabled={savingPassword}>
              {savingPassword ? "Saving…" : "Update password"}
            </button>
            <button type="button" className="link-button" onClick={() => setShowPasswordForm(false)}>
              cancel
            </button>
          </div>
        </form>
      )}
      {passwordSaved && <p className="settings-saved">Password updated.</p>}
    </section>
  );
}
