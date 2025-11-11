# **API Gateway (Actix-web)**

- A lightweight API Gateway exposing health, notifications enqueueing, status updates, and a user-creation proxy.
- Backed by Redis (rate limiting, idempotency, status storage) and RabbitMQ (notification queueing).
- Written in Rust using Actix-web.

## **Features**

- Notification enqueue with idempotency via `request_id`.
- Status updates persisted in Redis.
- Per-route rate limiting using Redis.
- Optional proxy to a User Service for user creation.
- CORS enabled, structured JSON responses.

## **Requirements**

- Rust 1.74+ (edition 2021)
- Redis (reachable via `REDIS_URL`)
- RabbitMQ (reachable via `RABBIT_URL`)

## **Environment Variables**

- `URL` (required): Bind address, e.g. `0.0.0.0`.
- `PORT` (required): Port to listen on, e.g. `8080`.
- `REDIS_URL` (required): e.g. `redis://localhost:6379`.
- `RABBIT_URL` (required): e.g. `amqp://guest:guest@localhost:5672/%2f`.
- `RABBIT_EXCHANGE` (optional): Direct exchange name, default `notifications.direct`.
- `USER_SERVICE_BASE_URL` (optional): Base URL to proxy `POST /api/v1/users/`.
- `TEMPLATE_SERVICE_BASE_URL` (optional): Base URL to proxy `/api/v1/templates/*`.
- `EMAIL`, `NAME`, `CAT_FACT_URL` (present, currently unused by routes).

Example `.env` (see `.env.example`):

```bash
URL=0.0.0.0
PORT=8080
REDIS_URL=redis://localhost:6379
RABBIT_URL=amqp://guest:guest@localhost:5672/%2f
RABBIT_EXCHANGE=notifications.direct
# USER_SERVICE_BASE_URL=http://localhost:9000
# TEMPLATE_SERVICE_BASE_URL=http://localhost:9100
```

## **Run Locally**

- Ensure Redis and RabbitMQ are reachable.
- `cargo run`
- Server listens on `http://<URL>:<PORT>` (from env).

## **Docker**

- A `Dockerfile` is provided, but currently copies a binary named `api-gateway` and sets up Diesel CLI. For this project, the produced binary is `api_gateway`. If you plan to containerize run:

```bash
docker build -t api-gateway .
docker run --rm -p 8080:8080 --env-file .env api-gateway
```

## **Architecture**

- Actix-web for HTTP server and routing.
- Redis for:
  - Rate limiting per IP+route using `INCR` + `EXPIRE`.
  - Idempotency reservation and finalization keyed by `request_id`.
  - Notification status storage under `notif:{notification_id}`.
- RabbitMQ for:
  - Direct exchange publish with routing keys `email` or `push`.
  - Idempotent declaration of exchange and queues (`email.queue`, `push.queue`, `failed.queue`).

## **API Documentation**

Shared response envelope (used by endpoints below unless stated otherwise):

```rust
{
  "success": true | false,
  "data": <any | null>,
  "error": <string | null>,
  "message": <string>,
  "meta": <object | null>
}
```

- Rate limiting
  - `POST /api/v1/notifications/`: 60 requests / 60s per client IP.
  - `POST /api/v1/users/`: 30 requests / 60s per client IP.
  - `POST /api/v1/templates/`: 30 requests / 60s per client IP.
  - On limit exceeded: HTTP 429 with the above envelope and `success=false`.

- Idempotency
  - `POST /api/v1/notifications/` requires a `request_id` string.
  - Duplicate `request_id` returns the same `notification_id` with message: "duplicate request_id; returning previous notification_id".

### Endpoints

- GET `/api/v1/healthz`
  - Description: Liveness check.
  - Request body: none.
  - Response body (note: this one does NOT use the shared envelope):
    - Example:
      `{ "status": "success", "data": { "health": "Server is active" } }`
  - Status codes: 200.

- POST `/api/v1/notifications/`
  - Description: Enqueue a notification to RabbitMQ, with idempotency and initial `pending` status in Redis.
  - Request body JSON:
    - Fields:
      - `notification_type`: "email" | "push" (snake_case).
      - `user_id`: UUID string.
      - `template_code`: string.
      - `variables`: object `{ name: string, link: string, meta?: object }`.
      - `request_id`: string (idempotency key; required).
      - `priority`: integer.
      - `metadata`: optional object.
    - Example:

      ```rust
      {
        "notification_type": "email",
        "user_id": "8e6a812c-23f4-4f11-bb25-665fe0e7efb4",
        "template_code": "welcome_email",
        "variables": { "name": "Ada", "link": "https://app.example/reset" },
        "request_id": "req_123",
        "priority": 5,
        "metadata": { "campaign": "onboarding" }
      }
      ```

  - Response body (shared envelope):
    - `data`: `{ "notification_id": string }`.
    - Example:

      ```rust
      {
        "success": true,
        "data": { "notification_id": "a4f5e1b8-3ea0-4f0a-86c3-2e3a6b8d7a49" },
        "error": null,
        "message": "enqueued",
        "meta": null
      }
      ```

  - Status codes: 200, 400, 429, 502, 500.

- POST `/api/v1/{notification_preference}/status/`
  - Description: Update the status of an existing notification in Redis. The `{notification_preference}` path segment is typically `email` or `push`; it is not validated by the gateway.
  - Request body JSON:
    - Fields:
      - `notification_id`: string (UUID string produced when enqueued).
      - `status`: "delivered" | "pending" | "failed" (snake_case).
      - `timestamp`: optional RFC3339 string; workers can supply when status was observed.
      - `error`: optional string containing failure context.
    - Example:

      ```rust
      {
        "notification_id": "a4f5e1b8-3ea0-4f0a-86c3-2e3a6b8d7a49",
        "status": "delivered",
        "timestamp": "2025-11-11T02:22:33Z"
      }
      ```

  - Response body (shared envelope):
    - `data`: `{ "notification_id": string }`.
    - `message`: "status updated".
  - Status codes: 200, 500.

- POST `/api/v1/users/`
  - Description: Optional proxy to a User Service; if `USER_SERVICE_BASE_URL` is set, the gateway forwards this request to `{USER_SERVICE_BASE_URL}/api/v1/users/` and returns upstream status and body.
  - Request body JSON:
    - Fields:
      - `name`: string
      - `email`: string
      - `push_token`: optional string
      - `preferences`: `{ "email": bool, "push": bool }`
      - `password`: string
    - Example:

      ```rust
      {
        "name": "Ada",
        "email": "ada@example.com",
        "push_token": null,
        "preferences": { "email": true, "push": false },
        "password": "s3cr3t"
      }
      ```

  - Response:
    - If proxy is configured: raw upstream response body with upstream status code.
    - If not configured: shared envelope error with 501 and message "user service not configured".
  - Status codes: 200–499 passthrough (proxy), 429 (rate limit), 502 (proxy error), 501 (not configured).

- GET `/api/v1/users/{user_id}`
  - Description: Proxy to user service to fetch a single user.
  - Request body: none.
  - Response: raw upstream body; status is upstream status.
  - Status codes: 200–499 passthrough (proxy), 429 (rate limit), 502 (proxy error), 502 (not configured).

- PATCH `/api/v1/users/{user_id}/preferences`
  - Description: Proxy to update a user’s notification preferences.
  - Request body JSON:
    - `{ "email": bool, "push": bool }`
  - Response: raw upstream body; status is upstream status.
  - Status codes: 200–499 passthrough (proxy), 429 (rate limit), 502 (proxy error), 502 (not configured).

- POST `/api/v1/templates/`
  - Description: Proxy to template service to create a template.
  - Request body JSON: arbitrary template payload, e.g.:
  
    ```rust
    { "code": "welcome_email", "body": "Hi {{name}}", "meta": {"locale": "en"} }
    ```

  - Response: raw upstream body; status is upstream status.
  - Status codes: 201/200–499 passthrough, 429 (rate limit), 502 (proxy error), 502 (not configured).

- GET `/api/v1/templates/`
  - Description: List templates (proxy).
  - Response: raw upstream body; status is upstream status.
  - Status codes: 200–499 passthrough, 502 (proxy error), 502 (not configured).

- GET `/api/v1/templates/{code}`
  - Description: Get a template by code (proxy).
  - Response: raw upstream body; status is upstream status.
  - Status codes: 200–499 passthrough, 502 (proxy error), 502 (not configured).

- PUT `/api/v1/templates/{code}`
  - Description: Update a template by code (proxy).
  - Request body JSON: arbitrary template payload, e.g.:
  
    ```rust
    { "body": "Hello {{name}}", "meta": {"locale": "en-GB"} }
    ```

  - Response: raw upstream body; status is upstream status.
  - Status codes: 200–499 passthrough, 502 (proxy error), 502 (not configured).

- DELETE `/api/v1/templates/{code}`
  - Description: Delete a template by code (proxy).
  - Response: raw upstream body; status is upstream status.
  - Status codes: 200–499 passthrough, 502 (proxy error), 502 (not configured).

## **Operational Notes**

- Queues and bindings are declared idempotently on startup.
- Redis keys:
  - Rate limit: `rate:{ip}:{route}` (numeric counter with expiry).
  - Idempotency: `idem:{request_id}` → `notification_id` (string).
  - Status: `notif:{notification_id}` → hash `{ status, updated_at, error? }`.

## **Contributing / Next Steps**

- Add tests for handlers and helper logic.
- Expose a GET status endpoint (e.g., `/api/v1/notifications/{id}`) to read current state from Redis.
- Consider validating `{notification_preference}` to `email|push` if desired.
