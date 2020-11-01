const cookieParser = require('cookie-parser');
const fileupload = require('express-fileupload');

module.exports = (app) => {
  // Cookie parser
  app.use(cookieParser());

  // File uploading
  app.use(fileupload());
};
