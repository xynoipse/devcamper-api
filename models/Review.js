const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, 'The title field is required'],
    maxlength: 100,
  },
  text: {
    type: String,
    required: [true, 'The text field is required'],
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    required: [true, 'The rating field is required'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  bootcamp: {
    type: mongoose.Schema.ObjectId,
    ref: 'Bootcamp',
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
});

reviewSchema.index({ bootcamp: 1, user: 1 }, { unique: true });

// Call bootcamp getAverageRating after save
reviewSchema.post('save', async function () {
  await this.model('Bootcamp').getAverageRating(this.bootcamp);
});

// Call bootcamp getAverageRating after remove
reviewSchema.post('remove', async function () {
  await this.model('Bootcamp').getAverageRating(this.bootcamp);
});

module.exports = mongoose.model('Review', reviewSchema);
