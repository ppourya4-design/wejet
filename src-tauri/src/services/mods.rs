use crate::services::storage::StorageService;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

const MODS_BACKUP_FILE: &str = "mods-backup.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegistryBackupEntry {
    pub mod_id: String,
    pub registry_path: String,
    pub value_name: String,
    pub previous_dword: Option<u32>,
    pub backed_up_at: i64,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModsBackupStore {
    pub entries: HashMap<String, RegistryBackupEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowsModStatus {
    pub id: String,
    pub supported_on_host: bool,
    pub desktop_icons_visible: bool,
    pub has_backup: bool,
}

/// Safe, reversible official Windows Desktop Icons visibility mod (Sections 51–52).
/// Backs up touched HKCU registry values before applying changes and uses `SHChangeNotify`.
pub fn get_desktop_icons_status(storage: &StorageService) -> WindowsModStatus {
    let backups: ModsBackupStore = storage.read_or_default(MODS_BACKUP_FILE);
    let has_backup = backups.entries.contains_key("desktop_icons");

    #[cfg(target_os = "windows")]
    {
        let visible = read_hide_icons_dword().unwrap_or(0) == 0;
        WindowsModStatus {
            id: "desktop_icons".to_string(),
            supported_on_host: true,
            desktop_icons_visible: visible,
            has_backup,
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        WindowsModStatus {
            id: "desktop_icons".to_string(),
            supported_on_host: false,
            desktop_icons_visible: true,
            has_backup,
        }
    }
}

pub fn set_desktop_icons_visible(
    storage: &StorageService,
    visible: bool,
) -> Result<WindowsModStatus, String> {
    let mut backups: ModsBackupStore = storage.read_or_default(MODS_BACKUP_FILE);

    #[cfg(target_os = "windows")]
    {
        if !backups.entries.contains_key("desktop_icons") {
            let current = read_hide_icons_dword();
            backups.entries.insert(
                "desktop_icons".to_string(),
                RegistryBackupEntry {
                    mod_id: "desktop_icons".to_string(),
                    registry_path:
                        r"HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced"
                            .to_string(),
                    value_name: "HideIcons".to_string(),
                    previous_dword: current,
                    backed_up_at: chrono::Utc::now().timestamp(),
                },
            );
            storage.write_atomic(MODS_BACKUP_FILE, &backups)?;
        }

        let target_val: u32 = if visible { 0 } else { 1 };
        write_hide_icons_dword(target_val)?;
        notify_shell_refresh();
        Ok(get_desktop_icons_status(storage))
    }

    #[cfg(not(target_os = "windows"))]
    {
        backups.entries.insert(
            "desktop_icons".to_string(),
            RegistryBackupEntry {
                mod_id: "desktop_icons".to_string(),
                registry_path: r"HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced"
                    .to_string(),
                value_name: "HideIcons".to_string(),
                previous_dword: Some(0),
                backed_up_at: chrono::Utc::now().timestamp(),
            },
        );
        storage.write_atomic(MODS_BACKUP_FILE, &backups)?;
        Ok(WindowsModStatus {
            id: "desktop_icons".to_string(),
            supported_on_host: false,
            desktop_icons_visible: visible,
            has_backup: true,
        })
    }
}

pub fn revert_all_mods(storage: &StorageService) -> Result<WindowsModStatus, String> {
    let mut backups: ModsBackupStore = storage.read_or_default(MODS_BACKUP_FILE);

    #[cfg(target_os = "windows")]
    {
        if let Some(entry) = backups.entries.remove("desktop_icons") {
            let restore_val = entry.previous_dword.unwrap_or(0);
            write_hide_icons_dword(restore_val)?;
            notify_shell_refresh();
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        backups.entries.remove("desktop_icons");
    }

    storage.write_atomic(MODS_BACKUP_FILE, &backups)?;
    Ok(get_desktop_icons_status(storage))
}

#[cfg(target_os = "windows")]
fn read_hide_icons_dword() -> Option<u32> {
    use winreg::enums::HKEY_CURRENT_USER;
    use winreg::RegKey;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let key = hkcu
        .open_subkey(r"Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced")
        .ok()?;
    key.get_value::<u32, _>("HideIcons").ok()
}

#[cfg(target_os = "windows")]
fn write_hide_icons_dword(val: u32) -> Result<(), String> {
    use winreg::enums::HKEY_CURRENT_USER;
    use winreg::RegKey;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let (key, _) = hkcu
        .create_subkey(r"Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced")
        .map_err(|e| format!("Registry open error: {e}"))?;
    key.set_value("HideIcons", &val)
        .map_err(|e| format!("Registry write error: {e}"))
}

#[cfg(target_os = "windows")]
fn notify_shell_refresh() {
    use windows::Win32::UI::Shell::{SHChangeNotify, SHCNE_ASSOCCHANGED, SHCNF_IDLIST};
    unsafe {
        SHChangeNotify(SHCNE_ASSOCCHANGED, SHCNF_IDLIST, None, None);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mods_backup_and_revert_lifecycle() {
        let dir = tempfile::tempdir().expect("tempdir");
        let storage = StorageService::new(dir.path().to_path_buf()).expect("storage");

        let initial = get_desktop_icons_status(&storage);
        assert!(!initial.has_backup);

        let updated = set_desktop_icons_visible(&storage, false).expect("set hidden");
        assert!(updated.has_backup);

        let reverted = revert_all_mods(&storage).expect("revert all");
        assert!(!reverted.has_backup);
    }
}
