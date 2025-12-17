use thiserror::Error;

#[derive(Error, Debug)]
pub enum ValidatorError {
    #[error("Invalid entitlement")]
    InvalidEntitlement,

    #[error("Quota exceeded")]
    QuotaExceeded,

    #[error("Rate limit exceeded")]
    RateLimitExceeded,

    #[error("Blockchain error: {0}")]
    BlockchainError(String),

    #[error("Cache error: {0}")]
    CacheError(String),

    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Redis error: {0}")]
    RedisError(String),

    #[error("Signature validation failed")]
    SignatureValidationFailed,

    #[error("Network error: {0}")]
    NetworkError(String),
}

impl From<redis::RedisError> for ValidatorError {
    fn from(err: redis::RedisError) -> Self {
        ValidatorError::RedisError(err.to_string())
    }
}

impl From<config::ConfigError> for ValidatorError {
    fn from(err: config::ConfigError) -> Self {
        ValidatorError::ConfigError(err.to_string())
    }
}

impl From<tonic::Status> for ValidatorError {
    fn from(err: tonic::Status) -> Self {
        ValidatorError::NetworkError(err.to_string())
    }
}

impl From<tonic::transport::Error> for ValidatorError {
    fn from(err: tonic::transport::Error) -> Self {
        ValidatorError::NetworkError(err.to_string())
    }
}
