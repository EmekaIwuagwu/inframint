use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

pub struct RateLimiter {
    windows: Arc<Mutex<HashMap<String, Vec<u64>>>>,
    window_size: u64,
    max_requests: u64,
}

impl RateLimiter {
    pub fn new(window_size: u64, max_requests: u64) -> Self {
        Self {
            windows: Arc::new(Mutex::new(HashMap::new())),
            window_size,
            max_requests,
        }
    }

    pub async fn check(&self, key: &str) -> bool {
        let mut windows = self.windows.lock().await;
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let window = windows.entry(key.to_string()).or_insert_with(Vec::new);

        // Remove old timestamps
        window.retain(|&t| t > now - self.window_size);

        if window.len() >= self.max_requests as usize {
            return false;
        }

        window.push(now);
        true
    }

    pub async fn reset(&self, key: &str) {
        let mut windows = self.windows.lock().await;
        windows.remove(key);
    }
}
