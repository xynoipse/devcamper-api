const fs = require('fs');
const path = require('path');
const ErrorResponse = require('../utils/errorResponse');

const imageUpload = (file, filename) => {
  const fileUploadPath = process.env.FILE_UPLOAD_PATH;
  if (!fileUploadPath)
    throw new ErrorResponse('Please specify file upload path', 400);

  !fs.existsSync(fileUploadPath) &&
    fs.mkdirSync(fileUploadPath, { recursive: true });

  if (!file.mimetype.startsWith('image'))
    throw new ErrorResponse('Please upload a valid image file', 400);

  if (!file.size > process.env.MAX_FILE_UPLOAD)
    throw new ErrorResponse(
      `Please upload a image less than ${process.env.MAX_FILE_UPLOAD}`,
      400
    );

  file.name = `${filename}${path.parse(file.name).ext}`;

  file.mv(`${fileUploadPath}/${file.name}`, async (err) => {
    if (err) throw new ErrorResponse('Problem with image file upload', 500);
  });

  return file.name;
};

module.exports = imageUpload;
