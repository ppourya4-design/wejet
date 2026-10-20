use crate::models::notes::{default_notes, ClipboardEntry, NoteItem};
use crate::models::settings::AppSettings;
use crate::services::clipboard::{read_os_clipboard, record_clipboard_text, write_os_clipboard};
use crate::AppState;
use tauri::{AppHandle, Emitter, State};

#[tauri::command]
pub fn get_notes(state: State<'_, AppState>) -> Vec<NoteItem> {
    state.storage.read_or_init("notes.json", default_notes)
}

#[tauri::command]
pub fn save_notes(
    app: AppHandle,
    state: State<'_, AppState>,
    notes: Vec<NoteItem>,
) -> Result<Vec<NoteItem>, String> {
    state.storage.write_atomic("notes.json", &notes)?;
    let _ = app.emit("wejet://notes-changed", &notes);
    Ok(notes)
}

#[tauri::command]
pub fn add_quick_note(
    app: AppHandle,
    state: State<'_, AppState>,
    text: String,
) -> Result<Vec<NoteItem>, String> {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return Ok(state.storage.read_or_init("notes.json", default_notes));
    }
    let now = chrono::Utc::now().timestamp();
    let mut notes: Vec<NoteItem> = state.storage.read_or_init("notes.json", default_notes);
    let title: String = trimmed.chars().take(36).collect();
    notes.insert(
        0,
        NoteItem {
            id: format!("note-{now}"),
            title,
            body: trimmed.to_string(),
            todos: Vec::new(),
            pinned: false,
            created_at: now,
            updated_at: now,
        },
    );
    state.storage.write_atomic("notes.json", &notes)?;
    let _ = app.emit("wejet://notes-changed", &notes);
    Ok(notes)
}

#[tauri::command]
pub fn get_clipboard_history(state: State<'_, AppState>) -> Vec<ClipboardEntry> {
    state.storage.read_or_default("clipboard.json")
}

#[tauri::command]
pub fn sync_clipboard(state: State<'_, AppState>) -> Vec<ClipboardEntry> {
    let settings: AppSettings = state.storage.read_or_default("settings.json");
    if !settings.clipboard_enabled {
        return state.storage.read_or_default("clipboard.json");
    }
    if let Some(text) = read_os_clipboard() {
        return record_clipboard_text(&state.storage, &text, settings.clipboard_max_items);
    }
    state.storage.read_or_default("clipboard.json")
}

#[tauri::command]
pub fn copy_to_clipboard(
    state: State<'_, AppState>,
    text: String,
) -> Result<Vec<ClipboardEntry>, String> {
    let _ = write_os_clipboard(&text);
    let settings: AppSettings = state.storage.read_or_default("settings.json");
    Ok(record_clipboard_text(
        &state.storage,
        &text,
        settings.clipboard_max_items,
    ))
}

#[tauri::command]
pub fn save_clipboard_history(
    state: State<'_, AppState>,
    items: Vec<ClipboardEntry>,
) -> Result<Vec<ClipboardEntry>, String> {
    state.storage.write_atomic("clipboard.json", &items)?;
    Ok(items)
}

#[tauri::command]
pub fn clear_clipboard_history(state: State<'_, AppState>) -> Result<Vec<ClipboardEntry>, String> {
    let existing: Vec<ClipboardEntry> = state.storage.read_or_default("clipboard.json");
    let pinned_only: Vec<ClipboardEntry> = existing.into_iter().filter(|i| i.pinned).collect();
    state.storage.write_atomic("clipboard.json", &pinned_only)?;
    Ok(pinned_only)
}
