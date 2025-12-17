use axum::{
    extract::{Path, State, Query},
    Json,
    http::StatusCode,
    response::IntoResponse,
};
use crate::AppState;
use serde_json::json;
use crate::models::service::Service;
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct ServiceListResponse {
    pub id: String,
    pub name: String,
    pub provider: String,
    pub type_: String,
    pub description: String,
    pub price: f64, // Lowest tier price or base price
    pub tags: Vec<String>,
}

pub async fn list(
    State(state): State<AppState>,
) -> impl IntoResponse {
    // Fetch services joined with provider name and lowest price
    let rows = sqlx::query!(
        r#"
        SELECT s.id, s.name, s.description, s.service_type, s.tags, sp.name as provider_name,
               COALESCE(MIN(pt.price_amount), 0) as min_price
        FROM services s
        JOIN service_providers sp ON s.provider_id = sp.id
        LEFT JOIN pricing_tiers pt ON s.id = pt.service_id
        WHERE s.status = 'active'
        GROUP BY s.id, sp.name
        "#
    )
    .fetch_all(&state.db)
    .await;

    match rows {
        Ok(services) => {
            let response: Vec<ServiceListResponse> = services.into_iter().map(|s| {
                ServiceListResponse {
                    id: s.id.to_string(),
                    name: s.name,
                    provider: s.provider_name,
                    type_: s.service_type,
                    description: s.description.unwrap_or_default(),
                    price: s.min_price.unwrap_or(0) as f64,
                    tags: s.tags.unwrap_or_default(),
                }
            }).collect();
            
            Json(json!({ "services": response }))
        },
        Err(e) => {
            tracing::error!("Failed to fetch services: {:?}", e);
            Json(json!({ "error": "Internal Server Error", "services": [] }))
        }
    }
}

#[derive(Serialize)]
pub struct ServiceDetailResponse {
    pub id: String,
    pub name: String,
    pub provider_name: String,
    pub description: String,
    pub type_: String,
    pub status: String,
    pub tags: Vec<String>,
    pub pricing_tiers: Vec<PricingTierResponse>,
}

#[derive(Serialize)]
pub struct PricingTierResponse {
    pub id: String,
    pub tier_name: String,
    pub price_amount: i64,
    pub price_token: String,
    pub quota_requests: Option<i32>,
}

pub async fn get(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    let service_uuid = match uuid::Uuid::parse_str(&id) {
        Ok(uid) => uid,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(json!({"error": "Invalid ID"}))).into_response(),
    };

    // Fetch Service
    let service = match sqlx::query!(
        r#"
        SELECT s.id, s.name, s.description, s.service_type, s.status, s.tags, sp.name as provider_name
        FROM services s
        JOIN service_providers sp ON s.provider_id = sp.id
        WHERE s.id = $1
        "#,
        service_uuid
    )
    .fetch_optional(&state.db)
    .await {
        Ok(Some(s)) => s,
        Ok(None) => return (StatusCode::NOT_FOUND, Json(json!({"error": "Service not found"}))).into_response(),
        Err(e) => {
            tracing::error!("Failed to fetch service: {:?}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": "Internal Server Error"}))).into_response()
        }
    };

    // Fetch Tiers
    let tiers = match sqlx::query!(
        r#"
        SELECT id, tier_name, price_amount, price_token, quota_requests
        FROM pricing_tiers
        WHERE service_id = $1
        "#,
        service_uuid
    )
    .fetch_all(&state.db)
    .await {
        Ok(t) => t,
        Err(e) => {
             tracing::error!("Failed to fetch tiers: {:?}", e);
             vec![] // Return empty tiers if fail, or error out? Empty is safer for now.
        }
    };

    let response = ServiceDetailResponse {
        id: service.id.to_string(),
        name: service.name,
        provider_name: service.provider_name,
        description: service.description.unwrap_or_default(),
        type_: service.service_type,
        status: service.status.unwrap_or_else(|| "active".to_string()),
        tags: service.tags.unwrap_or_default(),
        pricing_tiers: tiers.into_iter().map(|t| PricingTierResponse {
            id: t.id.to_string(),
            tier_name: t.tier_name,
            price_amount: t.price_amount,
            price_token: t.price_token,
            quota_requests: t.quota_requests,
        }).collect(),
    };

    Json(response).into_response()
}

pub async fn search(
    State(state): State<AppState>,
    Query(params): Query<serde_json::Value>,
) -> impl IntoResponse {
    Json(json!({ "results": [] }))
}

#[derive(Deserialize)]
pub struct CreateServiceRequest {
    pub name: String,
    pub description: String,
    pub service_type: String,
    pub tags: Vec<String>,
    pub tiers: Vec<CreateTierRequest>,
    pub provider_id: Option<String>, // Should come from Auth token in real app
}

#[derive(Deserialize)]
pub struct CreateTierRequest {
    pub name: String,
    pub price: i64,
    pub requests: i32,
}

pub async fn create(
    State(state): State<AppState>,
    Json(payload): Json<CreateServiceRequest>,
) -> impl IntoResponse {
    let provider_id = payload.provider_id.unwrap_or_else(|| "00000000-0000-0000-0000-000000000000".to_string()); // Mock Default
    let provider_uuid = uuid::Uuid::parse_str(&provider_id).unwrap_or_default();

    // Start transaction
    let mut tx = match state.db.begin().await {
        Ok(tx) => tx,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))).into_response(),
    };

    // Insert Service
    let service_id = match sqlx::query!(
        r#"
        INSERT INTO services (provider_id, name, description, service_type, tags)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
        "#,
        provider_uuid,
        payload.name,
        payload.description,
        payload.service_type,
        &payload.tags
    )
    .fetch_one(&mut *tx)
    .await {
        Ok(rec) => rec.id,
        Err(e) => {
            let _ = tx.rollback().await;
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))).into_response()
        }
    };

    // Insert Tiers
    for tier in payload.tiers {
        if let Err(e) = sqlx::query!(
            r#"
            INSERT INTO pricing_tiers (service_id, tier_name, price_amount, price_token, quota_requests)
            VALUES ($1, $2, $3, 'SUI', $4)
            "#,
            service_id,
            tier.name,
            tier.price,
            tier.requests
        )
        .execute(&mut *tx)
        .await {
            let _ = tx.rollback().await;
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))).into_response();
        }
    }

    if let Err(e) = tx.commit().await {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))).into_response();
    }

    Json(json!({ 
        "status": "created",
        "service_id": service_id.to_string()
    })).into_response()
}

pub async fn update(
    Path(id): Path<String>,
    State(state): State<AppState>,
    Json(payload): Json<serde_json::Value>,
) -> impl IntoResponse {
    let service_id = match uuid::Uuid::parse_str(&id) {
        Ok(uid) => uid,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(json!({"error": "Invalid ID"}))).into_response(),
    };

    // Parse Update Check (Partial Update)
    let name = payload.get("name").and_then(|v| v.as_str());
    let description = payload.get("description").and_then(|v| v.as_str());
    let status = payload.get("status").and_then(|v| v.as_str());
    let service_type = payload.get("type").and_then(|v| v.as_str()); // Frontend sends 'type'

    let result = sqlx::query!(
        r#"
        UPDATE services
        SET 
            name = COALESCE($1, name),
            description = COALESCE($2, description),
            status = COALESCE($3, status),
            service_type = COALESCE($4, service_type),
            updated_at = NOW()
        WHERE id = $5
        RETURNING id
        "#,
        name,
        description,
        status,
        service_type,
        service_id
    )
    .fetch_optional(&state.db)
    .await;

    match result {
        Ok(Some(_)) => Json(json!({ "status": "updated", "id": id })).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, Json(json!({"error": "Service not found"}))).into_response(),
        Err(e) => {
            tracing::error!("Update failed: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": "Update failed"}))).into_response()
        }
    }
}

pub async fn delete(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    let service_id = match uuid::Uuid::parse_str(&id) {
        Ok(uid) => uid,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(json!({"error": "Invalid ID"}))).into_response(),
    };

    // Soft delete (set status to 'archived') or Hard Delete?
    // Let's do Soft Delete for now as it's safer for infrastructure
    let result = sqlx::query!(
        r#"
        UPDATE services SET status = 'archived', updated_at = NOW() WHERE id = $1
        "#,
        service_id
    )
    .execute(&state.db)
    .await;

    match result {
        Ok(res) => {
            if res.rows_affected() > 0 {
                Json(json!({ "status": "deleted" })).into_response()
            } else {
                (StatusCode::NOT_FOUND, Json(json!({"error": "Service not found"}))).into_response()
            }
        },
        Err(e) => {
            tracing::error!("Delete failed: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": "Delete failed"}))).into_response()
        }
    }
}
