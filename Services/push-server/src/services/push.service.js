const { v4: uuid } = require('uuid');
const userServiceClient = require('../clients/userServiceClient');
const templateServiceClient = require('../clients/templateServiceClient');
const fcmProvider = require('../providers/fcmProvider');
const { ApplicationError } = require('../utils/errors');
const buildLogger = require('../utils/logger');

const logger = buildLogger('push-service');

const unwrap = (response) => response.data;

const fetchUserProfile = async (userId) => {
  try {
    const response = await userServiceClient.getUserById(userId);
    return unwrap(response);
  } catch (error) {
    if (error.response?.data?.message) {
      throw new ApplicationError(
        error.response.data.message,
        error.response.status,
        error.response.data.error,
        error.response.data.data,
      );
    }

    throw new ApplicationError(
      'Failed to retrieve user profile',
      502,
      'USER_SERVICE_UNAVAILABLE',
      { userId, error: error.message },
    );
  }
};

const renderTemplate = async (templateId, variables, language) => {
  try {
    const response = await templateServiceClient.renderTemplate(templateId, {
      language,
      variables,
    });
    const payload = unwrap(response);
    return payload?.data || payload;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new ApplicationError(
        error.response.data.message,
        error.response.status,
        error.response.data.error,
        error.response.data.data,
      );
    }

    throw new ApplicationError(
      'Failed to render template',
      502,
      'TEMPLATE_SERVICE_UNAVAILABLE',
      { templateId, error: error.message },
    );
  }
};

const shouldRespectQuietHours = (preferences) => {
  if (!preferences?.quiet_hours_start || !preferences?.quiet_hours_end) {
    return false;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startHours, startMinutes] = preferences.quiet_hours_start.split(':').map(Number);
  const [endHours, endMinutes] = preferences.quiet_hours_end.split(':').map(Number);

  const startTotal = startHours * 60 + startMinutes;
  const endTotal = endHours * 60 + endMinutes;

  if (startTotal === endTotal) {
    return false;
  }

  if (startTotal < endTotal) {
    return currentMinutes >= startTotal && currentMinutes < endTotal;
  }

  return currentMinutes >= startTotal || currentMinutes < endTotal;
};

const notifyInvalidTokens = async (userId, tokens) => {
  if (!tokens.length) {
    return;
  }

  await Promise.all(
    tokens.map((token) =>
      userServiceClient
        .removePushToken(userId, token)
        .catch((error) => logger.warn('Failed to remove invalid push token', { token, error: error.message })),
    ),
  );
};

const sendPushNotification = async (notification) => {
  const userData = await fetchUserProfile(notification.user_id);
  const user = userData.data;

  if (!user || user.is_active === false || user.preferences?.push_notifications === false) {
    throw new ApplicationError(
      'Push notifications disabled for user',
      202,
      'PUSH_NOT_ENABLED',
      { user_id: notification.user_id },
    );
  }

  if (!user.push_tokens || user.push_tokens.length === 0) {
    throw new ApplicationError(
      'User has no push tokens',
      202,
      'PUSH_TOKENS_MISSING',
      { user_id: notification.user_id },
    );
  }

  if (shouldRespectQuietHours(user.preferences)) {
    throw new ApplicationError(
      'Notification falls within quiet hours',
      202,
      'QUIET_HOURS_ACTIVE',
      { user_id: notification.user_id },
    );
  }

  let title = notification.payload_overrides?.title || '';
  let body = notification.payload_overrides?.body || '';
  let data = notification.payload_overrides?.data || {};
  const image = notification.payload_overrides?.image;

  if (notification.template_id) {
    const template = await renderTemplate(
      notification.template_id,
      notification.variables || {},
      notification.language,
    );

    title = title || template.rendered_title || template.rendered_subject;
    body = body || template.rendered_text || template.rendered_body;
    const renderedData = template.rendered_data || template.renderedData || {};
    data = {
      ...renderedData,
      ...data,
    };
  }

  if (!title || !body) {
    throw new ApplicationError(
      'Push title and body are required',
      400,
      'PUSH_CONTENT_MISSING',
      { notification_id: notification.notification_id },
    );
  }

  const correlationId = notification.metadata?.correlation_id || uuid();

  const response = await fcmProvider.sendPush({
    tokens: user.push_tokens,
    title,
    body,
    data,
    image,
    notificationId: notification.notification_id,
    correlationId,
  });

  const invalidTokens = [];
  response.responses.forEach((result, index) => {
    if (!result.success && result.error?.code === 'messaging/registration-token-not-registered') {
      invalidTokens.push(user.push_tokens[index]);
    }
  });

  if (invalidTokens.length) {
    await notifyInvalidTokens(notification.user_id, invalidTokens);
  }

  logger.info('Push notification processed', {
    notification_id: notification.notification_id,
    success_count: response.successCount,
    failure_count: response.failureCount,
  });

  return {
    notification_id: notification.notification_id,
    status: response.failureCount === 0 ? 'sent' : 'partial',
    provider_response: response,
    invalid_tokens: invalidTokens,
  };
};

module.exports = {
  sendPushNotification,
};

