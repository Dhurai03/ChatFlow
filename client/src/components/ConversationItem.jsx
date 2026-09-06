function ConversationItem({ conversation, currentUserId, isActive, onClick }) {
  const other = conversation.participants?.find(
    (p) => String(p._id) !== String(currentUserId)
  );

  if (!other) return null;

  const initials = other.name.charAt(0).toUpperCase();
  const preview = conversation.lastMessage || 'No messages yet';
  const time = conversation.lastMessageAt
    ? new Date(conversation.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <li className={`conv-item ${isActive ? 'conv-item--active' : ''}`} onClick={onClick}>
      <div className="avatar">{initials}</div>
      <div className="conv-item-body">
        <div className="conv-item-top">
          <span className="conv-item-name">{other.name}</span>
          <span className="conv-item-time">{time}</span>
        </div>
        <p className="conv-item-preview">{preview}</p>
      </div>
    </li>
  );
}

export default ConversationItem;
