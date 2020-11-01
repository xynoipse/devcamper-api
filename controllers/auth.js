const config = require('config');
const ErrorResponse = require('../utils/errorResponse');
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
