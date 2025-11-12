const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('../config');

const swaggerDefinition = {
  openapi: '3.0.1',
  info: {
    title: 'Email Notification Service',
    version: '1.0.0',
    description:
      'REST API for dispatching email notifications, performing health checks, and handling provider callbacks.',
  },
  servers: [
    {
      url: `http://localhost:${config.port}`,
      description: 'Local',
    },
  ],
  components: {
    schemas: {
      BaseResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          error: { type: ['string', 'null'] },
          data: { type: ['object', 'null'] },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'integer' },
              limit: { type: 'integer' },
              page: { type: 'integer' },
              total_pages: { type: 'integer' },
              has_next: { type: 'boolean' },
              has_previous: { type: 'boolean' },
            },
          },
        },
      },
      EmailTestRequest: {
        type: 'object',
        required: ['to', 'subject', 'html'],
        properties: {
          to: { type: 'string', format: 'email' },
          subject: { type: 'string', minLength: 3, maxLength: 200 },
          html: { type: 'string' },
          text: { type: 'string' },
        },
      },
      EmailTestResponseData: {
        type: 'object',
        properties: {
          message_id: { type: 'string' },
          to: { type: 'string', format: 'email' },
          accepted: {
            type: 'array',
            items: { type: 'string', format: 'email' },
          },
        },
      },
    },
  },
  tags: [
    { name: 'Health', description: 'Service health endpoints' },
    { name: 'Email', description: 'Email notification endpoints' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Service health check',
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BaseResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/email/test-send': {
      post: {
        tags: ['Email'],
        summary: 'Send a test email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EmailTestRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Email dispatched',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/BaseResponse' },
                    {
                      properties: {
                        data: {
                          $ref: '#/components/schemas/EmailTestResponseData',
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BaseResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/email/webhook/{provider}': {
      post: {
        tags: ['Email'],
        summary: 'Provider webhook receiver (placeholder)',
        parameters: [
          {
            in: 'path',
            name: 'provider',
            required: true,
            schema: { type: 'string' },
            description: 'Provider identifier (e.g., smtp, ses)',
          },
        ],
        requestBody: {
          description: 'Provider-specific payload',
          required: false,
          content: {
            'application/json': { schema: { type: 'object' } },
            'application/x-www-form-urlencoded': { schema: { type: 'object' } },
          },
        },
        responses: {
          200: {
            description: 'Acknowledged',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BaseResponse' },
              },
            },
          },
        },
      },
    },
  },
};

const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: [],
});

const setupSwagger = (app) => {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
};

module.exports = setupSwagger;

