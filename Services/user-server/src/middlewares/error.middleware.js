const httpStatus = require('http-status');
const { isCelebrateError } = require('celebrate');
const { ApplicationError } = require('../utils/errors');
const { buildResponse, defaultPaginationMeta } = require('../utils/response');

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
  let statusCode = httpStatus.INTERNAL_SERVER_ERROR;
  let message = 'Something went wrong';
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let details = null;

  if (isCelebrateError(error)) {
    statusCode = httpStatus.BAD_REQUEST;
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
  }

  const safeStatusCode = Number.isInteger(statusCode)
    ? statusCode
    : httpStatus.INTERNAL_SERVER_ERROR;

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

