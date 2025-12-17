use serde::Deserialize;
use std::env;
use config::{Config, File, Environment, ConfigError};

#[derive(Debug, Deserialize, Clone)]
pub struct ValidatorConfig {
    pub redis_url: String,
    pub sui_rpc_url: String,
    pub contract_address: String,
    pub cache_ttl: u64,
    pub rate_limit_window: u64,
    pub rate_limit_max: u64,
    pub grpc_port: u16,
}

impl ValidatorConfig {
    pub fn from_env() -> Result<Self, ConfigError> {
        let mut builder = Config::builder()
            .add_source(File::with_name("validator-config").required(false))
            .add_source(Environment::with_prefix("VALIDATOR"));

        // Set defaults
        builder = builder.set_default("cache_ttl", "300")?;
        builder = builder.set_default("rate_limit_window", "60")?;
        builder = builder.set_default("rate_limit_max", "1000")?;
        builder = builder.set_default("grpc_port", "50051")?;

        let config = builder.build()?;
        config.try_deserialize()
    }
}
