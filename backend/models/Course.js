const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true }, // e.g. CSC201
    title: { type: String, required: true, trim: true },
    units: { type: Number, required: true, min: 1, max: 6 },
    department: { type: String, required: true, trim: true },
    level: { type: String, enum: ['ND1', 'ND2', 'HND1', 'HND2'], required: true },
    semester: { type: String, enum: ['First', 'Second'], required: true },
    type: { type: String, enum: ['Core', 'Elective'], default: 'Core' },
    lecturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);
