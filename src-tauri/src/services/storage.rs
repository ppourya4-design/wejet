use parking_lot::Mutex;
use serde::de::DeserializeOwned;
use serde::Serialize;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

/// Centralized thread-safe atomic JSON storage service in AppData (Section 37).
/// Uses write-to-temp + fsync + atomic rename so crashes never corrupt user files.
pub struct StorageService {
    base_dir: PathBuf,
    write_lock: Mutex<()>,
}

impl StorageService {
    pub fn new(base_dir: PathBuf) -> Result<Self, String> {
        fs::create_dir_all(&base_dir).map_err(|e| format!("Failed creating storage dir: {e}"))?;
        fs::create_dir_all(base_dir.join("cache"))
            .map_err(|e| format!("Failed creating cache dir: {e}"))?;
        Ok(Self {
            base_dir,
            write_lock: Mutex::new(()),
        })
    }

    pub fn default_app_data() -> Result<Self, String> {
        let base = dirs::data_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("com.wejet.desktop");
        Self::new(base)
    }

    pub fn base_dir(&self) -> &Path {
        &self.base_dir
    }

    fn resolve_safe_rel_path(&self, rel: &str) -> Result<PathBuf, String> {
        if rel.is_empty()
            || rel.contains("..")
            || rel.contains('\0')
            || Path::new(rel).is_absolute()
        {
            return Err("Invalid storage key path".to_string());
        }
        Ok(self.base_dir.join(rel))
    }

    pub fn read_or_default<T>(&self, rel: &str) -> T
    where
        T: DeserializeOwned + Serialize + Default,
    {
        match self.read_optional::<T>(rel) {
            Ok(Some(val)) => val,
            _ => {
                let default_val = T::default();
                let _ = self.write_atomic(rel, &default_val);
                default_val
            }
        }
    }

    pub fn read_or_init<T, F>(&self, rel: &str, init: F) -> T
    where
        T: DeserializeOwned + Serialize,
        F: FnOnce() -> T,
    {
        match self.read_optional::<T>(rel) {
            Ok(Some(val)) => val,
            _ => {
                let val = init();
                let _ = self.write_atomic(rel, &val);
                val
            }
        }
    }

    pub fn read_optional<T>(&self, rel: &str) -> Result<Option<T>, String>
    where
        T: DeserializeOwned,
    {
        let target = self.resolve_safe_rel_path(rel)?;
        if !target.exists() {
            return Ok(None);
        }
        let raw = fs::read_to_string(&target).map_err(|e| format!("Storage read failed: {e}"))?;
        let parsed =
            serde_json::from_str::<T>(&raw).map_err(|e| format!("JSON decode failed: {e}"))?;
        Ok(Some(parsed))
    }

    pub fn write_atomic<T>(&self, rel: &str, data: &T) -> Result<(), String>
    where
        T: Serialize + ?Sized,
    {
        let _guard = self.write_lock.lock();
        let target = self.resolve_safe_rel_path(rel)?;
        if let Some(parent) = target.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("Parent dir create failed: {e}"))?;
        }
        let serialized = serde_json::to_string_pretty(data)
            .map_err(|e| format!("JSON serialize failed: {e}"))?;

        let tmp_name = format!(
            "{}.tmp.{}",
            target
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("data.json"),
            std::process::id()
        );
        let tmp_path = target.with_file_name(tmp_name);

        {
            let mut file =
                fs::File::create(&tmp_path).map_err(|e| format!("Temp file create failed: {e}"))?;
            file.write_all(serialized.as_bytes())
                .map_err(|e| format!("Temp file write failed: {e}"))?;
            let _ = file.sync_all();
        }

        fs::rename(&tmp_path, &target).map_err(|e| {
            let _ = fs::remove_file(&tmp_path);
            format!("Atomic rename failed: {e}")
        })?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::settings::{AppSettings, Language};
    use crate::models::widget::DesktopLayout;

    #[test]
    fn test_atomic_storage_persistence_and_path_traversal_guard() {
        let dir = tempfile::tempdir().expect("tempdir");
        let storage = StorageService::new(dir.path().to_path_buf()).expect("storage init");

        let settings = AppSettings {
            language: Language::En,
            global_opacity: 72,
            ..Default::default()
        };

        storage
            .write_atomic("settings.json", &settings)
            .expect("atomic write settings");

        let loaded: AppSettings = storage
            .read_optional("settings.json")
            .expect("read ok")
            .expect("present");
        assert_eq!(loaded.language, Language::En);
        assert_eq!(loaded.global_opacity, 72);

        let layout = DesktopLayout::curated_default();
        storage
            .write_atomic("layout.json", &layout)
            .expect("atomic write layout");
        let loaded_layout: DesktopLayout = storage.read_or_default("layout.json");
        assert_eq!(loaded_layout.widgets.len(), layout.widgets.len());

        // Path traversal must be rejected
        assert!(storage.write_atomic("../escape.json", &settings).is_err());
        assert!(storage.read_optional::<AppSettings>("/etc/passwd").is_err());
    }
}
