const { createLogger, transports, format } = require('winston');

const logger = createLogger({
  format: format.json(),
  transports: [
    new transports.File({ filename: 'logs/logfile.log' }),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
  ],
  exceptionHandlers: [new transports.File({ filename: 'logs/exceptions.log' })],
  rejectionHandlers: [new transports.File({ filename: 'logs/rejections.log' })],
});

module.exports = logger;
