const buildHttpClient = require('./httpClient');
const config = require('../config');
const buildLogger = require('../utils/logger');

const logger = buildLogger('template-service-client');

const client = buildHttpClient({
  baseURL: config.services.template.base_url,
  timeout: config.services.template.timeout_ms,
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    logger.error('Template service request failed', {
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    });
    return Promise.reject(error);
  },
);

const renderTemplate = (templateId, payload) => client.post(`/templates/${templateId}/render`, payload);

module.exports = {
  renderTemplate,
};

