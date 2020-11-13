const supertest = require('supertest');
const mongoose = require('mongoose');
const User = require('../../../models/User');
const app = require('../../../app');
const request = supertest(app);

describe('/api/users', () => {
  let admin;

  beforeEach(async () => {
    admin = new User({
      name: 'admin',
      email: 'admin@admin.com',
      password: 'password',
      role: 'admin',
    });

    await admin.save({ validateBeforeSave: false });
  });

  afterAll(async () => {
    mongoose.connection.close();
  });

  afterEach(async () => {
    await User.deleteMany();
  });

  describe('GET /', () => {
    let token;
    let query;

    const exec = () => {
      return request
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .query(query);
    };

    beforeEach(async () => {
      token = admin.generateAuthToken();

      await User.insertMany([
        {
          name: 'user1',
          email: 'user1@user.com',
          password: 'password',
        },
        {
          name: 'user2',
          email: 'user2@user.com',
          password: 'password',
        },
      ]);
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 403 if client is unauthorized', async () => {
      const user = await User.findOne({ role: 'user' });
      token = user.generateAuthToken();

      const res = await exec();

      expect(res.status).toBe(403);
    });

    it('should return all users', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(3);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data.some((u) => u.name === 'user1')).toBeTruthy();
      expect(res.body.data.some((u) => u.name === 'user2')).toBeTruthy();
    });

    it('should return filtered users if fields in query string is set', async () => {
      role = 'user';

      query = { role };
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data).toEqual(
        expect.arrayContaining([expect.objectContaining({ role })])
      );
    });

    it('should return all users to only have the selected fields', async () => {
      query = { select: 'name,email' };
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(3);
      expect(res.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            email: expect.any(String),
          }),
          expect.not.objectContaining({
            role: expect.any(String),
          }),
        ])
      );
    });

    it('should return sorted users if query string sort parameter is set', async () => {
      query = { sort: 'name' };
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(3);
      expect(res.body.data[1].name).toBe('user1');
      expect(res.body.data[2].name).toBe('user2');
    });

    it('should return paginated users if query string limit parameter is set', async () => {
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

    it('should return page paginated users if query string page parameter is set', async () => {
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
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send(body);
    };

    beforeEach(() => {
      token = admin.generateAuthToken();

      body = {
        name: 'user',
        email: 'user@email.com',
        password: 'password',
      };
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 403 if client is unauthorized', async () => {
      const user = await User.create({
        name: 'name',
        email: 'email@email.com',
        password: 'password',
      });
      token = user.generateAuthToken();

      const res = await exec();

      expect(res.status).toBe(403);
    });

    it('should return 400 if there is a duplicate key error', async () => {
      body.email = 'admin@admin.com';

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

    it('should return the created user if it is valid', async () => {
      const res = await exec();

      const user = await User.findOne({ email: body.email });

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data).toHaveProperty('email', user.email);
    });
  });

  describe('GET /:id', () => {
    let id;
    let token;
    let user;

    const exec = () => {
      return request
        .get(`/api/users/${id}`)
        .set('Authorization', `Bearer ${token}`);
    };

    beforeEach(async () => {
      token = admin.generateAuthToken();

      user = await User.create({
        name: 'user',
        email: 'user@email.com',
        password: 'password',
      });

      id = user._id;
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 403 if client is unauthorized', async () => {
      const user = await User.create({
        name: 'name',
        email: 'email@email.com',
        password: 'password',
      });
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

    it('should return 404 if user with the given id was not found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return a user if id is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id', user._id.toHexString());
      expect(res.body.data).toHaveProperty('name', user.name);
      expect(res.body.data).toHaveProperty('email', user.email);
    });
  });

  describe('PUT /:id', () => {
    let token;
    let id;
    let user;
    let email;

    const exec = () => {
      return request
        .put(`/api/users/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ email });
    };

    beforeEach(async () => {
      token = admin.generateAuthToken();

      user = await User.create({
        name: 'user',
        email: 'user@email.com',
        password: 'password',
      });

      id = user._id;
      email = 'newemail@email.com';
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
      email = 'admin@admin.com';

      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
      expect(res.body.errors.email).toBeDefined();
    });

    it('should return 400 if there is a validation error', async () => {
      email = '';

      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
      expect(res.body.errors.email).toBeDefined();
    });

    it('should return 404 if id is invalid', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 404 if user with the given id was not found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should update the user if it is valid', async () => {
      await exec();

      const user = await User.findById(id);

      expect(user).not.toBeNull();
      expect(user.email).toBe(email);
    });

    it('should return the updated user if it is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id', id.toHexString());
      expect(res.body.data).toHaveProperty('email', email);
    });
  });

  describe('DELETE /:id', () => {
    let token;
    let id;

    const exec = () => {
      return request
        .delete(`/api/users/${id}`)
        .set('Authorization', `Bearer ${token}`);
    };

    beforeEach(async () => {
      token = admin.generateAuthToken();

      user = await User.create({
        name: 'user',
        email: 'user@email.com',
        password: 'password',
      });

      id = user._id;
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

    it('should return 404 if user with the given id was not found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should delete the user if it is valid', async () => {
      await exec();

      const deletedUser = await User.findById(id);

      expect(deletedUser).toBeNull();
    });

    it('should return 200 if it is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
