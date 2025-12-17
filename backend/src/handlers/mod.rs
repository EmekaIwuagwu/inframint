pub mod services;
pub mod auth;
pub mod admin;
pub mod entitlements;
pub mod stats;

use axum::{Json, response::IntoResponse};
use serde_json::json;

pub async fn health_check() -> impl IntoResponse {
    Json(json!({ "status": "ok" }))
}
