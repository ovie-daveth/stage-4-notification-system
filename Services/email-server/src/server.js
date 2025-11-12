const http = require('http');
const app = require('./app');
const config = require('./config');
const { connectRabbitMQ, closeRabbitMQ } = require('./config/rabbitmq');
const { startConsumer } = require('./consumers/email.consumer');
const buildLogger = require('./utils/logger');

const logger = buildLogger('email-server');

const start = async () => {
  try {
    await connectRabbitMQ();
    await startConsumer();

    const server = http.createServer(app);

    server.listen(config.port, () => {
      logger.info(`Email service listening on port ${config.port}`, {
        environment: config.env,
      });
    });

    const shutdown = async () => {
      logger.info('Gracefully shutting down email service');
      server.close(async () => {
        logger.info('HTTP server closed');
        await closeRabbitMQ();
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled promise rejection', { reason });
      shutdown();
    });
  } catch (error) {
    logger.error('Failed to start email service', { error });
    process.exit(1);
  }
};

start();

