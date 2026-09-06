const { verifyToken } = require('../services/tokenService');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized. Invalid token.' });
  }
};

module.exports = { protect };
