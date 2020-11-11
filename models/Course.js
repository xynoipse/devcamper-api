const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, 'The title field is required'],
  },
  description: {
    type: String,
    required: [true, 'The description field is required'],
  },
  weeks: {
    type: Number,
    required: [true, 'The number of weeks is required'],
  },
  tuition: {
    type: Number,
    required: [true, 'The tuition cost is required'],
  },
  minimumSkill: {
    type: String,
    required: [true, 'The minimum skill field is required'],
    enum: ['beginner', 'intermediate', 'advanced'],
  },
  scholarshipAvailable: {
    type: Boolean,
    default: false,
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

// Call getAverageCost after save
courseSchema.post('save', async function () {
  await this.model('Bootcamp').getAverageCost(this.bootcamp);
});

// Call getAverageCost after remove
courseSchema.post('remove', async function () {
  await this.model('Bootcamp').getAverageCost(this.bootcamp);
});

module.exports = mongoose.model('Course', courseSchema);
