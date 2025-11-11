const admin = require('firebase-admin');
const config = require('../config');
const buildLogger = require('../utils/logger');
const { ApplicationError } = require('../utils/errors');
const httpStatus = require('http-status');

const logger = buildLogger('fcm-provider');

let initialized = false;

const init = () => {
  if (initialized) {
    return;
  }

  const credential = config.push.firebase.credential;

  if (!credential) {
    throw new Error('Firebase credential not provided. Set FIREBASE_SERVICE_ACCOUNT_JSON or path.');
  }

  admin.initializeApp({
    credential: admin.credential.cert(credential),
    projectId: config.push.firebase.project_id || credential.project_id,
  });

  initialized = true;
  logger.info('Firebase admin initialized');
};

const sendPush = async ({
  tokens,
  title,
  body,
  data,
  image,
  notificationId,
  correlationId,
}) => {
  if (!tokens || tokens.length === 0) {
    throw new ApplicationError(
      'No push tokens provided',
      httpStatus.BAD_REQUEST,
      'PUSH_TOKENS_MISSING',
    );
  }

  init();

  const payload = {
    tokens,
    notification: {
      title,
      body,
    },
    data: {
      ...(data || {}),
      notification_id: notificationId,
    },
    android: {
      notification: {
        imageUrl: image,
      },
    },
    apns: image
      ? {
          payload: {
            aps: {
              'mutable-content': 1,
            },
          },
          fcm_options: {
            image,
          },
        }
      : undefined,
  };

  if (correlationId) {
    payload.data.correlation_id = correlationId;
  }

  const response = await admin.messaging().sendEachForMulticast(payload);

  logger.info('Push notification dispatched', {
    success_count: response.successCount,
    failure_count: response.failureCount,
  });

  return response;
};

module.exports = {
  sendPush,
};

