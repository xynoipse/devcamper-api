require('express-async-errors');
const express = require('express');
const errorHandler = require('../middleware/errorHandler');

module.exports = (app) => {
  app.use(express.json());

  app.use(errorHandler);
};
