const jwt = require('jsonwebtoken');
const config = require('config');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  const { authorization } = req.headers;

  if (authorization && authorization.startsWith('Bearer ')) {
    token = authorization.split(' ')[1];
  }

  if (!token) throw new ErrorResponse('Unauthenticated.', 401);

  try {
    const decoded = jwt.verify(token, config.get('jwtSecret'));
    req.user = await User.findById(decoded._id);
    next();
  } catch (error) {
    throw new ErrorResponse('Invalid Token', 400);
  }
};

exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    throw new ErrorResponse('Unauthorized.', 403);

  next();
};
