const express = require('express');
const router = express.Router();

const auth = require('../controllers/auth');
const { protect } = require('../middleware/auth');

router.post('/register', auth.register);
router.post('/login', auth.login);
router.get('/me', protect, auth.me);
router.put('/updatedetails', protect, auth.updateDetails);
router.put('/updatepassword', protect, auth.updatePassword);
router.post('/forgotpassword', auth.forgotPassword);
router.put('/resetpassword/:resettoken', auth.resetPassword);

module.exports = router;
