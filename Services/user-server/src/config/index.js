const dotenv = require('dotenv');

dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4001,
  cors_origin: process.env.CORS_ORIGIN,
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/notification_system',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  auth: {
    jwt_secret: process.env.JWT_SECRET || 'change_this_secret',
    jwt_expires_in: process.env.JWT_EXPIRES_IN || '7d',
  },
};

module.exports = config;

