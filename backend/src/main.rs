use axum::{
    routing::{get, post, put, delete},
    Router,
};
use sqlx::postgres::PgPoolOptions;
use tower_http::cors::{CorsLayer, Any};
use std::net::SocketAddr;
use dotenvy::dotenv;
use tracing::{info, error};

mod config;
mod routes;
mod handlers;
mod models;
mod db;
mod auth;
mod middleware;
mod utils;
mod validator;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    tracing_subscriber::fmt()
        .with_env_filter("inframint=debug,tower_http=debug,axum::rejection=trace")
        .init();

    // Load environment variables
    dotenv().ok();
    info!("🚀 Starting InfraMint Backend...");

    // Load configuration
    let config = config::Config::from_env()?;
    info!("📋 Configuration loaded");

    // Setup database connection pool
    let db_pool = PgPoolOptions::new()
        .max_connections(config.database.max_connections)
        .connect(&config.database.url)
        .await?;
    info!("🔗 Database connected");

    // Run migrations
    sqlx::migrate!("./migrations").run(&db_pool).await?;
    info!("📤 Database migrations applied");

    // Initialize validator client
    let validator_client = validator::ValidatorClient::new(&config.validator.url).await?;
    info!("🔐 Validator client connected");

    // Build application state
    let app_state = AppState {
        db: db_pool,
        jwt_secret: config.auth.jwt_secret.clone(),
        redis_url: config.redis.url.clone(),
        validator: validator_client,
    };
    info!("🧰 Application state initialized");

    // Build router
    // Public Routes
    let public_routes = Router::new()
        .route("/health", get(handlers::health_check))
        .route("/api/v1/auth/register", post(handlers::auth::register))
        .route("/api/v1/auth/login", post(handlers::auth::login))
        .route("/api/v1/services", get(handlers::services::list))
        .route("/api/v1/services/:id", get(handlers::services::get))
        .route("/api/v1/services/search", get(handlers::services::search))
        .route("/api/v1/stats/global", get(handlers::stats::get_global_stats))
        .route("/api/v1/stats/provider", get(handlers::stats::get_provider_stats));

    // Protected Routes
    let protected_routes = Router::new()
        .route("/api/v1/services", post(handlers::services::create))
        .route("/api/v1/services/:id", put(handlers::services::update))
        .route("/api/v1/services/:id", delete(handlers::services::delete))
        .route("/api/v1/entitlements/validate", post(handlers::entitlements::validate_entitlement))
        .route("/api/v1/entitlements/consume", post(handlers::entitlements::consume_entitlement))
        .route("/api/v1/entitlements/signature", post(handlers::entitlements::validate_signature))
        .route("/api/v1/admin/providers", get(handlers::admin::list_providers)) // TODO: Add require_admin
        .layer(axum::middleware::from_fn(middleware::auth::require_auth));

    // Build router
    let app = Router::new()
        .merge(public_routes)
        .merge(protected_routes)
        // CORS
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods([
                    axum::http::Method::GET,
                    axum::http::Method::POST,
                    axum::http::Method::PUT,
                    axum::http::Method::DELETE,
                    axum::http::Method::OPTIONS,
                ])
                .allow_headers(Any)
        )
        .with_state(app_state);

    let list = tokio::net::TcpListener::bind(format!("{}:{}", config.server.host, config.server.port)).await?;
    info!("🚀 Server listening on {}", list.local_addr()?);

    axum::serve(list, app).await?;

    Ok(())
}

#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
    pub jwt_secret: String,
    pub redis_url: String,
    pub validator: validator::ValidatorClient,
}
