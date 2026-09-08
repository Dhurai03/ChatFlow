import { useState } from 'react';
import { searchUsers } from '../services/userService';
import Avatar from './Avatar';

function CreateGroupModal({ onClose, onCreateGroup }) {
  const [groupName, setGroupName] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]); // [{ _id, name, email, avatar }]
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = { current: null };

  const handleSearch = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchUsers(val);
        // Exclude already selected users
        setResults(data.filter((u) => !selected.find((s) => s._id === u._id)));
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 300);
  };

  const addUser = (u) => {
    if (!selected.find((s) => s._id === u._id)) {
      setSelected((prev) => [...prev, u]);
    }
    setQuery('');
    setResults([]);
  };

  const removeUser = (id) => setSelected((prev) => prev.filter((s) => s._id !== id));

  const handleCreate = async () => {
    if (!groupName.trim()) { setError('Group name is required.'); return; }
    if (selected.length < 2) { setError('Add at least 2 people to create a group.'); return; }
    setCreating(true);
    setError('');
    try {
      await onCreateGroup(groupName.trim(), selected.map((s) => s._id));
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create group. Try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">New Group Chat</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Group name */}
          <div className="profile-field">
            <label className="profile-label">Group Name *</label>
            <input
              className="profile-input"
              type="text"
              placeholder="e.g. Project Team, Weekend Plans…"
              value={groupName}
              maxLength={60}
              onChange={(e) => setGroupName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Add participants */}
          <div className="profile-field">
            <label className="profile-label">Add Members (min. 2)</label>
            <div className="user-search" style={{ position: 'relative' }}>
              <div className="user-search-input-wrap">
                <input
                  className="user-search-input"
                  type="text"
                  placeholder="Search users by name or email…"
                  value={query}
                  onChange={handleSearch}
                />
                {searching && <span className="search-loading" />}
              </div>
              {results.length > 0 && (
                <ul className="user-search-dropdown">
                  {results.map((u) => (
                    <li key={u._id} className="user-search-item" onClick={() => addUser(u)}>
                      <Avatar name={u.name} avatarUrl={u.avatar} size="sm" />
                      <div>
                        <p className="usearch-name">{u.name}</p>
                        <p className="usearch-email">{u.email}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Selected chips */}
          {selected.length > 0 && (
            <div className="group-chips">
              {selected.map((u) => (
                <span key={u._id} className="group-chip">
                  <Avatar name={u.name} avatarUrl={u.avatar} size="xs" />
                  <span className="group-chip-name">{u.name}</span>
                  <button className="group-chip-remove" onClick={() => removeUser(u._id)} title="Remove">✕</button>
                </span>
              ))}
            </div>
          )}

          {selected.length > 0 && (
            <p className="group-members-count">
              {selected.length} member{selected.length !== 1 ? 's' : ''} selected (+ you)
            </p>
          )}

          {error && <p className="profile-error">{error}</p>}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={creating}>Cancel</button>
          <button className="btn-primary" onClick={handleCreate} disabled={creating || selected.length < 2 || !groupName.trim()}>
            {creating ? 'Creating…' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateGroupModal;
