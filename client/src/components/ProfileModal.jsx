import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/userService';
import Avatar from './Avatar';

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/thumbs/svg?seed=1&radius=50',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=2&radius=50',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=3&radius=50',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=4&radius=50',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=5&radius=50',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=6&radius=50',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=7&radius=50',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=8&radius=50',
];

function ProfileModal({ onClose }) {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [statusMessage, setStatusMessage] = useState(user?.statusMessage || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [customUrl, setCustomUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
    setBio(user?.bio || '');
    setStatusMessage(user?.statusMessage || '');
    setAvatar(user?.avatar || '');
  }, [user]);

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const updated = await updateProfile({ name, bio, statusMessage, avatar });
      updateUser(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save profile. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const applyCustomUrl = () => {
    if (customUrl.trim()) setAvatar(customUrl.trim());
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card profile-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Profile</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="profile-modal-body">
          {/* Avatar preview */}
          <div className="profile-avatar-preview">
            <Avatar name={name} avatarUrl={avatar} size="xl" />
            <p className="profile-avatar-hint">Choose an avatar below or paste a URL</p>
          </div>

          {/* Preset avatars */}
          <div className="preset-avatars">
            {PRESET_AVATARS.map((url, i) => (
              <button
                key={i}
                className={`preset-avatar-btn ${avatar === url ? 'preset-avatar-btn--active' : ''}`}
                onClick={() => setAvatar(url)}
                title={`Avatar option ${i + 1}`}
              >
                <img src={url} alt={`Preset ${i + 1}`} />
              </button>
            ))}
            <button
              className={`preset-avatar-btn ${!avatar ? 'preset-avatar-btn--active' : ''}`}
              onClick={() => setAvatar('')}
              title="Use initials"
            >
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>Aa</span>
            </button>
          </div>

         

          {/* Name */}
          <div className="profile-field">
            <label className="profile-label">Display Name *</label>
            <input
              className="profile-input"
              type="text"
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          {/* Bio */}
          <div className="profile-field">
            <label className="profile-label">Bio <span className="profile-label-counter">{bio.length}/160</span></label>
            <textarea
              className="profile-input profile-textarea"
              value={bio}
              maxLength={160}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others a bit about yourself…"
              rows={3}
            />
          </div>

          {/* Status */}
          <div className="profile-field">
            <label className="profile-label">Status <span className="profile-label-counter">{statusMessage.length}/100</span></label>
            <input
              className="profile-input"
              type="text"
              value={statusMessage}
              maxLength={100}
              onChange={(e) => setStatusMessage(e.target.value)}
              placeholder="What's on your mind?"
            />
          </div>

          {error && <p className="profile-error">{error}</p>}
          {success && <p className="profile-success">✓ Profile saved!</p>}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;
