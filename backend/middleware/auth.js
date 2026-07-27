const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the JWT sent in the Authorization header and attaches req.user
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user || !req.user.isActive) {
        return res.status(401).json({ message: 'User not found or deactivated' });
      }
      return next();
    } catch (err) {
      return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token provided' });
};

// Restricts a route to specific roles, e.g. authorize('admin', 'lecturer')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied for role: ${req.user ? req.user.role : 'unknown'}` });
    }
    next();
  };
};

module.exports = { protect, authorize };
