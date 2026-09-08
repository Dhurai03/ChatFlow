const mongoose = require('mongoose');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// GET /api/messages/conversations/:conversationId/messages?page=1&limit=30
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 30));

    // Verify user belongs to this conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const totalMessages = await Message.countDocuments({ conversationId });
    const totalPages = Math.max(1, Math.ceil(totalMessages / limit));

    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name email avatar')
      .lean();

    res.json({ messages, page, limit, totalMessages, totalPages });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch messages.' });
  }
};

// POST /api/messages
const sendMessage = async (req, res) => {
  try {
    const { conversationId, receiverId, text } = req.body;
    const senderId = req.user._id;

    if (!conversationId || !text) {
      return res.status(400).json({ message: 'conversationId and text are required.' });
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return res.status(400).json({ message: 'Message cannot be empty.' });
    }
    if (trimmed.length > 2000) {
      return res.status(400).json({ message: 'Message is too long (max 2000 characters).' });
    }

    // Verify sender belongs to conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: senderId,
    });

    if (!conversation) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // For 1-to-1 conversations, receiverId is required
    if (!conversation.isGroup && !receiverId) {
      return res.status(400).json({ message: 'receiverId is required for direct messages.' });
    }

    const messageData = {
      conversationId,
      sender: senderId,
      text: trimmed,
      status: 'sent',
    };
    if (receiverId) messageData.receiver = receiverId;

    const message = await Message.create(messageData);

    // Populate sender info for the response
    const populated = await Message.findById(message._id)
      .populate('sender', 'name email avatar')
      .lean();

    // Update conversation last message preview
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: trimmed,
      lastMessageAt: message.createdAt,
    });

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to send message.' });
  }
};

// PATCH /api/messages/:messageId/status
const updateMessageStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    const validStatuses = ['delivered', 'read'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Status must be "delivered" or "read".' });
    }

    const message = await Message.findOneAndUpdate(
      { _id: messageId, receiver: userId },
      { status },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    res.json(message);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update message status.' });
  }
};

// PATCH /api/messages/conversations/:conversationId/read
const markConversationRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Verify user has access to this conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const userObjId = new mongoose.Types.ObjectId(userId);

    // Mark messages as read and persist readBy for Feature 5
    const result = await Message.updateMany(
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

    res.json({ ok: true, count: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark messages as read.' });
  }
};

// PATCH /api/messages/:messageId — Edit a message (sender only)
const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text cannot be empty.' });
    }
    if (text.trim().length > 2000) {
      return res.status(400).json({ message: 'Message is too long (max 2000 characters).' });
    }

    const message = await Message.findOneAndUpdate(
      { _id: messageId, sender: userId, isDeleted: { $ne: true } },
      { text: text.trim(), isEdited: true },
      { new: true }
    ).populate('sender', 'name email avatar');

    if (!message) {
      return res.status(404).json({ message: 'Message not found or you are not the sender.' });
    }

    res.json(message);
  } catch (err) {
    res.status(500).json({ message: 'Failed to edit message.' });
  }
};

// DELETE /api/messages/:messageId — Soft-delete a message (sender only)
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findOneAndUpdate(
      { _id: messageId, sender: userId, isDeleted: { $ne: true } },
      {
        isDeleted: true,
        deletedAt: new Date(),
        text: 'This message was deleted',
      },
      { new: true }
    ).populate('sender', 'name email avatar');

    if (!message) {
      return res.status(404).json({ message: 'Message not found or you are not the sender.' });
    }

    res.json(message);
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete message.' });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  updateMessageStatus,
  markConversationRead,
  editMessage,
  deleteMessage,
};
