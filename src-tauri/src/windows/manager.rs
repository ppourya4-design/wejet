use crate::windows::backdrop::configure_manager_backdrop;
use tauri::{AppHandle, Emitter, Manager, WindowEvent};

pub fn open_manager_window(app: &AppHandle, section: Option<&str>) {
    if let Some(window) = app.get_webview_window("manager") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
        if let Some(target) = section {
            let _ = app.emit("wejet://navigate", target);
        }
    }
}

pub fn attach_manager_close_to_tray(app: &AppHandle, is_dark: bool) {
    if let Some(window) = app.get_webview_window("manager") {
        let _ = configure_manager_backdrop(&window, is_dark);
        let win_clone = window.clone();
        window.on_window_event(move |event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                // Keep Wejet running lightweight in the System Tray (Section 41 & 73)
                api.prevent_close();
                let _ = win_clone.hide();
            }
        });
    }
}
