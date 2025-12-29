const express = require('express');
const router = express.Router();
const controller = require('../controllers/coursesController');

// GET /api/courses
router.get('/', controller.getCourses);

// GET /api/courses/:id
router.get('/:id', controller.getCourse);

// GET /api/courses/:id/modules/:moduleIndex
router.get('/:id/modules/:moduleIndex', controller.getModule);

// GET /api/courses/:id/modules/:moduleIndex/topics/:topicIndex
router.get('/:id/modules/:moduleIndex/topics/:topicIndex', controller.getTopic);

module.exports = router;
