const express = require('express');
const router = express.Router();

const bootcamp = require('../controllers/bootcamp');
const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(bootcamp.index)
  .post([protect, authorize('admin', 'publisher')], bootcamp.create);

router
  .route('/:id')
  .get(bootcamp.show)
  .put([protect, authorize('admin', 'publisher')], bootcamp.update)
  .delete([protect, authorize('admin', 'publisher')], bootcamp.destroy);

router
  .route('/:id/photo')
  .put([protect, authorize('admin', 'publisher')], bootcamp.photoUpload);

router.route('/radius/:zipcode/:distance').get(bootcamp.getInRadius);

router.use('/:bootcampId/courses', require('./courses'));
router.use('/:bootcampId/reviews', require('./reviews'));

module.exports = router;
