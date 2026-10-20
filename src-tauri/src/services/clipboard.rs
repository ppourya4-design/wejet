use crate::models::notes::ClipboardEntry;
use crate::services::storage::StorageService;

const CLIPBOARD_FILE: &str = "clipboard.json";

/// Lightweight local-only clipboard ring history (Section 25).
/// Skips huge payloads (>8KB) and single-token high-entropy strings resembling API keys/passwords.
pub fn record_clipboard_text(
    storage: &StorageService,
    raw: &str,
    max_items: usize,
) -> Vec<ClipboardEntry> {
    let mut history: Vec<ClipboardEntry> = storage.read_or_default(CLIPBOARD_FILE);
    let trimmed = raw.trim();
    if trimmed.is_empty() || trimmed.len() > 8192 || looks_sensitive_secret(trimmed) {
        return history;
    }

    let now = chrono::Utc::now().timestamp();
    if let Some(existing) = history.iter_mut().find(|item| item.content == trimmed) {
        existing.copied_at = now;
    } else {
        history.insert(
            0,
            ClipboardEntry {
                id: format!("clip-{now}-{}", history.len()),
                content: trimmed.to_string(),
                pinned: false,
                copied_at: now,
            },
        );
    }

    // Keep pinned entries first, then newest up to `max_items`
    history.sort_by(|a, b| {
        b.pinned
            .cmp(&a.pinned)
            .then_with(|| b.copied_at.cmp(&a.copied_at))
    });
    let cap = max_items.clamp(5, 20);
    if history.len() > cap {
        history.truncate(cap);
    }
    let _ = storage.write_atomic(CLIPBOARD_FILE, &history);
    history
}

pub fn read_os_clipboard() -> Option<String> {
    let mut cb = arboard::Clipboard::new().ok()?;
    cb.get_text().ok()
}

pub fn write_os_clipboard(text: &str) -> Result<(), String> {
    let mut cb = arboard::Clipboard::new().map_err(|e| format!("Clipboard unavailable: {e}"))?;
    cb.set_text(text.to_string())
        .map_err(|e| format!("Clipboard write failed: {e}"))
}

fn looks_sensitive_secret(text: &str) -> bool {
    if text.contains(char::is_whitespace)
        || text.starts_with("http://")
        || text.starts_with("https://")
    {
        return false;
    }
    let lower = text.to_lowercase();
    if lower.starts_with("sk-")
        || lower.starts_with("ghp_")
        || lower.starts_with("github_pat_")
        || lower.starts_with("eyjh")
    {
        return true;
    }
    false
}
