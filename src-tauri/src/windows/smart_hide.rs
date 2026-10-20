use crate::models::settings::{AppSettings, SmartHideMode};
use crate::services::storage::StorageService;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

/// Lightweight fullscreen / game smart-hide detector (Sections 31–32).
/// Polls every 1500ms at ~0.00% CPU with zero expensive process scans.
pub fn spawn_smart_hide_monitor(app: AppHandle, storage: Arc<StorageService>) {
    let currently_hidden_by_context = Arc::new(AtomicBool::new(false));
    let state_flag = Arc::clone(&currently_hidden_by_context);

    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_millis(1500));

        let settings: AppSettings = storage.read_or_default("settings.json");
        if !settings.widgets_visible || settings.smart_hide == SmartHideMode::AlwaysShow {
            if state_flag.swap(false, Ordering::SeqCst) {
                if let Some(win) = app.get_webview_window("desktop") {
                    let _ = win.show();
                }
                let _ = app.emit("wejet://smart-hide", false);
            }
            continue;
        }

        let should_hide = detect_fullscreen_or_game(&app, settings.smart_hide);
        let was_hidden = state_flag.swap(should_hide, Ordering::SeqCst);
        if should_hide != was_hidden {
            if let Some(win) = app.get_webview_window("desktop") {
                if should_hide {
                    let _ = win.hide();
                } else {
                    let _ = win.show();
                }
            }
            let _ = app.emit("wejet://smart-hide", should_hide);
        }
    });
}

#[cfg(target_os = "windows")]
fn detect_fullscreen_or_game(app: &AppHandle, mode: SmartHideMode) -> bool {
    use tauri::Manager;
    use windows::Win32::Foundation::{HWND, RECT};
    use windows::Win32::Graphics::Gdi::{
        GetMonitorInfoW, MonitorFromWindow, MONITORINFO, MONITOR_DEFAULTTONEAREST,
    };
    use windows::Win32::UI::WindowsAndMessaging::{
        GetClassNameW, GetForegroundWindow, GetWindowRect, IsWindowVisible,
    };

    unsafe {
        let fg: HWND = GetForegroundWindow();
        if fg.0.is_null() || !IsWindowVisible(fg).as_bool() {
            return false;
        }

        // Ignore Wejet's own windows
        if let Some(d) = app.get_webview_window("desktop") {
            if let Ok(h) = d.hwnd() {
                if h.0 == fg.0 {
                    return false;
                }
            }
        }
        if let Some(m) = app.get_webview_window("manager") {
            if let Ok(h) = m.hwnd() {
                if h.0 == fg.0 {
                    return false;
                }
            }
        }

        // Ignore desktop shell classes (`Progman`, `WorkerW`, `Shell_TrayWnd`)
        let mut class_buf = [0u16; 64];
        let len = GetClassNameW(fg, &mut class_buf);
        if len > 0 {
            let cls = String::from_utf16_lossy(&class_buf[..len as usize]);
            if matches!(
                cls.as_str(),
                "Progman" | "WorkerW" | "Shell_TrayWnd" | "Shell_SecondaryTrayWnd"
            ) {
                return false;
            }

            // Typical DirectX/Unreal/Unity/SDL window class check for Games mode
            let looks_like_game_window = matches!(
                cls.as_str(),
                "UnrealWindow" | "UnityWndClass" | "SDL_app" | "GLFW30" | "Valve001"
            );
            if mode == SmartHideMode::HideInGames {
                return looks_like_game_window;
            }
        }

        let mut win_rect = RECT::default();
        if GetWindowRect(fg, &mut win_rect).is_err() {
            return false;
        }

        let monitor = MonitorFromWindow(fg, MONITOR_DEFAULTTONEAREST);
        let mut mon_info = MONITORINFO {
            cbSize: std::mem::size_of::<MONITORINFO>() as u32,
            ..Default::default()
        };
        if !GetMonitorInfoW(monitor, &mut mon_info).as_bool() {
            return false;
        }

        let mr = mon_info.rcMonitor;
        win_rect.left <= mr.left
            && win_rect.top <= mr.top
            && win_rect.right >= mr.right
            && win_rect.bottom >= mr.bottom
    }
}

#[cfg(not(target_os = "windows"))]
fn detect_fullscreen_or_game(_app: &AppHandle, _mode: SmartHideMode) -> bool {
    false
}
