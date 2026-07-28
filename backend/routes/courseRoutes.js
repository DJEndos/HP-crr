const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/courses?level=ND1&semester=First&department=Computer%20Science
// @desc    List courses, optionally filtered (any logged-in user)
router.get('/', protect, async (req, res) => {
  try {
    const { level, semester, department } = req.query;
    const filter = {};
    if (level) filter.level = level;
    if (semester) filter.semester = semester;
    if (department) filter.department = department;

    const courses = await Course.find(filter).populate('lecturer', 'fullName staffId');
    return res.json(courses);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch courses', error: err.message });
  }
});

// @route   POST /api/courses
// @desc    Create a course (admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.create(req.body);
    return res.status(201).json(course);
  } catch (err) {
    return res.status(400).json({ message: 'Failed to create course', error: err.message });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update a course (admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    return res.json(course);
  } catch (err) {
    return res.status(400).json({ message: 'Failed to update course', error: err.message });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete a course (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    return res.json({ message: 'Course deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete course', error: err.message });
  }
});

// @route   PUT /api/courses/:id/assign-lecturer
// @desc    Assign a lecturer to a course (admin only)
router.put('/:id/assign-lecturer', protect, authorize('admin'), async (req, res) => {
  try {
    const { lecturerId } = req.body;
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { lecturer: lecturerId },
      { new: true }
    ).populate('lecturer', 'fullName staffId');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    return res.json(course);
  } catch (err) {
    return res.status(400).json({ message: 'Failed to assign lecturer', error: err.message });
  }
});

module.exports = router;
