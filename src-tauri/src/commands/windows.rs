use crate::models::notes::{
    default_launcher_items, default_notes, FullBackupBundle, LauncherItem, NoteItem, WejetSetupFile,
};
use crate::models::profile::{default_profiles, DesktopProfile};
use crate::models::settings::AppSettings;
use crate::models::widget::DesktopLayout;
use crate::services::mods::{
    get_desktop_icons_status, revert_all_mods, set_desktop_icons_visible, WindowsModStatus,
};
use crate::windows::desktop_layer::{set_desktop_layer_visibility, sync_desktop_click_through};
use crate::windows::manager::open_manager_window;
use crate::AppState;
use tauri::{AppHandle, Emitter, State};

#[tauri::command]
pub fn open_manager(app: AppHandle, section: Option<String>) {
    open_manager_window(&app, section.as_deref());
}

#[tauri::command]
pub fn set_desktop_visibility(
    app: AppHandle,
    state: State<'_, AppState>,
    visible: bool,
) -> Result<AppSettings, String> {
    let mut settings: AppSettings = state.storage.read_or_default("settings.json");
    settings.widgets_visible = visible;
    state.storage.write_atomic("settings.json", &settings)?;
    set_desktop_layer_visibility(&app, visible);
    let _ = app.emit("wejet://settings-changed", &settings);
    Ok(settings)
}

#[tauri::command]
pub fn set_layout_lock(
    app: AppHandle,
    state: State<'_, AppState>,
    locked: bool,
) -> Result<AppSettings, String> {
    let mut settings: AppSettings = state.storage.read_or_default("settings.json");
    settings.layout_locked = locked;
    state.storage.write_atomic("settings.json", &settings)?;
    sync_desktop_click_through(&app, locked, settings.click_through_when_locked);
    let _ = app.emit("wejet://settings-changed", &settings);
    Ok(settings)
}

#[tauri::command]
pub fn get_windows_mod_status(state: State<'_, AppState>) -> WindowsModStatus {
    get_desktop_icons_status(&state.storage)
}

#[tauri::command]
pub fn set_desktop_icons(
    state: State<'_, AppState>,
    visible: bool,
) -> Result<WindowsModStatus, String> {
    set_desktop_icons_visible(&state.storage, visible)
}

#[tauri::command]
pub fn revert_windows_mods(state: State<'_, AppState>) -> Result<WindowsModStatus, String> {
    revert_all_mods(&state.storage)
}

#[tauri::command]
pub fn export_setup_file(state: State<'_, AppState>, name: String) -> Result<String, String> {
    let settings: AppSettings = state.storage.read_or_default("settings.json");
    let layout: DesktopLayout = state.storage.read_or_default("layout.json");
    let profiles: Vec<DesktopProfile> = state
        .storage
        .read_or_init("profiles.json", default_profiles);
    let launcher: Vec<LauncherItem> = state
        .storage
        .read_or_init("launcher.json", default_launcher_items);

    let bundle = WejetSetupFile {
        format: "wejet-setup".to_string(),
        version: 1,
        exported_at: chrono::Utc::now().timestamp(),
        name,
        theme: settings.theme,
        accent_color: settings.accent_color,
        opacity: settings.global_opacity,
        layout,
        profiles,
        launcher,
    };
    serde_json::to_string_pretty(&bundle).map_err(|e| format!("Export serialize failed: {e}"))
}

#[tauri::command]
pub fn import_setup_file(
    app: AppHandle,
    state: State<'_, AppState>,
    raw_json: String,
) -> Result<AppSettings, String> {
    let parsed: WejetSetupFile =
        serde_json::from_str(&raw_json).map_err(|_| "Invalid .wejet setup file".to_string())?;
    if parsed.version != 1 {
        return Err("Unsupported .wejet file version".to_string());
    }

    let mut settings: AppSettings = state.storage.read_or_default("settings.json");
    settings.theme = parsed.theme;
    settings.accent_color = parsed.accent_color;
    settings.global_opacity = parsed.opacity.clamp(20, 100);

    state.storage.write_atomic("settings.json", &settings)?;
    state.storage.write_atomic("layout.json", &parsed.layout)?;
    state
        .storage
        .write_atomic("profiles.json", &parsed.profiles)?;
    state
        .storage
        .write_atomic("launcher.json", &parsed.launcher)?;

    let _ = app.emit("wejet://settings-changed", &settings);
    let _ = app.emit("wejet://layout-changed", &parsed.layout);
    let _ = app.emit("wejet://profiles-changed", &parsed.profiles);
    let _ = app.emit("wejet://launcher-changed", &parsed.launcher);
    Ok(settings)
}

#[tauri::command]
pub fn export_full_backup(state: State<'_, AppState>) -> Result<String, String> {
    let backup = FullBackupBundle {
        version: 1,
        exported_at: chrono::Utc::now().timestamp(),
        settings: state.storage.read_or_default("settings.json"),
        profiles: state
            .storage
            .read_or_init("profiles.json", default_profiles),
        layouts: state.storage.read_or_default("layout.json"),
        notes: state.storage.read_or_init("notes.json", default_notes),
        launcher: state
            .storage
            .read_or_init("launcher.json", default_launcher_items),
    };
    serde_json::to_string_pretty(&backup).map_err(|e| format!("Backup serialize failed: {e}"))
}

#[tauri::command]
pub fn restore_full_backup(
    app: AppHandle,
    state: State<'_, AppState>,
    raw_json: String,
) -> Result<AppSettings, String> {
    let backup: FullBackupBundle =
        serde_json::from_str(&raw_json).map_err(|_| "Invalid Wejet backup JSON".to_string())?;
    if backup.version != 1 {
        return Err("Unsupported backup format version".to_string());
    }

    let notes: Vec<NoteItem> = backup.notes;
    state
        .storage
        .write_atomic("settings.json", &backup.settings)?;
    state
        .storage
        .write_atomic("profiles.json", &backup.profiles)?;
    state.storage.write_atomic("layout.json", &backup.layouts)?;
    state.storage.write_atomic("notes.json", &notes)?;
    state
        .storage
        .write_atomic("launcher.json", &backup.launcher)?;

    let _ = app.emit("wejet://settings-changed", &backup.settings);
    let _ = app.emit("wejet://layout-changed", &backup.layouts);
    let _ = app.emit("wejet://profiles-changed", &backup.profiles);
    let _ = app.emit("wejet://notes-changed", &notes);
    let _ = app.emit("wejet://launcher-changed", &backup.launcher);
    Ok(backup.settings)
}
