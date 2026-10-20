use crate::models::notes::{default_launcher_items, LauncherItem, LauncherKind};
use crate::AppState;
use std::path::Path;
use tauri::{AppHandle, Emitter, State};

/// Validates target path or URL strictly before launching via Windows Shell APIs (Sections 26 & 39).
/// Never runs `cmd.exe /c`, `powershell`, or shell metacharacters.
pub fn validate_launch_target(target: &str) -> Result<LauncherKind, String> {
    let trimmed = target.trim();
    if trimmed.is_empty() || trimmed.len() > 1024 {
        return Err("Empty or overly long target".to_string());
    }
    if trimmed.contains('\0') || trimmed.contains('\n') || trimmed.contains('\r') {
        return Err("Control characters are disallowed".to_string());
    }

    let lower = trimmed.to_lowercase();
    if lower.starts_with("javascript:")
        || lower.starts_with("vbscript:")
        || lower.starts_with("data:")
        || lower.starts_with("ms-msdt:")
    {
        return Err("Unsafe URI scheme rejected".to_string());
    }

    if lower.starts_with("https://") || lower.starts_with("http://") {
        // Disallow whitespace inside HTTP URLs
        if trimmed.chars().any(char::is_whitespace) {
            return Err("Malformed URL".to_string());
        }
        return Ok(LauncherKind::Url);
    }

    // Disallow shell injection metacharacters & direct command-interpreter abuse
    if trimmed.contains('|')
        || trimmed.contains(';')
        || trimmed.contains('`')
        || trimmed.contains("$(")
        || trimmed.contains("&&")
    {
        return Err("Unsafe characters in path".to_string());
    }

    let whitelisted_system_apps = [
        "explorer.exe",
        "notepad.exe",
        "calc.exe",
        "mspaint.exe",
        "taskmgr.exe",
        "wt.exe",
    ];
    if whitelisted_system_apps.contains(&lower.as_str()) {
        return Ok(LauncherKind::App);
    }

    let p = Path::new(trimmed);
    if p.is_dir() {
        return Ok(LauncherKind::Folder);
    }
    if p.exists() {
        return Ok(LauncherKind::File);
    }

    Err("Target path does not exist on this system".to_string())
}

#[tauri::command]
pub fn get_launcher_items(state: State<'_, AppState>) -> Vec<LauncherItem> {
    state
        .storage
        .read_or_init("launcher.json", default_launcher_items)
}

#[tauri::command]
pub fn save_launcher_items(
    app: AppHandle,
    state: State<'_, AppState>,
    items: Vec<LauncherItem>,
) -> Result<Vec<LauncherItem>, String> {
    state.storage.write_atomic("launcher.json", &items)?;
    let _ = app.emit("wejet://launcher-changed", &items);
    Ok(items)
}

#[tauri::command]
pub fn launch_target(target: String) -> Result<(), String> {
    let _kind = validate_launch_target(&target)?;

    #[cfg(target_os = "windows")]
    {
        use windows::core::{w, HSTRING, PCWSTR};
        use windows::Win32::UI::Shell::ShellExecuteW;
        use windows::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL;

        let target_h = HSTRING::from(target.trim());
        let hinst = unsafe {
            ShellExecuteW(
                None,
                w!("open"),
                PCWSTR(target_h.as_ptr()),
                PCWSTR::null(),
                PCWSTR::null(),
                SW_SHOWNORMAL,
            )
        };
        if (hinst.0 as isize) <= 32 {
            return Err("Windows could not open the requested item".to_string());
        }
        Ok(())
    }

    #[cfg(not(target_os = "windows"))]
    {
        std::process::Command::new("xdg-open")
            .arg(target.trim())
            .spawn()
            .map_err(|e| format!("Failed opening target: {e}"))?;
        Ok(())
    }
}

#[tauri::command]
pub fn discover_installed_apps() -> Vec<LauncherItem> {
    #[cfg_attr(not(target_os = "windows"), allow(unused_mut))]
    let mut results = default_launcher_items();

    #[cfg(target_os = "windows")]
    {
        let mut search_roots = Vec::new();
        if let Ok(program_data) = std::env::var("ProgramData") {
            search_roots.push(
                std::path::PathBuf::from(program_data)
                    .join(r"Microsoft\Windows\Start Menu\Programs"),
            );
        }
        if let Ok(appdata) = std::env::var("APPDATA") {
            search_roots.push(
                std::path::PathBuf::from(appdata).join(r"Microsoft\Windows\Start Menu\Programs"),
            );
        }

        for root in search_roots {
            collect_shortcuts(&root, 0, &mut results);
            if results.len() >= 36 {
                break;
            }
        }
    }

    results
}

#[cfg(target_os = "windows")]
fn collect_shortcuts(dir: &Path, depth: usize, out: &mut Vec<LauncherItem>) {
    if depth > 2 || out.len() >= 36 {
        return;
    }
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let p = entry.path();
        if p.is_dir() {
            collect_shortcuts(&p, depth + 1, out);
        } else if p
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| e.eq_ignore_ascii_case("lnk"))
            .unwrap_or(false)
        {
            if let Some(stem) = p.file_stem().and_then(|s| s.to_str()) {
                let lower = stem.to_lowercase();
                if lower.contains("uninstall") || lower.contains("readme") {
                    continue;
                }
                out.push(LauncherItem {
                    id: format!("app-{}", out.len()),
                    name: stem.to_string(),
                    label: None,
                    target: p.to_string_lossy().to_string(),
                    kind: LauncherKind::App,
                    icon: "app".to_string(),
                });
                if out.len() >= 36 {
                    return;
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_launch_path_validation_security() {
        assert_eq!(
            validate_launch_target("https://wejet.app/docs").expect("valid url"),
            LauncherKind::Url
        );
        assert_eq!(
            validate_launch_target("calc.exe").expect("valid built-in app"),
            LauncherKind::App
        );
        assert!(validate_launch_target("javascript:alert(1)").is_err());
        assert!(validate_launch_target("ms-msdt:/id PCWDiagnostic").is_err());
        assert!(validate_launch_target("C:\\foo && calc.exe").is_err());
        assert!(validate_launch_target("C:\\bad\0path.exe").is_err());
        assert!(validate_launch_target("/definitely/nonexistent/wejet-test-binary").is_err());
    }
}
