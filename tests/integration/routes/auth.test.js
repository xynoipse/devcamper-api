const supertest = require('supertest');
const mongoose = require('mongoose');
const User = require('../../../models/User');
const app = require('../../../app');
const request = supertest(app);

describe('/api/auth', () => {
  let user;

  beforeEach(async () => {
    user = await User.create({
      name: 'user1',
      email: 'user1@email.com',
      password: 'password',
    });
  });

  afterAll(async () => {
    mongoose.connection.close();
  });

  afterEach(async () => {
    await User.deleteMany();
  });

  describe('POST /register', () => {
    let body;

    const exec = () => {
      return request.post('/api/auth/register').send(body);
    };

    beforeEach(() => {
      body = {
        name: 'user2',
        email: 'user2@email.com',
        password: 'password',
      };
    });

    it('should return 400 if there is a duplicate key error', async () => {
      body.email = 'user1@email.com';

      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
      expect(res.body.errors.email).toBeDefined();
    });

    it('should return 400 if there is a validation error', async () => {
      body.name = '';

      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
      expect(res.body.errors.name).toBeDefined();
    });

    it('should save the user if it is valid', async () => {
      await exec();

      const user = await User.findOne({ email: body.email });

      expect(user).not.toBeNull();
    });

    it('should return a token response if it is valid', async () => {
      const res = await exec();

      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });
  });

  describe('POST /login', () => {
    let body;

    const exec = () => {
      return request.post('/api/auth/login').send(body);
    };

    beforeEach(() => {
      body = {
        email: 'user1@email.com',
        password: 'password',
      };
    });

    it('should return 400 if email or password is empty', async () => {
      body.email = '';
      body.password = '';

      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 401 if user with the given email was not found', async () => {
      body.email = 'user2@email.com';

      const res = await exec();

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 401 if it is invalid password', async () => {
      body.password = '12345678';

      const res = await exec();

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return a token response if it is valid', async () => {
      const res = await exec();

      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });
  });

  describe('GET /me', () => {
    const exec = () => {
      return request
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
    };

    beforeEach(() => {
      token = user.generateAuthToken();
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 if client token is invalid', async () => {
      token = 'a';

      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 200 if it is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return the current auth user if it is valid', async () => {
      const res = await exec();

      expect(res.body.data).toHaveProperty('_id', user._id.toHexString());
      expect(res.body.data).toHaveProperty('email', user.email);
    });
  });
});
