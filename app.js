const express = require('express');
const app = express();

require('./app/db')();
require('./app/logging')(app);
require('./app/middlewares')(app);
require('./app/routes')(app);

module.exports = app;
