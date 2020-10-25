const ErrorResponse = require('../utils/errorResponse');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    const message = 'Resource not found';
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key error collection
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    const errors = { ...err.keyValue };
    const field = Object.keys(errors)[0];
    errors[field] = `The ${field} has already been taken`;
    error = new ErrorResponse(message, 400, errors);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = 'The given data was invalid.';
    const errors = { ...err.errors };
    Object.keys(errors).map((key) => (errors[key] = err.errors[key].message));
    error = new ErrorResponse(message, 400, errors);
  }

  if (!error.statusCode) {
    logger.error({
      message: err.message,
      level: err.level,
      stack: err.stack,
      meta: err,
    });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    errors: error.errors || undefined,
  });
};

module.exports = errorHandler;
