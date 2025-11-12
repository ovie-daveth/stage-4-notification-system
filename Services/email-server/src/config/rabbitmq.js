const amqplib = require('amqplib');
const config = require('./index');
const buildLogger = require('../utils/logger');

const logger = buildLogger('rabbitmq');

let connection;
let channel;

const connectRabbitMQ = async () => {
  if (channel) {
    return channel;
  }

  connection = await amqplib.connect(config.rabbitmq.uri);
  connection.on('error', (error) => {
    logger.error('RabbitMQ connection error', { error });
  });
  connection.on('close', () => {
    logger.warn('RabbitMQ connection closed');
  });

  channel = await connection.createChannel();
  await channel.assertExchange(config.rabbitmq.exchange, 'direct', { durable: true });
  await channel.assertQueue(config.rabbitmq.email_queue, {
    durable: true,
    deadLetterExchange: config.rabbitmq.exchange,
    deadLetterRoutingKey: config.rabbitmq.dead_letter_queue,
  });
  await channel.assertQueue(config.rabbitmq.dead_letter_queue, { durable: true });
  await channel.bindQueue(config.rabbitmq.email_queue, config.rabbitmq.exchange, config.rabbitmq.email_queue);
  await channel.prefetch(config.rabbitmq.prefetch);

  logger.info('RabbitMQ connection established', {
    exchange: config.rabbitmq.exchange,
    queue: config.rabbitmq.email_queue,
  });

  return channel;
};

const getChannel = () => {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }
  return channel;
};

const closeRabbitMQ = async () => {
  try {
    await channel?.close();
    await connection?.close();
    logger.info('RabbitMQ connection closed gracefully');
  } catch (error) {
    logger.error('Error closing RabbitMQ connection', { error });
  } finally {
    channel = undefined;
    connection = undefined;
  }
};

module.exports = {
  connectRabbitMQ,
  getChannel,
  closeRabbitMQ,
};

