import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import LoadingSpinner from './LoadingSpinner';

function MessageList({ messages, loading, error, currentUserId, hasMore, onLoadMore, isTyping, isGroup, onEdit, onDelete }) {
  const bottomRef = useRef(null);
  const listRef = useRef(null);
  const prevScrollHeight = useRef(0);
  const prevMessageCount = useRef(0);

  useEffect(() => {
    const count = messages.length;
    if (count > prevMessageCount.current || isTyping) {
      const el = listRef.current;
      if (el) {
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
        if (prevMessageCount.current === 0 || nearBottom) {
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
    prevMessageCount.current = count;
  }, [messages, isTyping]);

  useEffect(() => {
    if (loading && listRef.current) {
      prevScrollHeight.current = listRef.current.scrollHeight;
    } else if (!loading && listRef.current && prevScrollHeight.current) {
      const diff = listRef.current.scrollHeight - prevScrollHeight.current;
      listRef.current.scrollTop = diff;
      prevScrollHeight.current = 0;
    }
  }, [loading]);

  if (loading && messages.length === 0) {
    return <LoadingSpinner text="Loading messages..." />;
  }

  // Helper: normalise a Date to a "YYYY-M-D" key for day comparison
  const toDayKey = (d) =>
    d ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : null;

  // Helper: compute the label shown on the date separator pill
  const getDateLabel = (date) => {
    const today = new Date();
    const diffDays = Math.floor(
      (new Date(today.getFullYear(), today.getMonth(), today.getDate()) -
       new Date(date.getFullYear(), date.getMonth(), date.getDate())) /
      86400000
    );
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString(undefined, { weekday: 'long' });
    return date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'long',
      year: diffDays > 365 ? 'numeric' : undefined,
    });
  };

  return (
    <div className="message-list" ref={listRef}>
      {hasMore && (
        <div className="load-more-wrap">
          <button className="load-more-btn" onClick={onLoadMore} disabled={loading}>
            {loading ? 'Loading…' : 'Load older messages'}
          </button>
        </div>
      )}

      {error && <p className="msg-error">{error}</p>}

      {messages.length === 0 && !loading && (
        <div className="msg-empty">
          <p>No messages yet. Say hello! 👋</p>
        </div>
      )}

      {messages.map((msg, idx) => {
        const senderId = msg.sender?._id || msg.sender;
        const isMine = String(senderId) === String(currentUserId);

        const msgDate = msg.createdAt ? new Date(msg.createdAt) : null;
        const prevMsg = idx > 0 ? messages[idx - 1] : null;
        const prevDate = prevMsg?.createdAt ? new Date(prevMsg.createdAt) : null;

        // Show separator when the calendar day changes (or for the very first message)
        const showSeparator = msgDate && toDayKey(msgDate) !== toDayKey(prevDate);

        return (
          <div key={msg._id}>
            {showSeparator && msgDate && (
              <div className="date-separator">
                <span className="date-separator-label">{getDateLabel(msgDate)}</span>
              </div>
            )}
            <MessageBubble
              message={msg}
              isMine={isMine}
              isGroup={isGroup}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        );
      })}

      {isTyping && (
        <div className="message-row message-received">
          <div className="message-bubble typing-bubble">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;
