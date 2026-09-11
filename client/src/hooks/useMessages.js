import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getMessages,
  sendMessage,
  markConversationRead,
  editMessage as apiEditMessage,
  deleteMessage as apiDeleteMessage,
} from '../services/messageService';

export function useMessages(conversationId, currentUser, otherUser, socket, isGroup = false) {
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

  const updateMessage = useCallback((updatedMsg) => {
    setMessages((prev) =>
      prev.map((m) => (String(m._id) === String(updatedMsg._id) ? { ...m, ...updatedMsg } : m))
    );
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
      } catch {
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

    // Feature 5: persist read on open
    markConversationRead(conversationId).catch(() => {});
  }, [conversationId, load]);

  // Join/leave socket rooms
  useEffect(() => {
    if (!socket || !conversationId) return;
    socket.emit('join:conversation', conversationId);

    // Feature 5: notify the other user (1-to-1) that we read
    if (otherUser && !isGroup) {
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
  }, [socket, conversationId, otherUser, isGroup]);

  // ─── Incoming new messages ───────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (String(msg.conversationId) !== String(convIdRef.current)) return;

      addMessage(msg);

      const myId = currentUser?.id || currentUser?._id;
      const senderId = msg.sender?._id || msg.sender;

      // If received (not mine), mark as read since the conversation is open
      if (String(senderId) !== String(myId)) {
        // Mark as read (stronger than delivered — no need to also emit message:delivered)
        markConversationRead(convIdRef.current).catch(() => {});
        socket.emit('messages:read', {
          conversationId: convIdRef.current,
          senderId: senderId,
        });
      }
    };

    socket.on('message:new', handleNewMessage);
    return () => socket.off('message:new', handleNewMessage);
  }, [socket, currentUser, addMessage, isGroup]);

  // ─── Message status updates (1-to-1 delivered/read ticks) ───────────
  useEffect(() => {
    if (!socket) return;

    const handleStatus = ({ messageId, status }) => {
      setMessages((prev) =>
        prev.map((m) => (String(m._id) === String(messageId) ? { ...m, status } : m))
      );
    };

    // Feature 5: reliable read receipt — update ALL my sent messages in this conv to 'read'
    const handleRead = ({ conversationId: cid, readerId }) => {
      if (String(cid) !== String(convIdRef.current)) return;
      const myId = currentUser?.id || currentUser?._id;
      // Ignore read events triggered by myself (I'm the one who read, not the recipient)
      if (String(readerId) === String(myId)) return;
      setMessages((prev) =>
        prev.map((m) => {
          const senderId = m.sender?._id || m.sender;
          // Only update messages sent by me that haven't been marked read yet
          if (String(senderId) === String(myId) && m.status !== 'read') {
            return { ...m, status: 'read' };
          }
          return m;
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

  // ─── Feature 4: real-time edit/delete updates ───────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleUpdated = (updatedMsg) => {
      if (String(updatedMsg.conversationId) !== String(convIdRef.current)) return;
      updateMessage(updatedMsg);
    };

    socket.on('message:updated', handleUpdated);
    return () => socket.off('message:updated', handleUpdated);
  }, [socket, updateMessage]);

  // ─── Send ───────────────────────────────────────────────────────────────
  const send = useCallback(
    async (text) => {
      if (!conversationId) return;
      const trimmed = text.trim();
      if (!trimmed) return;

      setSending(true);
      try {
        // For group: no receiverId; for 1-to-1: pass otherUser._id
        const msg = await sendMessage(conversationId, isGroup ? null : otherUser?._id, trimmed);
        addMessage(msg);

        if (socket && socket.connected) {
          socket.emit('message:send', {
            messageId: msg._id,
            conversationId,
            receiverId: isGroup ? null : otherUser?._id,
            text: msg.text,
            createdAt: msg.createdAt,
          });
        }
      } catch {
        setError('Unable to send message. Please try again.');
      } finally {
        setSending(false);
      }
    },
    [conversationId, otherUser, socket, addMessage, isGroup]
  );

  // ─── Feature 4: Edit ────────────────────────────────────────────────────
  const edit = useCallback(
    async (messageId, newText) => {
      if (!newText.trim()) return;
      try {
        const updated = await apiEditMessage(messageId, newText.trim());
        updateMessage(updated);
        // Emit via socket for real-time update to others in the room
        if (socket && socket.connected) {
          socket.emit('message:edit', {
            messageId,
            conversationId,
            text: newText.trim(),
          });
        }
      } catch {
        setError('Failed to edit message.');
      }
    },
    [conversationId, socket, updateMessage]
  );

  // ─── Feature 4: Delete ──────────────────────────────────────────────────
  const remove = useCallback(
    async (messageId) => {
      try {
        const updated = await apiDeleteMessage(messageId);
        updateMessage(updated);
        // Emit via socket for real-time update to others in the room
        if (socket && socket.connected) {
          socket.emit('message:delete', {
            messageId,
            conversationId,
          });
        }
      } catch {
        setError('Failed to delete message.');
      }
    },
    [conversationId, socket, updateMessage]
  );

  const loadMore = useCallback(() => {
    if (page < totalPages && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      load(nextPage);
    }
  }, [page, totalPages, loading, load]);

  return {
    messages,
    loading,
    error,
    sending,
    send,
    edit,
    remove,
    loadMore,
    hasMore: page < totalPages,
  };
}
