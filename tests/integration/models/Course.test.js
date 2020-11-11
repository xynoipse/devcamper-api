const mongoose = require('mongoose');
const db = require('../../../app/db');
const Course = require('../../../models/Course');
const Bootcamp = require('../../../models/Bootcamp');

describe('Course model', () => {
  let bootcamp;
  let course;

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
    const courses = [
      {
        title: 'course1',
        description: 'description',
        weeks: 1,
        tuition: 1000,
        minimumSkill: 'beginner',
        bootcamp: bootcamp._id,
      },
      {
        title: 'course2',
        description: 'description',
        weeks: 2,
        tuition: 2000,
        minimumSkill: 'beginner',
        bootcamp: bootcamp._id,
      },
    ];

    for (const course of courses) await Course.create(course);

    course = await Course.findOne();
  });

  afterEach(async () => {
    await Course.deleteMany();
  });

  const calculateBootcampAvgCost = async () => {
    let averageCost = 0;
    const courses = await Course.find();

    for (const course of courses) averageCost += course.tuition;
    averageCost = averageCost / courses.length;

    return Math.ceil(averageCost / 10) * 10;
  };

  it('should call bootcamp model getAverageCost static method after saving a course', async () => {
    await Course.create({
      title: 'course3',
      description: 'description',
      weeks: 3,
      tuition: 3000,
      minimumSkill: 'beginner',
      bootcamp: bootcamp._id,
    });

    const bootcampInDb = await Bootcamp.findOne();

    expect(bootcampInDb.averageCost).toBe(await calculateBootcampAvgCost());
  });

  it('should call bootcamp model getAverageCost static method after removing a course', async () => {
    const courseInDb = await Course.findById(course._id);
    await courseInDb.remove();

    const bootcampInDb = await Bootcamp.findOne();

    console.log(await calculateBootcampAvgCost());
    expect(bootcampInDb.averageCost).toBe(await calculateBootcampAvgCost());
  });
});
