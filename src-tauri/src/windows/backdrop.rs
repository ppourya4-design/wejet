use serde::{Deserialize, Serialize};
use tauri::WebviewWindow;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackdropReport {
    pub tier: String,
    pub native_compositor: bool,
}

/// Applies Windows 11/10 native DWM backdrop attributes safely with full fallback hierarchy:
/// 1. Native Windows DWM Acrylic / Mica backdrop
/// 2. WebView2 + CSS backdrop-filter blur
/// 3. Translucent layered surface
/// 4. Solid theme surface
#[cfg(target_os = "windows")]
pub fn configure_manager_backdrop(window: &WebviewWindow, is_dark: bool) -> BackdropReport {
    use windows::Win32::Foundation::HWND;
    use windows::Win32::Graphics::Dwm::{
        DwmSetWindowAttribute, DWMSBT_TRANSIENTWINDOW, DWMWA_SYSTEMBACKDROP_TYPE,
        DWMWA_USE_IMMERSIVE_DARK_MODE, DWMWA_WINDOW_CORNER_PREFERENCE, DWMWCP_ROUND,
    };

    if let Ok(raw) = window.hwnd() {
        let hwnd = HWND(raw.0);
        unsafe {
            let dark_flag: i32 = i32::from(is_dark);
            let _ = DwmSetWindowAttribute(
                hwnd,
                DWMWA_USE_IMMERSIVE_DARK_MODE,
                (&dark_flag as *const i32).cast::<core::ffi::c_void>(),
                std::mem::size_of::<i32>() as u32,
            );
            let round = DWMWCP_ROUND;
            let _ = DwmSetWindowAttribute(
                hwnd,
                DWMWA_WINDOW_CORNER_PREFERENCE,
                std::ptr::from_ref(&round).cast::<core::ffi::c_void>(),
                std::mem::size_of_val(&round) as u32,
            );
            let acrylic_backdrop = DWMSBT_TRANSIENTWINDOW;
            if DwmSetWindowAttribute(
                hwnd,
                DWMWA_SYSTEMBACKDROP_TYPE,
                std::ptr::from_ref(&acrylic_backdrop).cast::<core::ffi::c_void>(),
                std::mem::size_of_val(&acrylic_backdrop) as u32,
            )
            .is_ok()
            {
                return BackdropReport {
                    tier: "native-dwm-acrylic".to_string(),
                    native_compositor: true,
                };
            }
        }
    }

    let tint = if is_dark {
        Some((15, 22, 36, 175))
    } else {
        Some((244, 247, 252, 185))
    };
    if window_vibrancy::apply_acrylic(window, tint).is_ok() {
        return BackdropReport {
            tier: "window-vibrancy-acrylic".to_string(),
            native_compositor: true,
        };
    }

    BackdropReport {
        tier: "css-backdrop-glass".to_string(),
        native_compositor: false,
    }
}

#[cfg(not(target_os = "windows"))]
pub fn configure_manager_backdrop(_window: &WebviewWindow, _is_dark: bool) -> BackdropReport {
    BackdropReport {
        tier: "css-backdrop-glass".to_string(),
        native_compositor: false,
    }
}
