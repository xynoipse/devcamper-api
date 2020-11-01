const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('config');
const User = require('../../../models/User');

describe('User model', () => {
  describe('user.generateAuthToken', () => {
    it('should return a valid JWT', () => {
      const payload = {
        _id: new mongoose.Types.ObjectId().toHexString(),
      };
      const user = new User(payload);
      const token = user.generateAuthToken();
      const decoded = jwt.verify(token, config.get('jwtSecret'));

      expect(decoded).toMatchObject(payload);
    });
  });

  describe('user.validatePassword', () => {
    let password;
    let user;

    beforeEach(async () => {
      password = 'password';
      const payload = { password };

      const salt = await bcrypt.genSalt(10);
      payload.password = await bcrypt.hash(payload.password, salt);

      user = new User(payload);
    });

    it('should return false if password doesnt match', async () => {
      password = '12345678';

      const validPassword = await user.validatePassword(password);

      expect(validPassword).toBe(false);
    });

    it('should return true if password match', async () => {
      const validPassword = await user.validatePassword(password);

      expect(validPassword).toBe(true);
    });
  });
});
