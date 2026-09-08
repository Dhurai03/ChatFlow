const express = require('express');
const {
  getConversations,
  createConversation,
  createGroupConversation,
} = require('../controllers/conversationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getConversations);
router.post('/', protect, createConversation);
router.post('/group', protect, createGroupConversation);

module.exports = router;
