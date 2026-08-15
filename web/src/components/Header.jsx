import Logo from "./Logo.jsx";

export default function Header({ name, email, onSignOut }) {
  return (
    <header className="dashboard-nav">
      <Logo size={24} />
      <div className="dashboard-nav-user">
        <span className="user-email">{name || email}</span>
        <button className="btn-text" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </header>
  );
}
