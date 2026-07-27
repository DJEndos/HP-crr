const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    session: { type: String, required: true },
    semester: { type: String, enum: ['First', 'Second'], required: true },
    caScore: { type: Number, min: 0, max: 30, default: 0 }, // continuous assessment
    examScore: { type: Number, min: 0, max: 70, default: 0 },
    totalScore: { type: Number, min: 0, max: 100 },
    grade: { type: String, enum: ['A', 'B', 'C', 'D', 'E', 'F'] },
    gradePoint: { type: Number },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPublished: { type: Boolean, default: false }
  },
  { timestamps: true }
);

resultSchema.index({ student: 1, course: 1, session: 1, semester: 1 }, { unique: true });

// Auto-compute total, grade and grade point before save
resultSchema.pre('save', function (next) {
  this.totalScore = (this.caScore || 0) + (this.examScore || 0);

  if (this.totalScore >= 70) { this.grade = 'A'; this.gradePoint = 5; }
  else if (this.totalScore >= 60) { this.grade = 'B'; this.gradePoint = 4; }
  else if (this.totalScore >= 50) { this.grade = 'C'; this.gradePoint = 3; }
  else if (this.totalScore >= 45) { this.grade = 'D'; this.gradePoint = 2; }
  else if (this.totalScore >= 40) { this.grade = 'E'; this.gradePoint = 1; }
  else { this.grade = 'F'; this.gradePoint = 0; }

  next();
});

module.exports = mongoose.model('Result', resultSchema);
