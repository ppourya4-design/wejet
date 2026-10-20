use crate::models::profile::default_profiles;
use crate::models::settings::{AppSettings, ThemeId};
use crate::windows::desktop_layer::{set_desktop_layer_visibility, sync_desktop_click_through};
use crate::windows::manager::open_manager_window;
use crate::AppState;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager};

pub fn setup_system_tray(app: &AppHandle) -> Result<(), tauri::Error> {
    let show_hide = MenuItem::with_id(
        app,
        "toggle-visibility",
        "Show / Hide Widgets",
        true,
        None::<&str>,
    )?;
    let lock_layout = MenuItem::with_id(app, "lock-layout", "Lock Layout", true, None::<&str>)?;
    let edit_layout = MenuItem::with_id(
        app,
        "edit-layout",
        "Edit Layout (Ctrl+Alt+L)",
        true,
        None::<&str>,
    )?;
    let quick_note = MenuItem::with_id(
        app,
        "quick-note",
        "Quick Note (Ctrl+Alt+N)",
        true,
        None::<&str>,
    )?;
    let cmd_center = MenuItem::with_id(
        app,
        "command-center",
        "Command Center (Ctrl+Space)",
        true,
        None::<&str>,
    )?;

    // Profiles Submenu
    let prof_prod = MenuItem::with_id(
        app,
        "profile:productivity",
        "Personal & Productivity",
        true,
        None::<&str>,
    )?;
    let prof_work =
        MenuItem::with_id(app, "profile:work", "Work (Ctrl+Alt+1)", true, None::<&str>)?;
    let prof_game = MenuItem::with_id(
        app,
        "profile:gaming",
        "Gaming (Ctrl+Alt+2)",
        true,
        None::<&str>,
    )?;
    let prof_study = MenuItem::with_id(
        app,
        "profile:study",
        "Study (Ctrl+Alt+3)",
        true,
        None::<&str>,
    )?;
    let prof_min = MenuItem::with_id(app, "profile:minimal", "Minimal", true, None::<&str>)?;
    let prof_dev = MenuItem::with_id(
        app,
        "profile:development",
        "Development",
        true,
        None::<&str>,
    )?;
    let profiles_sub = Submenu::with_items(
        app,
        "Profiles / Spaces",
        true,
        &[
            &prof_prod,
            &prof_work,
            &prof_game,
            &prof_study,
            &prof_min,
            &prof_dev,
        ],
    )?;

    // Themes Submenu
    let th_dark = MenuItem::with_id(app, "theme:dark-glass", "Dark Glass", true, None::<&str>)?;
    let th_light = MenuItem::with_id(app, "theme:light-glass", "Light Glass", true, None::<&str>)?;
    let th_mid = MenuItem::with_id(app, "theme:midnight", "Midnight", true, None::<&str>)?;
    let th_frost = MenuItem::with_id(app, "theme:frost", "Frost", true, None::<&str>)?;
    let th_min = MenuItem::with_id(app, "theme:minimal", "Minimal", true, None::<&str>)?;
    let th_aurora = MenuItem::with_id(app, "theme:aurora", "Aurora", true, None::<&str>)?;
    let th_warm = MenuItem::with_id(app, "theme:warm", "Warm", true, None::<&str>)?;
    let th_sys = MenuItem::with_id(
        app,
        "theme:system",
        "Follow Windows System",
        true,
        None::<&str>,
    )?;
    let themes_sub = Submenu::with_items(
        app,
        "Themes",
        true,
        &[
            &th_dark, &th_light, &th_mid, &th_frost, &th_min, &th_aurora, &th_warm, &th_sys,
        ],
    )?;

    let open_settings = MenuItem::with_id(
        app,
        "open-settings",
        "Settings & Manager",
        true,
        None::<&str>,
    )?;
    let open_about = MenuItem::with_id(app, "open-about", "About Wejet", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit Wejet", true, None::<&str>)?;
    let sep1 = PredefinedMenuItem::separator(app)?;
    let sep2 = PredefinedMenuItem::separator(app)?;

    let menu = Menu::with_items(
        app,
        &[
            &show_hide,
            &lock_layout,
            &edit_layout,
            &quick_note,
            &cmd_center,
            &sep1,
            &profiles_sub,
            &themes_sub,
            &sep2,
            &open_settings,
            &open_about,
            &quit,
        ],
    )?;

    let icon = app
        .default_window_icon()
        .cloned()
        .expect("Wejet bundle icon embedded");

    TrayIconBuilder::with_id("wejet-tray")
        .icon(icon)
        .tooltip("WEJET — Personal Desktop Environment")
        .menu(&menu)
        .on_menu_event(|app, event| {
            let id = event.id().as_ref();
            let state = app.state::<AppState>();

            match id {
                "toggle-visibility" => {
                    let mut s: AppSettings = state.storage.read_or_default("settings.json");
                    s.widgets_visible = !s.widgets_visible;
                    let _ = state.storage.write_atomic("settings.json", &s);
                    set_desktop_layer_visibility(app, s.widgets_visible);
                    let _ = app.emit("wejet://settings-changed", &s);
                }
                "lock-layout" | "edit-layout" => {
                    let lock = id == "lock-layout";
                    let mut s: AppSettings = state.storage.read_or_default("settings.json");
                    s.layout_locked = lock;
                    let _ = state.storage.write_atomic("settings.json", &s);
                    sync_desktop_click_through(app, lock, s.click_through_when_locked);
                    let _ = app.emit("wejet://settings-changed", &s);
                }
                "quick-note" => {
                    sync_desktop_click_through(app, false, false);
                    let _ = app.emit("wejet://open-quick-note", true);
                }
                "command-center" => {
                    sync_desktop_click_through(app, false, false);
                    let _ = app.emit("wejet://open-command-center", true);
                }
                "open-settings" => open_manager_window(app, Some("settings")),
                "open-about" => open_manager_window(app, Some("about")),
                "quit" => app.exit(0),
                other if other.starts_with("profile:") => {
                    let target_id = &other["profile:".len()..];
                    let profiles = state
                        .storage
                        .read_or_init("profiles.json", default_profiles);
                    if let Some(selected) = profiles.into_iter().find(|p| p.id == target_id) {
                        let mut s: AppSettings = state.storage.read_or_default("settings.json");
                        s.active_profile_id = selected.id.clone();
                        s.theme = selected.theme.clone();
                        s.accent_color = selected.accent_color.clone();
                        s.global_opacity = selected.opacity;
                        let _ = state.storage.write_atomic("settings.json", &s);
                        let _ = state.storage.write_atomic("layout.json", &selected.layout);
                        let _ = app.emit("wejet://settings-changed", &s);
                        let _ = app.emit("wejet://layout-changed", &selected.layout);
                    }
                }
                other if other.starts_with("theme:") => {
                    let theme_slug = &other["theme:".len()..];
                    let parsed = match theme_slug {
                        "light-glass" => ThemeId::LightGlass,
                        "midnight" => ThemeId::Midnight,
                        "frost" => ThemeId::Frost,
                        "minimal" => ThemeId::Minimal,
                        "aurora" => ThemeId::Aurora,
                        "warm" => ThemeId::Warm,
                        "system" => ThemeId::System,
                        _ => ThemeId::DarkGlass,
                    };
                    let mut s: AppSettings = state.storage.read_or_default("settings.json");
                    s.theme = parsed;
                    let _ = state.storage.write_atomic("settings.json", &s);
                    let _ = app.emit("wejet://settings-changed", &s);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                open_manager_window(tray.app_handle(), None);
            }
        })
        .build(app)?;

    Ok(())
}
