use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MonitorInfo {
    pub id: String,
    pub name: String,
    pub is_primary: bool,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub scale_factor: f64,
}

impl Default for MonitorInfo {
    fn default() -> Self {
        Self {
            id: "primary-0".to_string(),
            name: "Primary Display".to_string(),
            is_primary: true,
            x: 0,
            y: 0,
            width: 1920,
            height: 1080,
            scale_factor: 1.0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WidgetInstance {
    pub instance_id: String,
    pub widget_type: String,
    pub monitor_id: String,
    pub x: i32,
    pub y: i32,
    /// Normalized anchor ratios (0.0..=1.0) preserving layout across resolutions & monitors
    pub anchor_x_ratio: f64,
    pub anchor_y_ratio: f64,
    pub width: u32,
    pub height: u32,
    pub opacity: u8,
    pub visible: bool,
    pub locked: bool,
    pub z_index: u32,
    pub settings: HashMap<String, Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopLayout {
    pub version: u32,
    pub reference_width: u32,
    pub reference_height: u32,
    pub widgets: Vec<WidgetInstance>,
}

impl Default for DesktopLayout {
    fn default() -> Self {
        Self::curated_default()
    }
}

impl DesktopLayout {
    /// Curated default desktop layout (Sections 74–75):
    /// Clock top-right, Weather top-left, Music bottom-right, Notes/Todo bottom-left,
    /// compact System Monitor bottom-center-right, leaving wide open wallpaper space.
    pub fn curated_default() -> Self {
        let mut clock_settings = HashMap::new();
        clock_settings.insert("style".to_string(), Value::String("minimal".to_string()));
        clock_settings.insert("format24h".to_string(), Value::Bool(true));
        clock_settings.insert("showSeconds".to_string(), Value::Bool(false));
        clock_settings.insert("showPersianDate".to_string(), Value::Bool(true));
        clock_settings.insert("showGregorianDate".to_string(), Value::Bool(true));

        let mut weather_settings = HashMap::new();
        weather_settings.insert("unit".to_string(), Value::String("C".to_string()));
        weather_settings.insert("showForecast".to_string(), Value::Bool(true));

        let mut system_settings = HashMap::new();
        system_settings.insert("showChart".to_string(), Value::Bool(true));
        system_settings.insert("showNetwork".to_string(), Value::Bool(true));

        Self {
            version: 1,
            reference_width: 1440,
            reference_height: 900,
            widgets: vec![
                WidgetInstance {
                    instance_id: "w-clock-default".to_string(),
                    widget_type: "clock".to_string(),
                    monitor_id: "primary-0".to_string(),
                    x: 1080,
                    y: 40,
                    anchor_x_ratio: 0.75,
                    anchor_y_ratio: 0.044,
                    width: 320,
                    height: 184,
                    opacity: 84,
                    visible: true,
                    locked: false,
                    z_index: 1,
                    settings: clock_settings,
                },
                WidgetInstance {
                    instance_id: "w-weather-default".to_string(),
                    widget_type: "weather".to_string(),
                    monitor_id: "primary-0".to_string(),
                    x: 40,
                    y: 40,
                    anchor_x_ratio: 0.028,
                    anchor_y_ratio: 0.044,
                    width: 320,
                    height: 224,
                    opacity: 84,
                    visible: true,
                    locked: false,
                    z_index: 2,
                    settings: weather_settings,
                },
                WidgetInstance {
                    instance_id: "w-notes-default".to_string(),
                    widget_type: "notes".to_string(),
                    monitor_id: "primary-0".to_string(),
                    x: 40,
                    y: 540,
                    anchor_x_ratio: 0.028,
                    anchor_y_ratio: 0.60,
                    width: 320,
                    height: 316,
                    opacity: 86,
                    visible: true,
                    locked: false,
                    z_index: 3,
                    settings: HashMap::new(),
                },
                WidgetInstance {
                    instance_id: "w-system-default".to_string(),
                    widget_type: "system".to_string(),
                    monitor_id: "primary-0".to_string(),
                    x: 1080,
                    y: 440,
                    anchor_x_ratio: 0.75,
                    anchor_y_ratio: 0.489,
                    width: 320,
                    height: 208,
                    opacity: 82,
                    visible: true,
                    locked: false,
                    z_index: 4,
                    settings: system_settings,
                },
                WidgetInstance {
                    instance_id: "w-music-default".to_string(),
                    widget_type: "music".to_string(),
                    monitor_id: "primary-0".to_string(),
                    x: 1080,
                    y: 668,
                    anchor_x_ratio: 0.75,
                    anchor_y_ratio: 0.742,
                    width: 320,
                    height: 188,
                    opacity: 86,
                    visible: true,
                    locked: false,
                    z_index: 5,
                    settings: HashMap::new(),
                },
            ],
        }
    }
}
