const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Course = require('../models/Course');
const { protect, authorize } = require('../middleware/auth');

const MAX_UNITS = 24;

// @route   POST /api/registrations
// @desc    Student registers courses for a session/semester
router.post('/', protect, authorize('student'), async (req, res) => {
  try {
    const { session, semester, courseIds } = req.body;

    if (!session || !semester || !Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({ message: 'session, semester, and courseIds[] are required' });
    }

    const existing = await Registration.findOne({ student: req.user._id, session, semester });
    if (existing) {
      return res.status(409).json({ message: 'You have already registered courses for this session/semester' });
    }

    const courses = await Course.find({ _id: { $in: courseIds } });
    if (courses.length !== courseIds.length) {
      return res.status(400).json({ message: 'One or more selected courses could not be found' });
    }

    const totalUnits = courses.reduce((sum, c) => sum + c.units, 0);
    if (totalUnits > MAX_UNITS) {
      return res.status(400).json({ message: `Total units (${totalUnits}) exceed the maximum allowed (${MAX_UNITS})` });
    }

    const registration = await Registration.create({
      student: req.user._id,
      session,
      semester,
      level: req.user.level,
      courses: courseIds,
      totalUnits
    });

    const populated = await registration.populate('courses');
    return res.status(201).json(populated);
  } catch (err) {
    return res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

// @route   GET /api/registrations/me
// @desc    Student views their own registration history
router.get('/me', protect, authorize('student'), async (req, res) => {
  try {
    const registrations = await Registration.find({ student: req.user._id }).populate('courses');
    return res.json(registrations);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch registrations', error: err.message });
  }
});

// @route   GET /api/registrations
// @desc    Admin/lecturer views all registrations, optionally filtered by course
router.get('/', protect, authorize('admin', 'lecturer'), async (req, res) => {
  try {
    const { session, semester, courseId } = req.query;
    const filter = {};
    if (session) filter.session = session;
    if (semester) filter.semester = semester;
    if (courseId) filter.courses = courseId;

    const registrations = await Registration.find(filter)
      .populate('student', 'fullName regNo level department')
      .populate('courses', 'code title units');
    return res.json(registrations);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch registrations', error: err.message });
  }
});

// @route   PUT /api/registrations/:id/status
// @desc    Admin approves or rejects a registration
router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body; // 'approved' | 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'status must be approved or rejected' });
    }

    const registration = await Registration.findByIdAndUpdate(
      req.params.id,
      { status, approvedBy: req.user._id },
      { new: true }
    );
    if (!registration) return res.status(404).json({ message: 'Registration not found' });
    return res.json(registration);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update registration status', error: err.message });
  }
});

module.exports = router;
