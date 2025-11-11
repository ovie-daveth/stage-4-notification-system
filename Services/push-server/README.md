## Push Service

### Overview
Processes push notification jobs from RabbitMQ and dispatches them through Firebase Cloud Messaging (FCM). Enforces user preferences (including quiet hours), hydrates notifications from templates, and removes invalid device tokens via the User Service.

### Architecture
- Express 5 HTTP API with Celebrate/Joi validation, Helmet, and shared response format.
- RabbitMQ consumer bound to `notifications.direct` → `push.queue` with configurable prefetch and dead-letter queue.
- Axios clients for `user-server` (preferences, device tokens) and `template-server` (rendered copy/data).
- Firebase Admin SDK generates and sends multicast push messages.
- Structured logging, reusable `ApplicationError`, and quiet hours helper.

### Dependencies
| Package | Role |
| --- | --- |
| express, cors, helmet, morgan | HTTP layer, CORS, security headers, logging |
| celebrate (Joi) | Request validation |
| amqplib | RabbitMQ client |
| axios | HTTP client for downstream services |
| firebase-admin | FCM sendEachForMulticast |
| uuid, http-status | Correlation and error codes |
| dotenv | Env loading |

Dev: ESLint 9, Nodemon.

### Prerequisites
- Node.js >= 18.
- RabbitMQ accessible at configured URI.
- Firebase service account JSON with messaging scope.
- Operational User and Template services.

### Setup
1. Create `.env` (see configuration below).
2. Install packages: `npm install`
3. Start dev server: `npm run dev` (nodemon) or production `npm start`
4. Run linting: `npm run lint`
5. Ensure Firebase credentials parse correctly on first push attempt.

### Configuration
| Variable | Description (default) |
| --- | --- |
| `PORT` | HTTP port (4004) |
| `CORS_ORIGIN` | Optional CORS allowlist |
| `RABBITMQ_URI` | Broker URI (`amqp://localhost:5672`) |
| `RABBITMQ_EXCHANGE` | `notifications.direct` |
| `RABBITMQ_PUSH_QUEUE` | `push.queue` |
| `RABBITMQ_DEAD_LETTER_QUEUE` | `failed.queue` |
| `RABBITMQ_PREFETCH` | Prefetch (10) |
| `USER_SERVICE_URL`, `USER_SERVICE_TIMEOUT_MS` | User service settings |
| `TEMPLATE_SERVICE_URL`, `TEMPLATE_SERVICE_TIMEOUT_MS` | Template service settings |
| `PUSH_PROVIDER` | Only `fcm` currently |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | JSON string representation of service account |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Optional file path alternative |
| `FIREBASE_PROJECT_ID` | Optional override (falls back to credential project_id) |

Provide either `FIREBASE_SERVICE_ACCOUNT_JSON` **or** `FIREBASE_SERVICE_ACCOUNT_PATH`. The service throws during init if neither works.

### RabbitMQ Processing
1. Consume messages from `push.queue`; invalid JSON → `nack` without requeue.
2. Fetch user profile, ensure `is_active`, `push_notifications` flag, and device tokens exist.
3. Check quiet hours via `preferences.quiet_hours_start` / `quiet_hours_end`; if active, respond with `QUIET_HOURS_ACTIVE`.
4. Merge template render (title/body/data/image) with payload overrides.
5. Dispatch via Firebase `sendEachForMulticast`; capture success/failure counts.
6. Collect invalid tokens (`messaging/registration-token-not-registered`) and call `userServiceClient.removePushToken`.
7. Ack on success; `nack` with requeue when `ApplicationError.statusCode >= 500`.

### Queue Payload Schema
```json
{
  "notification_id": "9f349869-6fb5-4877-8f1e-1d14626a50d5",
  "user_id": "user-456",
  "template_id": "transactional-alert",
  "language": "en",
  "variables": { "amount": "₦10,000" },
  "payload_overrides": {
    "title": "Account Credit",
    "body": "Your account was credited",
    "data": { "account_id": "acc-987" },
    "image": "https://cdn.example.com/banner.png"
  },
  "metadata": { "correlation_id": "trace-xyz" }
}
```

### HTTP Endpoints
| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Health probe with dependency summaries |
| POST | `/api/v1/push/test-send` | Sends a single-token test push via FCM |
| POST | `/api/v1/push/webhook/:provider` | Provider webhook placeholder (extend per provider) |

**Test Send Request**
```json
{
  "push_token": "<device-token>",
  "title": "Hello!",
  "body": "Push notification test",
  "data": { "screen": "inbox" },
  "image": "https://cdn.example.com/push.png"
}
```

**Response envelope**
```json
{
  "success": true,
  "message": "Test push dispatched",
  "data": {
    "success_count": 1,
    "failure_count": 0,
    "responses": [
      { "success": true, "messageId": "projects/.../messages/..." }
    ]
  },
  "error": null,
  "meta": { "total": 0, "limit": 0, "page": 0, "total_pages": 0, "has_next": false, "has_previous": false }
}
```

### Error Handling
- Preference violations (`PUSH_NOT_ENABLED`, `QUIET_HOURS_ACTIVE`, `PUSH_TOKENS_MISSING`) return 202/400 and drop the job.
- Template/User service issues bubble as 5xx to trigger requeue.
- Firebase credential misconfiguration raises synchronous errors when `sendPush` initializes the SDK.

### Observability & Housekeeping
- Logs include `notification_id`, success/failure counts, invalid token list length, correlation IDs.
- Quiet hours decisions logged for auditing.
- Token cleanup tasks run concurrently for each invalid token.

### Testing
- `npm run lint`
- Suggested: add Jest unit tests for `push.service.js` covering quiet hours, token removal, template merging, and controller tests with Supertest.

### Troubleshooting
- “Firebase credential not provided”: confirm JSON/path env var; ensure valid JSON string when using `FIREBASE_SERVICE_ACCOUNT_JSON`.
- Messages stuck in `failed.queue`: inspect logs for `notification_id` and examine payload/preference mismatches.
- Partial failures: check `invalid_tokens` array in response; ensure User Service endpoint for removing tokens is healthy.

### Roadmap
- Support additional push providers (APNs via native credentials, Expo, etc.).
- Quiet hours scheduling for delayed dispatch.
- Delivery status callbacks and analytics dashboard.
- Metrics export (Prometheus / OpenTelemetry) for send rate, failure rate, queue depth.