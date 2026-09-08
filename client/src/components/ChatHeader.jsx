import Avatar from './Avatar';

function ChatHeader({ conversation, otherUser, isOnline, isTyping, onBack }) {
  const isGroup = conversation?.isGroup;

  const participantCount = conversation?.participants?.length || 0;
  const groupName = conversation?.name || 'Group';

  if (isGroup) {
    return (
      <div className="chat-header">
        <button className="chat-back-btn" onClick={onBack} title="Back">←</button>
        {/* Stacked mini-avatars for group */}
        <div className="chat-header-group-avatar">
          {conversation?.participants?.slice(0, 3).map((p) => (
            <Avatar key={p._id} name={p.name} avatarUrl={p.avatar} size="xs" className="stacked-mini-av" />
          ))}
        </div>
        <div className="chat-header-info">
          <p className="chat-header-name">👥 {groupName}</p>
          <p className="chat-header-status status-group">
            {isTyping ? 'Someone is typing…' : `${participantCount} members`}
          </p>
        </div>
      </div>
    );
  }

  // 1-to-1
  const initials = otherUser?.name?.charAt(0).toUpperCase() || '?';

  return (
    <div className="chat-header">
      <button className="chat-back-btn" onClick={onBack} title="Back">←</button>
      <Avatar name={otherUser?.name} avatarUrl={otherUser?.avatar} size="md" showOnline isOnline={isOnline} />
      <div className="chat-header-info">
        <p className="chat-header-name">{otherUser?.name}</p>
        <p className={`chat-header-status ${isTyping ? 'status-typing' : isOnline ? 'status-online' : 'status-offline'}`}>
          {isTyping ? 'typing…' : isOnline ? 'Online' : 'Offline'}
        </p>
      </div>
    </div>
  );
}

export default ChatHeader;
