use crate::services::storage::StorageService;
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CacheEnvelope<T> {
    pub data: T,
    pub fetched_at: i64,
    pub ttl_seconds: u64,
    pub provider: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedResult<T> {
    pub data: T,
    pub fetched_at: i64,
    pub age_seconds: u64,
    pub is_stale: bool,
    pub provider: String,
}

impl<T> CacheEnvelope<T> {
    pub fn into_result(self, force_stale: bool) -> CachedResult<T> {
        let now = chrono::Utc::now().timestamp();
        let age = now.saturating_sub(self.fetched_at) as u64;
        let expired = age > self.ttl_seconds;
        CachedResult {
            data: self.data,
            fetched_at: self.fetched_at,
            age_seconds: age,
            is_stale: force_stale || expired,
            provider: self.provider,
        }
    }
}

pub fn load_cached<T: DeserializeOwned>(
    storage: &StorageService,
    cache_key: &str,
) -> Option<CacheEnvelope<T>> {
    storage
        .read_optional::<CacheEnvelope<T>>(cache_key)
        .ok()
        .flatten()
}

pub fn save_cached<T: Serialize + Clone>(
    storage: &StorageService,
    cache_key: &str,
    data: T,
    ttl_seconds: u64,
    provider: &str,
) -> CachedResult<T> {
    let now = chrono::Utc::now().timestamp();
    let env = CacheEnvelope {
        data: data.clone(),
        fetched_at: now,
        ttl_seconds,
        provider: provider.to_string(),
    };
    let _ = storage.write_atomic(cache_key, &env);
    CachedResult {
        data,
        fetched_at: now,
        age_seconds: 0,
        is_stale: false,
        provider: provider.to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cache_envelope_ttl_and_stale_behavior() {
        let dir = tempfile::tempdir().expect("tempdir");
        let storage = StorageService::new(dir.path().to_path_buf()).expect("storage");

        let saved = save_cached(&storage, "cache/test.json", 42_i32, 1800, "unit-test");
        assert!(!saved.is_stale);
        assert_eq!(saved.data, 42);

        let loaded = load_cached::<i32>(&storage, "cache/test.json").expect("cached item");
        assert_eq!(loaded.provider, "unit-test");

        let stale_view = loaded.into_result(true);
        assert!(stale_view.is_stale);
    }
}
