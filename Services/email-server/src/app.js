const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const { errors } = require('celebrate');
const routes = require('./routes');
const config = require('./config');
const buildLogger = require('./utils/logger');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');
const setupSwagger = require('./docs/swagger');

const app = express();
const logger = buildLogger('http');

app.set('trust proxy', 1);

if (config.env !== 'test') {
  app.use(
    morgan('combined', {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    }),
  );
}

app.use(helmet());
app.use(
  cors({
    origin: config.env === 'production' ? config.cors_origin : '*',
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

setupSwagger(app);
app.use(routes);

app.use(errors());
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

