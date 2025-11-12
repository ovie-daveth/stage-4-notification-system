const dotenv = require('dotenv');

dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4002,
  cors_origin: process.env.CORS_ORIGIN,
  rabbitmq: {
    uri: process.env.RABBITMQ_URI || 'amqp://localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE || 'notifications.direct',
    email_queue: process.env.RABBITMQ_EMAIL_QUEUE || 'email.queue',
    dead_letter_queue: process.env.RABBITMQ_DEAD_LETTER_QUEUE || 'failed.queue',
    prefetch: Number(process.env.RABBITMQ_PREFETCH) || 5,
  },
  services: {
    user: {
      base_url: process.env.USER_SERVICE_URL || 'http://localhost:4001/api/v1',
      timeout_ms: Number(process.env.USER_SERVICE_TIMEOUT_MS) || 5000,
    },
    template: {
      base_url: process.env.TEMPLATE_SERVICE_URL || 'http://localhost:4003/api/v1',
      timeout_ms: Number(process.env.TEMPLATE_SERVICE_TIMEOUT_MS) || 5000,
    },
  },
  email: {
    default_from: process.env.EMAIL_FROM || 'notifications@example.com',
    provider: process.env.EMAIL_PROVIDER || 'smtp',
    smtp: {
      host: process.env.SMTP_HOST || 'localhost',
      port: Number(process.env.SMTP_PORT) || 1025,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USERNAME || '',
        pass: process.env.SMTP_PASSWORD || '',
      },
    },
  },
};

module.exports = config;

