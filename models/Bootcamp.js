const mongoose = require('mongoose');
const slugify = require('slugify');
const geocoder = require('../utils/geocoder');

const bootcampSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'The name field is required'],
      unique: true,
      trim: true,
      maxlength: [50, 'Name can not be more than 50 characters'],
    },
    slug: String,
    description: {
      type: String,
      required: [true, 'The description field is required'],
      maxlength: [500, 'Description can not be more than 500 characters'],
    },
    website: {
      type: String,
      match: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        'Please use a valid URL with HTTP or HTTPS',
      ],
    },
    phone: {
      type: String,
      maxlength: [20, 'Phone number can not be longer than 20 characters'],
    },
    email: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'The email must be a valid email address',
      ],
    },
    address: {
      type: String,
      required: [true, 'The address field is required'],
    },
    location: {
      // GeoJSON Point
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
        index: '2dsphere',
      },
      formattedAddress: String,
      street: String,
      city: String,
      state: String,
      zipcode: String,
      country: String,
    },
    careers: {
      type: [String],
      required: true,
      enum: [
        'Web Development',
        'Mobile Development',
        'UI/UX',
        'Data Science',
        'Business',
        'Other',
      ],
    },
    averageRating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [10, 'Rating must can not be more than 10'],
    },
    averageCost: Number,
    photo: {
      type: String,
      default: 'no-photo.jpg',
    },
    housing: {
      type: Boolean,
      default: false,
    },
    jobAssistance: {
      type: Boolean,
      default: false,
    },
    jobGuarantee: {
      type: Boolean,
      default: false,
    },
    acceptGi: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Calculate bootcamp averageCost
bootcampSchema.statics.getAverageCost = async function (bootcampId) {
  const obj = await this.model('Course').aggregate([
    {
      $match: { bootcamp: bootcampId },
    },
    {
      $group: {
        _id: '$bootcamp',
        averageCost: { $avg: '$tuition' },
      },
    },
  ]);

  try {
    if (obj[0]) {
      return await this.findByIdAndUpdate(bootcampId, {
        averageCost: Math.ceil(obj[0].averageCost / 10) * 10,
      });
    }

    await this.findByIdAndUpdate(bootcampId, {
      averageCost: undefined,
    });
  } catch (error) {
    console.log(error);
  }
};

// Calculate bootcamp averageRating
bootcampSchema.statics.getAverageRating = async function (bootcampId) {
  const obj = await this.model('Review').aggregate([
    {
      $match: { bootcamp: bootcampId },
    },
    {
      $group: {
        _id: '$bootcamp',
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  try {
    if (obj[0]) {
      return await this.findByIdAndUpdate(bootcampId, {
        averageRating: obj[0].averageRating,
      });
    }

    await this.findByIdAndUpdate(bootcampId, {
      averageRating: undefined,
    });
  } catch (error) {
    console.log(error);
  }
};

// Slug
bootcampSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Geocoder
bootcampSchema.pre('save', async function (next) {
  const [loc] = await geocoder.geocode(this.address);
  this.address = undefined;
  this.location = {
    type: 'Point',
    coordinates: [loc.longitude, loc.latitude],
    formattedAddress: loc.formattedAddress,
    street: loc.streetName,
    city: loc.city,
    state: loc.stateCode,
    zipcode: loc.zipcode,
    country: loc.countryCode,
  };
  next();
});

// Cascade delete courses
bootcampSchema.pre('remove', async function (next) {
  await this.model('Course').deleteMany({ bootcamp: this._id });
  next();
});

// Reverse populate with virtuals
bootcampSchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'bootcamp',
  justOne: false,
});

module.exports = mongoose.model('Bootcamp', bootcampSchema);
