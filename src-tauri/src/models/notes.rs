use crate::models::profile::DesktopProfile;
use crate::models::settings::{AppSettings, ThemeId};
use crate::models::widget::DesktopLayout;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TodoEntry {
    pub id: String,
    pub text: String,
    pub completed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteItem {
    pub id: String,
    pub title: String,
    pub body: String,
    pub todos: Vec<TodoEntry>,
    pub pinned: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

pub fn default_notes() -> Vec<NoteItem> {
    let now = chrono::Utc::now().timestamp();
    vec![NoteItem {
        id: "note-welcome".to_string(),
        title: "یادداشت‌ها و کارهای امروز".to_string(),
        body: "برای ثبت یادداشت سریع از میانبر Ctrl + Alt + N و برای باز کردن مرکز فرمان از Ctrl + Space استفاده کنید.".to_string(),
        todos: vec![
            TodoEntry {
                id: "todo-1".to_string(),
                text: "شخصی‌سازی چیدمان ویجت‌ها با Ctrl + Alt + L".to_string(),
                completed: false,
            },
            TodoEntry {
                id: "todo-2".to_string(),
                text: "بررسی تقویم جلالی و رویدادهای ماه".to_string(),
                completed: true,
            },
        ],
        pinned: true,
        created_at: now,
        updated_at: now,
    }]
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClipboardEntry {
    pub id: String,
    pub content: String,
    pub pinned: bool,
    pub copied_at: i64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LauncherKind {
    App,
    File,
    Folder,
    Url,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LauncherItem {
    pub id: String,
    pub name: String,
    pub label: Option<String>,
    pub target: String,
    pub kind: LauncherKind,
    pub icon: String,
}

pub fn default_launcher_items() -> Vec<LauncherItem> {
    vec![
        LauncherItem {
            id: "launch-explorer".to_string(),
            name: "File Explorer".to_string(),
            label: Some("پوشه‌ها".to_string()),
            target: "explorer.exe".to_string(),
            kind: LauncherKind::App,
            icon: "folder".to_string(),
        },
        LauncherItem {
            id: "launch-notepad".to_string(),
            name: "Notepad".to_string(),
            label: Some("دفترچه یادداشت".to_string()),
            target: "notepad.exe".to_string(),
            kind: LauncherKind::App,
            icon: "file-text".to_string(),
        },
        LauncherItem {
            id: "launch-calc".to_string(),
            name: "Calculator".to_string(),
            label: Some("ماشین‌حساب".to_string()),
            target: "calc.exe".to_string(),
            kind: LauncherKind::App,
            icon: "calculator".to_string(),
        },
        LauncherItem {
            id: "launch-github".to_string(),
            name: "GitHub".to_string(),
            label: Some("گیت‌هاب".to_string()),
            target: "https://github.com".to_string(),
            kind: LauncherKind::Url,
            icon: "globe".to_string(),
        },
    ]
}

/// Shareable `.wejet` setup file containing ZERO personal notes or system paths
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WejetSetupFile {
    pub format: String,
    pub version: u32,
    pub exported_at: i64,
    pub name: String,
    pub theme: ThemeId,
    pub accent_color: String,
    pub opacity: u8,
    pub layout: DesktopLayout,
    pub profiles: Vec<DesktopProfile>,
    pub launcher: Vec<LauncherItem>,
}

/// Versioned full local backup bundle (Section 50)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FullBackupBundle {
    pub version: u32,
    pub exported_at: i64,
    pub settings: AppSettings,
    pub profiles: Vec<DesktopProfile>,
    pub layouts: DesktopLayout,
    pub notes: Vec<NoteItem>,
    pub launcher: Vec<LauncherItem>,
}
