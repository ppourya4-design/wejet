use crate::services::storage::StorageService;
use image::GenericImageView;
use serde::{Deserialize, Serialize};
use std::path::Path;

const WALLPAPER_CACHE: &str = "cache/wallpaper.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WallpaperAccentCache {
    pub path: String,
    pub modified_epoch: u64,
    pub accent_hex: String,
}

/// Lightweight wallpaper dominant vibrant color extractor with mtime cache (Section 5).
pub fn extract_wallpaper_accent(storage: &StorageService) -> Option<String> {
    let path_str = current_wallpaper_path()?;
    let path = Path::new(&path_str);
    let meta = std::fs::metadata(path).ok()?;
    let mtime = meta
        .modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs())
        .unwrap_or(0);

    if let Ok(Some(cached)) = storage.read_optional::<WallpaperAccentCache>(WALLPAPER_CACHE) {
        if cached.path == path_str && cached.modified_epoch == mtime {
            return Some(cached.accent_hex);
        }
    }

    let img = image::open(path).ok()?;
    let thumb = img.thumbnail(48, 48);
    let mut r_sum: u64 = 0;
    let mut g_sum: u64 = 0;
    let mut b_sum: u64 = 0;
    let mut weight_total: u64 = 0;

    for (_x, _y, px) in thumb.pixels() {
        let [r, g, b, _a] = px.0;
        let max_c = r.max(g).max(b) as u64;
        let min_c = r.min(g).min(b) as u64;
        let saturation = max_c.saturating_sub(min_c);
        // Weight vibrant mid-tone pixels highest
        let weight = 1 + saturation * 3;
        r_sum += (r as u64) * weight;
        g_sum += (g as u64) * weight;
        b_sum += (b as u64) * weight;
        weight_total += weight;
    }

    if weight_total == 0 {
        return None;
    }

    // Boost brightness slightly so accent always maintains accessible contrast on dark/light glass
    let r = ((r_sum / weight_total) as u8).max(72);
    let g = ((g_sum / weight_total) as u8).max(96);
    let b = ((b_sum / weight_total) as u8).max(112);
    let hex = format!("#{r:02X}{g:02X}{b:02X}");

    let _ = storage.write_atomic(
        WALLPAPER_CACHE,
        &WallpaperAccentCache {
            path: path_str,
            modified_epoch: mtime,
            accent_hex: hex.clone(),
        },
    );
    Some(hex)
}

#[cfg(target_os = "windows")]
fn current_wallpaper_path() -> Option<String> {
    use winreg::enums::HKEY_CURRENT_USER;
    use winreg::RegKey;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let desktop = hkcu.open_subkey(r"Control Panel\Desktop").ok()?;
    let path: String = desktop.get_value("WallPaper").ok()?;
    if path.trim().is_empty() {
        None
    } else {
        Some(path)
    }
}

#[cfg(not(target_os = "windows"))]
fn current_wallpaper_path() -> Option<String> {
    None
}
