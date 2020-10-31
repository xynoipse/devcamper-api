const supertest = require('supertest');
const mongoose = require('mongoose');
const Course = require('../../../models/Course');
const Bootcamp = require('../../../models/Bootcamp');
const app = require('../../../app');
const request = supertest(app);

describe('/api/courses', () => {
  let bootcamp;

  beforeAll(async () => {
    bootcamp = await Bootcamp.create({
      name: 'bootcamp1',
      description: 'description',
      address: 'address',
      careers: ['Web Development'],
    });
  });

  afterAll(async () => {
    await Bootcamp.deleteMany();
    mongoose.connection.close();
  });

  afterEach(async () => {
    await Course.deleteMany();
  });

  describe('GET /', () => {
    let query;

    const exec = () => {
      return request.get('/api/courses').query(query);
    };

    beforeEach(async () => {
      await Course.insertMany([
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
          minimumSkill: 'intermediate',
          bootcamp: bootcamp._id,
        },
      ]);
    });

    it('should return all courses with populated bootcamp field', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data.some((c) => c.title === 'course1')).toBeTruthy();
      expect(res.body.data.some((c) => c.title === 'course2')).toBeTruthy();
      expect(
        res.body.data.some((c) => c.bootcamp._id === bootcamp._id.toHexString())
      ).toBeTruthy();
    });

    it('should return filtered courses if fields in query string is set', async () => {
      minimumSkill = 'beginner';
      tuition = 1000;

      query = { minimumSkill, 'tuition[lte]': tuition };
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ minimumSkill }),
          expect.objectContaining({ tuition: expect.any(Number) }),
        ])
      );
      expect(res.body.data[0].tuition).toBeLessThanOrEqual(tuition);
    });

    it('should return all courses to only have the selected fields', async () => {
      query = { select: 'title,description' };
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: expect.any(String),
            description: expect.any(String),
          }),
          expect.not.objectContaining({
            minimumSkill: expect.any(String),
          }),
        ])
      );
    });

    it('should return sorted courses if query string sort parameter is set', async () => {
      query = { sort: '-title' };
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data[0].title).toBe('course2');
      expect(res.body.data[1].title).toBe('course1');
    });

    it('should return paginated courses if query string limit parameter is set', async () => {
      query = { limit: 1 };

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.pagination).toMatchObject({
        next: { page: 2, limit: 1 },
      });
      expect(res.body.data).toBeDefined();
    });

    it('should return page paginated courses if query string page parameter is set', async () => {
      query = { limit: 1, page: 2 };

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.pagination).toMatchObject({
        prev: { page: 1, limit: 1 },
      });
      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /:id', () => {
    let id;
    let course;

    const exec = () => {
      return request.get(`/api/courses/${id}`);
    };

    beforeEach(async () => {
      course = await Course.create({
        title: 'course1',
        description: 'description',
        weeks: 1,
        tuition: 1000,
        minimumSkill: 'beginner',
        bootcamp: bootcamp._id,
      });

      id = course._id;
    });

    it('should return 404 if id is invalid', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 404 if course with the given id was not found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return a course if id is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', course.name);
    });
  });

  describe('PUT /:id', () => {
    let id;
    let title;

    const exec = () => {
      return request.put(`/api/courses/${id}`).send({ title });
    };

    beforeEach(async () => {
      const course = await Course.create({
        title: 'course1',
        description: 'description',
        weeks: 1,
        tuition: 1000,
        minimumSkill: 'beginner',
        bootcamp: bootcamp._id,
      });

      id = course._id;
      title = 'newTitle';
    });

    it('should return 400 if there is a validation error', async () => {
      title = '';

      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
      expect(res.body.errors.title).toBeDefined();
    });

    it('should return 404 if id is invalid', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 404 if course with the given id was not found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should update the course if it is valid', async () => {
      await exec();

      const course = await Course.findById(id);

      expect(course).not.toBeNull();
      expect(course.title).toBe(title);
    });

    it('should return the updated course if it is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('title', title);
    });
  });

  describe('DELETE /:id', () => {
    let id;

    const exec = () => {
      return request.delete(`/api/courses/${id}`);
    };

    beforeEach(async () => {
      const course = await Course.create({
        title: 'course1',
        description: 'description',
        weeks: 1,
        tuition: 1000,
        minimumSkill: 'beginner',
        bootcamp: bootcamp._id,
      });

      id = course._id;
    });

    it('should return 404 if id is invalid', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 404 if course with the given id was not found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should delete the course if it is valid', async () => {
      await exec();

      const deletedCourse = await Course.findById(id);

      expect(deletedCourse).toBeNull();
    });

    it('should return 200 if it is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
