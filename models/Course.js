const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  intro: { type: String },
  description: { type: String },
  examples: [{ type: String }],
  practiceQuestions: [{ type: Object }],
  order: { type: Number, default: 0 }
});

const ModuleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  order: { type: Number, default: 0 },
  topics: [TopicSchema]
});

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, lowercase: true, index: true },
  description: { type: String },
  modules: [ModuleSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', CourseSchema);
