const User = require('../models/User');

// GET /api/users?search=query
const getUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const currentUserId = req.user._id;

    const filter = { _id: { $ne: currentUserId } };

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const users = await User.find(filter)
      .select('name email avatar bio statusMessage createdAt')
      .limit(20)
      .lean();

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to search users.' });
  }
};

// PATCH /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, avatar, bio, statusMessage } = req.body;

    const updates = {};
    if (name !== undefined) {
      const trimmed = name.trim();
      if (!trimmed) return res.status(400).json({ message: 'Name cannot be empty.' });
      updates.name = trimmed;
    }
    if (avatar !== undefined) updates.avatar = avatar.trim();
    if (bio !== undefined) {
      if (bio.length > 160) return res.status(400).json({ message: 'Bio cannot exceed 160 characters.' });
      updates.bio = bio.trim();
    }
    if (statusMessage !== undefined) {
      if (statusMessage.length > 100) return res.status(400).json({ message: 'Status cannot exceed 100 characters.' });
      updates.statusMessage = statusMessage.trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided to update.' });
    }

    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password').lean();
    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      statusMessage: user.statusMessage,
      createdAt: user.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile.' });
  }
};

module.exports = { getUsers, updateProfile };
