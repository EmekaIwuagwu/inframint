use std::sync::Arc;
use tokio::sync::RwLock;
use validator::{ValidatorServiceImpl, ValidatorConfig};
use validator::cache::EntitlementCache;
use validator::blockchain::{SuiBlockchainClient, Entitlement};
use validator::rate_limit::RateLimiter;
use validator::error::ValidatorError;
use tonic::Request;
use validator::proto::{
    ValidateEntitlementRequest, ConsumeEntitlementRequest, ValidateSignatureRequest
};

#[tokio::test]
async fn test_validate_entitlement_success() {
    // Setup test environment
    let config = ValidatorConfig {
        redis_url: "redis://localhost:6379".to_string(),
        sui_rpc_url: "https://sui-testnet.rpc.com".to_string(),
        contract_address: "0x123".to_string(),
        cache_ttl: 300,
        rate_limit_window: 60,
        rate_limit_max: 1000,
        grpc_port: 50051,
    };

    let service = ValidatorServiceImpl::new(config).await.unwrap();

    // Test with mock data
    let request = Request::new(ValidateEntitlementRequest {
        entitlement_id: "test-entitlement-1".to_string(),
        signature: "".to_string(),
        message: "".to_string(),
    });

    let response = service.validate_entitlement(request).await.unwrap();
    assert!(response.into_inner().valid);
}

#[tokio::test]
async fn test_validate_entitlement_invalid() {
    let config = ValidatorConfig {
        redis_url: "redis://localhost:6379".to_string(),
        sui_rpc_url: "https://sui-testnet.rpc.com".to_string(),
        contract_address: "0x123".to_string(),
        cache_ttl: 300,
        rate_limit_window: 60,
        rate_limit_max: 1000,
        grpc_port: 50051,
    };

    let service = ValidatorServiceImpl::new(config).await.unwrap();

    let request = Request::new(ValidateEntitlementRequest {
        entitlement_id: "invalid-entitlement".to_string(),
        signature: "".to_string(),
        message: "".to_string(),
    });

    let response = service.validate_entitlement(request).await.unwrap();
    assert!(!response.into_inner().valid);
}

#[tokio::test]
async fn test_consume_entitlement_success() {
    let config = ValidatorConfig {
        redis_url: "redis://localhost:6379".to_string(),
        sui_rpc_url: "https://sui-testnet.rpc.com".to_string(),
        contract_address: "0x123".to_string(),
        cache_ttl: 300,
        rate_limit_window: 60,
        rate_limit_max: 1000,
        grpc_port: 50051,
    };

    let service = ValidatorServiceImpl::new(config).await.unwrap();

    let request = Request::new(ConsumeEntitlementRequest {
        entitlement_id: "test-entitlement-1".to_string(),
        amount: 10,
        signature: "test-signature".to_string(),
        message: "test-message".to_string(),
    });

    let response = service.consume_entitlement(request).await.unwrap();
    assert!(response.into_inner().success);
    assert_eq!(response.into_inner().remaining_quota, 990);
}

#[tokio::test]
async fn test_consume_entitlement_quota_exceeded() {
    let config = ValidatorConfig {
        redis_url: "redis://localhost:6379".to_string(),
        sui_rpc_url: "https://sui-testnet.rpc.com".to_string(),
        contract_address: "0x123".to_string(),
        cache_ttl: 300,
        rate_limit_window: 60,
        rate_limit_max: 1000,
        grpc_port: 50051,
    };

    let service = ValidatorServiceImpl::new(config).await.unwrap();

    let request = Request::new(ConsumeEntitlementRequest {
        entitlement_id: "test-entitlement-1".to_string(),
        amount: 2000, // More than quota
        signature: "test-signature".to_string(),
        message: "test-message".to_string(),
    });

    let response = service.consume_entitlement(request).await;
    assert!(response.is_err());
}

#[tokio::test]
async fn test_validate_signature() {
    let config = ValidatorConfig {
        redis_url: "redis://localhost:6379".to_string(),
        sui_rpc_url: "https://sui-testnet.rpc.com".to_string(),
        contract_address: "0x123".to_string(),
        cache_ttl: 300,
        rate_limit_window: 60,
        rate_limit_max: 1000,
        grpc_port: 50051,
    };

    let service = ValidatorServiceImpl::new(config).await.unwrap();

    let request = Request::new(ValidateSignatureRequest {
        entitlement_id: "test-entitlement-1".to_string(),
        signature: "test-signature".to_string(),
        message: "test-message".to_string(),
    });

    let response = service.validate_signature(request).await.unwrap();
    assert!(response.into_inner().valid);
}

#[tokio::test]
async fn test_rate_limiting() {
    let config = ValidatorConfig {
        redis_url: "redis://localhost:6379".to_string(),
        sui_rpc_url: "https://sui-testnet.rpc.com".to_string(),
        contract_address: "0x123".to_string(),
        cache_ttl: 300,
        rate_limit_window: 1, // 1 second window
        rate_limit_max: 2,   // Max 2 requests
        grpc_port: 50051,
    };

    let service = ValidatorServiceImpl::new(config).await.unwrap();

    // First request should succeed
    let request1 = Request::new(ValidateEntitlementRequest {
        entitlement_id: "rate-limit-test".to_string(),
        signature: "".to_string(),
        message: "".to_string(),
    });

    let response1 = service.validate_entitlement(request1).await;
    assert!(response1.is_ok());

    // Second request should succeed
    let request2 = Request::new(ValidateEntitlementRequest {
        entitlement_id: "rate-limit-test".to_string(),
        signature: "".to_string(),
        message: "".to_string(),
    });

    let response2 = service.validate_entitlement(request2).await;
    assert!(response2.is_ok());

    // Third request should be rate limited
    let request3 = Request::new(ValidateEntitlementRequest {
        entitlement_id: "rate-limit-test".to_string(),
        signature: "".to_string(),
        message: "".to_string(),
    });

    let response3 = service.validate_entitlement(request3).await;
    assert!(response3.is_err());
}

#[tokio::test]
async fn test_caching() {
    let config = ValidatorConfig {
        redis_url: "redis://localhost:6379".to_string(),
        sui_rpc_url: "https://sui-testnet.rpc.com".to_string(),
        contract_address: "0x123".to_string(),
        cache_ttl: 300,
        rate_limit_window: 60,
        rate_limit_max: 1000,
        grpc_port: 50051,
    };

    let service = ValidatorServiceImpl::new(config).await.unwrap();

    // First request - should hit blockchain
    let request1 = Request::new(ValidateEntitlementRequest {
        entitlement_id: "cache-test".to_string(),
        signature: "".to_string(),
        message: "".to_string(),
    });

    let response1 = service.validate_entitlement(request1).await.unwrap();
    assert!(response1.into_inner().valid);

    // Second request - should hit cache
    let request2 = Request::new(ValidateEntitlementRequest {
        entitlement_id: "cache-test".to_string(),
        signature: "".to_string(),
        message: "".to_string(),
    });

    let response2 = service.validate_entitlement(request2).await.unwrap();
    assert!(response2.into_inner().valid);
}
