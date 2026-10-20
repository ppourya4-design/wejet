use crate::models::settings::AppSettings;
use crate::services::wallpaper::extract_wallpaper_accent;
use crate::windows::desktop_layer::{set_desktop_layer_visibility, sync_desktop_click_through};
use crate::AppState;
use tauri::{AppHandle, Emitter, State};
use tauri_plugin_autostart::ManagerExt;

#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> AppSettings {
    state.storage.read_or_default("settings.json")
}

#[tauri::command]
pub fn save_settings(
    app: AppHandle,
    state: State<'_, AppState>,
    settings: AppSettings,
) -> Result<AppSettings, String> {
    state.storage.write_atomic("settings.json", &settings)?;
    sync_desktop_click_through(
        &app,
        settings.layout_locked,
        settings.click_through_when_locked,
    );
    set_desktop_layer_visibility(&app, settings.widgets_visible);
    let _ = app.emit("wejet://settings-changed", &settings);
    Ok(settings)
}

#[tauri::command]
pub fn set_autostart(
    app: AppHandle,
    state: State<'_, AppState>,
    enabled: bool,
) -> Result<bool, String> {
    let autostart = app.autolaunch();
    if enabled {
        let _ = autostart.enable();
    } else {
        let _ = autostart.disable();
    }
    let mut settings: AppSettings = state.storage.read_or_default("settings.json");
    settings.start_with_windows = enabled;
    state.storage.write_atomic("settings.json", &settings)?;
    let _ = app.emit("wejet://settings-changed", &settings);
    Ok(enabled)
}

#[tauri::command]
pub fn get_autostart(app: AppHandle, state: State<'_, AppState>) -> bool {
    app.autolaunch().is_enabled().unwrap_or_else(|_| {
        let s: AppSettings = state.storage.read_or_default("settings.json");
        s.start_with_windows
    })
}

#[tauri::command]
pub fn extract_wallpaper_color(state: State<'_, AppState>) -> Option<String> {
    extract_wallpaper_accent(&state.storage)
}
