const buildLogger = (scope = 'user-service') => ({
  info: (message, meta = {}) => console.info(`[${scope}] ${message}`, meta),
  warn: (message, meta = {}) => console.warn(`[${scope}] ${message}`, meta),
  error: (message, meta = {}) => console.error(`[${scope}] ${message}`, meta),
});

module.exports = buildLogger;

