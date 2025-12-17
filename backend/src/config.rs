use serde::Deserialize;
use std::env;

#[derive(Debug, Deserialize, Clone)]
pub struct Config {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub auth: AuthConfig,
    pub redis: RedisConfig,
    pub validator: ValidatorConfig,
}

#[derive(Debug, Deserialize, Clone)]
pub struct ServerConfig {
    pub port: u16,
    pub host: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
}

#[derive(Debug, Deserialize, Clone)]
pub struct AuthConfig {
    pub jwt_secret: String,
    pub jwt_expiry: i64,
    pub refresh_expiry: i64,
}

#[derive(Debug, Deserialize, Clone)]
pub struct RedisConfig {
    pub url: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct ValidatorConfig {
    pub url: String,
    pub timeout: u64,
}

impl Config {
    pub fn from_env() -> Result<Self, config::ConfigError> {
        let mut builder = config::Config::builder()
            .add_source(config::File::with_name("config"))
            .add_source(config::Environment::with_prefix("INFRAMINT"));

        // Set defaults
        builder = builder.set_default("server.port", "8000")?;
        builder = builder.set_default("server.host", "0.0.0.0")?;
        builder = builder.set_default("database.max_connections", "10")?;
        builder = builder.set_default("auth.jwt_expiry", "3600")?;
        builder = builder.set_default("auth.refresh_expiry", "86400")?;
        builder = builder.set_default("validator.url", "http://localhost:50051")?;
        builder = builder.set_default("validator.timeout", "5")?;

        let config = builder.build()?;
        config.try_deserialize()
    }
}
