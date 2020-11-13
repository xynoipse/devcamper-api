const express = require('express');
const router = express.Router();

const user = require('../controllers/user');
const { protect, authorize } = require('../middleware/auth');

router.use([protect, authorize('admin')]);

router.route('/').get(user.index).post(user.create);

router.route('/:id').get(user.show).put(user.update).delete(user.destroy);

module.exports = router;
