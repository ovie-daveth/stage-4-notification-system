const http = require('http');
const app = require('./app');
const config = require('./config');
const { connectDatabase } = require('./config/database');
const buildLogger = require('./utils/logger');

const logger = buildLogger('user-server');

const start = async () => {
  try {
    await connectDatabase();

    const server = http.createServer(app);

    server.listen(config.port, () => {
      logger.info(`User service listening on port ${config.port}`, {
        environment: config.env,
      });
    });

    const shutdown = async () => {
      logger.info('Gracefully shutting down user service');
      server.close(async () => {
        logger.info('HTTP server closed');
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
    logger.error('Failed to start user service', { error });
    process.exit(1);
  }
};

start();

