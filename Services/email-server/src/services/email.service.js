const httpStatus = require('http-status');
const { v4: uuid } = require('uuid');
const userServiceClient = require('../clients/userServiceClient');
const templateServiceClient = require('../clients/templateServiceClient');
const { ApplicationError } = require('../utils/errors');
const buildLogger = require('../utils/logger');
const emailProvider = require('../providers/nodemailerProvider');

const logger = buildLogger('email-service');

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
      httpStatus.BAD_GATEWAY,
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
      httpStatus.BAD_GATEWAY,
      'TEMPLATE_SERVICE_UNAVAILABLE',
      { templateId, error: error.message },
    );
  }
};

const buildEmailPayload = ({ user, notification }) => {
  if (!user.email || user.preferences?.email_notifications === false || user.is_active === false) {
    throw new ApplicationError(
      'Email notifications disabled for user',
      httpStatus.ACCEPTED,
      'EMAIL_NOT_ENABLED',
      { user_id: user.user_id },
    );
  }

  const correlationId = notification.metadata?.correlation_id || uuid();
  const headers = {
    'X-Notification-Id': notification.notification_id,
    'X-Correlation-Id': correlationId,
  };

  if (notification.payload_overrides?.headers) {
    Object.assign(headers, notification.payload_overrides.headers);
  }

  return {
    to: user.email,
    headers,
  };
};

const sendEmailNotification = async (notification) => {
  const userData = await fetchUserProfile(notification.user_id);
  const user = userData.data;

  const emailPayload = buildEmailPayload({ user, notification });

  let subject =
    notification.payload_overrides?.subject ||
    notification.rendered_subject ||
    '';
  let html =
    notification.payload_overrides?.body ||
    notification.rendered_body ||
    '';
  let text =
    notification.payload_overrides?.text ||
    notification.rendered_text ||
    '';

  if ((!subject || !html) && notification.template_id) {
    const template = await renderTemplate(
      notification.template_id,
      notification.variables || {},
      notification.language,
    );

    subject = subject || template.rendered_subject;
    html = html || template.rendered_body;
    text = text || template.rendered_text;
  }

  if (!subject || !html) {
    throw new ApplicationError(
      'Email subject and body are required',
      httpStatus.BAD_REQUEST,
      'EMAIL_CONTENT_MISSING',
      { notification_id: notification.notification_id },
    );
  }

  const providerResponse = await emailProvider.sendEmail({
    ...emailPayload,
    subject,
    html,
    text,
  });

  logger.info('Email notification processed', {
    notification_id: notification.notification_id,
    message_id: providerResponse.messageId,
    to: emailPayload.to,
  });

  return {
    notification_id: notification.notification_id,
    status: 'sent',
    provider_response: providerResponse,
  };
};

module.exports = {
  sendEmailNotification,
};

