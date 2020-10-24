const fileupload = require('express-fileupload');

module.exports = (app) => {
  // File uploading
  app.use(fileupload());
};
