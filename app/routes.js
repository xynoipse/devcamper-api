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

  app.use(errorHandler);
};
