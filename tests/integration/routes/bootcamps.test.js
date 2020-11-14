const supertest = require('supertest');
const mongoose = require('mongoose');
const Bootcamp = require('../../../models/Bootcamp');
const Course = require('../../../models/Course');
const Review = require('../../../models/Review');
const User = require('../../../models/User');
const app = require('../../../app');
const request = supertest(app);

describe('/api/bootcamps', () => {
  let publisher;
  let user;

  beforeAll(async () => {
    publisher = await User.create({
      name: 'Publisher',
      email: 'publisher@publisher.com',
      password: 'password',
      role: 'publisher',
    });

    user = await User.create({
      name: 'User',
      email: 'user@user.com',
      password: 'password',
      role: 'user',
    });
  });

  afterAll(async () => {
    await User.deleteMany();
    mongoose.connection.close();
  });

  afterEach(async () => {
    await Bootcamp.deleteMany();
  });

  describe('GET /', () => {
    let query;

    const exec = () => {
      return request.get('/api/bootcamps').query(query);
    };

    beforeEach(async () => {
      await Bootcamp.insertMany([
        {
          name: 'bootcamp1',
          description: 'description',
          address: 'address',
          jobGuarantee: true,
          careers: ['Web Development'],
          user: publisher._id,
        },
        {
          name: 'bootcamp2',
          description: 'description',
          address: 'address',
          jobGuarantee: false,
          careers: ['Mobile Development'],
          user: publisher._id,
        },
      ]);
    });

    it('should return all bootcamps', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data.some((b) => b.name === 'bootcamp1')).toBeTruthy();
      expect(res.body.data.some((b) => b.name === 'bootcamp2')).toBeTruthy();
    });

    it('should return filtered bootcamps if fields in query string is set', async () => {
      jobGuarantee = true;
      careers = ['Web Development'];

      query = { jobGuarantee, 'careers[in]': careers };
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ jobGuarantee }),
          expect.objectContaining({
            careers: expect.arrayContaining(careers),
          }),
        ])
      );
    });

    it('should return all bootcamps to only have the selected fields', async () => {
      query = { select: 'name,description' };
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            description: expect.any(String),
          }),
          expect.not.objectContaining({
            address: expect.any(String),
          }),
        ])
      );
    });

    it('should return sorted bootcamps if query string sort parameter is set', async () => {
      query = { sort: 'name' };
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data[0].name).toBe('bootcamp1');
      expect(res.body.data[1].name).toBe('bootcamp2');
    });

    it('should return paginated bootcamps if query string limit parameter is set', async () => {
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

    it('should return page paginated bootcamps if query string page parameter is set', async () => {
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

  describe('POST /', () => {
    let token;
    let body;

    const exec = () => {
      return request
        .post('/api/bootcamps')
        .set('Authorization', `Bearer ${token}`)
        .send(body);
    };

    beforeEach(async () => {
      token = publisher.generateAuthToken();

      body = {
        name: 'bootcamp1',
        description: 'description',
        address: 'address',
        careers: ['Web Development'],
        user: new mongoose.Types.ObjectId().toHexString(),
      };
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 403 if client is unauthorized', async () => {
      token = user.generateAuthToken();

      const res = await exec();

      expect(res.status).toBe(403);
    });

    it('should return 400 if there is a duplicate key error', async () => {
      await Bootcamp.insertMany([body]);

      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
      expect(res.body.errors.name).toBeDefined();
    });

    it('should return 400 if there is a validation error', async () => {
      delete body.name;

      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
      expect(res.body.errors.name).toBeDefined();
    });

    it('should return 400 if client already published a bootcamp', async () => {
      body.user = publisher._id;
      await Bootcamp.insertMany([body]);

      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should save the bootcamp if it is valid', async () => {
      await exec();

      const bootcamp = await Bootcamp.findOne({ name: body.name });

      expect(bootcamp).not.toBeNull();
    });

    it('should return the created bootcamp if it is valid', async () => {
      const res = await exec();

      const bootcamp = await Bootcamp.findOne({ name: body.name });

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data).toHaveProperty('name', bootcamp.name);
    });

    it('should geocode the address to location field if it is valid', async () => {
      await exec();

      const bootcamp = await Bootcamp.findOne({ name: body.name });

      expect(bootcamp.address).not.toBeDefined();
      expect(bootcamp.location).toEqual(
        expect.objectContaining({
          type: 'Point',
          coordinates: expect.any(Array),
        })
      );
    });
  });

  describe('GET /:id', () => {
    let id;
    let bootcamp;

    const exec = () => {
      return request.get(`/api/bootcamps/${id}`);
    };

    beforeEach(async () => {
      bootcamp = await Bootcamp.create({
        name: 'bootcamp1',
        description: 'description',
        address: 'address',
        careers: ['Web Development'],
        user: publisher._id,
      });

      id = bootcamp._id;
    });

    it('should return 404 if id is invalid', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 404 if bootcamp with the given id was not found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return a bootcamp if id is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', bootcamp.name);
    });
  });

  describe('PUT /:id', () => {
    let token;
    let id;
    let name;

    const exec = () => {
      return request
        .put(`/api/bootcamps/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name });
    };

    beforeEach(async () => {
      token = publisher.generateAuthToken();

      await Bootcamp.insertMany([
        {
          name: 'bootcamp1',
          description: 'description',
          address: 'address',
          careers: ['Web Development'],
          user: publisher._id,
        },
        {
          name: 'bootcamp2',
          description: 'description',
          address: 'address',
          careers: ['Mobile Development'],
          user: new mongoose.Types.ObjectId().toHexString(),
        },
      ]);

      const bootcamp = await Bootcamp.findOne();

      id = bootcamp._id;
      name = 'newName';
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 403 if client is unauthorized', async () => {
      token = user.generateAuthToken();

      const res = await exec();

      expect(res.status).toBe(403);
    });

    it('should return 400 if there is a duplicate key error', async () => {
      name = 'bootcamp2';

      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
      expect(res.body.errors.name).toBeDefined();
    });

    it('should return 400 if there is a validation error', async () => {
      name = '';

      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
      expect(res.body.errors.name).toBeDefined();
    });

    it('should return 404 if id is invalid', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 404 if bootcamp with the given id was not found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 403 if client does not own the bootcamp', async () => {
      const bootcamp = await Bootcamp.findOne({ name: 'bootcamp2' });
      id = bootcamp._id;

      const res = await exec();

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should update the bootcamp if it is valid', async () => {
      await exec();

      const bootcamp = await Bootcamp.findById(id);

      expect(bootcamp).not.toBeNull();
      expect(bootcamp.name).toBe(name);
    });

    it('should return the updated bootcamp if it is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', name);
    });
  });

  describe('DELETE /:id', () => {
    let token;
    let id;

    const exec = () => {
      return request
        .delete(`/api/bootcamps/${id}`)
        .set('Authorization', `Bearer ${token}`);
    };

    beforeEach(async () => {
      token = publisher.generateAuthToken();

      await Bootcamp.insertMany([
        {
          name: 'bootcamp1',
          description: 'description',
          address: 'address',
          careers: ['Web Development'],
          user: publisher._id,
        },
        {
          name: 'bootcamp2',
          description: 'description',
          address: 'address',
          careers: ['Mobile Development'],
          user: new mongoose.Types.ObjectId().toHexString(),
        },
      ]);

      const bootcamp = await Bootcamp.findOne();

      id = bootcamp._id;
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 403 if client is unauthorized', async () => {
      token = user.generateAuthToken();

      const res = await exec();

      expect(res.status).toBe(403);
    });

    it('should return 404 if id is invalid', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 404 if bootcamp with the given id was not found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 403 if client does not own the bootcamp', async () => {
      const bootcamp = await Bootcamp.findOne({ name: 'bootcamp2' });
      id = bootcamp._id;

      const res = await exec();

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should delete the bootcamp if it is valid', async () => {
      await exec();

      const deletedBootcamp = await Bootcamp.findById(id);

      expect(deletedBootcamp).toBeNull();
    });

    it('should return 200 if it is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /:bootcampId/courses', () => {
    let bootcamp;
    let bootcampId;
    let courses;

    const exec = () => {
      return request.get(`/api/bootcamps/${bootcampId}/courses`);
    };

    beforeEach(async () => {
      bootcamp = await Bootcamp.create({
        name: 'bootcamp1',
        description: 'description',
        address: 'address',
        careers: ['Web Development'],
        user: publisher._id,
      });

      bootcampId = bootcamp._id;

      courses = await Course.insertMany([
        {
          title: 'course1',
          description: 'description',
          weeks: 1,
          tuition: 1000,
          minimumSkill: 'beginner',
          bootcamp: bootcamp._id,
          user: publisher._id,
        },
        {
          title: 'course2',
          description: 'description',
          weeks: 2,
          tuition: 2000,
          minimumSkill: 'intermediate',
          bootcamp: bootcamp._id,
          user: publisher._id,
        },
      ]);
    });

    afterEach(async () => {
      await Course.deleteMany();
    });

    it('should return 404 if bootcampId is invalid', async () => {
      bootcampId = 1;

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 200 with 0 data if bootcamp with the given bootcampId was not found', async () => {
      bootcampId = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(0);
    });

    it('should return all bootcamp courses if id is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data.some((c) => c.title === 'course1')).toBeTruthy();
      expect(res.body.data.some((c) => c.title === 'course2')).toBeTruthy();
    });
  });

  describe('POST /:bootcampId/courses', () => {
    let token;
    let bootcamp;
    let bootcampId;
    let body;

    const exec = () => {
      return request
        .post(`/api/bootcamps/${bootcampId}/courses`)
        .set('Authorization', `Bearer ${token}`)
        .send(body);
    };

    beforeEach(async () => {
      token = publisher.generateAuthToken();

      await Bootcamp.insertMany([
        {
          name: 'bootcamp1',
          description: 'description',
          address: 'address',
          careers: ['Web Development'],
          user: publisher._id,
        },
        {
          name: 'bootcamp2',
          description: 'description',
          address: 'address',
          careers: ['Mobile Development'],
          user: new mongoose.Types.ObjectId().toHexString(),
        },
      ]);

      const bootcamp = await Bootcamp.findOne();

      bootcampId = bootcamp._id;

      body = {
        title: 'course1',
        description: 'description',
        weeks: 1,
        tuition: 1000,
        minimumSkill: 'beginner',
        bootcamp: bootcamp._id,
      };
    });

    afterEach(async () => {
      await Course.deleteMany();
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 403 if client is unauthorized', async () => {
      token = user.generateAuthToken();

      const res = await exec();

      expect(res.status).toBe(403);
    });

    it('should return 400 if there is a validation error', async () => {
      delete body.title;

      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
      expect(res.body.errors.title).toBeDefined();
    });

    it('should return 404 if bootcampId is invalid', async () => {
      bootcampId = 1;

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 404 if bootcamp with the given bootcampId was not found', async () => {
      bootcampId = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 403 if client does not own the bootcamp', async () => {
      const bootcamp = await Bootcamp.findOne({ name: 'bootcamp2' });
      bootcampId = bootcamp._id;

      const res = await exec();

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should save the bootcamp course if it is valid', async () => {
      await exec();

      const course = await Course.findOne({ bootcamp: bootcampId });

      expect(course).not.toBeNull();
      expect(course).toHaveProperty('title', body.title);
    });

    it('should return the created bootcamp course if it is valid', async () => {
      const res = await exec();

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data).toHaveProperty('title', body.title);
      expect(res.body.data).toHaveProperty(
        'bootcamp',
        bootcampId.toHexString()
      );
    });
  });

  describe('GET /:bootcampId/review', () => {
    let bootcamp;
    let bootcampId;

    const exec = () => {
      return request.get(`/api/bootcamps/${bootcampId}/reviews`);
    };

    beforeEach(async () => {
      bootcamp = await Bootcamp.create({
        name: 'bootcamp1',
        description: 'description',
        address: 'address',
        careers: ['Web Development'],
        user: publisher._id,
      });

      bootcampId = bootcamp._id;

      await Review.insertMany([
        {
          title: 'review1',
          text: 'text',
          rating: 1,
          bootcamp: bootcamp._id,
          user: user._id,
        },
        {
          title: 'review2',
          text: 'text',
          rating: 2,
          bootcamp: bootcamp._id,
          user: mongoose.Types.ObjectId(),
        },
      ]);
    });

    afterEach(async () => {
      await Review.deleteMany();
    });

    it('should return 404 if bootcampId is invalid', async () => {
      bootcampId = 1;

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 200 with 0 data if bootcamp with the given bootcampId was not found', async () => {
      bootcampId = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(0);
    });

    it('should return all bootcamp reviews if id is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data.some((r) => r.title === 'review1')).toBeTruthy();
      expect(res.body.data.some((r) => r.title === 'review2')).toBeTruthy();
    });
  });

  describe('POST /:bootcampId/reviews', () => {
    let token;
    let bootcamp;
    let bootcampId;
    let body;

    const exec = () => {
      return request
        .post(`/api/bootcamps/${bootcampId}/reviews`)
        .set('Authorization', `Bearer ${token}`)
        .send(body);
    };

    beforeEach(async () => {
      token = user.generateAuthToken();

      bootcamp = await Bootcamp.create({
        name: 'bootcamp1',
        description: 'description',
        address: 'address',
        careers: ['Web Development'],
        user: publisher._id,
      });

      bootcampId = bootcamp._id;

      body = {
        title: 'review1',
        text: 'text',
        rating: 1,
      };
    });

    afterEach(async () => {
      await Review.deleteMany();
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 403 if client is unauthorized', async () => {
      token = publisher.generateAuthToken();

      const res = await exec();

      expect(res.status).toBe(403);
    });

    it('should return 400 if client already submitted a review', async () => {
      await Review.create({
        title: 'review1',
        text: 'text',
        rating: 1,
        bootcamp: bootcamp._id,
        user: user._id,
      });

      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 400 if there is a validation error', async () => {
      body.title = '';

      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
      expect(res.body.errors.title).toBeDefined();
    });

    it('should return 404 if bootcampId is invalid', async () => {
      bootcampId = 1;

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 404 if bootcamp with the given bootcampId was not found', async () => {
      bootcampId = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should save the bootcamp review if it is valid', async () => {
      await exec();

      const review = await Review.findOne({ bootcamp: bootcampId });

      expect(review).not.toBeNull();
      expect(review).toHaveProperty('title', body.title);
    });

    it('should return the created bootcamp review if it is valid', async () => {
      const res = await exec();

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data).toHaveProperty('title', body.title);
      expect(res.body.data).toHaveProperty(
        'bootcamp',
        bootcampId.toHexString()
      );
    });
  });
});
