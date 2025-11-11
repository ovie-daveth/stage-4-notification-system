// use actix_web::{get, post, web, App, HttpRequest, HttpResponse, HttpServer, Responder};
// use dotenvy::dotenv;
// use futures_util::TryFutureExt;
// use lapin::{options::*, types::FieldTable, BasicProperties, Channel, Connection, ConnectionProperties, ExchangeKind};
// use redis::AsyncCommands;
// use serde::{Deserialize, Serialize};
// use std::{env, sync::Arc, time::Duration};
// use thiserror::Error;
// use tokio::sync::Mutex;
// use uuid::Uuid;

// //
// // ================ Shared Types (snake_case) ================
// //

// #[derive(Serialize, Deserialize, Debug)]
// struct ApiResponse<T>
// where
//     T: Serialize,
// {
//     success: bool,
//     data: Option<T>,
//     error: Option<String>,
//     message: String,
//     meta: Option<PaginationMeta>,
// }

// #[derive(Serialize, Deserialize, Debug, Default)]
// struct PaginationMeta {
//     total: u64,
//     limit: u64,
//     page: u64,
//     total_pages: u64,
//     has_next: bool,
//     has_previous: bool,
// }

// #[derive(Serialize, Deserialize, Debug, Clone)]
// #[serde(rename_all = "snake_case")]
// enum NotificationType {
//     Email,
//     Push,
// }

// #[derive(Serialize, Deserialize, Debug, Clone)]
// struct UserData {
//     name: String,
//     link: String, // keep simple; validate in workers if needed
//     #[serde(default)]
//     meta: Option<serde_json::Value>,
// }

// #[derive(Serialize, Deserialize, Debug, Clone)]
// struct NotificationRequest {
//     notification_type: NotificationType,
//     user_id: Uuid,
//     template_code: String, // code or path
//     variables: UserData,
//     request_id: String,
//     priority: i32,
//     #[serde(default)]
//     metadata: Option<serde_json::Value>,
// }

// #[derive(Serialize, Deserialize, Debug, Clone)]
// struct NotificationEnqueued {
//     notification_id: String,
// }

// #[derive(Serialize, Deserialize, Debug)]
// struct CreateUserRequest {
//     name: String,
//     email: String,
//     #[serde(default)]
//     push_token: Option<String>,
//     preferences: UserPreference,
//     password: String,
// }

// #[derive(Serialize, Deserialize, Debug)]
// struct UserPreference {
//     email: bool,
//     push: bool,
// }

// #[derive(Serialize, Deserialize, Debug)]
// #[serde(rename_all = "snake_case")]
// enum NotificationStatus {
//     Delivered,
//     Pending,
//     Failed,
// }

// #[derive(Serialize, Deserialize, Debug)]
// struct StatusUpdateRequest {
//     notification_id: String,
//     status: NotificationStatus,
//     #[serde(default)]
//     timestamp: Option<String>, // simplify; workers can provide RFC3339 if they wish
//     #[serde(default)]
//     error: Option<String>,
// }

// //
// // ================ App State ================
// //

// #[derive(Clone)]
// struct AppState {
//     redis: redis::aio::ConnectionManager,
//     rmq: Arc<Mutex<Channel>>,
//     exchange: String,
//     // Optional: proxy to user service (if you want /api/v1/users/ to forward)
//     user_service_base: Option<String>,
// }

// //
// // ================ Helpers ================
// //

// #[derive(Error, Debug)]
// enum GatewayError {
//     #[error("Rate limit exceeded")]
//     RateLimited,
//     #[error("Idempotency key exists")]
//     AlreadyProcessed,
//     #[error("Redis error: {0}")]
//     Redis(#[from] redis::RedisError),
//     #[error("RabbitMQ error: {0}")]
//     Rabbit(String),
//     #[error("Upstream error: {0}")]
//     Upstream(String),
// }

// fn ok<T: Serialize>(data: T, message: &str) -> HttpResponse {
//     HttpResponse::Ok().json(ApiResponse {
//         success: true,
//         data: Some(data),
//         error: None,
//         message: message.to_string(),
//         meta: None,
//     })
// }

// fn err(status: actix_web::http::StatusCode, message: &str) -> HttpResponse {
//     HttpResponse::build(status).json(ApiResponse::<()> {
//         success: false,
//         data: None,
//         error: Some(message.to_string()),
//         message: message.to_string(),
//         meta: None,
//     })
// }

// // Simple, distributed rate limit (per IP+route) using Redis INCR + EXPIRE.
// // limit: max requests in `window_secs`.
// async fn rate_limit_check(
//     mut redis: redis::aio::ConnectionManager,
//     client_key: &str,
//     route_key: &str,
//     limit: u32,
//     window_secs: usize,
// ) -> Result<(), GatewayError> {
//     let key = format!("rate:{}:{}", client_key, route_key);
//     let count: i64 = redis.incr(&key, 1).await?;
//     if count == 1 {
//         let _: () = redis.expire(&key, window_secs).await?;
//     }
//     if count as u32 > limit {
//         return Err(GatewayError::RateLimited);
//     }
//     Ok(())
// }

// // Idempotency: ensure request_id is only processed once.
// // Returns:
// // - Ok(Some(notification_id)) if the key existed (we return previous id)
// // - Ok(None) if we successfully reserved the key (caller will create an id and store it)
// // - Err if Redis fails
// async fn idempotency_reserve(
//     mut redis: redis::aio::ConnectionManager,
//     request_id: &str,
//     ttl_secs: usize,
// ) -> Result<Option<String>, GatewayError> {
//     let key = format!("idem:{}", request_id);
//     // SETNX equivalent: SET key value NX EX ttl
//     // We first check if exists:
//     let exists: bool = redis.exists(&key).await?;
//     if exists {
//         let prev: Option<String> = redis.get(&key).await?;
//         return Ok(prev); // Some(id) -> already processed
//     }
//     // Reserve with placeholder; caller must set final notification_id after enqueue
//     let reserved: bool = redis
//         .set_nx(&key, "__reserved__")
//         .await?;
//     if reserved {
//         let _: () = redis.expire(&key, ttl_secs).await?;
//         Ok(None)
//     } else {
//         // Race: someone else set it just now. Return its value.
//         let prev: Option<String> = redis.get(&key).await?;
//         Ok(prev)
//     }
// }

// // After creating the real notification_id, finalize the idem key to map request_id -> notification_id
// async fn idempotency_finalize(
//     mut redis: redis::aio::ConnectionManager,
//     request_id: &str,
//     notification_id: &str,
//     ttl_secs: usize,
// ) -> Result<(), GatewayError> {
//     let key = format!("idem:{}", request_id);
//     let _: () = redis.set_ex(key, notification_id, ttl_secs).await?;
//     Ok(())
// }

// // Status: store latest status in a Redis hash
// // notif:{notification_id} => { status: "...", updated_at: "...", error: "..." }
// async fn set_status(
//     mut redis: redis::aio::ConnectionManager,
//     notification_id: &str,
//     status: &str,
//     error: Option<&str>,
// ) -> Result<(), GatewayError> {
//     let key = format!("notif:{}", notification_id);
//     let now = chrono::Utc::now().to_rfc3339();
//     let _: () = redis.hset(&key, "status", status).await?;
//     let _: () = redis.hset(&key, "updated_at", now).await?;
//     if let Some(e) = error {
//         let _: () = redis.hset(&key, "error", e).await?;
//     }
//     // Optional TTL, so status doesn’t live forever (e.g., 7 days)
//     let _: () = redis.expire(&key, 60 * 60 * 24 * 7).await?;
//     Ok(())
// }

// //
// // ================ RabbitMQ Setup & Publish ================
// //

// async fn init_rabbit() -> Result<(Channel, String), GatewayError> {
//     let amqp = env::var("RABBIT_URL").expect("RABBIT_URL missing");
//     let exchange = env::var("RABBIT_EXCHANGE").unwrap_or_else(|_| "notifications.direct".to_string());

//     let conn = Connection::connect(&amqp, ConnectionProperties::default())
//         .await
//         .map_err(|e| GatewayError::Rabbit(e.to_string()))?;

//     let ch = conn
//         .create_channel()
//         .await
//         .map_err(|e| GatewayError::Rabbit(e.to_string()))?;

//     ch.exchange_declare(
//         &exchange,
//         ExchangeKind::Direct,
//         ExchangeDeclareOptions {
//             durable: true,
//             ..Default::default()
//         },
//         FieldTable::default(),
//     )
//     .await
//     .map_err(|e| GatewayError::Rabbit(e.to_string()))?;

//     // declare queues + bindings (idempotent)
//     for (queue, routing_key) in [("email.queue", "email"), ("push.queue", "push"), ("failed.queue", "failed")] {
//         ch.queue_declare(
//             queue,
//             QueueDeclareOptions {
//                 durable: true,
//                 ..Default::default()
//             },
//             FieldTable::default(),
//         )
//         .await
//         .map_err(|e| GatewayError::Rabbit(e.to_string()))?;

//         ch.queue_bind(
//             queue,
//             &exchange,
//             routing_key,
//             QueueBindOptions::default(),
//             FieldTable::default(),
//         )
//         .await
//         .map_err(|e| GatewayError::Rabbit(e.to_string()))?;
//     }

//     Ok((ch, exchange))
// }

// async fn publish_notification(
//     ch: &Channel,
//     exchange: &str,
//     notif_type: &NotificationType,
//     payload: &serde_json::Value,
// ) -> Result<(), GatewayError> {
//     let routing_key = match notif_type {
//         NotificationType::Email => "email",
//         NotificationType::Push => "push",
//     };
//     let body = serde_json::to_vec(payload).unwrap();

//     ch.basic_publish(
//         exchange,
//         routing_key,
//         BasicPublishOptions {
//             mandatory: false,
//             immediate: false,
//         },
//         &body,
//         BasicProperties::default().with_content_type("application/json".into()),
//     )
//     .await
//     .map_err(|e| GatewayError::Rabbit(e.to_string()))?
//     .await
//     .map_err(|e| GatewayError::Rabbit(e.to_string()))?;

//     Ok(())
// }

// //
// // ================ Handlers ================
// //

// #[post("/api/v1/notifications/")]
// async fn create_notification(
//     req: HttpRequest,
//     state: web::Data<AppState>,
//     payload: web::Json<NotificationRequest>,
// ) -> impl Responder {
//     // Simple per-route rate limit: 60 requests / 60s per IP
//     let ip = req
//         .connection_info()
//         .realip_remote_addr()
//         .unwrap_or("unknown")
//         .to_string();

//     if let Err(e) = rate_limit_check(
//         state.redis.clone(),
//         &ip,
//         "create_notification",
//         60,
//         60,
//     )
//     .await
//     {
//         return err(actix_web::http::StatusCode::TOO_MANY_REQUESTS, &e.to_string());
//     }

//     // Idempotency reserve
//     match idempotency_reserve(state.redis.clone(), &payload.request_id, 24 * 60 * 60).await {
//         Ok(Some(existing_id)) => {
//             // Already processed: return same id
//             return ok(
//                 NotificationEnqueued { notification_id: existing_id },
//                 "duplicate request_id; returning previous notification_id",
//             );
//         }
//         Ok(None) => {} // reserved; continue
//         Err(e) => return err(actix_web::http::StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()),
//     }

//     // Create a notification id
//     let notification_id = Uuid::new_v4().to_string();

//     // Build the message body for MQ
//     let msg = serde_json::json!({
//         "notification_id": notification_id,
//         "notification_type": payload.notification_type,
//         "user_id": payload.user_id,
//         "template_code": payload.template_code,
//         "variables": payload.variables,
//         "priority": payload.priority,
//         "metadata": payload.metadata,
//         "request_id": payload.request_id,
//         "enqueued_at": chrono::Utc::now().to_rfc3339(),
//     });

//     // Publish to MQ
//     if let Err(e) = publish_notification(&state.rmq.lock().await, &state.exchange, &payload.notification_type, &msg).await {
//         return err(actix_web::http::StatusCode::BAD_GATEWAY, &format!("queue publish failed: {}", e));
//     }

//     // Finalize idempotency (request_id -> notification_id)
//     if let Err(e) = idempotency_finalize(state.redis.clone(), &payload.request_id, &notification_id, 24 * 60 * 60).await {
//         return err(actix_web::http::StatusCode::INTERNAL_SERVER_ERROR, &e.to_string());
//     }

//     // Set initial status
//     if let Err(e) = set_status(state.redis.clone(), &notification_id, "pending", None).await {
//         return err(actix_web::http::StatusCode::INTERNAL_SERVER_ERROR, &e.to_string());
//     }

//     ok(NotificationEnqueued { notification_id }, "enqueued")
// }



// // Workers will call this to update status (email or push):
// // POST /api/v1/{notification_preference}/status/  where notification_preference ∈ {email, push}
// #[post("/api/v1/{notification_preference}/status/")]
// async fn update_status(
//     path: web::Path<String>,
//     state: web::Data<AppState>,
//     payload: web::Json<StatusUpdateRequest>,
// ) -> impl Responder {
//     let _pref = path.into_inner(); // not used directly here, but path shape matches the spec

//     let status_str = match payload.status {
//         NotificationStatus::Delivered => "delivered",
//         NotificationStatus::Pending => "pending",
//         NotificationStatus::Failed => "failed",
//     };

//     if let Err(e) = set_status(
//         state.redis.clone(),
//         &payload.notification_id,
//         status_str,
//         payload.error.as_deref(),
//     )
//     .await
//     {
//         return err(actix_web::http::StatusCode::INTERNAL_SERVER_ERROR, &e.to_string());
//     }

//     ok(serde_json::json!({ "notification_id": payload.notification_id }), "status updated")
// }

// #[get("/health")]
// async fn health() -> impl Responder {
//     HttpResponse::Ok().body("ok")
// }

// //
// // ================ Main ================
// //

// #[actix_web::main]
// async fn main() -> std::io::Result<()> {
//     dotenv().ok();

//     let server_addr = env::var("SERVER_ADDR").unwrap_or_else(|_| "0.0.0.0:8080".into());

//     // Redis
//     let redis_url = env::var("REDIS_URL").expect("REDIS_URL missing");
//     let client = redis::Client::open(redis_url).expect("bad REDIS_URL");
//     let manager = redis::aio::ConnectionManager::new(client)
//         .await
//         .expect("redis connect failed");

//     // RabbitMQ
//     let (rmq_ch, exchange) = init_rabbit().await.expect("rabbit init failed");

//     // Optional user service base for proxying /users
//     let user_service_base = env::var("USER_SERVICE_BASE_URL").ok();

//     let state = AppState {
//         redis: manager,
//         rmq: Arc::new(Mutex::new(rmq_ch)),
//         exchange,
//         user_service_base,
//     };

//     println!("API Gateway listening on http://{server_addr}");
//     HttpServer::new(move || {
//         App::new()
//             .app_data(web::Data::new(state.clone()))
//             .service(health)
//             .service(create_notification)
//             .service(create_user)
//             .service(update_status)
//     })
//     .workers(2)
//     .client_request_timeout(Duration::from_secs(15))
//     .bind(server_addr)?
//     .run()
//     .await
// }