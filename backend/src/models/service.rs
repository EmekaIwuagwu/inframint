use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Service {
    pub id: Uuid,
    pub provider_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    #[sqlx(rename = "service_type")]
    pub type_: String, // Mapped to service_type in DB
    pub status: String,
    pub tags: Option<Vec<String>>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct PricingTier {
    pub id: Uuid,
    pub service_id: Uuid,
    pub tier_name: String,
    pub price_amount: i64,
    pub price_token: String,
    pub quota_requests: Option<i32>,
    pub created_at: Option<DateTime<Utc>>,
}
