const ErrorResponse = require('../utils/errorResponse');
const advancedResults = require('../utils/advancedResults');
const imageUpload = require('../utils/imageUpload');
const geocoder = require('../utils/geocoder');
const Bootcamp = require('../models/Bootcamp');

/**
 * Get all bootcamps
 * @route   GET /api/bootcamps
 * @access  Public
 */
exports.index = async (req, res) => {
  const results = await advancedResults(req, Bootcamp, 'courses');
  res.json(results);
};

/**
 * Create a new bootcamp
 * @route   POST /api/bootcamps/
 * @access  Private
 */
exports.create = async (req, res) => {
  req.body.user = req.user.id;

  const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id });
  if (publishedBootcamp && req.user.role !== 'admin')
    throw new ErrorResponse('You have already published a bootcamp', 400);

  const bootcamp = await Bootcamp.create(req.body);

  res.status(201).json({ success: true, data: bootcamp });
};

/**
 * Get a bootcamp
 * @route   GET /api/bootcamps/:id
 * @access  Public
 */
exports.show = async (req, res) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) throw new ErrorResponse('Bootcamp Not Found', 404);

  res.json({ success: true, data: bootcamp });
};

/**
 * Update a bootcamp
 * @route   PUT /api/bootcamps/:id
 * @access  Private
 */
exports.update = async (req, res) => {
  let bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) throw new ErrorResponse('Bootcamp Not Found', 404);
  if (bootcamp.user.toHexString() !== req.user.id && req.user.role !== 'admin')
    throw new ErrorResponse('Unauthorized', 403);

  bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, data: bootcamp });
};

/**
 * Delete a bootcamp
 * @route   DELETE /api/bootcamps/:id
 * @access  Private
 */
exports.destroy = async (req, res) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) throw new ErrorResponse('Bootcamp Not Found', 404);
  if (bootcamp.user.toHexString() !== req.user.id && req.user.role !== 'admin')
    throw new ErrorResponse('Unauthorized', 403);

  await bootcamp.remove();

  res.json({ success: true, data: {} });
};

/**
 * Get bootcamps within a radius
 * @route   GET /api/bootcamps/radius/:zipcode/:distance
 * @access  Public
 */
exports.getInRadius = async (req, res) => {
  const { zipcode, distance } = req.params;

  const [loc] = await geocoder.geocode(zipcode);
  const lat = loc.latitude;
  const lng = loc.longitude;

  // Calc radius using radians
  // Divide dist by radius of earth
  // Earth Radius = 3,963 mi / 6,378 km
  const radius = distance / 3963;

  const bootcamps = await Bootcamp.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.json({
    success: true,
    count: bootcamps.length,
    data: bootcamps,
  });
};

/**
 * Upload bootcamp photo
 * @route   PUT /api/bootcamps/:id/photo
 * @access  Private
 */
exports.photoUpload = async (req, res) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) throw new ErrorResponse('Bootcamp Not Found', 404);
  if (bootcamp.user.toHexString() !== req.user.id && req.user.role !== 'admin')
    throw new ErrorResponse('Unauthorized', 403);
  if (!req.files) throw new ErrorResponse('Please upload a file', 400);

  const filename = imageUpload(req.files.file, `photo_${bootcamp._id}`);

  await Bootcamp.findByIdAndUpdate(req.params.id, { photo: filename });

  res.json({
    success: true,
    data: filename,
  });
};
