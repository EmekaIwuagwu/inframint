use axum::{
    middleware::Next,
    response::Response,
    extract::Request,
};

pub mod auth {
    use super::*;

    pub async fn require_auth(req: Request, next: Next) -> Response {
        // TODO: Validate JWT
        next.run(req).await
    }

    pub async fn require_admin(req: Request, next: Next) -> Response {
        // TODO: Validate Admin Role
        next.run(req).await
    }
}
