const ErrorResponse = require('../utils/errorResponse');
const advancedResults = require('../utils/advancedResults');
const User = require('../models/User');

/**
 * Get all users
 * @route   GET /api/users
 * @access  Private/Admin
 */
exports.index = async (req, res) => {
  const results = await advancedResults(req, User);
  res.json(results);
};

/**
 * Create a new user
 * @route   POST /api/users/
 * @access  Private/Admin
 */
exports.create = async (req, res) => {
  const user = await User.create(req.body);

  res.status(201).json({ success: true, data: user });
};

/**
 * Get a user
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
exports.show = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) throw new ErrorResponse('User Not Found', 404);

  res.json({ success: true, data: user });
};

/**
 * Update a user
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
exports.update = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) throw new ErrorResponse('User Not Found', 404);

  res.json({ success: true, data: user });
};

/**
 * Delete a user
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
exports.destroy = async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) throw new ErrorResponse('User Not Found', 404);

  res.json({ success: true, data: {} });
};
