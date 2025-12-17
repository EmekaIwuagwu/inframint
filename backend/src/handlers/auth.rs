use axum::{
    extract::State,
    Json,
    response::IntoResponse,
    http::StatusCode,
};
use crate::AppState;
use serde::Deserialize;
use serde_json::json;

#[derive(Deserialize)]
pub struct AuthRequest {
    pub email: String,
    pub password: String, // In real app, hash this!
}

pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<AuthRequest>,
) -> impl IntoResponse {
    // Check if user exists (Mock check)
    if payload.email == "exists@example.com" {
         return (StatusCode::CONFLICT, Json(json!({"error": "User already exists"}))).into_response();
    }
    
    // In a real app: Hash password, insert into DB
    // let user_id = sqlx::query!(...)

    Json(json!({ 
        "token": "mock_jwt_token_for_new_user",
        "user": {
            "email": payload.email,
            "role": "provider"
        }
    })).into_response()
}

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<AuthRequest>,
) -> impl IntoResponse {
    // Mock Login Logic
    if payload.email == "demo@inframint.com" && payload.password == "password" {
        Json(json!({ 
            "token": "mock_jwt_token_valid",
            "user": {
                "id": "123",
                "email": payload.email,
                "role": "admin"
            }
        })).into_response()
    } else {
        (StatusCode::UNAUTHORIZED, Json(json!({"error": "Invalid credentials"}))).into_response()
    }
}
