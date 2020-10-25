const config = require('config');
const logger = require('./utils/logger');
const app = require('./app');

const PORT = config.get('port');

app.listen(PORT, () =>
  logger.info(`Server running in ${app.get('env')} mode on port ${PORT}`)
);
