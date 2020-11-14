const supertest = require('supertest');
const mongoose = require('mongoose');
const Review = require('../../../models/Review');
const Bootcamp = require('../../../models/Bootcamp');
const User = require('../../../models/User');
const app = require('../../../app');
const request = supertest(app);

describe('/api/reviews', () => {
  let publisher;
  let user;
  let bootcamp;

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

    bootcamp = await Bootcamp.create({
      name: 'bootcamp1',
      description: 'description',
      address: 'address',
      careers: ['Web Development'],
      user: publisher._id,
    });
  });

  afterAll(async () => {
    await User.deleteMany();
    await Bootcamp.deleteMany();
    mongoose.connection.close();
  });

  afterEach(async () => {
    await Review.deleteMany();
  });

  describe('GET /', () => {
    let query;

    const exec = () => {
      return request.get('/api/reviews').query(query);
    };

    beforeEach(async () => {
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

    it('should return all reviews with populated bootcamp field', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data.some((r) => r.title === 'review1')).toBeTruthy();
      expect(res.body.data.some((r) => r.title === 'review2')).toBeTruthy();
      expect(
        res.body.data.some((r) => r.bootcamp._id === bootcamp._id.toHexString())
      ).toBeTruthy();
    });

    it('should return filtered reviews if fields in query string is set', async () => {
      rating = 1;

      query = { 'rating[lte]': rating };
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ title: 'review1' }),
          expect.objectContaining({ rating: expect.any(Number) }),
        ])
      );
      expect(res.body.data[0].rating).toBeLessThanOrEqual(rating);
    });

    it('should return all reviews to only have the selected fields', async () => {
      query = { select: 'title,text' };
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: expect.any(String),
            text: expect.any(String),
          }),
          expect.not.objectContaining({
            rating: expect.any(String),
          }),
        ])
      );
    });

    it('should return sorted reviews if query string sort parameter is set', async () => {
      query = { sort: '-title' };
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data[0].title).toBe('review2');
      expect(res.body.data[1].title).toBe('review1');
    });

    it('should return paginated reviews if query string limit parameter is set', async () => {
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

    it('should return page paginated reviews if query string page parameter is set', async () => {
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
    let review;

    const exec = () => {
      return request.get(`/api/reviews/${id}`);
    };

    beforeEach(async () => {
      review = await Review.create({
        title: 'review1',
        text: 'text',
        rating: 1,
        bootcamp: bootcamp._id,
        user: user._id,
      });

      id = review._id;
    });

    it('should return 404 if id is invalid', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 404 if review with the given id was not found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return a review if id is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', review.name);
    });
  });

  describe('PUT /:id', () => {
    let token;
    let id;
    let title;

    const exec = () => {
      return request
        .put(`/api/reviews/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title });
    };

    beforeEach(async () => {
      token = user.generateAuthToken();

      review = await Review.create({
        title: 'review',
        text: 'text',
        rating: 1,
        bootcamp: bootcamp._id,
        user: user._id,
      });

      id = review._id;
      title = 'newTitle';
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

    it('should return 404 if review with the given id was not found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 403 if client does not own the review', async () => {
      const review = await Review.create({
        title: 'review',
        text: 'text',
        rating: 1,
        bootcamp: bootcamp._id,
        user: mongoose.Types.ObjectId(),
      });
      id = review._id;

      const res = await exec();

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should update the review if it is valid', async () => {
      await exec();

      const review = await Review.findById(id);

      expect(review).not.toBeNull();
      expect(review.title).toBe(title);
    });

    it('should return the updated review if it is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('title', title);
    });
  });

  describe('DELETE /:id', () => {
    let token;
    let id;

    const exec = () => {
      return request
        .delete(`/api/reviews/${id}`)
        .set('Authorization', `Bearer ${token}`);
    };

    beforeEach(async () => {
      token = user.generateAuthToken();

      review = await Review.create({
        title: 'review',
        text: 'text',
        rating: 1,
        bootcamp: bootcamp._id,
        user: user._id,
      });

      id = review._id;
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

    it('should return 404 if id is invalid', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 404 if review with the given id was not found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 403 if client does not own the review', async () => {
      const review = await Review.create({
        title: 'review',
        text: 'text',
        rating: 1,
        bootcamp: bootcamp._id,
        user: mongoose.Types.ObjectId(),
      });
      id = review._id;

      const res = await exec();

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should delete the review if it is valid', async () => {
      await exec();

      const deletedReview = await Review.findById(id);

      expect(deletedReview).toBeNull();
    });

    it('should return 200 if it is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
