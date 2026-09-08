const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Helper: populate participants with full profile fields
const populateParticipants = (query) =>
  query.populate('participants', 'name email avatar bio statusMessage').populate('admin', 'name email avatar');

// GET /api/conversations
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await populateParticipants(
      Conversation.find({ participants: userId })
    )
      .sort({ lastMessageAt: -1 })
      .lean();

    const unreadCounts = await Message.aggregate([
      {
        $match: {
          receiver: new mongoose.Types.ObjectId(userId),
          status: { $ne: 'read' },
          isDeleted: { $ne: true },
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

// POST /api/conversations — Create or return existing 1-to-1 conversation
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

    // Return existing 1-to-1 conversation if one already exists
    const existing = await populateParticipants(
      Conversation.findOne({
        isGroup: { $ne: true },
        participants: { $all: [userId, participantId], $size: 2 },
      })
    ).lean();

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
      isGroup: false,
    });

    const populated = await populateParticipants(
      Conversation.findById(conversation._id)
    ).lean();

    res.status(201).json({ ...populated, unreadCount: 0 });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create conversation.' });
  }
};

// POST /api/conversations/group — Create a new group conversation
const createGroupConversation = async (req, res) => {
  try {
    const { name, participantIds } = req.body;
    const userId = req.user._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Group name is required.' });
    }

    if (!Array.isArray(participantIds) || participantIds.length < 2) {
      return res.status(400).json({ message: 'A group requires at least 2 other participants.' });
    }

    // Deduplicate and include the creator
    const allParticipants = [...new Set([String(userId), ...participantIds.map(String)])];

    if (allParticipants.length < 3) {
      return res.status(400).json({ message: 'A group requires at least 2 other participants.' });
    }

    const conversation = await Conversation.create({
      participants: allParticipants,
      isGroup: true,
      name: name.trim(),
      admin: userId,
      lastMessageAt: new Date(),
    });

    const populated = await populateParticipants(
      Conversation.findById(conversation._id)
    ).lean();

    res.status(201).json({ ...populated, unreadCount: 0 });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create group conversation.' });
  }
};

module.exports = { getConversations, createConversation, createGroupConversation };
