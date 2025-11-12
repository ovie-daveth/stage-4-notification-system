const { buildResponse } = require('../utils/response');

const healthCheck = (req, res) => {
  return res.status(200).json(
    buildResponse({
      message: 'User service is healthy',
      data: {
        status: 'up',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    }),
  );
};

module.exports = {
  healthCheck,
};

