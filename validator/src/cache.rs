use redis::AsyncCommands;
use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CachedEntitlement {
    pub id: String,
    pub service_id: String,
    pub buyer: String,
    pub quota_requests: u64,
    pub quota_used: u64,
    pub expires_at: u64,
    pub active: bool,
    pub rate_limit_per_second: u32,
}

pub struct EntitlementCache {
    client: redis::Client,
    ttl: Duration,
}

impl EntitlementCache {
    pub async fn new(redis_url: &str, ttl_seconds: u64) -> Result<Self, redis::RedisError> {
        let client = redis::Client::open(redis_url)?;
        let ttl = Duration::from_secs(ttl_seconds);

        Ok(Self { client, ttl })
    }

    pub async fn get(&self, entitlement_id: &str) -> Result<Option<CachedEntitlement>, redis::RedisError> {
        let mut conn = self.client.get_async_connection().await?;
        let key = format!("ent:{}", entitlement_id);

        let data: Option<String> = conn.get(&key).await?;
        match data {
            Some(data) => {
                let entitlement: CachedEntitlement = serde_json::from_str(&data)?;
                Ok(Some(entitlement))
            }
            None => Ok(None),
        }
    }

    pub async fn set(&self, entitlement_id: String, entitlement: CachedEntitlement) -> Result<(), redis::RedisError> {
        let mut conn = self.client.get_async_connection().await?;
        let key = format!("ent:{}", entitlement_id);
        let data = serde_json::to_string(&entitlement)?;

        conn.set_ex(&key, data, self.ttl.as_secs() as usize).await?;
        Ok(())
    }

    pub async fn invalidate(&self, entitlement_id: &str) -> Result<(), redis::RedisError> {
        let mut conn = self.client.get_async_connection().await?;
        let key = format!("ent:{}", entitlement_id);
        conn.del(&key).await?;
        Ok(())
    }
}
