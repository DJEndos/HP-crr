const express = require('express');
const router = express.Router();
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { protect } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register a new student (lecturers/admins are created by an admin)
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, regNo, department, level } = req.body;

    if (!fullName || !email || !password || !regNo || !department || !level) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await User.findOne({ $or: [{ email }, { regNo }] });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email or reg. number already exists' });
    }

    const user = await User.create({
      fullName, email, password, regNo, department, level, role: 'student'
    });

    return res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      regNo: user.regNo,
      department: user.department,
      level: user.level,
      role: user.role,
      token: generateToken(user._id, user.role)
    });
  } catch (err) {
    return res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login for student, lecturer, or admin (identifier = email or regNo/staffId)
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Identifier and password are required' });
    }

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { regNo: identifier }, { staffId: identifier }]
    }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'This account has been deactivated' });
    }

    return res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      regNo: user.regNo || null,
      staffId: user.staffId || null,
      department: user.department || null,
      level: user.level || null,
      token: generateToken(user._id, user.role)
    });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get the logged-in user's profile
router.get('/me', protect, async (req, res) => {
  return res.json(req.user);
});

module.exports = router;
