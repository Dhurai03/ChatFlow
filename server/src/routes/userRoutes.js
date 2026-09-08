const express = require('express');
const { getUsers, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getUsers);
router.patch('/profile', protect, updateProfile);

module.exports = router;
