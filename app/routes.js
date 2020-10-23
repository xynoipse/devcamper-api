require('express-async-errors');
const express = require('express');
const errorHandler = require('../middleware/errorHandler');

module.exports = (app) => {
  app.use(express.json());

  app.use('/api/bootcamps', require('../routes/bootcamps'));

  app.use(errorHandler);
};
