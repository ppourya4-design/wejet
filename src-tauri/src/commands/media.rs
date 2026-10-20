use crate::services::media::{
    get_media_session, trigger_media_action, MediaAction, MediaSessionInfo,
};

#[tauri::command]
pub async fn get_media_info() -> Result<MediaSessionInfo, String> {
    tauri::async_runtime::spawn_blocking(get_media_session)
        .await
        .map_err(|e| format!("Media session read failed: {e}"))
}

#[tauri::command]
pub async fn media_control(action: MediaAction) -> Result<bool, String> {
    tauri::async_runtime::spawn_blocking(move || trigger_media_action(action))
        .await
        .map_err(|e| format!("Media command join failed: {e}"))?
}
