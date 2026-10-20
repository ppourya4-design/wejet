use crate::models::profile::{default_profiles, DesktopProfile};
use crate::models::settings::AppSettings;
use crate::models::widget::{DesktopLayout, MonitorInfo};
use crate::windows::desktop_layer::enumerate_monitors;
use crate::AppState;
use tauri::{AppHandle, Emitter, State};

#[tauri::command]
pub fn get_layout(state: State<'_, AppState>) -> DesktopLayout {
    state.storage.read_or_default("layout.json")
}

#[tauri::command]
pub fn save_layout(
    app: AppHandle,
    state: State<'_, AppState>,
    layout: DesktopLayout,
) -> Result<DesktopLayout, String> {
    state.storage.write_atomic("layout.json", &layout)?;

    // Also update the active profile snapshot so space layouts stay synchronized
    let settings: AppSettings = state.storage.read_or_default("settings.json");
    let mut profiles: Vec<DesktopProfile> = state
        .storage
        .read_or_init("profiles.json", default_profiles);
    if let Some(active) = profiles
        .iter_mut()
        .find(|p| p.id == settings.active_profile_id)
    {
        active.layout = layout.clone();
        let _ = state.storage.write_atomic("profiles.json", &profiles);
    }

    let _ = app.emit("wejet://layout-changed", &layout);
    Ok(layout)
}

#[tauri::command]
pub fn get_profiles(state: State<'_, AppState>) -> Vec<DesktopProfile> {
    state
        .storage
        .read_or_init("profiles.json", default_profiles)
}

#[tauri::command]
pub fn save_profiles(
    app: AppHandle,
    state: State<'_, AppState>,
    profiles: Vec<DesktopProfile>,
) -> Result<Vec<DesktopProfile>, String> {
    state.storage.write_atomic("profiles.json", &profiles)?;
    let _ = app.emit("wejet://profiles-changed", &profiles);
    Ok(profiles)
}

#[tauri::command]
pub fn activate_profile(
    app: AppHandle,
    state: State<'_, AppState>,
    profile_id: String,
) -> Result<DesktopProfile, String> {
    let profiles: Vec<DesktopProfile> = state
        .storage
        .read_or_init("profiles.json", default_profiles);
    let selected = profiles
        .into_iter()
        .find(|p| p.id == profile_id)
        .ok_or_else(|| "Profile not found".to_string())?;

    let mut settings: AppSettings = state.storage.read_or_default("settings.json");
    settings.active_profile_id = selected.id.clone();
    settings.theme = selected.theme.clone();
    settings.accent_color = selected.accent_color.clone();
    settings.global_opacity = selected.opacity;

    state.storage.write_atomic("settings.json", &settings)?;
    state
        .storage
        .write_atomic("layout.json", &selected.layout)?;

    let _ = app.emit("wejet://settings-changed", &settings);
    let _ = app.emit("wejet://layout-changed", &selected.layout);
    Ok(selected)
}

#[tauri::command]
pub fn get_monitors(app: AppHandle) -> Vec<MonitorInfo> {
    enumerate_monitors(&app)
}
