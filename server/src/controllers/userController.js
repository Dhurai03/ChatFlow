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
      .select('name email createdAt')
      .limit(20)
      .lean();

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to search users.' });
  }
};

module.exports = { getUsers };
