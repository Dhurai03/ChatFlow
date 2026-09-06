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

    // For pagination: page 1 = most recent messages, page 2 = older, etc.
    // We sort ascending so the client renders oldest→newest
    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
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

    if (!conversationId || !receiverId || !text) {
      return res.status(400).json({ message: 'conversationId, receiverId, and text are required.' });
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

    const message = await Message.create({
      conversationId,
      sender: senderId,
      receiver: receiverId,
      text: trimmed,
      status: 'sent',
    });

    // Update conversation last message preview
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: trimmed,
      lastMessageAt: message.createdAt,
    });

    res.status(201).json(message);
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

    await Message.updateMany(
      { conversationId, receiver: userId, status: { $ne: 'read' } },
      { status: 'read' }
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark messages as read.' });
  }
};

module.exports = { getMessages, sendMessage, updateMessageStatus, markConversationRead };
