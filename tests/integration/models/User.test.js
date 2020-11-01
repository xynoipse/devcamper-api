const mongoose = require('mongoose');
const db = require('../../../app/db');
const User = require('../../../models/User');

describe('User model', () => {
  beforeAll(async () => {
    await db();
  });

  afterAll(async () => {
    await User.deleteMany();
    mongoose.connection.close();
  });

  it('should hash the password string before saving', async () => {
    body = {
      name: 'user',
      email: 'user@email.com',
      password: 'password',
    };

    user = await User.create(body);

    expect(user.password).not.toMatch(body.password);
  });
});
