const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

// @route   GET /api/admin/users?role=student
// @desc    List users, optionally filtered by role
router.get('/users', async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    const users = await User.find(filter).select('-password');
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
});

// @route   POST /api/admin/lecturers
// @desc    Create a lecturer account
router.post('/lecturers', async (req, res) => {
  try {
    const { fullName, email, password, staffId, department } = req.body;
    if (!fullName || !email || !password || !staffId || !department) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const lecturer = await User.create({
      fullName, email, password, staffId, department, role: 'lecturer'
    });
    return res.status(201).json({ ...lecturer.toObject(), password: undefined });
  } catch (err) {
    return res.status(400).json({ message: 'Failed to create lecturer', error: err.message });
  }
});

// @route   PUT /api/admin/users/:id/deactivate
// @desc    Deactivate a user account
router.put('/users/:id/deactivate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to deactivate user', error: err.message });
  }
});

// @route   PUT /api/admin/users/:id/reactivate
// @desc    Reactivate a user account
router.put('/users/:id/reactivate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to reactivate user', error: err.message });
  }
});

module.exports = router;
