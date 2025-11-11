use actix_web::HttpResponse;
use lapin::{options::BasicPublishOptions, BasicProperties, Channel};
use serde::Serialize;
use thiserror::Error;
use crate::helpers::types::{ApiResponse, NotificationType};
use redis::AsyncCommands;

#[derive(Error, Debug)]
pub enum GatewayError {
    #[error("Rate limit exceeded")]
    RateLimited,
    #[error("Idempotency key exists")]
    AlreadyProcessed,
    #[error("Redis error: {0}")]
    Redis(#[from] redis::RedisError),
    #[error("RabbitMQ error: {0}")]
    Rabbit(String),
    #[error("Upstream error: {0}")]
    Upstream(String),
}

pub fn ok<T: Serialize>(data: T, message: &str) -> HttpResponse {
    HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(data),
        error: None,
        message: message.to_string(),
        meta: None,
    })
}

pub fn err(status: actix_web::http::StatusCode, message: &str) -> HttpResponse {
    HttpResponse::build(status).json(ApiResponse::<()> {
        success: false,
        data: None,
        error: Some(message.to_string()),
        message: message.to_string(),
        meta: None,
    })
}

// Simple, distributed rate limit (per IP+route) using Redis INCR + EXPIRE.
// limit: max requests in `window_secs`.
pub async fn rate_limit_check(
    client: redis::Client,
    client_key: &str,
    route_key: &str,
    limit: u32,
    window_secs: usize,
) -> Result<(), GatewayError> {
    let mut redis = client.get_multiplexed_async_connection().await?;
    let key = format!("rate:{}:{}", client_key, route_key);
    let count: i64 = redis.incr(&key, 1).await?;
    if count == 1 {
        let _: () = redis.expire(&key, window_secs as i64).await?;
    }
    if count as u32 > limit {
        return Err(GatewayError::RateLimited);
    }
    Ok(())
}

// Idempotency: ensure request_id is only processed once.
// Returns:
// - Ok(Some(notification_id)) if the key existed (we return previous id)
// - Ok(None) if we successfully reserved the key (caller will create an id and store it)
// - Err if Redis fails
pub async fn idempotency_reserve(
    client: redis::Client,
    request_id: &str,
    ttl_secs: usize,
) -> Result<Option<String>, GatewayError> {
    let mut redis = client.get_multiplexed_async_connection().await?;
    let key = format!("idem:{}", request_id);
    let exists: bool = redis.exists(&key).await?;
    if exists {
        let prev: Option<String> = redis.get(&key).await?;
        return Ok(prev);
    }
    let reserved: bool = redis.set_nx(&key, "__reserved__").await?;
    if reserved {
        let _: () = redis.expire(&key, ttl_secs as i64).await?;
        Ok(None)
    } else {
        let prev: Option<String> = redis.get(&key).await?;
        Ok(prev)
    }
}

// After creating the real notification_id, finalize the idem key to map request_id -> notification_id
pub async fn idempotency_finalize(
    client: redis::Client,
    request_id: &str,
    notification_id: &str,
    ttl_secs: usize,
) -> Result<(), GatewayError> {
    let mut redis = client.get_multiplexed_async_connection().await?;
    let key = format!("idem:{}", request_id);
    let _: () = redis.set_ex(key, notification_id, ttl_secs as u64).await?;
    Ok(())
}

// Status: store latest status in a Redis hash
// notif:{notification_id} => { status: "...", updated_at: "...", error: "..." }
pub async fn set_status(
    client: redis::Client,
    notification_id: &str,
    status: &str,
    error: Option<&str>,
) -> Result<(), GatewayError> {
    let mut redis = client.get_multiplexed_async_connection().await?;
    let key = format!("notif:{}", notification_id);
    let now = chrono::Utc::now().to_rfc3339();
    let _: () = redis.hset(&key, "status", status).await?;
    let _: () = redis.hset(&key, "updated_at", now).await?;
    if let Some(e) = error {
        let _: () = redis.hset(&key, "error", e).await?;
    }
    let _: () = redis.expire(&key, 60 * 60 * 24 * 7).await?;
    Ok(())
}

pub async fn publish_notification(
    ch: &Channel,
    exchange: &str,
    notif_type: &NotificationType,
    payload: &serde_json::Value,
) -> Result<(), GatewayError> {
    let routing_key = match notif_type {
        NotificationType::Email => "email",
        NotificationType::Push => "push",
    };
    let body = serde_json::to_vec(payload).unwrap();

    ch.basic_publish(
        exchange,
        routing_key,
        BasicPublishOptions {
            mandatory: false,
            immediate: false,
        },
        &body,
        BasicProperties::default().with_content_type("application/json".into()),
    )
    .await
    .map_err(|e| GatewayError::Rabbit(e.to_string()))?
    .await
    .map_err(|e| GatewayError::Rabbit(e.to_string()))?;

    Ok(())
}
