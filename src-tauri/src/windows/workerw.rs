use serde::{Deserialize, Serialize};
use tauri::WebviewWindow;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopAttachReport {
    pub attached_to_workerw: bool,
    pub mode: String,
}

#[cfg(target_os = "windows")]
pub fn attach_window_to_desktop_layer(window: &WebviewWindow) -> DesktopAttachReport {
    use windows::core::{w, BOOL};
    use windows::Win32::Foundation::{HWND, LPARAM, WPARAM};
    use windows::Win32::UI::WindowsAndMessaging::{
        EnumWindows, FindWindowExW, FindWindowW, GetWindowLongPtrW, SendMessageTimeoutW, SetParent,
        SetWindowLongPtrW, SetWindowPos, GWL_EXSTYLE, HWND_BOTTOM, SMTO_NORMAL, SWP_NOACTIVATE,
        SWP_NOMOVE, SWP_NOSIZE, WS_EX_NOACTIVATE, WS_EX_TOOLWINDOW,
    };

    let Ok(raw_hwnd) = window.hwnd() else {
        return DesktopAttachReport {
            attached_to_workerw: false,
            mode: "unavailable-hwnd".to_string(),
        };
    };
    let target_hwnd = HWND(raw_hwnd.0);

    unsafe {
        // Apply non-intrusive desktop tool-window flags (never appears in Alt+Tab)
        let current_ex = GetWindowLongPtrW(target_hwnd, GWL_EXSTYLE);
        let desired_ex = current_ex | (WS_EX_TOOLWINDOW.0 as isize) | (WS_EX_NOACTIVATE.0 as isize);
        let _ = SetWindowLongPtrW(target_hwnd, GWL_EXSTYLE, desired_ex);

        // Locate Progman and request WorkerW spawn (compatible with Win10 & Win11 22H2–24H2)
        if let Ok(progman) = FindWindowW(w!("Progman"), None) {
            if !progman.0.is_null() {
                let mut result: usize = 0;
                let _ = SendMessageTimeoutW(
                    progman,
                    0x052C,
                    WPARAM(0xD),
                    LPARAM(0x1),
                    SMTO_NORMAL,
                    1000,
                    Some(&mut result),
                );

                // First check Win11 24H2 style child WorkerW under Progman
                if let Ok(def_view) =
                    FindWindowExW(Some(progman), None, w!("SHELLDLL_DefView"), None)
                {
                    if !def_view.0.is_null() {
                        if let Ok(worker_child) =
                            FindWindowExW(Some(progman), None, w!("WorkerW"), None)
                        {
                            if !worker_child.0.is_null()
                                && SetParent(target_hwnd, Some(worker_child)).is_ok()
                            {
                                return DesktopAttachReport {
                                    attached_to_workerw: true,
                                    mode: "workerw-win11-layered".to_string(),
                                };
                            }
                        }
                    }
                }

                // Classic Win10 / Win11 top-level sibling WorkerW enumeration
                let mut found_workerw = HWND::default();
                unsafe extern "system" fn enum_proc(top: HWND, lparam: LPARAM) -> BOOL {
                    let shell_view =
                        unsafe { FindWindowExW(Some(top), None, w!("SHELLDLL_DefView"), None) };
                    if let Ok(sv) = shell_view {
                        if !sv.0.is_null() {
                            if let Ok(worker) =
                                unsafe { FindWindowExW(None, Some(top), w!("WorkerW"), None) }
                            {
                                if !worker.0.is_null() {
                                    let out = lparam.0 as *mut HWND;
                                    unsafe {
                                        *out = worker;
                                    }
                                    return BOOL(0);
                                }
                            }
                        }
                    }
                    BOOL(1)
                }

                let _ = EnumWindows(
                    Some(enum_proc),
                    LPARAM((&mut found_workerw as *mut HWND) as isize),
                );
                if !found_workerw.0.is_null() && SetParent(target_hwnd, Some(found_workerw)).is_ok()
                {
                    return DesktopAttachReport {
                        attached_to_workerw: true,
                        mode: "workerw-classic".to_string(),
                    };
                }
            }
        }

        // Graceful bottom-most desktop fallback (never crashes if WorkerW is restricted)
        let _ = SetWindowPos(
            target_hwnd,
            Some(HWND_BOTTOM),
            0,
            0,
            0,
            0,
            SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE,
        );
    }

    DesktopAttachReport {
        attached_to_workerw: false,
        mode: "bottom-most-fallback".to_string(),
    }
}

#[cfg(not(target_os = "windows"))]
pub fn attach_window_to_desktop_layer(_window: &WebviewWindow) -> DesktopAttachReport {
    DesktopAttachReport {
        attached_to_workerw: false,
        mode: "cross-platform-preview".to_string(),
    }
}
