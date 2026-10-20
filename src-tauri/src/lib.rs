pub mod commands;
pub mod models;
pub mod services;
pub mod tray;
pub mod windows;

use commands::system::TelemetryCollector;
use models::profile::default_profiles;
use models::settings::{AppSettings, ThemeId};
use parking_lot::Mutex;
use services::prices::PriceService;
use services::storage::StorageService;
use services::weather::WeatherService;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};
use windows::desktop_layer::{
    set_desktop_layer_visibility, setup_desktop_layer_window, sync_desktop_click_through,
};
use windows::manager::attach_manager_close_to_tray;
use windows::smart_hide::spawn_smart_hide_monitor;

pub struct AppState {
    pub storage: Arc<StorageService>,
    pub weather: Arc<WeatherService>,
    pub prices: Arc<PriceService>,
}

fn register_global_shortcuts(app: &AppHandle, settings: &AppSettings) {
    let gs = app.global_shortcut();

    let lock_shortcut = settings.hotkeys.toggle_lock.clone();
    let app_lock = app.clone();
    let _ = gs.on_shortcut(lock_shortcut.as_str(), move |_app, _sc, ev| {
        if ev.state == ShortcutState::Pressed {
            let state = app_lock.state::<AppState>();
            let mut s: AppSettings = state.storage.read_or_default("settings.json");
            s.layout_locked = !s.layout_locked;
            let _ = state.storage.write_atomic("settings.json", &s);
            sync_desktop_click_through(&app_lock, s.layout_locked, s.click_through_when_locked);
            let _ = app_lock.emit("wejet://settings-changed", &s);
        }
    });

    let note_shortcut = settings.hotkeys.quick_note.clone();
    let app_note = app.clone();
    let _ = gs.on_shortcut(note_shortcut.as_str(), move |_app, _sc, ev| {
        if ev.state == ShortcutState::Pressed {
            sync_desktop_click_through(&app_note, false, false);
            if let Some(d) = app_note.get_webview_window("desktop") {
                let _ = d.set_focus();
            }
            let _ = app_note.emit("wejet://open-quick-note", true);
        }
    });

    let cmd_shortcut = settings.hotkeys.command_center.clone();
    let app_cmd = app.clone();
    let _ = gs.on_shortcut(cmd_shortcut.as_str(), move |_app, _sc, ev| {
        if ev.state == ShortcutState::Pressed {
            sync_desktop_click_through(&app_cmd, false, false);
            if let Some(d) = app_cmd.get_webview_window("desktop") {
                let _ = d.set_focus();
            }
            let _ = app_cmd.emit("wejet://open-command-center", true);
        }
    });

    for (shortcut_str, target_profile) in [
        (settings.hotkeys.profile_work.clone(), "work"),
        (settings.hotkeys.profile_gaming.clone(), "gaming"),
        (settings.hotkeys.profile_study.clone(), "study"),
    ] {
        let app_prof = app.clone();
        let _ = gs.on_shortcut(shortcut_str.as_str(), move |_app, _sc, ev| {
            if ev.state == ShortcutState::Pressed {
                let state = app_prof.state::<AppState>();
                let profiles = state
                    .storage
                    .read_or_init("profiles.json", default_profiles);
                if let Some(selected) = profiles.into_iter().find(|p| p.id == target_profile) {
                    let mut s: AppSettings = state.storage.read_or_default("settings.json");
                    s.active_profile_id = selected.id.clone();
                    s.theme = selected.theme.clone();
                    s.accent_color = selected.accent_color.clone();
                    s.global_opacity = selected.opacity;
                    let _ = state.storage.write_atomic("settings.json", &s);
                    let _ = state.storage.write_atomic("layout.json", &selected.layout);
                    let _ = app_prof.emit("wejet://settings-changed", &s);
                    let _ = app_prof.emit("wejet://layout-changed", &selected.layout);
                }
            }
        });
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let storage = Arc::new(
        StorageService::default_app_data().expect("Failed initializing Wejet AppData directory"),
    );
    let weather = Arc::new(WeatherService::default());
    let prices = Arc::new(PriceService::default());

    let storage_for_setup = Arc::clone(&storage);

    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(AppState {
            storage,
            weather,
            prices,
        })
        .manage(Mutex::new(TelemetryCollector::default()))
        .setup(move |app| {
            let handle = app.handle();
            let settings: AppSettings = storage_for_setup.read_or_default("settings.json");
            let is_dark = !matches!(settings.theme, ThemeId::LightGlass | ThemeId::Frost);

            let _ = setup_desktop_layer_window(handle);
            sync_desktop_click_through(
                handle,
                settings.layout_locked,
                settings.click_through_when_locked,
            );
            set_desktop_layer_visibility(handle, settings.widgets_visible);
            attach_manager_close_to_tray(handle, is_dark);

            // Honor silent startup to tray (`--minimized` or user preference after onboarding)
            let launched_minimized = std::env::args().any(|a| a == "--minimized");
            if launched_minimized
                || (settings.first_run_complete && settings.launch_minimized_to_tray)
            {
                if let Some(mgr) = handle.get_webview_window("manager") {
                    let _ = mgr.hide();
                }
            }

            let _ = tray::setup_system_tray(handle);
            register_global_shortcuts(handle, &settings);
            spawn_smart_hide_monitor(handle.clone(), Arc::clone(&storage_for_setup));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::settings::get_settings,
            commands::settings::save_settings,
            commands::settings::set_autostart,
            commands::settings::get_autostart,
            commands::settings::extract_wallpaper_color,
            commands::layout::get_layout,
            commands::layout::save_layout,
            commands::layout::get_profiles,
            commands::layout::save_profiles,
            commands::layout::activate_profile,
            commands::layout::get_monitors,
            commands::system::get_system_metrics,
            commands::weather::fetch_weather,
            commands::weather::search_weather_city,
            commands::prices::fetch_prices,
            commands::launcher::get_launcher_items,
            commands::launcher::save_launcher_items,
            commands::launcher::launch_target,
            commands::launcher::discover_installed_apps,
            commands::media::get_media_info,
            commands::media::media_control,
            commands::notes::get_notes,
            commands::notes::save_notes,
            commands::notes::add_quick_note,
            commands::notes::get_clipboard_history,
            commands::notes::sync_clipboard,
            commands::notes::copy_to_clipboard,
            commands::notes::save_clipboard_history,
            commands::notes::clear_clipboard_history,
            commands::windows::open_manager,
            commands::windows::set_desktop_visibility,
            commands::windows::set_layout_lock,
            commands::windows::get_windows_mod_status,
            commands::windows::set_desktop_icons,
            commands::windows::revert_windows_mods,
            commands::windows::export_setup_file,
            commands::windows::import_setup_file,
            commands::windows::export_full_backup,
            commands::windows::restore_full_backup,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Wejet desktop application");
}
