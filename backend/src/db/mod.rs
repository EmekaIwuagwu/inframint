use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;

pub async fn get_db_pool(url: &str) -> PgPool {
    PgPoolOptions::new()
        .max_connections(5)
        .connect(url)
        .await
        .expect("Failed to create pool")
}
