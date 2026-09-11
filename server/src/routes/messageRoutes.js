const express = require('express');
const {
  getMessages,
  sendMessage,
  updateMessageStatus,
  markConversationRead,
  editMessage,
  deleteMessage,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();


// Mark all messages in a conversation as read
router.patch('/conversations/:conversationId/read', protect, markConversationRead);

// Get paginated messages for a conversation
router.get('/conversations/:conversationId/messages', protect, getMessages);

// Send a new message
router.post('/', protect, sendMessage);

// Update single message status (must be after /conversations routes)
router.patch('/:messageId/status', protect, updateMessageStatus);

// Edit a message (sender only)
router.patch('/:messageId', protect, editMessage);

// Delete a message — soft delete (sender only)
router.delete('/:messageId', protect, deleteMessage);

module.exports = router;
