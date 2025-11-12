const mongoose = require('mongoose');
const config = require('./index');
const buildLogger = require('../utils/logger');

const logger = buildLogger('database');

const connectDatabase = async () => {
  try {
    await mongoose.connect(config.database.uri, config.database.options);
    logger.info('MongoDB connected successfully', {
      uri: config.database.uri.replace(/\/\/.*@/, '//***@'),
    });
  } catch (error) {
    logger.error('MongoDB connection failed', {
      error: error.message,
      stack: error.stack,
    });
    logger.error('Please ensure MongoDB is running or check your MONGODB_URI in .env file');
    logger.error('For local MongoDB: Start MongoDB service or run "mongod --dbpath C:\\data\\db"');
    logger.error('For MongoDB Atlas: Check your connection string and network access settings');
    process.exit(1);
  }
};

mongoose.connection.on('error', (error) => {
  logger.error('MongoDB connection error', { error: error.message });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

module.exports = {
  connectDatabase,
};

