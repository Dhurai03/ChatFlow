import { useState, useEffect, useCallback, useRef } from 'react';
import { getConversations, createConversation } from '../services/conversationService';

export function useConversations(socket) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  // When a new message arrives via socket, move that conversation to top
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => String(c._id) === String(message.conversationId));
        if (idx === -1) {
          // Unknown conversation — reload list to pick it up
          load();
          return prev;
        }
        const updated = {
          ...prev[idx],
          lastMessage: message.text,
          lastMessageAt: message.createdAt,
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

  return { conversations, loading, error, startConversation, reload: load };
}
