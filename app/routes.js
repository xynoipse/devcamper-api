require('express-async-errors');
const path = require('path');
const express = require('express');
const errorHandler = require('../middleware/errorHandler');

module.exports = (app) => {
  // Body parser
  app.use(express.json());

  // Set static folder
  app.use(express.static(path.join(__dirname, '../public')));

  // Mount routers
  app.use('/api/bootcamps', require('../routes/bootcamps'));
  app.use('/api/courses', require('../routes/courses'));
  app.use('/api/auth', require('../routes/auth'));
  app.use('/api/users', require('../routes/users'));
  app.use('/api/reviews', require('../routes/reviews'));

  app.use(errorHandler);
};
