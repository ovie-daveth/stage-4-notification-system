const nodemailer = require('nodemailer');
const config = require('../config');
const buildLogger = require('../utils/logger');
const { ApplicationError } = require('../utils/errors');

const logger = buildLogger('email-provider');

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.secure,
      auth: config.email.smtp.auth.user
        ? {
            user: config.email.smtp.auth.user,
            pass: config.email.smtp.auth.pass,
          }
        : undefined,
    });
  }

  return transporter;
};

const sendEmail = async ({
  to,
  subject,
  html,
  text,
  headers,
}) => {
  const mailer = getTransporter();

  try {
    const result = await mailer.sendMail({
      from: config.email.default_from,
      to,
      subject,
      html,
      text,
      headers,
    });

    logger.info('Email dispatched', {
      message_id: result.messageId,
      to,
    });

    return result;
  } catch (error) {
    logger.error('Failed to send email via provider', {
      to,
      code: error.code,
      response: error.response?.toString?.(),
      command: error.command,
      message: error.message,
    });

    throw new ApplicationError(
      'Failed to dispatch email through provider',
      502,
      'EMAIL_PROVIDER_ERROR',
      {
        code: error.code,
        command: error.command,
        response: error.response,
        message: error.message,
      },
    );
  }
};

module.exports = {
  sendEmail,
};

