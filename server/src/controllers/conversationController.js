const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// GET /api/conversations
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'name email')
      .sort({ lastMessageAt: -1 })
      .lean();

    const unreadCounts = await Message.aggregate([
      {
        $match: {
          receiver: new mongoose.Types.ObjectId(userId),
          status: { $ne: 'read' },
        },
      },
      {
        $group: {
          _id: '$conversationId',
          count: { $sum: 1 },
        },
      },
    ]);

    const unreadMap = new Map(unreadCounts.map((u) => [String(u._id), u.count]));

    const result = conversations.map((conv) => ({
      ...conv,
      unreadCount: unreadMap.get(String(conv._id)) || 0,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch conversations.' });
  }
};

// POST /api/conversations
const createConversation = async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.user._id;

    if (!participantId) {
      return res.status(400).json({ message: 'participantId is required.' });
    }

    if (String(participantId) === String(userId)) {
      return res.status(400).json({ message: 'Cannot start a conversation with yourself.' });
    }

    // Return existing conversation if one already exists
    const existing = await Conversation.findOne({
      participants: { $all: [userId, participantId] },
    }).populate('participants', 'name email').lean();

    if (existing) {
      const unreadCount = await Message.countDocuments({
        conversationId: existing._id,
        receiver: userId,
        status: { $ne: 'read' },
      });
      return res.json({ ...existing, unreadCount });
    }

    const conversation = await Conversation.create({
      participants: [userId, participantId],
    });

    const populated = await Conversation.findById(conversation._id)
      .populate('participants', 'name email')
      .lean();

    res.status(201).json({ ...populated, unreadCount: 0 });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create conversation.' });
  }
};

module.exports = { getConversations, createConversation };
