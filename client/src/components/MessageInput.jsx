import { useState, useRef, useEffect } from 'react';

function MessageInput({ onSend, onTyping, onStopTyping, disabled }) {
  const [text, setText] = useState('');
  const typingTimeoutRef = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);

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
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (onStopTyping) onStopTyping();
    onSend(trimmed);
    setText('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  return (
    <div className="message-input-wrap">
      <textarea
        className="message-input"
        placeholder="Type a message…"
        value={text}
        onChange={handleChange}
        onKeyDown={handleKey}
        disabled={disabled}
        rows={1}
      />
      <button
        className="send-btn"
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        title="Send"
      >
        ➤
      </button>
    </div>
  );
}

export default MessageInput;
