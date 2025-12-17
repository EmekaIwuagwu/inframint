use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, error, debug};
use dotenvy::dotenv;
use tonic::{transport::Server, Request, Response, Status};
use prost::Message;

mod cache;
mod blockchain;
mod rate_limit;
mod config;
mod error;
mod proto {
    tonic::include_proto!("validator");
}

use crate::{
    cache::EntitlementCache,
    blockchain::{SuiBlockchainClient, BlockchainError},
    rate_limit::RateLimiter,
    config::ValidatorConfig,
    error::ValidatorError,
    proto::{
        validator_service_server::{ValidatorService, ValidatorServiceServer},
        ValidateEntitlementRequest, ValidateEntitlementResponse,
        ConsumeEntitlementRequest, ConsumeEntitlementResponse,
        ValidateSignatureRequest, ValidateSignatureResponse,
        Entitlement as ProtoEntitlement
    },
};

#[derive(Clone)]
pub struct ValidatorServiceImpl {
    cache: Arc<RwLock<EntitlementCache>>,
    blockchain: Arc<SuiBlockchainClient>,
    rate_limiter: Arc<RateLimiter>,
    config: ValidatorConfig,
}

#[tonic::async_trait]
impl ValidatorService for ValidatorServiceImpl {
    async fn validate_entitlement(
        &self,
        request: Request<ValidateEntitlementRequest>,
    ) -> Result<Response<ValidateEntitlementResponse>, Status> {
        let req = request.into_inner();

        // Rate limiting
        if !self.rate_limiter.check(&req.entitlement_id).await {
            return Err(Status::resource_exhausted("Rate limit exceeded"));
        }

        // Validate signature if provided
        if !req.signature.is_empty() && !req.message.is_empty() {
            let is_valid = self.validate_signature_internal(&req.entitlement_id, &req.signature, &req.message)
                .await
                .map_err(|e| Status::invalid_argument(e.to_string()))?;

            if !is_valid {
                return Ok(Response::new(ValidateEntitlementResponse {
                    valid: false,
                    error: "Invalid signature".to_string(),
                    entitlement: None,
                }));
            }
        }

        // Validate entitlement
        let result = self.validate_entitlement_internal(&req.entitlement_id)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        let response = ValidateEntitlementResponse {
            valid: result.is_some(),
            error: if result.is_some() { String::new() } else { "Entitlement not found or invalid".to_string() },
            entitlement: result.map(|e| ProtoEntitlement {
                id: e.id,
                service_id: e.service_id,
                buyer: e.buyer,
                tier_id: e.tier_id,
                quota_requests: e.quota_requests,
                quota_used: e.quota_used,
                purchased_at: e.purchased_at,
                expires_at: e.expires_at,
                active: e.active,
            }),
        };

        Ok(Response::new(response))
    }

    async fn consume_entitlement(
        &self,
        request: Request<ConsumeEntitlementRequest>,
    ) -> Result<Response<ConsumeEntitlementResponse>, Status> {
        let req = request.into_inner();

        // Rate limiting
        if !self.rate_limiter.check(&req.entitlement_id).await {
            return Err(Status::resource_exhausted("Rate limit exceeded"));
        }

        // Validate signature
        let is_valid = self.validate_signature_internal(&req.entitlement_id, &req.signature, &req.message)
            .await
            .map_err(|e| Status::invalid_argument(e.to_string()))?;

        if !is_valid {
            return Ok(Response::new(ConsumeEntitlementResponse {
                success: false,
                error: "Invalid signature".to_string(),
                remaining_quota: 0,
            }));
        }

        // Consume entitlement
        let remaining = self.consume_entitlement_internal(&req.entitlement_id, req.amount)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(ConsumeEntitlementResponse {
            success: true,
            error: String::new(),
            remaining_quota: remaining,
        }))
    }

    async fn validate_signature(
        &self,
        request: Request<ValidateSignatureRequest>,
    ) -> Result<Response<ValidateSignatureResponse>, Status> {
        let req = request.into_inner();

        // Rate limiting
        if !self.rate_limiter.check(&req.entitlement_id).await {
            return Err(Status::resource_exhausted("Rate limit exceeded"));
        }

        let is_valid = self.validate_signature_internal(&req.entitlement_id, &req.signature, &req.message)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(ValidateSignatureResponse {
            valid: is_valid,
            error: if is_valid { String::new() } else { "Invalid signature".to_string() },
        }))
    }
}

impl ValidatorServiceImpl {
    pub async fn new(config: ValidatorConfig) -> Result<Self, ValidatorError> {
        let cache = Arc::new(RwLock::new(EntitlementCache::new(
            &config.redis_url,
            config.cache_ttl,
        ).await?));

        let blockchain = Arc::new(SuiBlockchainClient::new(
            &config.sui_rpc_url,
            &config.contract_address,
        ).map_err(|e| ValidatorError::BlockchainError(e.to_string()))?);

        let rate_limiter = Arc::new(RateLimiter::new(
            config.rate_limit_window,
            config.rate_limit_max,
        ));

        Ok(Self {
            cache,
            blockchain,
            rate_limiter,
            config,
        })
    }

    async fn validate_entitlement_internal(
        &self,
        entitlement_id: &str,
    ) -> Result<Option<blockchain::Entitlement>, ValidatorError> {
        // Try cache first
        {
            let cache = self.cache.read().await;
            if let Some(entitlement) = cache.get(entitlement_id).await? {
                return Ok(Some(entitlement));
            }
        }

        // Fetch from blockchain
        let entitlement = self.blockchain.get_entitlement(entitlement_id)
            .await
            .map_err(|e| ValidatorError::BlockchainError(e.to_string()))?;

        // Validate entitlement
        if !self.validate_entitlement_data(&entitlement) {
            return Ok(None);
        }

        // Cache it
        {
            let mut cache = self.cache.write().await;
            cache.set(entitlement_id.to_string(), entitlement.clone()).await?;
        }

        Ok(Some(entitlement))
    }

    fn validate_entitlement_data(&self, entitlement: &blockchain::Entitlement) -> bool {
        if !entitlement.active {
            return false;
        }

        if entitlement.expires_at <= chrono::Utc::now().timestamp() as u64 {
            return false;
        }

        true
    }

    async fn validate_signature_internal(
        &self,
        entitlement_id: &str,
        signature: &str,
        message: &str,
    ) -> Result<bool, ValidatorError> {
        self.blockchain.validate_entitlement_signature(entitlement_id, signature, message)
            .await
            .map_err(|e| ValidatorError::BlockchainError(e.to_string()))
    }

    async fn consume_entitlement_internal(
        &self,
        entitlement_id: &str,
        amount: u64,
    ) -> Result<u64, ValidatorError> {
        // Validate first
        let entitlement = self.validate_entitlement_internal(entitlement_id).await?
            .ok_or(ValidatorError::InvalidEntitlement)?;

        // Check quota
        if entitlement.quota_used + amount > entitlement.quota_requests {
            return Err(ValidatorError::QuotaExceeded);
        }

        // Update on blockchain
        self.blockchain.consume_entitlement(entitlement_id, amount)
            .await
            .map_err(|e| ValidatorError::BlockchainError(e.to_string()))?;

        // Update cache
        {
            let mut cache = self.cache.write().await;
            if let Some(mut cached) = cache.get(entitlement_id).await? {
                cached.quota_used += amount;
                if cached.quota_used >= cached.quota_requests {
                    cached.active = false;
                }
                cache.set(entitlement_id.to_string(), cached).await?;
            }
        }

        Ok(entitlement.quota_requests - entitlement.quota_used - amount)
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    tracing_subscriber::fmt()
        .with_env_filter("inframint_validator=debug")
        .init();

    // Load environment variables
    dotenv().ok();
    info!("🔐 Starting InfraMint Validator...");

    // Load configuration
    let config = ValidatorConfig::from_env()?;
    info!("📋 Configuration loaded");

    // Initialize validator service
    let service = ValidatorServiceImpl::new(config).await?;
    info!("🚀 Validator service ready");

    // Start gRPC server
    let addr = format!("[::1]:{}", service.config.grpc_port).parse()?;
    info!("📊 gRPC server listening on {}", addr);

    Server::builder()
        .add_service(ValidatorServiceServer::new(service))
        .serve(addr)
        .await?;

    Ok(())
}
