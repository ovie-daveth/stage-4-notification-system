const { isCelebrateError } = require('celebrate');
const { ApplicationError } = require('../utils/errors');
const { buildResponse, defaultPaginationMeta } = require('../utils/response');
const buildLogger = require('../utils/logger');

const logger = buildLogger('error-middleware');

const notFoundHandler = (req, res) =>
  res.status(404).json(
    buildResponse({
      success: false,
      error: 'RESOURCE_NOT_FOUND',
      message: 'Requested resource was not found',
      meta: defaultPaginationMeta,
    }),
  );

// eslint-disable-next-line no-unused-vars
const errorHandler = (error, req, res, next) => {
  let statusCode = 500;
  let message = 'Something went wrong';
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let details = null;

  if (isCelebrateError(error)) {
    statusCode = 400;
    message = 'Validation failed';
    errorCode = 'VALIDATION_ERROR';
    details = {};

    for (const [segment, validationError] of error.details.entries()) {
      details[segment] = validationError.details.map((detail) => detail.message);
    }
  } else if (error instanceof ApplicationError) {
    statusCode = error.statusCode;
    message = error.message;
    errorCode = error.errorCode;
    details = error.details;
  } else if (Number.isInteger(error.status) || Number.isInteger(error.statusCode)) {
    statusCode = Number.isInteger(error.statusCode) ? error.statusCode : error.status;
    message = error.message || message;
  }

  const safeStatusCode = Number.isInteger(statusCode)
    ? statusCode
    : 500;

  logger.error('Request failed', {
    path: req.path,
    method: req.method,
    safeStatusCode,
    originalStatusCode: statusCode,
    error: {
      name: error.name,
      message: error.message,
    },
  });

  return res.status(safeStatusCode).json(
    buildResponse({
      success: false,
      error: errorCode,
      message,
      data: details,
      meta: defaultPaginationMeta,
    }),
  );
};

module.exports = {
  notFoundHandler,
  errorHandler,
};

