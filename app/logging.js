const morgan = require('morgan');
const { transports, format } = require('winston');
const logger = require('../utils/logger');

module.exports = (app) => {
  if (process.env.NODE_ENV !== 'production') {
    const console = new transports.Console({
      format: format.simple(),
    });

    logger.add(console);
    logger.exceptions.handle(console);
    logger.rejections.handle(console);

    app.use(morgan('dev'));
  }
};
