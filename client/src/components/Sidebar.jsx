import UserSearch from './UserSearch';
import ConversationList from './ConversationList';
import { useAuth } from '../context/AuthContext';

function Sidebar({ conversations, loading, error, activeId, onSelectConv, onSelectUser }) {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <span className="brand-logo">CF</span>
          <span className="brand-name">ChatFlow</span>
        </div>
        <div className="sidebar-user">
          <div className="avatar avatar-sm sidebar-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <button className="logout-btn" onClick={logout} title="Log out">
            ↩
          </button>
        </div>
      </div>

      <div className="sidebar-search">
        <UserSearch onSelectUser={onSelectUser} />
      </div>

      <div className="sidebar-label">Messages</div>

      <div className="sidebar-list">
        <ConversationList
          conversations={conversations}
          loading={loading}
          error={error}
          currentUserId={user?.id || user?._id}
          activeId={activeId}
          onSelect={onSelectConv}
        />
      </div>
    </aside>
  );
}

export default Sidebar;
