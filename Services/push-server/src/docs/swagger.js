const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('../config');

const swaggerDefinition = {
  openapi: '3.0.1',
  info: {
    title: 'Push Notification Service',
    version: '1.0.0',
    description:
      'REST API for dispatching push notifications, health monitoring, and webhook ingestion.',
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
      PushTestRequest: {
        type: 'object',
        required: ['push_token', 'title', 'body'],
        properties: {
          push_token: { type: 'string' },
          title: { type: 'string', minLength: 1, maxLength: 150 },
          body: { type: 'string', minLength: 1, maxLength: 500 },
          data: {
            type: 'object',
            additionalProperties: { type: 'string' },
          },
          image: { type: 'string', format: 'uri' },
        },
      },
      PushTestResponseData: {
        type: 'object',
        properties: {
          success_count: { type: 'integer' },
          failure_count: { type: 'integer' },
          responses: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                messageId: { type: 'string' },
                error: { type: 'object' },
              },
            },
          },
        },
      },
    },
  },
  tags: [
    { name: 'Health', description: 'Service health endpoints' },
    { name: 'Push', description: 'Push notification endpoints' },
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
    '/api/v1/push/test-send': {
      post: {
        tags: ['Push'],
        summary: 'Send a test push notification',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PushTestRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Push dispatched',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/BaseResponse' },
                    {
                      properties: {
                        data: {
                          $ref: '#/components/schemas/PushTestResponseData',
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
    '/api/v1/push/webhook/{provider}': {
      post: {
        tags: ['Push'],
        summary: 'Provider webhook receiver (placeholder)',
        parameters: [
          {
            in: 'path',
            name: 'provider',
            required: true,
            schema: { type: 'string' },
            description: 'Provider identifier (e.g., fcm)',
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

