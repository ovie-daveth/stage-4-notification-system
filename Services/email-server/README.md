## Email Service

### Overview
Dedicated microservice that consumes email notification jobs from RabbitMQ, enriches each job with template/user data, and dispatches via an SMTP provider using Nodemailer. Provides REST endpoints for operational checks, smoke testing, and provider callbacks.

### Architecture at a Glance
- Express 5 + Helmet + Celebrate/Joi for HTTP handling, validation, and security headers.
- RabbitMQ consumer bound to `notifications.direct` → `email.queue`, dead-letter queue support.
- Axios clients for `user-server` (contact data, preferences) and `template-server` (content rendering).
- Nodemailer transport initialized on demand from environment configuration.
- Consistent JSON response envelope, structured logging, centralized error type (`ApplicationError`).
- Graceful handling of templating failures, disabled notifications, and transient infrastructure errors.

### Dependencies
| Package | Purpose |
| --- | --- |
| express, cors, helmet, morgan | HTTP server, CORS, security headers, request logging |
| celebrate (Joi) | Request payload validation |
| amqplib | RabbitMQ client for consumers |
| axios | Downstream service calls (user/template) |
| nodemailer | Email delivery (SMTP/provider API) |
| http-status, uuid | HTTP codes, correlation IDs |
| dotenv | Environment variable loading |

Dev tooling: ESLint 9 (`eslint`, `@eslint/js`) and Nodemon.

### Prerequisites
- Node.js >= 18 and npm.
- Running RabbitMQ instance reachable at `RABBITMQ_URI`.
- User Service and Template Service reachable over HTTP.
- SMTP credentials with permission to send from `EMAIL_FROM`.

### Getting Started
1. Install dependencies: `npm install`
2. Copy environment template: `cp env.example .env`
3. Fill in RabbitMQ, SMTP, and downstream URLs in `.env`
4. Start locally: `npm run dev` (hot reload) or `npm start` (production)
5. Run lint checks: `npm run lint`

### Configuration
| Variable | Notes (defaults) |
| --- | --- |
| `PORT` | HTTP port (4002) |
| `CORS_ORIGIN` | Optional admin UI origin |
| `RABBITMQ_URI` | Connection string `amqp://localhost:5672` |
| `RABBITMQ_EXCHANGE` | `notifications.direct` |
| `RABBITMQ_EMAIL_QUEUE` | `email.queue` |
| `RABBITMQ_DEAD_LETTER_QUEUE` | `failed.queue` |
| `RABBITMQ_PREFETCH` | In-flight job limit (5) |
| `USER_SERVICE_URL` / `USER_SERVICE_TIMEOUT_MS` | User profile endpoint + timeout |
| `TEMPLATE_SERVICE_URL` / `TEMPLATE_SERVICE_TIMEOUT_MS` | Template render endpoint + timeout |
| `EMAIL_FROM` | Default sender (`notifications@example.com`) |
| `EMAIL_PROVIDER` | Currently `smtp` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | SMTP host config |
| `SMTP_USERNAME`, `SMTP_PASSWORD` | Auth credentials (optional) |

### RabbitMQ Job Flow
1. Receive JSON message from `email.queue`; malformed messages get rejected (`nack` without requeue).
2. Optionally call Template Service to render subject/body when `template_id` is provided.
3. Fetch user profile from User Service; enforce preferences (`email_notifications`).
4. Merge payload overrides (`payload_overrides.subject`, `body`, `text`, `headers`).
5. Validate content; missing subject/body triggers `ApplicationError`.
6. Dispatch via Nodemailer; acknowledge on success or `nack` with requeue when error `statusCode >= 500`.

### Queue Payload Schema (example)
```json
{
  "notification_id": "d3d27a70-1a42-4b6e-9ac3-61bbb44ff3b2",
  "user_id": "user-123",
  "template_id": "password-reset",
  "language": "en",
  "variables": { "first_name": "Ada" },
  "payload_overrides": {
    "subject": "[Preview] Reset Password",
    "body": "<p>HTML body</p>",
    "text": "Plain text fallback",
    "headers": { "X-Custom": "value" }
  },
  "metadata": { "correlation_id": "trace-abc" }
}
```

### HTTP API
| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Returns service status + dependency checks |
| POST | `/api/v1/email/test-send` | Sends a synthetic email for smoke testing |
| POST | `/api/v1/email/webhook/:provider` | Hook for provider callbacks (stub) |

Common response envelope:
```json
{
  "success": true,
  "message": "Test email dispatched",
  "data": { "message_id": "<provider-id>", "to": "recipient@example.com", "accepted": ["recipient@example.com"] },
  "error": null,
  "meta": { "total": 0, "limit": 0, "page": 0, "total_pages": 0, "has_next": false, "has_previous": false }
}
```

**Test Send Request**
```json
{
  "to": "recipient@example.com",
  "subject": "System smoke test",
  "html": "<p>Hello from notification service</p>",
  "text": "Hello from notification service"
}
```

### Error Handling & Retries
- Domain errors (disabled notifications, missing content) throw `ApplicationError` with 202/400 status; message is acknowledged to avoid requeue.
- Integration failures (Template/User service outages, SMTP issues) set `statusCode >= 500`; the consumer `nack`s with requeue for retry.
- JSON parse failures permanently reject the message.

### Observability
- Logs include `notification_id`, correlation IDs, template info, and provider response metadata (see `logger.js` usage).
- Integrate stdout/stderr with your log aggregation pipeline; consider shipping to ELK/OpenTelemetry.

### Testing
- Lint: `npm run lint`
- Recommended to add Jest + Supertest suites covering controllers, services, and queue consumers.

### Troubleshooting
- `Failed to render template`: check Template Service availability and payload variables.
- `Email notifications disabled for user`: inspect user preferences or `is_active` status.
- SMTP errors: verify `.env` credentials and network access to provider.
- Messages in `failed.queue`: review logs for `notification_id` and requeue manually after resolution.

### Future Enhancements
- Publish delivery receipts to status topics.
- Implement provider-specific webhook parsing and bounce/complaint handling.
- Add retry/backoff with exponential delays.
- Expose metrics endpoint (Prometheus/OpenTelemetry) for queue depth, send rate, error rate.
