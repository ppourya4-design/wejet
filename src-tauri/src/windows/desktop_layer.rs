use crate::models::widget::MonitorInfo;
use crate::windows::workerw::{attach_window_to_desktop_layer, DesktopAttachReport};
use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize};

pub fn setup_desktop_layer_window(app: &AppHandle) -> Option<DesktopAttachReport> {
    let window = app.get_webview_window("desktop")?;

    // Size desktop layer to full primary monitor resolution without stealing focus
    if let Ok(Some(monitor)) = window.primary_monitor() {
        let pos = monitor.position();
        let size = monitor.size();
        let _ = window.set_position(PhysicalPosition::new(pos.x, pos.y));
        let _ = window.set_size(PhysicalSize::new(size.width, size.height));
    }

    let report = attach_window_to_desktop_layer(&window);
    Some(report)
}

pub fn sync_desktop_click_through(app: &AppHandle, locked: bool, click_through_when_locked: bool) {
    if let Some(window) = app.get_webview_window("desktop") {
        let ignore_mouse = locked && click_through_when_locked;
        let _ = window.set_ignore_cursor_events(ignore_mouse);
    }
}

pub fn set_desktop_layer_visibility(app: &AppHandle, visible: bool) {
    if let Some(window) = app.get_webview_window("desktop") {
        if visible {
            let _ = window.show();
        } else {
            let _ = window.hide();
        }
    }
}

pub fn enumerate_monitors(app: &AppHandle) -> Vec<MonitorInfo> {
    let Some(window) = app
        .get_webview_window("desktop")
        .or_else(|| app.get_webview_window("manager"))
    else {
        return vec![MonitorInfo::default()];
    };

    let primary_name = window
        .primary_monitor()
        .ok()
        .flatten()
        .and_then(|m| m.name().cloned());

    let Ok(monitors) = window.available_monitors() else {
        return vec![MonitorInfo::default()];
    };

    if monitors.is_empty() {
        return vec![MonitorInfo::default()];
    }

    monitors
        .into_iter()
        .enumerate()
        .map(|(idx, m)| {
            let name = m
                .name()
                .cloned()
                .unwrap_or_else(|| format!("Display {}", idx + 1));
            let is_primary = primary_name
                .as_ref()
                .map(|p| p == &name)
                .unwrap_or(idx == 0);
            MonitorInfo {
                id: if is_primary {
                    "primary-0".to_string()
                } else {
                    format!("display-{idx}")
                },
                name,
                is_primary,
                x: m.position().x,
                y: m.position().y,
                width: m.size().width,
                height: m.size().height,
                scale_factor: m.scale_factor(),
            }
        })
        .collect()
}
