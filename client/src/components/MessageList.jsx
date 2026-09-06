import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import LoadingSpinner from './LoadingSpinner';

function MessageList({ messages, loading, error, currentUserId, hasMore, onLoadMore, isTyping }) {
  const bottomRef = useRef(null);
  const listRef = useRef(null);
  const prevScrollHeight = useRef(0);
  const prevMessageCount = useRef(0);

  // Auto-scroll to bottom ONLY when a new message is appended (count increases) or typing starts
  useEffect(() => {
    const count = messages.length;
    if (count > prevMessageCount.current || isTyping) {
      // Only scroll if user is near the bottom (within 200px) or count was 0
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

  // Preserve scroll position when prepending older messages
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

      {messages.map((msg) => {
        const senderId = msg.sender?._id || msg.sender;
        const isMine = String(senderId) === String(currentUserId);
        return (
          <MessageBubble
            key={msg._id}
            message={msg}
            isMine={isMine}
          />
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
