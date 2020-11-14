const mongoose = require('mongoose');
const db = require('../../../app/db');
const Review = require('../../../models/Review');
const Bootcamp = require('../../../models/Bootcamp');

describe('Review model', () => {
  let bootcamp;
  let review;

  beforeAll(async () => {
    await db();

    bootcamp = await Bootcamp.create({
      name: 'bootcamp1',
      description: 'description',
      address: 'address',
      careers: ['Web Development'],
      user: new mongoose.Types.ObjectId().toHexString(),
    });
  });

  afterAll(async () => {
    await Bootcamp.deleteMany();
    mongoose.connection.close();
  });

  beforeEach(async () => {
    const reviews = [
      {
        title: 'review1',
        text: 'text',
        rating: 1,
        bootcamp: bootcamp._id,
        user: new mongoose.Types.ObjectId().toHexString(),
      },
      {
        title: 'review2',
        text: 'text',
        rating: 2,
        bootcamp: bootcamp._id,
        user: new mongoose.Types.ObjectId().toHexString(),
      },
    ];

    for (const review of reviews) await Review.create(review);

    review = await Review.findOne();
  });

  afterEach(async () => {
    await Review.deleteMany();
  });

  const calculateBootcampAvgRating = async () => {
    let averageRating = 0;
    const reviews = await Review.find();

    for (const review of reviews) averageRating += review.rating;
    averageRating = averageRating / reviews.length;

    return averageRating;
  };

  it('should call bootcamp model getAverageRating static method after saving a review', async () => {
    await Review.create({
      title: 'review3',
      text: 'text',
      rating: 3,
      bootcamp: bootcamp._id,
      user: new mongoose.Types.ObjectId().toHexString(),
    });

    const bootcampInDb = await Bootcamp.findOne();

    expect(bootcampInDb.averageRating).toBe(await calculateBootcampAvgRating());
  });

  it('should call bootcamp model getAverageRating static method after removing a review', async () => {
    const reviewInDb = await Review.findById(review._id);
    await reviewInDb.remove();

    const bootcampInDb = await Bootcamp.findOne();

    expect(bootcampInDb.averageRating).toBe(await calculateBootcampAvgRating());
  });
});
