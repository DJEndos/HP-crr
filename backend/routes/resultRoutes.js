const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Course = require('../models/Course');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/results/repair-legacy
// @desc    TEMPORARY: re-saves every result so the pre-save hook recomputes
//          totalScore/grade/gradePoint on records created before the findOneAndUpdate bug was fixed.
//          Safe to run more than once. Remove this route once confirmed fixed.
router.post('/repair-legacy', protect, authorize('admin'), async (req, res) => {
  try {
    const all = await Result.find({});
    let fixed = 0;
    for (const r of all) {
      await r.save();
      fixed++;
    }
    return res.json({ message: `Recomputed ${fixed} result(s).` });
  } catch (err) {
    return res.status(500).json({ message: 'Repair failed', error: err.message });
  }
});

// @route   POST /api/results
// @desc    Lecturer uploads or updates a result for a student in their course
router.post('/', protect, authorize('lecturer', 'admin'), async (req, res) => {
  try {
    const { studentId, courseId, session, semester, caScore, examScore } = req.body;

    if (!studentId || !courseId || !session || !semester) {
      return res.status(400).json({ message: 'studentId, courseId, session, and semester are required' });
    }

    // Lecturers may only upload results for courses assigned to them
    if (req.user.role === 'lecturer') {
      const course = await Course.findById(courseId);
      if (!course || String(course.lecturer) !== String(req.user._id)) {
        return res.status(403).json({ message: 'You are not assigned to this course' });
      }
    }

    let result = await Result.findOne({ student: studentId, course: courseId, session, semester });
    if (result) {
      result.caScore = caScore;
      result.examScore = examScore;
      result.uploadedBy = req.user._id;
    } else {
      result = new Result({
        student: studentId,
        course: courseId,
        session,
        semester,
        caScore,
        examScore,
        uploadedBy: req.user._id
      });
    }
    await result.save();

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to save result', error: err.message });
  }
});

// @route   PUT /api/results/:id/publish
// @desc    Admin publishes a result so the student can view it
router.put('/:id/publish', protect, authorize('admin'), async (req, res) => {
  try {
    const result = await Result.findByIdAndUpdate(req.params.id, { isPublished: true }, { new: true });
    if (!result) return res.status(404).json({ message: 'Result not found' });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to publish result', error: err.message });
  }
});

// @route   GET /api/results/me?session=2025/2026&semester=First
// @desc    Student views their own published results, plus GPA for that semester
router.get('/me', protect, authorize('student'), async (req, res) => {
  try {
    const { session, semester } = req.query;
    const filter = { student: req.user._id, isPublished: true };
    if (session) filter.session = session;
    if (semester) filter.semester = semester;

    const results = await Result.find(filter).populate('course', 'code title units');

    let totalPoints = 0;
    let totalUnits = 0;
    results.forEach(r => {
      totalPoints += r.gradePoint * r.course.units;
      totalUnits += r.course.units;
    });
    const gpa = totalUnits > 0 ? (totalPoints / totalUnits).toFixed(2) : null;

    return res.json({ results, gpa, totalUnits });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch results', error: err.message });
  }
});

// @route   GET /api/results/course/:courseId
// @desc    Lecturer/admin views all results for a specific course
router.get('/course/:courseId', protect, authorize('lecturer', 'admin'), async (req, res) => {
  try {
    const results = await Result.find({ course: req.params.courseId })
      .populate('student', 'fullName regNo')
      .populate('course', 'code title units');
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch results', error: err.message });
  }
});

module.exports = router;
