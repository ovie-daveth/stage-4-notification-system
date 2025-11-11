use crate::AppState;
use actix_web::{post, web, HttpRequest, Responder};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::helpers::helpers::{ok, err, rate_limit_check, idempotency_reserve, idempotency_finalize, set_status, publish_notification};
use crate::helpers::types::{NotificationType, UserData};


#[derive(Serialize, Deserialize, Debug, Clone)]
struct NotificationEnqueued {
    notification_id: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct NotificationRequest {
    notification_type: NotificationType,
    user_id: Uuid,
    template_code: String, // code or path
    variables: UserData,
    request_id: String,
    priority: i32,
    #[serde(default)]
    metadata: Option<serde_json::Value>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "snake_case")]
enum NotificationStatus {
    Delivered,
    Pending,
    Failed,
}


#[derive(Serialize, Deserialize, Debug)]
struct StatusUpdateRequest {
    notification_id: String,
    status: NotificationStatus,
    #[serde(default)]
    timestamp: Option<String>, 
    #[serde(default)]
    error: Option<String>,
}


// Workers will call this to update status (email or push):
// POST /api/v1/{notification_preference}/status/  where notification_preference ∈ {email, push}
#[post("/{notification_preference}/status/")]
pub async fn update_status(
    path: web::Path<String>,
    state: web::Data<AppState>,
    payload: web::Json<StatusUpdateRequest>,
) -> impl Responder {
    let _pref = path.into_inner(); // not used directly here, but path shape matches the spec

    let status_str = match payload.status {
        NotificationStatus::Delivered => "delivered",
        NotificationStatus::Pending => "pending",
        NotificationStatus::Failed => "failed",
    };

    if let Err(e) = set_status(
        state.env.redis_client.clone(),
        &payload.notification_id,
        status_str,
        payload.error.as_deref(),
    )
    .await
    {
        return err(actix_web::http::StatusCode::INTERNAL_SERVER_ERROR, &e.to_string());
    }

    ok(serde_json::json!({ "notification_id": payload.notification_id }), "status updated")
}


#[post("/notifications/")]
pub async fn create_notification(
    req: HttpRequest,
    state: web::Data<AppState>,
    payload: web::Json<NotificationRequest>,
) -> impl Responder {
    // Simple per-route rate limit: 60 requests / 60s per IP
    let ip = req
        .connection_info()
        .realip_remote_addr()
        .unwrap_or("unknown")
        .to_string();

    if let Err(e) = rate_limit_check(
        state.env.redis_client.clone(),
        &ip,
        "create_notification",
        60,
        60,
    )
    .await
    {
        return err(actix_web::http::StatusCode::TOO_MANY_REQUESTS, &e.to_string());
    }

    // Idempotency reserve
    match idempotency_reserve(state.env.redis_client.clone(), &payload.request_id, 24 * 60 * 60).await {
        Ok(Some(existing_id)) => {
            // Already processed: return same id
            return ok(
                NotificationEnqueued { notification_id: existing_id },
                "duplicate request_id; returning previous notification_id",
            );
        }
        Ok(None) => {} // reserved; continue
        Err(e) => return err(actix_web::http::StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()),
    }

    // Create a notification id
    let notification_id = Uuid::new_v4().to_string();

    // Build the message body for MQ
    let msg = serde_json::json!({
        "notification_id": notification_id,
        "notification_type": payload.notification_type,
        "user_id": payload.user_id,
        "template_code": payload.template_code,
        "variables": payload.variables,
        "priority": payload.priority,
        "metadata": payload.metadata,
        "request_id": payload.request_id,
        "enqueued_at": chrono::Utc::now().to_rfc3339(),
    });

    // Publish to MQ
    if let Err(e) = publish_notification(&*state.env.rmq.lock().await, &state.env.exchange, &payload.notification_type, &msg).await {
        return err(actix_web::http::StatusCode::BAD_GATEWAY, &format!("queue publish failed: {}", e));
    }

    // Finalize idempotency (request_id -> notification_id)
    if let Err(e) = idempotency_finalize(state.env.redis_client.clone(), &payload.request_id, &notification_id, 24 * 60 * 60).await {
        return err(actix_web::http::StatusCode::INTERNAL_SERVER_ERROR, &e.to_string());
    }

    // Set initial status
    if let Err(e) = set_status(state.env.redis_client.clone(), &notification_id, "pending", None).await {
        return err(actix_web::http::StatusCode::INTERNAL_SERVER_ERROR, &e.to_string());
    }

    ok(NotificationEnqueued { notification_id }, "enqueued")
}
