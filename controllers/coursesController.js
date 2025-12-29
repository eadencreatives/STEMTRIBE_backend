const Course = require('../models/Course');

exports.getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find().select('title description slug modules');
    res.json(courses);
  } catch (err) {
    next(err);
  }
};

exports.getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    next(err);
  }
};

exports.getModule = async (req, res, next) => {
  try {
    const { id, moduleIndex } = req.params;
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const idx = parseInt(moduleIndex, 10);
    const module = course.modules[idx];
    if (!module) return res.status(404).json({ message: 'Module not found' });
    res.json(module);
  } catch (err) {
    next(err);
  }
};

exports.getTopic = async (req, res, next) => {
  try {
    const { id, moduleIndex, topicIndex } = req.params;
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const mIdx = parseInt(moduleIndex, 10);
    const tIdx = parseInt(topicIndex, 10);
    const module = course.modules[mIdx];
    if (!module) return res.status(404).json({ message: 'Module not found' });
    const topic = module.topics[tIdx];
    if (!topic) return res.status(404).json({ message: 'Topic not found' });
    res.json({ module, topic, moduleIndex: mIdx, topicIndex: tIdx, courseId: course._id });
  } catch (err) {
    next(err);
  }
};
