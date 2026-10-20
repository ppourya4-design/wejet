use crate::models::settings::AppSettings;
use crate::services::cache::CachedResult;
use crate::services::weather::{CitySearchItem, WeatherPayload};
use crate::AppState;
use tauri::State;

#[tauri::command]
pub async fn fetch_weather(
    state: State<'_, AppState>,
    force_refresh: bool,
) -> Result<CachedResult<WeatherPayload>, String> {
    let settings: AppSettings = state.storage.read_or_default("settings.json");
    let storage = state.storage.clone();
    let weather = state.weather.clone();
    tauri::async_runtime::spawn_blocking(move || {
        weather.get_weather(
            &storage,
            &settings.weather_city,
            settings.weather_lat,
            settings.weather_lon,
            force_refresh,
        )
    })
    .await
    .map_err(|e| format!("Weather worker join failed: {e}"))
}

#[tauri::command]
pub async fn search_weather_city(
    state: State<'_, AppState>,
    query: String,
) -> Result<Vec<CitySearchItem>, String> {
    let weather = state.weather.clone();
    tauri::async_runtime::spawn_blocking(move || weather.search_cities(&query))
        .await
        .map_err(|e| format!("City search join failed: {e}"))
}
