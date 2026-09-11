import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useMessages } from '../hooks/useMessages';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

function ChatWindow({ conversation, onBack }) {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [isTyping, setIsTyping] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const typingTimerRef = useRef(null);

  const currentUserId = user?.id || user?._id;
  const isGroup = conversation?.isGroup;

  // For 1-to-1, find the other participant
  const otherUser = !isGroup
    ? conversation?.participants?.find((p) => String(p._id) !== String(currentUserId))
    : null;

  const isOnline = otherUser ? onlineUsers.has(String(otherUser._id)) : false;

  const { messages, loading, error, sending, send, edit, remove, loadMore, hasMore } = useMessages(
    conversation?._id,
    user,
    otherUser,
    socket,
    isGroup
  );

  // Clear editing state when conversation changes
  useEffect(() => {
    setEditingMessage(null);
  }, [conversation?._id]);

  // ─── Typing indicators ──────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !conversation?._id) return;

    const handleUserTyping = (data) => {
      if (
        data.conversationId === conversation._id &&
        String(data.userId) !== String(currentUserId)
      ) {
        setIsTyping(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setIsTyping(false), 4000);
      }
    };

    const handleUserStopTyping = (data) => {
      if (
        data.conversationId === conversation._id &&
        String(data.userId) !== String(currentUserId)
      ) {
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        setIsTyping(false);
      }
    };

    socket.on('user:typing', handleUserTyping);
    socket.on('user:stop_typing', handleUserStopTyping);

    return () => {
      socket.off('user:typing', handleUserTyping);
      socket.off('user:stop_typing', handleUserStopTyping);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [socket, conversation?._id, currentUserId]);

  useEffect(() => {
    setIsTyping(false);
  }, [conversation?._id]);

  const handleStartTyping = () => {
    if (socket && socket.connected && conversation?._id) {
      socket.emit('typing:start', {
        conversationId: conversation._id,
        receiverId: otherUser?._id,
      });
    }
  };

  const handleStopTyping = () => {
    if (socket && socket.connected && conversation?._id) {
      socket.emit('typing:stop', {
        conversationId: conversation._id,
        receiverId: otherUser?._id,
      });
    }
  };

  // ─── Edit handlers ───────────────────────────────────────────────────────
  // MessageBubble calls this with the full message object
  const handleStartEdit = (message) => {
    setEditingMessage(message);
  };

  // MessageInput calls this with (id, newText)
  const handleSaveEdit = (messageId, newText) => {
    edit(messageId, newText);
    setEditingMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
  };

  return (
    <div className="chat-window">
      <ChatHeader
        conversation={conversation}
        otherUser={otherUser}
        isOnline={isOnline}
        isTyping={isTyping}
        onBack={onBack}
      />
      <MessageList
        messages={messages}
        loading={loading}
        error={error}
        currentUserId={currentUserId}
        hasMore={hasMore}
        onLoadMore={loadMore}
        isTyping={isTyping}
        isGroup={isGroup}
        onEdit={handleStartEdit}
        onDelete={remove}
      />
      <MessageInput
        onSend={send}
        onTyping={handleStartTyping}
        onStopTyping={handleStopTyping}
        disabled={sending}
        editingMessage={editingMessage}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
      />
    </div>
  );
}

export default ChatWindow;
