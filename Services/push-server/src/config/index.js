const dotenv = require('dotenv');

dotenv.config();

const parseFirebaseCredential = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (error) {
      throw new Error(
        `Invalid FIREBASE_SERVICE_ACCOUNT_JSON value. Ensure it is valid JSON. ${error.message}`,
      );
    }
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
      return require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    } catch (error) {
      throw new Error(
        `Unable to load FIREBASE_SERVICE_ACCOUNT_PATH. Verify the path is correct. ${error.message}`,
      );
    }
  }

  return null;
};

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4004,
  cors_origin: process.env.CORS_ORIGIN,
  rabbitmq: {
    uri: process.env.RABBITMQ_URI || 'amqp://localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE || 'notifications.direct',
    push_queue: process.env.RABBITMQ_PUSH_QUEUE || 'push.queue',
    dead_letter_queue: process.env.RABBITMQ_DEAD_LETTER_QUEUE || 'failed.queue',
    prefetch: Number(process.env.RABBITMQ_PREFETCH) || 10,
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
  push: {
    provider: process.env.PUSH_PROVIDER || 'fcm',
    firebase: {
      credential: parseFirebaseCredential(),
      project_id: process.env.FIREBASE_PROJECT_ID,
    },
  },
};

module.exports = config;

