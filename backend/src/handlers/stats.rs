use axum::{
    extract::{State, Query},
    Json,
    response::IntoResponse,
};
use crate::AppState;
use serde_json::json;
use serde::Deserialize;

pub async fn get_global_stats(
    State(state): State<AppState>,
) -> impl IntoResponse {
    // Real Data: Count services
    let services_count = match sqlx::query!("SELECT COUNT(*) as count FROM services WHERE status = 'active'")
        .fetch_one(&state.db)
        .await 
    {
        Ok(rec) => rec.count.unwrap_or(0),
        Err(_) => 0,
    };

    // Semi-Real Data: Calculate 'volume' based on average price * arbitrary multiplier or just static for MVP
    // For now, we return these from backend so frontend is receiving data.
    let volume = 2_450_000; 
    let active_users = 5_000 + (services_count * 10); // Dynamic based on services

    Json(json!({
        "services_listed": services_count,
        "volume_traded": volume,
        "active_users": active_users
    }))
}

#[derive(Deserialize)]
pub struct ProviderStatsQuery {
    provider_id: Option<String>,
}

pub async fn get_provider_stats(
    State(state): State<AppState>,
    Query(query): Query<ProviderStatsQuery>,
) -> impl IntoResponse {
    // In a real app, provider_id comes from Auth token.
    // Here we might accept it as query param for the dashboard if not strictly auth-gated for view-only
    
    let pid = query.provider_id.unwrap_or_else(|| "00000000-0000-0000-0000-000000000000".to_string());
    
    let services_count = if let Ok(uuid) = uuid::Uuid::parse_str(&pid) {
        match sqlx::query!("SELECT COUNT(*) as count FROM services WHERE provider_id = $1", uuid)
            .fetch_one(&state.db)
            .await 
        {
            Ok(rec) => rec.count.unwrap_or(0),
            Err(_) => 0,
        }
    } else {
        0 // Fallback if invalid UUID or not provided (e.g. general provider dashboard view)
        // Actually, for the dashboard we saw earlier, it fetched ALL services.
        // We will return stats relative to the user's services.
    };
    
    // Logic for Dashboard "Stats Cards"
    // We can fetch "active services" count too
    let active_services = if let Ok(uuid) = uuid::Uuid::parse_str(&pid) {
        match sqlx::query!("SELECT COUNT(*) as count FROM services WHERE provider_id = $1 AND status = 'active'", uuid)
            .fetch_one(&state.db)
            .await 
        {
            Ok(rec) => rec.count.unwrap_or(0),
            Err(_) => 0,
        }
    } else {
        0
    };

    Json(json!({
        "total_services": services_count,
        "active_services": active_services,
        // Mocked revenues for now as we don't have transaction table
        "total_revenue": 2450.00,
        "active_users": 1250,
        "recent_activity": [
            {
                "type": "purchase",
                "title": "New Purchase",
                "description": "Pro Plan for Ethereum RPC",
                "time": "2 hours ago",
                "icon_bg": "bg-green-600",
                "icon": "+"
            },
            {
                "type": "withdrawal",
                "title": "Revenue Withdrawn",
                "description": "$500.00 to wallet",
                "time": "5 hours ago",
                "icon_bg": "bg-blue-600",
                "icon": "$"
            },
            {
                "type": "update",
                "title": "Service Updated",
                "description": "Sui Indexer pricing tiers",
                "time": "1 day ago",
                "icon_bg": "bg-purple-600",
                "icon": "✓"
            }
        ]
    }))
}
