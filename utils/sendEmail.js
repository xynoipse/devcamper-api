const nodemailer = require('nodemailer');
const config = require('config');
const logger = require('./logger');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: config.get('smtpHost'),
    port: config.get('smtpPort'),
    auth: {
      user: config.get('smtpUsername'),
      pass: config.get('smtpPassword'),
    },
  });

  const message = {
    from: `${config.get('smtpFromName')} <${config.get('smtpFromAddress')}>'`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  const info = await transporter.sendMail(message);

  logger.info(`Nodemailer: Message sent! ${info.messageId}`);
};

module.exports = sendEmail;
