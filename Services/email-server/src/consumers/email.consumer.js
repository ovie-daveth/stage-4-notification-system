const buildLogger = require('../utils/logger');
const { getChannel } = require('../config/rabbitmq');
const config = require('../config');
const templateServiceClient = require('../clients/templateServiceClient');
const { ApplicationError } = require('../utils/errors');
const emailService = require('../services/email.service');

const logger = buildLogger('email-consumer');

const processMessage = async (msg) => {
  const channel = getChannel();

  if (!msg) {
    return;
  }

  const content = msg.content.toString();
  let payload;

  try {
    payload = JSON.parse(content);
  } catch (error) {
    logger.error('Failed to parse message', { error, content });
    channel.nack(msg, false, false);
    return;
  }

  try {
    let hydratedPayload = payload;

    if (payload.template_id) {
      try {
        const templateResponse = await templateServiceClient.renderTemplate(payload.template_id, {
          language: payload.language,
          variables: payload.variables || {},
        });

        hydratedPayload = {
          ...payload,
          rendered_subject: templateResponse.data.rendered_subject,
          rendered_body: templateResponse.data.rendered_body,
          rendered_text: templateResponse.data.rendered_text,
        };
      } catch (error) {
        logger.error('Failed to render template for email job', {
          notification_id: payload.notification_id,
          template_id: payload.template_id,
          error: error.message,
          stack: error.stack,
          details: error.response?.data,
        });

        throw new ApplicationError(
          'Failed to render template',
          error.statusCode || 502,
          'TEMPLATE_RENDER_FAILED',
          { notification_id: payload.notification_id, template_id: payload.template_id },
        );
      }
    }

    const result = await emailService.sendEmailNotification(hydratedPayload);

    logger.info('Email job completed', {
      notification_id: result.notification_id,
      status: result.status,
    });

    channel.ack(msg);
  } catch (error) {
    logger.error('Email job failed', {
      notification_id: payload.notification_id,
      error: error.message,
      stack: error.stack,
      details: error.details,
    });

    const shouldRequeue = error.statusCode >= 500;
    channel.nack(msg, false, shouldRequeue);
  }
};

const startConsumer = async () => {
  const channel = getChannel();

  await channel.consume(
    config.rabbitmq.email_queue,
    async (msg) => {
      await processMessage(msg);
    },
    {
      noAck: false,
    },
  );

  logger.info('Email consumer started', {
    queue: config.rabbitmq.email_queue,
  });
};

module.exports = {
  startConsumer,
};

