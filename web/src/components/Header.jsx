import Logo from "./Logo.jsx";

export default function Header({ email, onSignOut }) {
  return (
    <header className="dashboard-nav">
      <Logo size={24} />
      <div className="dashboard-nav-user">
        <span className="user-email">{email}</span>
        <button className="btn-text" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </header>
  );
}
