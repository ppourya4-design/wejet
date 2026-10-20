use serde::{Deserialize, Serialize};

#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Language {
    #[default]
    Fa,
    En,
}

#[derive(Debug, Default, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ThemeId {
    #[default]
    DarkGlass,
    LightGlass,
    Midnight,
    Frost,
    Minimal,
    Aurora,
    Warm,
    System,
}

#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SmartHideMode {
    AlwaysShow,
    HideInFullscreen,
    HideInGames,
    #[default]
    HideInFullscreenAndGames,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HotkeyMap {
    pub toggle_lock: String,
    pub quick_note: String,
    pub command_center: String,
    pub profile_work: String,
    pub profile_gaming: String,
    pub profile_study: String,
}

impl Default for HotkeyMap {
    fn default() -> Self {
        Self {
            toggle_lock: "CommandOrControl+Alt+L".to_string(),
            quick_note: "CommandOrControl+Alt+N".to_string(),
            command_center: "CommandOrControl+Space".to_string(),
            profile_work: "CommandOrControl+Alt+1".to_string(),
            profile_gaming: "CommandOrControl+Alt+2".to_string(),
            profile_study: "CommandOrControl+Alt+3".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub version: u32,
    pub first_run_complete: bool,
    pub language: Language,
    pub use_persian_digits: bool,
    pub theme: ThemeId,
    pub accent_color: String,
    pub use_wallpaper_accent: bool,
    pub active_profile_id: String,
    pub layout_locked: bool,
    pub click_through_when_locked: bool,
    pub widgets_visible: bool,
    pub global_opacity: u8,
    pub snap_to_grid: bool,
    pub collision_awareness: bool,
    pub start_with_windows: bool,
    pub launch_minimized_to_tray: bool,
    pub smart_hide: SmartHideMode,
    pub reduced_motion: bool,
    pub weather_city: String,
    pub weather_lat: f64,
    pub weather_lon: f64,
    pub price_refresh_seconds: u64,
    pub clipboard_enabled: bool,
    pub clipboard_max_items: usize,
    pub hotkeys: HotkeyMap,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            version: 1,
            first_run_complete: false,
            language: Language::Fa,
            use_persian_digits: true,
            theme: ThemeId::DarkGlass,
            accent_color: "#5CC8FF".to_string(),
            use_wallpaper_accent: false,
            active_profile_id: "productivity".to_string(),
            layout_locked: true,
            click_through_when_locked: false,
            widgets_visible: true,
            global_opacity: 84,
            snap_to_grid: true,
            collision_awareness: true,
            start_with_windows: false,
            launch_minimized_to_tray: false,
            smart_hide: SmartHideMode::HideInFullscreenAndGames,
            reduced_motion: false,
            weather_city: "تهران / Tehran".to_string(),
            weather_lat: 35.6892,
            weather_lon: 51.3890,
            price_refresh_seconds: 300,
            clipboard_enabled: true,
            clipboard_max_items: 15,
            hotkeys: HotkeyMap::default(),
        }
    }
}
