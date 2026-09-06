import { useState, useEffect, useCallback, useRef } from 'react';
import { getMessages, sendMessage, markConversationRead } from '../services/messageService';

export function useMessages(conversationId, currentUser, otherUser, socket) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sending, setSending] = useState(false);

  // Track IDs to prevent duplicates
  const messageIds = useRef(new Set());
  // Track latest conversationId for async callbacks
  const convIdRef = useRef(conversationId);
  convIdRef.current = conversationId;

  const addMessage = useCallback((msg) => {
    if (messageIds.current.has(String(msg._id))) return;
    messageIds.current.add(String(msg._id));
    setMessages((prev) => [...prev, msg]);
  }, []);

  const load = useCallback(
    async (pageNum = 1) => {
      if (!conversationId) return;
      setLoading(true);
      setError('');
      try {
        const data = await getMessages(conversationId, pageNum);
        setTotalPages(data.totalPages || 1);
        if (pageNum === 1) {
          messageIds.current = new Set(data.messages.map((m) => String(m._id)));
          setMessages(data.messages);
        } else {
          const newMsgs = data.messages.filter((m) => !messageIds.current.has(String(m._id)));
          newMsgs.forEach((m) => messageIds.current.add(String(m._id)));
          setMessages((prev) => [...newMsgs, ...prev]);
        }
      } catch (err) {
        setError('Unable to load messages.');
      } finally {
        setLoading(false);
      }
    },
    [conversationId]
  );

  // Reset and load when conversation changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setPage(1);
      setTotalPages(1);
      messageIds.current = new Set();
      return;
    }
    setPage(1);
    setMessages([]);
    setTotalPages(1);
    messageIds.current = new Set();
    load(1);

    markConversationRead(conversationId).catch(() => {});
  }, [conversationId, load]);

  // Join/leave socket rooms — re-runs when socket or conversationId changes
  useEffect(() => {
    if (!socket || !conversationId) return;
    socket.emit('join:conversation', conversationId);

    // Notify other user we read the messages
    if (otherUser) {
      socket.emit('messages:read', {
        conversationId,
        senderId: otherUser._id,
      });
    }

    return () => {
      if (socket.connected) {
        socket.emit('leave:conversation', conversationId);
      }
    };
  }, [socket, conversationId, otherUser]);

  // Listen for incoming new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      // Only process messages for the currently active conversation
      if (String(msg.conversationId) !== String(convIdRef.current)) return;

      addMessage(msg);

      const myId = currentUser?.id || currentUser?._id;
      const senderId = msg.sender?._id || msg.sender;

      // If this message was received (not sent by me), acknowledge delivery
      if (String(senderId) !== String(myId)) {
        socket.emit('message:delivered', {
          messageId: msg._id,
          senderId: senderId,
        });
        // Mark as read since conversation is open
        markConversationRead(convIdRef.current).catch(() => {});
        if (otherUser) {
          socket.emit('messages:read', {
            conversationId: convIdRef.current,
            senderId: otherUser._id,
          });
        }
      }
    };

    socket.on('message:new', handleNewMessage);
    return () => socket.off('message:new', handleNewMessage);
  }, [socket, currentUser, otherUser, addMessage]);

  // Listen for message status updates
  useEffect(() => {
    if (!socket) return;

    const handleStatus = ({ messageId, status }) => {
      setMessages((prev) =>
        prev.map((m) => (String(m._id) === String(messageId) ? { ...m, status } : m))
      );
    };

    const handleRead = ({ conversationId: cid }) => {
      if (String(cid) !== String(convIdRef.current)) return;
      const myId = currentUser?.id || currentUser?._id;
      setMessages((prev) =>
        prev.map((m) => {
          const senderId = m.sender?._id || m.sender;
          return String(senderId) === String(myId) ? { ...m, status: 'read' } : m;
        })
      );
    };

    socket.on('message:status', handleStatus);
    socket.on('messages:read', handleRead);
    return () => {
      socket.off('message:status', handleStatus);
      socket.off('messages:read', handleRead);
    };
  }, [socket, currentUser]);

  const send = useCallback(
    async (text) => {
      if (!conversationId || !otherUser) return;
      const trimmed = text.trim();
      if (!trimmed) return;

      setSending(true);
      try {
        const msg = await sendMessage(conversationId, otherUser._id, trimmed);
        // Add to local state immediately (REST response)
        addMessage(msg);

        // Emit via socket so the other user gets it in real-time
        if (socket && socket.connected) {
          socket.emit('message:send', {
            messageId: msg._id,
            conversationId,
            receiverId: otherUser._id,
            text: msg.text,
          });
        }
      } catch {
        setError('Unable to send message. Please try again.');
      } finally {
        setSending(false);
      }
    },
    [conversationId, otherUser, socket, addMessage]
  );

  const loadMore = useCallback(() => {
    if (page < totalPages && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      load(nextPage);
    }
  }, [page, totalPages, loading, load]);

  return { messages, loading, error, sending, send, loadMore, hasMore: page < totalPages };
}
