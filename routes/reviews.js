const express = require('express');
const router = express.Router({ mergeParams: true });

const review = require('../controllers/review');
const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(review.index)
  .post([protect, authorize('admin', 'user')], review.create);

router
  .route('/:id')
  .get(review.show)
  .put([protect, authorize('admin', 'user')], review.update)
  .delete([protect, authorize('admin', 'user')], review.destroy);

module.exports = router;
