const ErrorResponse = require('../utils/errorResponse');
const advancedResults = require('../utils/advancedResults');
const Review = require('../models/Review');
const Bootcamp = require('../models/Bootcamp');

/**
 * Get reviews
 * @route   GET /api/reviews
 * @route   GET /api/bootcamps/:bootcampId/reviews
 * @access  Public
 */
exports.index = async (req, res) => {
  if (req.params.bootcampId) {
    const reviews = await Review.find({ bootcamp: req.params.bootcampId });
    return res.json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  }

  const results = await advancedResults(req, Review, {
    path: 'bootcamp',
    select: 'name description',
  });
  res.json(results);
};

/**
 * Create a new bootcamp review
 * @route   POST /api/bootcamps/:bootcampId/reviews
 * @access  Private
 */
exports.create = async (req, res) => {
  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id;

  const bootcamp = await Bootcamp.findById(req.params.bootcampId);
  if (!bootcamp) throw new ErrorResponse('Bootcamp Not Found', 404);

  const review = await Review.create(req.body);

  res.status(201).json({ success: true, data: review });
};

/**
 * Get a review
 * @route   GET /api/reviews/:id
 * @access  Public
 */
exports.show = async (req, res) => {
  const review = await Review.findById(req.params.id).populate({
    path: 'bootcamp',
    select: 'name description',
  });

  if (!review) throw new ErrorResponse('Review Not Found', 404);

  res.json({ success: true, data: review });
};

/**
 * Update a review
 * @route   PUT /api/reviews/:id
 * @access  Private
 */
exports.update = async (req, res) => {
  let review = await Review.findById(req.params.id);

  if (!review) throw new ErrorResponse('Review Not Found', 404);
  if (review.user.toHexString() !== req.user.id && req.user.role !== 'admin')
    throw new ErrorResponse('Unauthorized', 403);

  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, data: review });
};

/**
 * Delete a review
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
exports.destroy = async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) throw new ErrorResponse('Review Not Found', 404);
  if (review.user.toHexString() !== req.user.id && req.user.role !== 'admin')
    throw new ErrorResponse('Unauthorized', 403);

  await review.remove();

  res.json({ success: true, data: {} });
};
