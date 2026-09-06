import ConversationItem from './ConversationItem';
import LoadingSpinner from './LoadingSpinner';

function ConversationList({ conversations, loading, error, currentUserId, activeId, onSelect }) {
  if (loading) return <LoadingSpinner text="Loading chats..." />;
  if (error) return <p className="list-error">{error}</p>;

  if (conversations.length === 0) {
    return (
      <div className="list-empty">
        <p>No conversations yet.</p>
        <p>Search for someone to start chatting!</p>
      </div>
    );
  }

  return (
    <ul className="conv-list">
      {conversations.map((conv) => (
        <ConversationItem
          key={conv._id}
          conversation={conv}
          currentUserId={currentUserId}
          isActive={conv._id === activeId}
          onClick={() => onSelect(conv)}
        />
      ))}
    </ul>
  );
}

export default ConversationList;
