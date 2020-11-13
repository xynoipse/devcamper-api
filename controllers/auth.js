const crypto = require('crypto');
const config = require('config');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');

/**
 * Register user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  sendTokenResponse(user, res, 201);
};

/**
 * Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    throw new ErrorResponse('Please provide and email and password', 400);

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new ErrorResponse('Invalid email or password', 401);

  const validPassword = await user.validatePassword(password);
  if (!validPassword) throw new ErrorResponse('Invalid email or password', 401);

  sendTokenResponse(user, res, 200);
};

/**
 * Get current auth user
 * @route   POST /api/auth/me
 * @access  Private
 */
exports.me = async (req, res) => {
  const user = await User.findById(req.user.id);

  res.json({
    success: true,
    data: user,
  });
};

/**
 * Update current auth user details
 * @route   PUT /api/auth/updatedetails
 * @access  Private
 */
exports.updateDetails = async (req, res) => {
  const { name, email } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name, email },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: user,
  });
};

/**
 * Update current auth user password
 * @route   PUT /api/auth/updatepassword
 * @access  Private
 */
exports.updatePassword = async (req, res) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.validatePassword(req.body.currentPassword)))
    throw new ErrorResponse('Password is incorrect', 401);

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, res, 200);
};

/**
 * Forgot password
 * @route   POST /api/auth/forgotpassword
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) throw new ErrorResponse('User Not Found', 404);

  const resetToken = await user.getResetPasswordToken();

  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/auth/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      message,
    });

    res.json({
      success: true,
      data: 'Email sent.',
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    throw new ErrorResponse('Email could not be sent', 500);
  }
};

/**
 * Reset password
 * @route   PUT /api/auth/resetpassword/:resettoken
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) throw new ErrorResponse('Invalid Reset Token', 400);

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendTokenResponse(user, res, 200);
};

const sendTokenResponse = (user, res, statusCode) => {
  const token = user.generateAuthToken();

  const options = {
    expires: new Date(
      Date.now() + config.get('jwtCookieExpire') * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') options.secure = true;

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
  });
};
