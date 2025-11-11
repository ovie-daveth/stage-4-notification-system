use tokio::sync::Mutex;
use lapin::{options::*, types::FieldTable, Channel, Connection, ConnectionProperties, ExchangeKind};
use std::{env, sync::Arc};
use crate::helpers::helpers::GatewayError;


#[derive(Debug, Clone)]
pub struct Config {
    pub url: String,
    pub port: String,
    pub redis_client: redis::Client,
    pub rmq: Arc<Mutex<Channel>>,
    pub exchange: String,
    //proxy to user service ( /api/v1/users/ request forwarding)
    pub user_service_base: Option<String>,
    pub template_service_base: Option<String>,
}

impl Config {
    pub async fn init() -> Config {
        let port = std::env::var("PORT").expect("PORT must be set");
        let url = std::env::var("URL").expect("URL must be set");
        let redis_url = env::var("REDIS_URL").expect("REDIS_URL missing");
        let client = redis::Client::open(redis_url).expect("bad REDIS_URL");
        // Keep the Client; acquire connections per request
        let (rmq_ch, exchange) = init_rabbit().await.expect("rabbit init failed");
        let user_service_base = env::var("USER_SERVICE_BASE_URL").ok();
        let template_service_base = env::var("TEMPLATE_SERVICE_BASE_URL").ok();

        Config {
            port,
            url,
            redis_client: client,
            rmq: Arc::new(Mutex::new(rmq_ch)),
            exchange,
            user_service_base,
            template_service_base,
        }
    }
}

pub async fn init_rabbit() -> Result<(Channel, String), GatewayError> {
    let amqp = env::var("RABBIT_URL").expect("RABBIT_URL missing");
    let exchange = env::var("RABBIT_EXCHANGE").unwrap_or_else(|_| "notifications.direct".to_string());

    let conn = Connection::connect(&amqp, ConnectionProperties::default())
        .await
        .map_err(|e| GatewayError::Rabbit(e.to_string()))?;

    let ch = conn
        .create_channel()
        .await
        .map_err(|e| GatewayError::Rabbit(e.to_string()))?;

    ch.exchange_declare(
        &exchange,
        ExchangeKind::Direct,
        ExchangeDeclareOptions {
            durable: true,
            ..Default::default()
        },
        FieldTable::default(),
    )
    .await
    .map_err(|e| GatewayError::Rabbit(e.to_string()))?;

    // declare queues + bindings (idempotent)
    for (queue, routing_key) in [("email.queue", "email"), ("push.queue", "push"), ("failed.queue", "failed")] {
        ch.queue_declare(
            queue,
            QueueDeclareOptions {
                durable: true,
                ..Default::default()
            },
            FieldTable::default(),
        )
        .await
        .map_err(|e| GatewayError::Rabbit(e.to_string()))?;

        ch.queue_bind(
            queue,
            &exchange,
            routing_key,
            QueueBindOptions::default(),
            FieldTable::default(),
        )
        .await
        .map_err(|e| GatewayError::Rabbit(e.to_string()))?;
    }

    Ok((ch, exchange))
}
unsafe impl Send for Config {}
unsafe impl Sync for Config {}
