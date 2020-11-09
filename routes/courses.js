const express = require('express');
const router = express.Router({ mergeParams: true });

const course = require('../controllers/course');
const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(course.index)
  .post([protect, authorize('admin', 'publisher')], course.create);

router
  .route('/:id')
  .get(course.show)
  .put([protect, authorize('admin', 'publisher')], course.update)
  .delete([protect, authorize('admin', 'publisher')], course.destroy);

module.exports = router;
