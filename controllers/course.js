const ErrorResponse = require('../utils/errorResponse');
const advancedResults = require('../utils/advancedResults');
const Course = require('../models/Course');
const Bootcamp = require('../models/Bootcamp');

/**
 * Get courses
 * @route   GET /api/courses
 * @route   GET /api/bootcamps/:bootcampId/courses
 * @access  Public
 */
exports.index = async (req, res) => {
  if (req.params.bootcampId) {
    const courses = await Course.find({ bootcamp: req.params.bootcampId });
    return res.json({
      success: true,
      count: courses.length,
      data: courses,
    });
  }

  const results = await advancedResults(req, Course, {
    path: 'bootcamp',
    select: 'name description',
  });
  res.json(results);
};

/**
 * Create a new bootcamp course
 * @route   POST /api/bootcamps/:bootcampId/courses
 * @access  Private
 */
exports.create = async (req, res) => {
  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id;

  const bootcamp = await Bootcamp.findById(req.params.bootcampId);
  if (!bootcamp) throw new ErrorResponse('Bootcamp Not Found', 404);
  if (bootcamp.user.toHexString() !== req.user.id && req.user.role !== 'admin')
    throw new ErrorResponse('Unauthorized', 403);

  const course = await Course.create(req.body);

  res.json({ success: true, data: course });
};

/**
 * Get a single course
 * @route   GET /api/courses/:id
 * @access  Public
 */
exports.show = async (req, res) => {
  const course = await Course.findById(req.params.id).populate({
    path: 'bootcamp',
    select: 'name description',
  });

  if (!course) throw new ErrorResponse('Course Not Found', 404);

  res.json({ success: true, data: course });
};

/**
 * Update a course
 * @route   PUT /api/courses/:id
 * @access  Private
 */
exports.update = async (req, res) => {
  let course = await Course.findById(req.params.id);

  if (!course) throw new ErrorResponse('Course Not Found', 404);
  if (course.user.toHexString() !== req.user.id && req.user.role !== 'admin')
    throw new ErrorResponse('Unauthorized', 403);

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, data: course });
};

/**
 * Delete a course
 * @route   DELETE /api/courses/:id
 * @access  Private
 */
exports.destroy = async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) throw new ErrorResponse('Course Not Found', 404);
  if (course.user.toHexString() !== req.user.id && req.user.role !== 'admin')
    throw new ErrorResponse('Unauthorized', 403);

  await course.remove();

  res.json({ success: true, data: {} });
};
