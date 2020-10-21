const mongoose = require('mongoose');
const logger = require('../utils/logger');

module.exports = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  });

  logger.info(`MongoDB Connected: ${conn.connection.host}`);
};
