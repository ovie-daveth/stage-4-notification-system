const { buildResponse, defaultPaginationMeta } = require('../utils/response');

const getHealth = (req, res) =>
  res.status(200).json(
    buildResponse({
      message: 'Push service is healthy',
      data: {
        status: 'up',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      },
      meta: defaultPaginationMeta,
    }),
  );

module.exports = {
  getHealth,
};

