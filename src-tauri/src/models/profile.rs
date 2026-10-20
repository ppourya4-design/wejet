use crate::models::settings::ThemeId;
use crate::models::widget::{DesktopLayout, WidgetInstance};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopProfile {
    pub id: String,
    pub name_fa: String,
    pub name_en: String,
    pub description_fa: String,
    pub description_en: String,
    pub icon: String,
    pub theme: ThemeId,
    pub accent_color: String,
    pub opacity: u8,
    pub layout: DesktopLayout,
}

pub fn default_profiles() -> Vec<DesktopProfile> {
    let base = DesktopLayout::curated_default();

    // Minimal profile: pure editorial clock + weather only
    let minimal_widgets: Vec<WidgetInstance> = base
        .widgets
        .iter()
        .filter(|w| w.widget_type == "clock" || w.widget_type == "weather")
        .cloned()
        .collect();

    // Gaming profile: compact system monitor + clock + media
    let gaming_widgets: Vec<WidgetInstance> = base
        .widgets
        .iter()
        .filter(|w| {
            w.widget_type == "clock" || w.widget_type == "system" || w.widget_type == "music"
        })
        .cloned()
        .collect();

    // Study profile: clock + calendar + notes
    let mut study_widgets: Vec<WidgetInstance> = base
        .widgets
        .iter()
        .filter(|w| w.widget_type == "clock" || w.widget_type == "notes")
        .cloned()
        .collect();
    study_widgets.push(WidgetInstance {
        instance_id: "w-calendar-study".to_string(),
        widget_type: "calendar".to_string(),
        monitor_id: "primary-0".to_string(),
        x: 40,
        y: 40,
        anchor_x_ratio: 0.028,
        anchor_y_ratio: 0.044,
        width: 328,
        height: 312,
        opacity: 88,
        visible: true,
        locked: false,
        z_index: 6,
        settings: HashMap::new(),
    });

    // Work profile: clock + calendar + prices + notes + launcher
    let mut work_widgets = study_widgets.clone();
    work_widgets.push(WidgetInstance {
        instance_id: "w-prices-work".to_string(),
        widget_type: "prices".to_string(),
        monitor_id: "primary-0".to_string(),
        x: 1080,
        y: 244,
        anchor_x_ratio: 0.75,
        anchor_y_ratio: 0.271,
        width: 320,
        height: 256,
        opacity: 86,
        visible: true,
        locked: false,
        z_index: 7,
        settings: HashMap::new(),
    });

    // Development profile: clock + system + launcher + notes
    let mut dev_widgets = base
        .widgets
        .iter()
        .filter(|w| {
            w.widget_type == "clock" || w.widget_type == "system" || w.widget_type == "notes"
        })
        .cloned()
        .collect::<Vec<_>>();
    let mut launcher_cfg = HashMap::new();
    launcher_cfg.insert("columns".to_string(), Value::Number(2.into()));
    dev_widgets.push(WidgetInstance {
        instance_id: "w-launcher-dev".to_string(),
        widget_type: "launcher".to_string(),
        monitor_id: "primary-0".to_string(),
        x: 40,
        y: 40,
        anchor_x_ratio: 0.028,
        anchor_y_ratio: 0.044,
        width: 320,
        height: 248,
        opacity: 85,
        visible: true,
        locked: false,
        z_index: 8,
        settings: launcher_cfg,
    });

    vec![
        DesktopProfile {
            id: "productivity".to_string(),
            name_fa: "بهره‌وری (پیش‌فرض)".to_string(),
            name_en: "Personal & Productivity".to_string(),
            description_fa: "چیدمان متعادل شامل ساعت، آب‌وهوا، یادداشت، پایش سیستم و موسیقی"
                .to_string(),
            description_en: "Balanced desktop with clock, weather, notes, telemetry, and media"
                .to_string(),
            icon: "sparkles".to_string(),
            theme: ThemeId::DarkGlass,
            accent_color: "#5CC8FF".to_string(),
            opacity: 84,
            layout: base,
        },
        DesktopProfile {
            id: "work".to_string(),
            name_fa: "کاری".to_string(),
            name_en: "Work".to_string(),
            description_fa: "تمرکز بر تقویم جلالی، نرخ ارز و طلا، وظایف روزانه و ساعت".to_string(),
            description_en:
                "Focused workspace with Jalali calendar, market rates, tasks, and clock".to_string(),
            icon: "briefcase".to_string(),
            theme: ThemeId::Frost,
            accent_color: "#38BDF8".to_string(),
            opacity: 88,
            layout: DesktopLayout {
                version: 1,
                reference_width: 1440,
                reference_height: 900,
                widgets: work_widgets,
            },
        },
        DesktopProfile {
            id: "gaming".to_string(),
            name_fa: "گیمینگ".to_string(),
            name_en: "Gaming".to_string(),
            description_fa: "سبک و خلوت با پایش زنده پردازنده/رم و کنترل موسیقی".to_string(),
            description_en: "Ultra-lean HUD with hardware telemetry, clock, and media controls"
                .to_string(),
            icon: "gamepad".to_string(),
            theme: ThemeId::Midnight,
            accent_color: "#818CF8".to_string(),
            opacity: 76,
            layout: DesktopLayout {
                version: 1,
                reference_width: 1440,
                reference_height: 900,
                widgets: gaming_widgets,
            },
        },
        DesktopProfile {
            id: "study".to_string(),
            name_fa: "مطالعه".to_string(),
            name_en: "Study".to_string(),
            description_fa: "محیط آرام با تقویم، چک‌لیست مطالعه و ساعت شیشه‌ای گرم".to_string(),
            description_en: "Calm glass environment with calendar, study checklist, and warm tone"
                .to_string(),
            icon: "book".to_string(),
            theme: ThemeId::Warm,
            accent_color: "#FBBF24".to_string(),
            opacity: 86,
            layout: DesktopLayout {
                version: 1,
                reference_width: 1440,
                reference_height: 900,
                widgets: study_widgets,
            },
        },
        DesktopProfile {
            id: "minimal".to_string(),
            name_fa: "مینیمال".to_string(),
            name_en: "Minimal".to_string(),
            description_fa: "حداکثر فضای تصویر زمینه با ساعت شفاف و وضعیت هوا".to_string(),
            description_en: "Pure wallpaper showcase with ultra-translucent clock and weather"
                .to_string(),
            icon: "feather".to_string(),
            theme: ThemeId::Minimal,
            accent_color: "#94A3B8".to_string(),
            opacity: 68,
            layout: DesktopLayout {
                version: 1,
                reference_width: 1440,
                reference_height: 900,
                widgets: minimal_widgets,
            },
        },
        DesktopProfile {
            id: "development".to_string(),
            name_fa: "توسعه نرم‌افزار".to_string(),
            name_en: "Development".to_string(),
            description_fa: "پرتابگر سریع ابزارها، پایش منابع سیستم و یادداشت فنی".to_string(),
            description_en: "Dev launcher shortcuts, 60s hardware graphs, and scratchpad notes"
                .to_string(),
            icon: "terminal".to_string(),
            theme: ThemeId::Aurora,
            accent_color: "#34D399".to_string(),
            opacity: 84,
            layout: DesktopLayout {
                version: 1,
                reference_width: 1440,
                reference_height: 900,
                widgets: dev_widgets,
            },
        },
    ]
}
