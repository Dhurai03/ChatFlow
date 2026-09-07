import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useConversations } from '../hooks/useConversations';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import EmptyChat from './EmptyChat';

function ChatLayout() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [activeConvId, setActiveConvId] = useState(null);
  const [showChat, setShowChat] = useState(false); 

  const currentUserId = user?.id || user?._id;
  const { conversations, loading, error, startConversation, clearUnread } = useConversations(
    socket,
    activeConvId,
    currentUserId
  );

  const activeConv = conversations.find((c) => c._id === activeConvId) || null;

  const handleSelectConv = (conv) => {
    setActiveConvId(conv._id);
    clearUnread(conv._id);
    setShowChat(true);
  };

  const handleSelectUser = async (selectedUser) => {
    try {
      const conv = await startConversation(selectedUser._id);
      setActiveConvId(conv._id);
      clearUnread(conv._id);
      setShowChat(true);
    } catch {
      // ignore
    }
  };

  const handleBack = () => {
    setShowChat(false);
    setActiveConvId(null);
  };

  return (
    <div className="chat-layout">
      <div className={`chat-sidebar ${showChat ? 'sidebar-hidden' : ''}`}>
        <Sidebar
          conversations={conversations}
          loading={loading}
          error={error}
          activeId={activeConvId}
          onSelectConv={handleSelectConv}
          onSelectUser={handleSelectUser}
        />
      </div>

      <div className={`chat-main ${!showChat ? 'main-hidden' : ''}`}>
        {activeConv ? (
          <ChatWindow key={activeConv._id} conversation={activeConv} onBack={handleBack} />
        ) : (
          <EmptyChat />
        )}
      </div>
    </div>
  );
}

export default ChatLayout;
