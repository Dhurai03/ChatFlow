import Avatar from './Avatar';

function GroupAvatarStack({ participants, currentUserId }) {
  const others = participants.filter((p) => String(p._id) !== String(currentUserId)).slice(0, 3);
  return (
    <div className="group-avatar-stack">
      {others.map((p, i) => (
        <span key={p._id} className="group-avatar-stack-item" style={{ zIndex: others.length - i }}>
          <Avatar name={p.name} avatarUrl={p.avatar} size="sm" />
        </span>
      ))}
    </div>
  );
}

function ConversationItem({ conversation, currentUserId, isActive, onClick }) {
  const isGroup = conversation.isGroup;

  // 1-to-1: find the other participant
  const other = !isGroup
    ? conversation.participants?.find((p) => String(p._id) !== String(currentUserId))
    : null;

  if (!isGroup && !other) return null;

  const displayName = isGroup ? conversation.name : other.name;
  const preview = conversation.lastMessage || 'No messages yet';
  const time = conversation.lastMessageAt
    ? new Date(conversation.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  const unreadCount = conversation.unreadCount || 0;

  return (
    <li
      className={`conv-item ${isActive ? 'conv-item--active' : ''}`}
      onClick={onClick}
    >
      {/* Avatar */}
      {isGroup ? (
        <div className="conv-group-avatar">
          <GroupAvatarStack
            participants={conversation.participants || []}
            currentUserId={currentUserId}
          />
        </div>
      ) : (
        <Avatar name={other.name} avatarUrl={other.avatar} size="md" />
      )}

      <div className="conv-item-body">
        <div className="conv-item-top">
          <span className="conv-item-name">
            {isGroup && <span className="group-icon-inline" title="Group">👥 </span>}
            {displayName}
          </span>
          <span className="conv-item-time">{time}</span>
        </div>
        <div className="conv-item-bottom">
          <p className="conv-item-preview">{preview}</p>
          {unreadCount > 0 && <span className="conv-item-badge">{unreadCount}</span>}
        </div>
      </div>
    </li>
  );
}

export default ConversationItem;
