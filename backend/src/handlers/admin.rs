use axum::{
    extract::State,
    Json,
    response::IntoResponse,
    http::StatusCode,
};
use crate::AppState;
use serde_json::json;

pub async fn list_providers(
    State(state): State<AppState>,
) -> impl IntoResponse {
    // In a real app we query: SELECT * FROM users WHERE role = 'provider'
    // For now, return Mock List
    let providers = vec![
        json!({
            "id": "uuid-1",
            "name": "QuickNode",
            "status": "Verified"
        }),
        json!({
            "id": "uuid-2",
            "name": "Mysten Labs",
            "status": "Verified"
        })
    ];

    Json(json!({ "providers": providers }))
}
