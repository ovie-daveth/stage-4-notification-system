use crate::AppState;
use actix_web::{post, put, delete, get, web, HttpRequest, HttpResponse, Responder};
use crate::helpers::helpers::{rate_limit_check, err};


#[post("/templates/")]
pub async fn create_template(
    state: web::Data<AppState>,
    req: HttpRequest,
    body: web::Json<serde_json::Value>,
) -> impl Responder {
    // Rate limit: 30 writes/min
    let ip = req.connection_info().realip_remote_addr().unwrap_or("unknown").to_string();
    if let Err(e) = rate_limit_check(state.env.redis_client.clone(), &ip, "create_template", 30, 60).await {
        return err(actix_web::http::StatusCode::TOO_MANY_REQUESTS, &e.to_string());
    }

    let base = match &state.env.template_service_base {
        Some(t) => t,
        None => return err(actix_web::http::StatusCode::BAD_GATEWAY, "template service not configured"),
    };

    let url = format!("{}/api/v1/templates/", base);
    match reqwest::Client::new().post(&url).json(&*body).send().await {
        Ok(resp) => {
            let status = actix_web::http::StatusCode::from_u16(resp.status().as_u16())
                .unwrap_or(actix_web::http::StatusCode::BAD_GATEWAY);
            HttpResponse::build(status).body(resp.text().await.unwrap_or_default())
        }
        Err(e) => err(actix_web::http::StatusCode::BAD_GATEWAY, &e.to_string()),
    }
}

#[get("/templates/")]
pub async fn list_templates(
    state: web::Data<AppState>,
    req: HttpRequest,
) -> impl Responder {
    let base = match state.env.template_service_base.as_ref() {
        Some(b) => b,
        None => return err(actix_web::http::StatusCode::BAD_GATEWAY, "template service not configured"),
    };
    let url = format!("{}/api/v1/templates/", base);

    match reqwest::Client::new().get(&url).send().await {
        Ok(resp) => {
            let status = actix_web::http::StatusCode::from_u16(resp.status().as_u16())
                .unwrap_or(actix_web::http::StatusCode::BAD_GATEWAY);
            HttpResponse::build(status).body(resp.text().await.unwrap_or_default())
        }
        Err(e) => err(actix_web::http::StatusCode::BAD_GATEWAY, &e.to_string()),
    }
}

#[get("/templates/{code}")]
pub async fn get_template(
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> impl Responder {
    let code = path.into_inner();
    let base = match state.env.template_service_base.as_ref() {
        Some(b) => b,
        None => return err(actix_web::http::StatusCode::BAD_GATEWAY, "template service not configured"),
    };
    let url = format!("{}/api/v1/templates/{}", base, code);

    match reqwest::Client::new().get(&url).send().await {
        Ok(resp) => {
            let status = actix_web::http::StatusCode::from_u16(resp.status().as_u16())
                .unwrap_or(actix_web::http::StatusCode::BAD_GATEWAY);
            HttpResponse::build(status).body(resp.text().await.unwrap_or_default())
        }
        Err(e) => err(actix_web::http::StatusCode::BAD_GATEWAY, &e.to_string()),
    }
}

#[put("/templates/{code}")]
pub async fn update_template(
    state: web::Data<AppState>,
    path: web::Path<String>,
    body: web::Json<serde_json::Value>,
) -> impl Responder {
    let code = path.into_inner();
    let base = match state.env.template_service_base.as_ref() {
        Some(b) => b,
        None => return err(actix_web::http::StatusCode::BAD_GATEWAY, "template service not configured"),
    };
    let url = format!("{}/api/v1/templates/{}", base, code);

    match reqwest::Client::new().put(&url).json(&*body).send().await {
        Ok(resp) => {
            let status = actix_web::http::StatusCode::from_u16(resp.status().as_u16())
                .unwrap_or(actix_web::http::StatusCode::BAD_GATEWAY);
            HttpResponse::build(status).body(resp.text().await.unwrap_or_default())
        }
        Err(e) => err(actix_web::http::StatusCode::BAD_GATEWAY, &e.to_string()),
    }
}

#[delete("/templates/{code}")]
pub async fn delete_template(
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> impl Responder {
    let code = path.into_inner();
    let base = match state.env.template_service_base.as_ref() {
        Some(b) => b,
        None => return err(actix_web::http::StatusCode::BAD_GATEWAY, "template service not configured"),
    };
    let url = format!("{}/api/v1/templates/{}", base, code);

    match reqwest::Client::new().delete(&url).send().await {
        Ok(resp) => {
            let status = actix_web::http::StatusCode::from_u16(resp.status().as_u16())
                .unwrap_or(actix_web::http::StatusCode::BAD_GATEWAY);
            HttpResponse::build(status).body(resp.text().await.unwrap_or_default())
        }
        Err(e) => err(actix_web::http::StatusCode::BAD_GATEWAY, &e.to_string()),
    }
}
