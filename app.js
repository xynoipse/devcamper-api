const express = require('express');
const app = express();

require('./app/db')();
require('./app/logging')(app);

module.exports = app;
