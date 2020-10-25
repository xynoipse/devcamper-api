const config = require('config');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const db = config.get('mongoURI');

module.exports = async () => {
  const conn = await mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  });

  logger.info(`MongoDB Connected: ${conn.connection.host}`);
};
