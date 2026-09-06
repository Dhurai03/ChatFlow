const express = require('express');
const {
  getMessages,
  sendMessage,
  updateMessageStatus,
  markConversationRead,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// IMPORTANT: specific routes before wildcard routes

// Mark all messages in a conversation as read
router.patch('/conversations/:conversationId/read', protect, markConversationRead);

// Get paginated messages for a conversation
router.get('/conversations/:conversationId/messages', protect, getMessages);

// Send a new message
router.post('/', protect, sendMessage);

// Update single message status (must be after /conversations routes)
router.patch('/:messageId/status', protect, updateMessageStatus);

module.exports = router;
