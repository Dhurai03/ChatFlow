import { useState } from 'react';
import { VscCheck, VscCheckAll } from 'react-icons/vsc';
import { MdEdit, MdDeleteOutline, MdWarning } from 'react-icons/md';
import Avatar from './Avatar';

function StatusTick({ status }) {
  if (status === 'read') {
    return <VscCheckAll className="tick tick-read" title="Read" />;
  }
  if (status === 'delivered') {
    return <VscCheckAll className="tick tick-delivered" title="Delivered" />;
  }
  return <VscCheck className="tick tick-sent" title="Sent" />;
}

function MessageBubble({ message, isMine, isGroup, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const senderName = message.sender?.name || '';
  const senderAvatar = message.sender?.avatar || '';

  const handleEditSave = () => {
    if (editText.trim() && editText.trim() !== message.text) {
      onEdit(message._id, editText.trim());
    }
    setEditing(false);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSave();
    }
    if (e.key === 'Escape') {
      setEditText(message.text);
      setEditing(false);
    }
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(message._id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const isDeleted = message.isDeleted;

  return (
    <div
      className={`bubble-wrap ${isMine ? 'bubble-mine' : 'bubble-theirs'}`}
      onMouseEnter={() => !isDeleted && setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false); }}
    >
      {/* For group chats: show sender avatar and name above theirs messages */}
      {isGroup && !isMine && (
        <div className="bubble-sender-row">
          <Avatar name={senderName} avatarUrl={senderAvatar} size="xs" />
          <span className="bubble-sender-name">{senderName}</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', flexDirection: isMine ? 'row-reverse' : 'row', width: '100%' }}>
        {/* Hover actions (edit/delete — only for my non-deleted messages) */}
        {isMine && !isDeleted && hovered && !editing && (
          <div className="bubble-actions">
            <button
              className="bubble-action-btn"
              onClick={() => { setEditing(true); setEditText(message.text); }}
              title="Edit message"
            >
            <MdEdit size={18} />
</button>
            <button
              className={`bubble-action-btn ${confirmDelete ? 'bubble-action-btn--danger' : ''}`}
              onClick={handleDelete}
              title={confirmDelete ? 'Click again to confirm delete' : 'Delete message'}
            >
              {confirmDelete ? (
  <>
    <MdWarning size={18} />
    <span>Confirm</span>
  </>
) : (
  <MdDeleteOutline size={19} />
)}
            </button>
          </div>
        )}

        <div className={`bubble ${isMine ? 'bubble--out' : 'bubble--in'} ${isDeleted ? 'bubble--deleted' : ''}`}>
          {editing ? (
            /* ── Inline edit mode ── */
            <div className="bubble-edit-wrap">
              <textarea
                className="bubble-edit-input"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleEditKeyDown}
                autoFocus
                rows={2}
                maxLength={2000}
              />
              <div className="bubble-edit-actions">
                <button className="bubble-edit-btn bubble-edit-btn--save" onClick={handleEditSave}>Save</button>
                <button className="bubble-edit-btn bubble-edit-btn--cancel" onClick={() => { setEditText(message.text); setEditing(false); }}>Cancel</button>
              </div>
              <p className="bubble-edit-hint">Enter to save · Esc to cancel</p>
            </div>
          ) : (
            <>
              <p className={`bubble-text ${isDeleted ? 'bubble-text--deleted' : ''}`}>
                {isDeleted ? '🚫 This message was deleted' : message.text}
              </p>

              <div className="bubble-meta">
                {message.isEdited && !isDeleted && (
                  <span className="bubble-edited-tag">edited</span>
                )}
                <span className="bubble-time">{time}</span>
                {isMine && !isDeleted && <StatusTick status={message.status} />}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;