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

    // Join a conversation room
    socket.on('join:conversation', (conversationId) => {
      socket.join(conversationId);
    });

    // Leave a conversation room
    socket.on('leave:conversation', (conversationId) => {
      socket.leave(conversationId);
    });

    // Typing indicators
    socket.on('typing:start', ({ conversationId }) => {
      if (conversationId) {
        socket.to(conversationId).emit('user:typing', {
          userId,
          conversationId,
        });
      }
    });

    socket.on('typing:stop', ({ conversationId }) => {
      if (conversationId) {
        socket.to(conversationId).emit('user:stop_typing', {
          userId,
          conversationId,
        });
      }
    });

    // New message sent via socket (for real-time delivery to recipient)
    socket.on('message:send', async (data) => {
      const { _id, messageId, conversationId, receiverId, text } = data;
      const actualId = _id || messageId;

      const messagePayload = {
        _id: actualId,
        conversationId,
        sender: socket.user._id,
        receiver: receiverId,
        text,
        status: 'sent',
        createdAt: data.createdAt || new Date().toISOString(),
      };

      // Emit to everyone in the room and to the receiver's socket (for background/other conversation updates)
      const receiverSocketId = onlineUsers.get(String(receiverId));
      if (receiverSocketId) {
        io.to(conversationId).to(receiverSocketId).emit('message:new', messagePayload);
      } else {
        io.to(conversationId).emit('message:new', messagePayload);
      }
      if (receiverSocketId) {
        try {
          const updated = await Message.findByIdAndUpdate(
            actualId,
            { status: 'delivered' },
            { new: true }
          );
          if (updated) {
            // Notify sender of delivery
            const senderSocketId = onlineUsers.get(userId);
            if (senderSocketId) {
              io.to(senderSocketId).emit('message:status', {
                messageId: actualId,
                status: 'delivered',
              });
            }
          }
        } catch {
          // Non-critical — status update failed silently
        }
      }
    });

    // Recipient acknowledges delivery
    socket.on('message:delivered', async ({ messageId, senderId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, { status: 'delivered' });
        const senderSocketId = onlineUsers.get(String(senderId));
        if (senderSocketId) {
          io.to(senderSocketId).emit('message:status', {
            messageId,
            status: 'delivered',
          });
        }
      } catch {
        // ignore
      }
    });

    // Messages marked as read
    socket.on('messages:read', async ({ conversationId, senderId }) => {
      try {
        await Message.updateMany(
          { conversationId, receiver: userId, status: { $ne: 'read' } },
          { status: 'read' }
        );
        const senderSocketId = onlineUsers.get(String(senderId));
        if (senderSocketId) {
          io.to(senderSocketId).emit('messages:read', { conversationId });
        }
      } catch {
        // ignore
      }
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('user:offline', { userId });
    });
  });
}

module.exports = { setupSockets, onlineUsers };
