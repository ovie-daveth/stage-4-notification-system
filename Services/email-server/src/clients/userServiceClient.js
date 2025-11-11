const buildHttpClient = require('./httpClient');
const config = require('../config');
const buildLogger = require('../utils/logger');

const logger = buildLogger('user-service-client');

const client = buildHttpClient({
  baseURL: config.services.user.base_url,
  timeout: config.services.user.timeout_ms,
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    logger.error('User service request failed', {
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    });
    return Promise.reject(error);
  },
);

const getUserById = (userId) => client.get(`/users/${userId}`);

module.exports = {
  getUserById,
};

