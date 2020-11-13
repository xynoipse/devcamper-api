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

  describe('PUT /updatedetails', () => {
    let token;
    let body;

    const exec = () => {
      return request
        .put('/api/auth/updatedetails')
        .set('Authorization', `Bearer ${token}`)
        .send(body);
    };

    beforeEach(() => {
      token = user.generateAuthToken();

      body = {
        name: 'newName',
        email: 'newemail@email.com',
      };
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 400 if client token is invalid', async () => {
      token = 'a';

      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 if there is a duplicate key error', async () => {
      body.email = 'user2@email.com';

      await User.create({
        name: 'user2',
        email: 'user2@email.com',
        password: 'password',
      });

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

    it('should return 200 if it is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return the updated user if it is valid', async () => {
      const res = await exec();

      expect(res.body.data).toHaveProperty('_id', user._id.toHexString());
      expect(res.body.data).toHaveProperty('name', body.name);
      expect(res.body.data).toHaveProperty('email', body.email);
    });
  });

  describe('PUT /updatepassword', () => {
    let token;
    let body;

    const exec = () => {
      return request
        .put('/api/auth/updatepassword')
        .set('Authorization', `Bearer ${token}`)
        .send(body);
    };

    beforeEach(() => {
      token = user.generateAuthToken();

      body = {
        currentPassword: 'password',
        newPassword: 'newPassword',
      };
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 400 if client token is invalid', async () => {
      token = 'a';

      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 if current password is invalid', async () => {
      body.currentPassword = '12345678';

      const res = await exec();

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 200 if it is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return a token response if it is valid', async () => {
      const res = await exec();

      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    it('should update the user password if it is valid', async () => {
      await exec();

      const userInDb = await User.findById(user._id).select('+password');
      const matchNewPassword = await userInDb.validatePassword(
        body.newPassword
      );

      expect(matchNewPassword).toBe(true);
    });
  });

  describe('POST /forgotpassword', () => {
    let email;

    const exec = () => {
      return request.post('/api/auth/forgotpassword').send({ email });
    };

    beforeEach(() => {
      email = 'user1@email.com';
    });

    it('should return 404 if user with the given email was not found', async () => {
      email = 'user2@email.com';

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 200 if it is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should set the hashed resetToken to user resetPasswordToken field', async () => {
      await exec();

      const user = await User.findOne({ email });

      expect(user.resetPasswordToken).toBeDefined();
    });

    it('should set the user resetPasswordExpire field', async () => {
      await exec();

      const user = await User.findOne({ email });

      expect(user.resetPasswordExpire).toBeDefined();
    });
  });

  describe('PUT /resetpassword/:resettoken', () => {
    let resetToken;
    let password;

    const exec = () => {
      return request
        .put(`/api/auth/resetpassword/${resetToken}`)
        .send({ password });
    };

    beforeEach(async () => {
      resetToken = await user.getResetPasswordToken();

      password = 'newPassword';
    });

    it('should return 400 if reset token is invalid', async () => {
      resetToken = 'a';

      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 400 if reset token is expired', async () => {
      user.resetPasswordExpire = Date.now() - 10 * 60 * 1000;
      await user.save({ validateBeforeSave: false });

      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 200 if it is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return a token response if it is valid', async () => {
      const res = await exec();

      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    it('should update the user password if it is valid', async () => {
      await exec();

      const userInDb = await User.findById(user._id).select('+password');
      const matchNewPassword = await userInDb.validatePassword(password);

      expect(matchNewPassword).toBe(true);
    });

    it('should remove user resetPasswordToken and resetPasswordExpire field', async () => {
      await exec();

      const userInDb = await User.findById(user._id);

      expect(userInDb.resetPasswordToken).not.toBeDefined();
      expect(userInDb.resetPasswordExpire).not.toBeDefined();
    });
  });
});
