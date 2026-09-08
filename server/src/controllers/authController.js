const User = require('../models/User');
const { signToken } = require('../services/tokenService');

// POST /api/auth/signup
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }

    const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password });
    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        statusMessage: user.statusMessage,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Signup failed. Please try again.' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        statusMessage: user.statusMessage,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const { _id, name, email, avatar, bio, statusMessage, createdAt } = req.user;
    res.json({ id: _id, name, email, avatar, bio, statusMessage, createdAt });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get user.' });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  // JWT is stateless — actual token removal happens client-side.
  // This endpoint exists as a clean server-side hook (e.g., for future token blocklists).
  res.json({ message: 'Logged out successfully.' });
};

module.exports = { signup, login, getMe, logout };
