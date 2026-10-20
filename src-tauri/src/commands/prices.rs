use crate::models::settings::AppSettings;
use crate::services::cache::CachedResult;
use crate::services::prices::PricesPayload;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub async fn fetch_prices(
    state: State<'_, AppState>,
    force_refresh: bool,
) -> Result<CachedResult<PricesPayload>, String> {
    let settings: AppSettings = state.storage.read_or_default("settings.json");
    let storage = state.storage.clone();
    let prices = state.prices.clone();
    let ttl = settings.price_refresh_seconds;
    tauri::async_runtime::spawn_blocking(move || prices.get_prices(&storage, ttl, force_refresh))
        .await
        .map_err(|e| format!("Price worker join failed: {e}"))
}
