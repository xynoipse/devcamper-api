const express = require('express');
const router = express.Router();

const bootcamp = require('../controllers/bootcamp');

router
  .route('/')
  .get(bootcamp.index)
  .post(bootcamp.create);

router
  .route('/:id')
  .get(bootcamp.show)
  .put(bootcamp.update)
  .delete(bootcamp.destroy);

router.route('/radius/:zipcode/:distance').get(bootcamp.getInRadius);

module.exports = router;
