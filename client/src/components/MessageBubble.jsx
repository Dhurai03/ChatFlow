import { useState, useRef, useEffect } from 'react';
import { VscCheck, VscCheckAll } from 'react-icons/vsc';
import { MdEdit, MdDeleteOutline, MdKeyboardArrowDown } from 'react-icons/md';
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

// ── Delete confirmation modal ─────────────────────────────────────────────────
function DeleteModal({ onDeleteForEveryone, onDeleteForMe, onCancel }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
        <p className="delete-modal-title">Delete message?</p>
        <div className="delete-modal-actions">
          <button className="delete-modal-btn delete-modal-btn--everyone" onClick={onDeleteForEveryone}>
            <MdDeleteOutline size={18} />
            Delete for Everyone
          </button>
          <button className="delete-modal-btn delete-modal-btn--me" onClick={onDeleteForMe}>
            Delete for Me
          </button>
          <button className="delete-modal-btn delete-modal-btn--cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, isMine, isGroup, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const menuRef = useRef(null);

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const senderName = message.sender?.name || '';
  const senderAvatar = message.sender?.avatar || '';
  const isDeleted = message.isDeleted;

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleEditClick = () => {
    setMenuOpen(false);
    onEdit(message); // pass full message object so parent can populate edit bar
  };

  const handleDeleteClick = () => {
    setMenuOpen(false);
    setShowDeleteModal(true);
  };

  const handleDeleteForEveryone = () => {
    setShowDeleteModal(false);
    onDelete(message._id);
  };

  const handleDeleteForMe = () => {
    // Same action for now — keeps parity with WhatsApp UX structure
    setShowDeleteModal(false);
    onDelete(message._id);
  };

  return (
    <>
      <div className={`bubble-wrap ${isMine ? 'bubble-mine' : 'bubble-theirs'}`}>
        {/* Group chat: sender info */}
        {isGroup && !isMine && (
          <div className="bubble-sender-row">
            <Avatar name={senderName} avatarUrl={senderAvatar} size="xs" />
            <span className="bubble-sender-name">{senderName}</span>
          </div>
        )}

        <div className="bubble-row">
          <div className={`bubble ${isMine ? 'bubble--out' : 'bubble--in'} ${isDeleted ? 'bubble--deleted' : ''}`}>
            {/* ── Chevron context menu trigger ── */}
            {isMine && !isDeleted && (
              <div className="bubble-menu-wrap" ref={menuRef}>
                <button
                  className="bubble-chevron"
                  onClick={() => setMenuOpen((v) => !v)}
                  title="Message options"
                >
                  <MdKeyboardArrowDown size={18} />
                </button>

                {menuOpen && (
                  <div className={`bubble-context-menu ${isMine ? 'bubble-context-menu--right' : 'bubble-context-menu--left'}`}>
                    <button className="ctx-item" onClick={handleEditClick}>
                      <MdEdit size={16} />
                      <span>Edit</span>
                    </button>
                    <button className="ctx-item ctx-item--danger" onClick={handleDeleteClick}>
                      <MdDeleteOutline size={16} />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Message content ── */}
            <p className={`bubble-text ${isDeleted ? 'bubble-text--deleted' : ''}`}>
              {isDeleted ? '🚫 This message was deleted' : message.text}
            </p>

            {/* ── Time + ticks ── */}
            <div className="bubble-meta">
              {message.isEdited && !isDeleted && (
                <span className="bubble-edited-tag">edited</span>
              )}
              <span className="bubble-time">{time}</span>
              {isMine && !isDeleted && <StatusTick status={message.status} />}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <DeleteModal
          onDeleteForEveryone={handleDeleteForEveryone}
          onDeleteForMe={handleDeleteForMe}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}

export default MessageBubble;