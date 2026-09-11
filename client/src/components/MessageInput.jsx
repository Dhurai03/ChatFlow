import { useState, useRef, useEffect } from 'react';
import { MdEdit, MdClose } from 'react-icons/md';

function MessageInput({ onSend, onTyping, onStopTyping, disabled, editingMessage, onSaveEdit, onCancelEdit }) {
  const [text, setText] = useState('');
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  // When an editing message is set, pre-fill the textarea and focus
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text);
      setTimeout(() => {
        textareaRef.current?.focus();
        // Move cursor to end
        const len = editingMessage.text.length;
        textareaRef.current?.setSelectionRange(len, len);
      }, 0);
    } else {
      setText('');
    }
  }, [editingMessage]);

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);

    // Only emit typing events when NOT in edit mode
    if (!editingMessage) {
      if (onTyping && val.trim().length > 0) {
        onTyping();
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          if (onStopTyping) onStopTyping();
        }, 1500);
      } else if (val.trim().length === 0 && onStopTyping) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        onStopTyping();
      }
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (editingMessage) {
      // Save edit
      if (trimmed !== editingMessage.text) {
        onSaveEdit(editingMessage._id, trimmed);
      }
      onCancelEdit();
    } else {
      // Send new message
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (onStopTyping) onStopTyping();
      onSend(trimmed);
      setText('');
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape' && editingMessage) {
      onCancelEdit();
    }
  };

  const handleCancelEdit = () => {
    onCancelEdit();
    textareaRef.current?.focus();
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  return (
    <div className="message-input-area">
      {/* ── Edit bar (WhatsApp style) ── */}
      {editingMessage && (
        <div className="edit-bar">
          <MdEdit size={20} className="edit-bar-icon" />
          <div className="edit-bar-content">
            <span className="edit-bar-label">Editing message</span>
            <p className="edit-bar-preview">{editingMessage.text}</p>
          </div>
          <button className="edit-bar-cancel" onClick={handleCancelEdit} title="Cancel edit (Esc)">
            <MdClose size={20} />
          </button>
        </div>
      )}

      <div className="message-input-wrap">
        <textarea
          ref={textareaRef}
          className="message-input"
          placeholder={editingMessage ? 'Edit your message…' : 'Type a message…'}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKey}
          disabled={disabled}
          rows={1}
        />
        <button
          className={`send-btn ${editingMessage ? 'send-btn--edit' : ''}`}
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          title={editingMessage ? 'Save edit' : 'Send'}
        >
          {editingMessage ? '✓' : '➤'}
        </button>
      </div>
    </div>
  );
}

export default MessageInput;
