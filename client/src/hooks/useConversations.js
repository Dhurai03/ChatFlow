import { useState, useEffect, useCallback, useRef } from 'react';
import { getConversations, createConversation } from '../services/conversationService';

export function useConversations(socket, activeConvId, currentUserId) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const activeConvIdRef = useRef(activeConvId);
  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  const currentUserIdRef = useRef(currentUserId);
  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  const processedMessageIds = useRef(new Set());

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await getConversations();
      setConversations(data);
    } catch {
      setError('Unable to load conversations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const clearUnread = useCallback((convId) => {
    if (!convId) return;
    setConversations((prev) =>
      prev.map((c) =>
        String(c._id) === String(convId)
          ? { ...c, unreadCount: 0 }
          : c
      )
    );
  }, []);

  // When active conversation changes, reset its unread count
  useEffect(() => {
    if (activeConvId) {
      clearUnread(activeConvId);
    }
  }, [activeConvId, clearUnread]);

  // When a new message arrives via socket, move that conversation to top and update unread count
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      const msgId = message._id || message.messageId;
      if (msgId) {
        if (processedMessageIds.current.has(String(msgId))) {
          return;
        }
        processedMessageIds.current.add(String(msgId));
      }

      const senderId = message.sender?._id || message.sender;
      const myId = currentUserIdRef.current;
      const isFromMe = myId && String(senderId) === String(myId);
      const isCurrentOpen = String(message.conversationId) === String(activeConvIdRef.current);

      setConversations((prev) => {
        const idx = prev.findIndex((c) => String(c._id) === String(message.conversationId));
        if (idx === -1) {
          // Unknown conversation — reload list to pick it up with unread count
          load();
          return prev;
        }

        const existing = prev[idx];
        const shouldIncrement = !isFromMe && !isCurrentOpen;
        const newUnreadCount = shouldIncrement
          ? (existing.unreadCount || 0) + 1
          : isCurrentOpen
          ? 0
          : existing.unreadCount || 0;

        const updated = {
          ...existing,
          lastMessage: message.text,
          lastMessageAt: message.createdAt,
          unreadCount: newUnreadCount,
        };

        const rest = prev.filter((_, i) => i !== idx);
        return [updated, ...rest];
      });
    };

    socket.on('message:new', handleNewMessage);
    return () => socket.off('message:new', handleNewMessage);
  }, [socket, load]);

  const startConversation = useCallback(async (participantId) => {
    const conv = await createConversation(participantId);
    setConversations((prev) => {
      const exists = prev.find((c) => String(c._id) === String(conv._id));
      if (exists) return prev;
      return [conv, ...prev];
    });
    return conv;
  }, []);

  return { conversations, loading, error, startConversation, clearUnread, reload: load };
}
