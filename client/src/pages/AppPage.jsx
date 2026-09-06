import { useAuth } from '../context/AuthContext';

function AppPage() {
  const { user, logout } = useAuth();

  return (
    <div className="app-page">
      <header className="app-header">
        <span className="app-header-logo">ChatFlow</span>
        <button className="app-logout-btn" onClick={logout}>Log out</button>
      </header>
      <main className="app-main">
        <p>👋 Welcome, <strong>{user?.name}</strong>!</p>
        <p className="app-sub">You are logged in as <em>{user?.email}</em>.</p>
        <p className="app-note">Chat functionality coming in Day 2.</p>
      </main>
    </div>
  );
}

export default AppPage;
