use axum::middleware::{self as axum_middleware, from_fn_with_state};
use axum::router::Route;
use axum::{body::Body, extract::Request, response::Response};
use futures_util::future::BoxFuture;
use std::task::{Context, Poll};
use tower::Service;

// Just re-exporting auth middleware for now
pub mod auth;
