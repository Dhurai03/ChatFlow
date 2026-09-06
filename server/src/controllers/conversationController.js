const Conversation = require('../models/Conversation');

// GET /api/conversations
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'name email')
      .sort({ lastMessageAt: -1 })
      .lean();

    res.json(conversations);
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
      return res.json(existing);
    }

    const conversation = await Conversation.create({
      participants: [userId, participantId],
    });

    const populated = await Conversation.findById(conversation._id)
      .populate('participants', 'name email')
      .lean();

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create conversation.' });
  }
};

module.exports = { getConversations, createConversation };
