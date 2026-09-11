const mongoose = require('mongoose');
const Message = require('../models/Message');
const { verifyToken } = require('../services/tokenService');
const User = require('../models/User');

// Map of userId -> socketId for online presence
const onlineUsers = new Map();

function setupSockets(io) {
  // Authenticate socket connections
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('-password').lean();
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = String(socket.user._id);

    // Mark user online
    onlineUsers.set(userId, socket.id);

    // Send initial list of all currently online users to the newly connected socket
    socket.emit('users:online', { userIds: Array.from(onlineUsers.keys()) });

    // Broadcast to other connected clients that this user is online
    socket.broadcast.emit('user:online', { userId });

    // ─── Conversation Rooms ─────────────────────────────────────────────
    socket.on('join:conversation', (conversationId) => {
      socket.join(conversationId);
    });

    socket.on('leave:conversation', (conversationId) => {
      socket.leave(conversationId);
    });

    // ─── Typing Indicators ──────────────────────────────────────────────
    socket.on('typing:start', ({ conversationId }) => {
      if (conversationId) {
        socket.to(conversationId).emit('user:typing', { userId, conversationId });
      }
    });

    socket.on('typing:stop', ({ conversationId }) => {
      if (conversationId) {
        socket.to(conversationId).emit('user:stop_typing', { userId, conversationId });
      }
    });

    // ─── New Message (real-time relay) ──────────────────────────────────
    socket.on('message:send', async (data) => {
      const { _id, messageId, conversationId, receiverId, text } = data;
      const actualId = _id || messageId;

      const messagePayload = {
        _id: actualId,
        conversationId,
        sender: { _id: socket.user._id, name: socket.user.name, email: socket.user.email, avatar: socket.user.avatar },
        receiver: receiverId || null,
        text,
        status: 'sent',
        isEdited: false,
        isDeleted: false,
        createdAt: data.createdAt || new Date().toISOString(),
      };

      // Broadcast to everyone already in the conversation room
      io.to(conversationId).emit('message:new', messagePayload);

      // For 1-to-1: also emit DIRECTLY to the receiver's socket
      // so they get the real-time notification even if they haven't opened the conversation
      if (receiverId) {
        const receiverSocketId = onlineUsers.get(String(receiverId));
        if (receiverSocketId) {
          // Check if receiver is already in the room (avoid duplicate)
          const receiverSocket = io.sockets.sockets.get(receiverSocketId);
          const isInRoom = receiverSocket && receiverSocket.rooms.has(conversationId);
          if (!isInRoom) {
            // Send directly to the receiver's socket
            io.to(receiverSocketId).emit('message:new', messagePayload);
          }
          // Mark as delivered since receiver is online
          try {
            await Message.findByIdAndUpdate(actualId, { status: 'delivered' });
            const senderSocketId = onlineUsers.get(userId);
            if (senderSocketId) {
              io.to(senderSocketId).emit('message:status', {
                messageId: actualId,
                status: 'delivered',
              });
            }
          } catch {
            // Non-critical — status update failed silently
          }
        }
      }
    });

    // ─── Recipient acknowledges delivery ────────────────────────────────
    socket.on('message:delivered', async ({ messageId, senderId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, { status: 'delivered' });
        const senderSocketId = onlineUsers.get(String(senderId));
        if (senderSocketId) {
          io.to(senderSocketId).emit('message:status', { messageId, status: 'delivered' });
        }
      } catch {
        // ignore
      }
    });

    // ─── Messages read (Feature 5: reliable persistence + room broadcast) ──
    socket.on('messages:read', async ({ conversationId, senderId }) => {
      try {
        const userObjId = new mongoose.Types.ObjectId(userId);

        // Persist read status for ALL unread messages in the conversation from other users
        await Message.updateMany(
          {
            conversationId: new mongoose.Types.ObjectId(conversationId),
            sender: { $ne: userObjId },
            $or: [
              { status: { $ne: 'read' } },
              { 'readBy.user': { $ne: userObjId } },
            ],
          },
          {
            $set: { status: 'read' },
            $addToSet: { readBy: { user: userObjId, readAt: new Date() } },
          }
        );

        // Notify the senders (everyone in the room except the reader) that messages were read
        socket.to(conversationId).emit('messages:read', { conversationId, readerId: userId });

        // Also notify the specific sender directly (handles 1-to-1 where sender isn't in the room)
        if (senderId) {
          const senderSocketId = onlineUsers.get(String(senderId));
          if (senderSocketId) {
            const senderSocket = io.sockets.sockets.get(senderSocketId);
            const isInRoom = senderSocket && senderSocket.rooms.has(conversationId);
            if (!isInRoom) {
              io.to(senderSocketId).emit('messages:read', { conversationId, readerId: userId });
            }
          }
        }
      } catch {
        // ignore
      }
    });

    // ─── Message Edit (Feature 4) ────────────────────────────────────────
    socket.on('message:edit', async ({ messageId, conversationId, text }) => {
      try {
        const updated = await Message.findOneAndUpdate(
          { _id: messageId, sender: userId, isDeleted: { $ne: true } },
          { text: text.trim(), isEdited: true },
          { new: true }
        ).populate('sender', 'name email avatar');

        if (updated) {
          io.to(conversationId).emit('message:updated', updated);
        }
      } catch {
        // ignore
      }
    });

    // ─── Message Delete (Feature 4) ─────────────────────────────────────
    socket.on('message:delete', async ({ messageId, conversationId }) => {
      try {
        const updated = await Message.findOneAndUpdate(
          { _id: messageId, sender: userId, isDeleted: { $ne: true } },
          { isDeleted: true, deletedAt: new Date(), text: 'This message was deleted' },
          { new: true }
        ).populate('sender', 'name email avatar');

        if (updated) {
          io.to(conversationId).emit('message:updated', updated);
        }
      } catch {
        // ignore
      }
    });

    // ─── Disconnect ─────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('user:offline', { userId });
    });
  });
}

module.exports = { setupSockets, onlineUsers };
