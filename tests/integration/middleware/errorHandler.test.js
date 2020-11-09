const supertest = require('supertest');
const mongoose = require('mongoose');
const Bootcamp = require('../../../models/Bootcamp');
const User = require('../../../models/User');
const app = require('../../../app');
const request = supertest(app);

describe('errorHandler middleware', () => {
  let method;
  let id;
  let user;
  let token;
  let body;
  let bootcamp;

  const exec = () => {
    return request[method](`/api/bootcamps/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  };

  beforeAll(async () => {
    user = await User.create({
      name: 'User',
      email: 'user@user.com',
      password: 'password',
      role: 'publisher',
    });

    token = user.generateAuthToken();
  });

  beforeEach(async () => {
    bootcamp = await Bootcamp.insertMany([
      {
        name: 'bootcamp1',
        description: 'description',
        address: 'address',
        careers: ['Web Development'],
      },
      {
        name: 'bootcamp2',
        description: 'description',
        address: 'address',
        careers: ['Mobile Development'],
      },
    ]);

    method = 'put';
    id = bootcamp[0].id;
    body = {};
  });

  afterAll(async () => {
    await User.deleteMany();
    mongoose.connection.close();
  });

  afterEach(async () => {
    await Bootcamp.deleteMany();
  });

  it('should return 404 if invalid or bad objectid is passed', async () => {
    id = '1';

    const res = await exec();

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Resource not found/);
    expect(res.body.errors).not.toBeDefined();
  });

  it('should return 400 if there is a mongoose duplicate key error collection', async () => {
    body = { name: 'bootcamp2' };

    const res = await exec();

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Duplicate field value entered/);
    expect(res.body.errors).toBeDefined();
  });

  it('should return 400 if there is a mongoose validation error', async () => {
    method = 'post';
    id = '';
    body = {};

    const res = await exec();

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/The given data was invalid/);
    expect(res.body.errors).toBeDefined();
  });
});
