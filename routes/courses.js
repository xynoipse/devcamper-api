const express = require('express');
const router = express.Router({ mergeParams: true });

const course = require('../controllers/course');

router
  .route('/')
  .get(course.index)
  .post(course.create);

router
  .route('/:id')
  .get(course.show)
  .put(course.update)
  .delete(course.destroy);

module.exports = router;
