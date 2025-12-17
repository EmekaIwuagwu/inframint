use axum::{
    extract::{Path, State, Query},
    Json,
    http::StatusCode,
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use crate::AppState;
use serde_json::json;

#[derive(Deserialize)]
pub struct ValidateEntitlementRequest {
    pub entitlement_id: String,
    pub signature: String,
    pub message: String,
}

#[derive(Serialize)]
pub struct ValidateEntitlementResponse {
    pub valid: bool,
    pub error: Option<String>,
}

pub async fn validate_entitlement(
    State(state): State<AppState>,
    Json(request): Json<ValidateEntitlementRequest>,
) -> impl IntoResponse {
    let result = state.validator.validate_entitlement(
        &request.entitlement_id,
        &request.signature,
        &request.message,
    ).await;

    match result {
        Ok(valid) => {
            Json(json!({
                "valid": valid,
                "error": None::<String>
            }))
        },
        Err(e) => {
            Json(json!({
                "valid": false,
                "error": format!("Validation failed: {}", e)
            }))
        }
    }
}

#[derive(Deserialize)]
pub struct ConsumeEntitlementRequest {
    pub entitlement_id: String,
    pub amount: u64,
    pub signature: String,
    pub message: String,
}

#[derive(Serialize)]
pub struct ConsumeEntitlementResponse {
    pub success: bool,
    pub remaining_quota: Option<u64>,
    pub error: Option<String>,
}

pub async fn consume_entitlement(
    State(state): State<AppState>,
    Json(request): Json<ConsumeEntitlementRequest>,
) -> impl IntoResponse {
    let result = state.validator.consume_entitlement(
        &request.entitlement_id,
        request.amount,
        &request.signature,
        &request.message,
    ).await;

    match result {
        Ok(remaining) => {
            Json(json!({
                "success": true,
                "remaining_quota": remaining,
                "error": None::<String>
            }))
        },
        Err(e) => {
            Json(json!({
                "success": false,
                "remaining_quota": None::<u64>,
                "error": format!("Consumption failed: {}", e)
            }))
        }
    }
}

#[derive(Deserialize)]
pub struct ValidateSignatureRequest {
    pub entitlement_id: String,
    pub signature: String,
    pub message: String,
}

#[derive(Serialize)]
pub struct ValidateSignatureResponse {
    pub valid: bool,
    pub error: Option<String>,
}

pub async fn validate_signature(
    State(state): State<AppState>,
    Json(request): Json<ValidateSignatureRequest>,
) -> impl IntoResponse {
    let result = state.validator.validate_signature(
        &request.entitlement_id,
        &request.signature,
        &request.message,
    ).await;

    match result {
        Ok(valid) => {
            Json(json!({
                "valid": valid,
                "error": None::<String>
            }))
        },
        Err(e) => {
            Json(json!({
                "valid": false,
                "error": format!("Signature validation failed: {}", e)
            }))
        }
    }
}
