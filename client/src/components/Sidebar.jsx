import { useState } from 'react';
import UserSearch from './UserSearch';
import ConversationList from './ConversationList';
import ProfileModal from './ProfileModal';
import CreateGroupModal from './CreateGroupModal';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';

function Sidebar({ conversations, loading, error, activeId, onSelectConv, onSelectUser, onCreateGroup }) {
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logout();
    }
  };

  return (
    <aside className="sidebar">
      {/* ── Header ── */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <span className="brand-logo">CF</span>
          <span className="brand-name">ChatFlow</span>
        </div>
        <div className="sidebar-user">
          {/* Profile avatar — clickable */}
          <button
            className="sidebar-avatar-btn"
            onClick={() => setShowProfile(true)}
            title={`${user?.name} — Edit profile`}
          >
            <Avatar name={user?.name} avatarUrl={user?.avatar} size="sm" />
          </button>
          {/* Logout */}
          <button
            className="logout-btn"
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="sidebar-search">
        <UserSearch onSelectUser={onSelectUser} />
      </div>

      {/* ── Section label + New Group button ── */}
      <div className="sidebar-section-row">
        <span className="sidebar-label">Messages</span>
        <button
          className="new-group-btn"
          onClick={() => setShowCreateGroup(true)}
          title="New Group Chat"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            <line x1="19" y1="8" x2="19" y2="14"/>
            <line x1="22" y1="11" x2="16" y2="11"/>
          </svg>
          <span>New Group</span>
        </button>
      </div>

      {/* ── Conversation list ── */}
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

      {/* ── Modals ── */}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onCreateGroup={onCreateGroup}
        />
      )}
    </aside>
  );
}

export default Sidebar;
