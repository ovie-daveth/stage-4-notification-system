use crate::routes::healthz::check_health;
use crate::routes::notification::{create_notification, update_status};
use crate::routes::user::{create_user, get_user, update_user_preferences};
use crate::routes::template::{create_template, list_templates, get_template, update_template, delete_template};
use actix_web::web;

pub fn config(conf: &mut web::ServiceConfig) {
    let scope = web::scope("/api/v1")
        .service(check_health)
        .service(create_notification)
        .service(update_status)
        .service(create_user)
        .service(get_user)
        .service(update_user_preferences)
        .service(create_template)
        .service(list_templates)
        .service(get_template)
        .service(update_template)
        .service(delete_template);
    conf.service(scope);
}
