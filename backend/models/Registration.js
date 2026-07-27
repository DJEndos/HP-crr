const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    session: { type: String, required: true }, // e.g. "2025/2026"
    semester: { type: String, enum: ['First', 'Second'], required: true },
    level: { type: String, enum: ['ND1', 'ND2', 'HND1', 'HND2'], required: true },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }],
    totalUnits: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

// A student can only have one registration per session/semester
registrationSchema.index({ student: 1, session: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
