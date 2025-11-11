const buildLogger = require('../utils/logger');
const { getChannel } = require('../config/rabbitmq');
const config = require('../config');
const pushService = require('../services/push.service');

const logger = buildLogger('push-consumer');

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
    const result = await pushService.sendPushNotification(payload);

    logger.info('Push job completed', {
      notification_id: result.notification_id,
      status: result.status,
      invalid_tokens: result.invalid_tokens?.length,
    });

    channel.ack(msg);
  } catch (error) {
    logger.error('Push job failed', {
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
    config.rabbitmq.push_queue,
    async (msg) => {
      await processMessage(msg);
    },
    {
      noAck: false,
    },
  );

  logger.info('Push consumer started', {
    queue: config.rabbitmq.push_queue,
  });
};

module.exports = {
  startConsumer,
};

