use crate::AppState;
use actix_web::{post, web, HttpRequest, HttpResponse, Responder, patch, get};
use serde::{Deserialize, Serialize};
use crate::helpers::helpers::rate_limit_check;
use crate::helpers::helpers::err;


#[derive(Serialize, Deserialize, Debug, Clone)]
struct UserData {
    name: String,
    link: String, // keep simple; validate in workers if needed
    #[serde(default)]
    meta: Option<serde_json::Value>,
}



#[derive(Serialize, Deserialize, Debug)]
struct CreateUserRequest {
    name: String,
    email: String,
    #[serde(default)]
    push_token: Option<String>,
    preferences: UserPreference,
    password: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct UserPreference {
    email: bool,
    push: bool,
}



// (Optional) Simple user creation proxy — forwards to User Service (kept very simple)
#[post("/users/")]
pub async fn create_user(
    req: HttpRequest,
    state: web::Data<AppState>,
    payload: web::Json<CreateUserRequest>,
) -> impl Responder {
    // Rate limit (30/min) for user creation
    let ip = req
        .connection_info()
        .realip_remote_addr()
        .unwrap_or("unknown")
        .to_string();

      if let Err(e) = rate_limit_check(
        state.env.redis_client.clone(),
        &ip,
        "create_user",
        30,
        60,
    )
    .await
    {
        return err(actix_web::http::StatusCode::TOO_MANY_REQUESTS, &e.to_string());
    }

    if let Some(base) = &state.env.user_service_base {
        let url = format!("{}/api/v1/users/", base.trim_end_matches('/'));
        let client = reqwest::Client::new();
        match client.post(&url).json(&*payload).send().await {
            Ok(resp) => {
                let status = resp.status();
                let text = resp.text().await.unwrap_or_default();
                let actix_status = actix_web::http::StatusCode::from_u16(status.as_u16())
                    .unwrap_or(actix_web::http::StatusCode::BAD_GATEWAY);
                return HttpResponse::build(actix_status).body(text);
            }
            Err(e) => return err(actix_web::http::StatusCode::BAD_GATEWAY, &format!("user service error: {}", e)),
        }
    }
    // If no user service configured, respond 501
    err(actix_web::http::StatusCode::NOT_IMPLEMENTED, "user service not configured")
}


#[get("/users/{user_id}")]
pub async fn get_user(
    req: HttpRequest,
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> impl Responder {
    // Rate limit: 200 reads/min
    let ip = req.connection_info().realip_remote_addr().unwrap_or("unknown").to_string();
    if let Err(e) = rate_limit_check(state.env.redis_client.clone(), &ip, "get_user", 200, 60).await {
        return err(actix_web::http::StatusCode::TOO_MANY_REQUESTS, &e.to_string());
    }

    let user_id = path.into_inner();
    let base = match &state.env.user_service_base {
        Some(u) => u,
        None => return err(actix_web::http::StatusCode::BAD_GATEWAY, "user service not configured"),
    };

    let url = format!("{}/api/v1/users/{}", base, user_id);
    match reqwest::Client::new().get(&url).send().await {
        Ok(resp) => {
            let status = actix_web::http::StatusCode::from_u16(resp.status().as_u16())
                .unwrap_or(actix_web::http::StatusCode::BAD_GATEWAY);
            HttpResponse::build(status).body(resp.text().await.unwrap_or_default())
        }
        Err(e) => err(actix_web::http::StatusCode::BAD_GATEWAY, &format!("user service error: {}", e)),
    }
}

#[patch("/users/{user_id}/preferences")]
pub async fn update_user_preferences(
    req: HttpRequest,
    state: web::Data<AppState>,
    path: web::Path<String>,
    body: web::Json<UserPreference>,
) -> impl Responder {
    // Rate limit: 60 writes/min
    let ip = req.connection_info().realip_remote_addr().unwrap_or("unknown").to_string();
    if let Err(e) = rate_limit_check(state.env.redis_client.clone(), &ip, "update_preferences", 60, 60).await {
        return err(actix_web::http::StatusCode::TOO_MANY_REQUESTS, &e.to_string());
    }

    let user_id = path.into_inner();
    let base = match &state.env.user_service_base {
        Some(u) => u,
        None => return err(actix_web::http::StatusCode::BAD_GATEWAY, "user service not configured"),
    };

    let url = format!("{}/api/v1/users/{}/preferences", base, user_id);
    match reqwest::Client::new().patch(&url).json(&*body).send().await {
        Ok(resp) => {
            let status = actix_web::http::StatusCode::from_u16(resp.status().as_u16())
                .unwrap_or(actix_web::http::StatusCode::BAD_GATEWAY);
            HttpResponse::build(status).body(resp.text().await.unwrap_or_default())
        }
        Err(e) => err(actix_web::http::StatusCode::BAD_GATEWAY, &format!("user service error: {}", e)),
    }
}
