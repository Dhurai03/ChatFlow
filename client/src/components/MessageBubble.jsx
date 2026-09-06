function StatusTick({ status }) {
  if (status === 'read') return <span className="tick tick-read" title="Read">✓✓</span>;
  if (status === 'delivered') return <span className="tick tick-delivered" title="Delivered">✓✓</span>;
  return <span className="tick tick-sent" title="Sent">✓</span>;
}

function MessageBubble({ message, isMine }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`bubble-wrap ${isMine ? 'bubble-mine' : 'bubble-theirs'}`}>
      <div className={`bubble ${isMine ? 'bubble--out' : 'bubble--in'}`}>
        <p className="bubble-text">{message.text}</p>
        <div className="bubble-meta">
          <span className="bubble-time">{time}</span>
          {isMine && <StatusTick status={message.status} />}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
