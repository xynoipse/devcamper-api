require('dotenv').config();
const logger = require('./utils/logger');
const app = require('./app');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  logger.info(`Server running in ${app.get('env')} mode on port ${PORT}`)
);
