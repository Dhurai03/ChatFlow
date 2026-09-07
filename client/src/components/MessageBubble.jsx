import { VscCheck, VscCheckAll } from 'react-icons/vsc';

function StatusTick({ status }) {
  if (status === 'read') {
    return (
      <VscCheckAll
        className="tick tick-read"
        title="Read"
      />
    );
  }

  if (status === 'delivered') {
    return (
      <VscCheckAll
        className="tick tick-delivered"
        title="Delivered"
      />
    );
  }

  return (
    <VscCheck
      className="tick tick-sent"
      title="Sent"
    />
  );
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