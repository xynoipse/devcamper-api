const supertest = require('supertest');
const mongoose = require('mongoose');
const auth = require('../../../middleware/auth');
const User = require('../../../models/User');
const Bootcamp = require('../../../models/Bootcamp');
const app = require('../../../app');
const request = supertest(app);

describe('auth middleware', () => {
  let token;
  let user;

  const exec = () => {
    return request
      .post('/api/bootcamps')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'bootcamp',
        description: 'description',
        address: 'address',
        careers: ['Web Development'],
      });
  };

  beforeAll(async () => {
    user = await User.create({
      name: 'User',
      email: 'user@user.com',
      password: 'password',
      role: 'publisher',
    });
  });

  beforeEach(() => {
    token = user.generateAuthToken();
  });

  afterAll(async () => {
    await User.deleteMany();
    mongoose.connection.close();
  });

  afterEach(async () => {
    await Bootcamp.deleteMany();
  });

  describe('protect', () => {
    it('should return 401 if no token is provided', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 if token is invalid', async () => {
      token = 'a';

      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 201 if token is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should populate req.user with valid user if token is valid', async () => {
      const token = new User(user).generateAuthToken();
      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
      const res = {};
      const next = jest.fn();

      await auth.protect(req, res, next);

      expect(req.user).toHaveProperty('_id', user._id);
      expect(req.user).toHaveProperty('name', user.name);
      expect(req.user).toHaveProperty('email', user.email);
    });
  });

  describe('authorize', () => {
    it('should return 201 if role is authorized', async () => {
      const res = await exec();

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 403 if role is unauthorized', async () => {
      await User.findByIdAndUpdate(user._id, { role: 'user' });

      const res = await exec();

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
