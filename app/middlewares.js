const express = require('express');
const cookieParser = require('cookie-parser');
const fileupload = require('express-fileupload');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');

module.exports = (app) => {
  // Body parser
  app.use(express.json());

  // Cookie parser
  app.use(cookieParser());

  // File uploading
  app.use(fileupload());

  // Sanitize data
  app.use(mongoSanitize());

  // Set security headers
  app.use(helmet());

  // Prevent XSS attacks
  app.use(xss());

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  });

  app.use(limiter);

  // Prevent http param pollution
  app.use(hpp());

  // Enable CORS
  app.use(cors());
};
