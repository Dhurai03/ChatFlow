function ChatHeader({ otherUser, isOnline, isTyping, onBack }) {
  const initials = otherUser?.name?.charAt(0).toUpperCase() || '?';

  return (
    <div className="chat-header">
      <button className="chat-back-btn" onClick={onBack} title="Back">
        ←
      </button>
      <div className="avatar">{initials}</div>
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
