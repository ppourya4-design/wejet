use serde::{Deserialize, Serialize};

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaSessionInfo {
    pub available: bool,
    pub is_playing: bool,
    pub title: String,
    pub artist: String,
    pub album_title: String,
    pub source_app: String,
    pub cover_data_url: Option<String>,
}

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MediaAction {
    PlayPause,
    Next,
    Previous,
}

#[cfg(target_os = "windows")]
mod imp {
    use super::{MediaAction, MediaSessionInfo};
    use base64::Engine;
    use windows::Media::Control::{
        GlobalSystemMediaTransportControlsSessionManager,
        GlobalSystemMediaTransportControlsSessionPlaybackStatus,
    };
    use windows::Storage::Streams::DataReader;

    pub fn read_current_session() -> MediaSessionInfo {
        let Ok(manager_op) = GlobalSystemMediaTransportControlsSessionManager::RequestAsync()
        else {
            return MediaSessionInfo::default();
        };
        let Ok(manager) = manager_op.join() else {
            return MediaSessionInfo::default();
        };
        let Ok(session) = manager.GetCurrentSession() else {
            return MediaSessionInfo::default();
        };

        let playback_info = session.GetPlaybackInfo().ok();
        let is_playing = playback_info
            .and_then(|info| info.PlaybackStatus().ok())
            .map(|st| st == GlobalSystemMediaTransportControlsSessionPlaybackStatus::Playing)
            .unwrap_or(false);

        let source_app = session
            .SourceAppUserModelId()
            .map(|h| h.to_string())
            .unwrap_or_default();

        let Ok(props_op) = session.TryGetMediaPropertiesAsync() else {
            return MediaSessionInfo::default();
        };
        let Ok(props) = props_op.join() else {
            return MediaSessionInfo::default();
        };

        let title = props.Title().map(|s| s.to_string()).unwrap_or_default();
        let artist = props.Artist().map(|s| s.to_string()).unwrap_or_default();
        let album_title = props
            .AlbumTitle()
            .map(|s| s.to_string())
            .unwrap_or_default();

        let cover_data_url = props
            .Thumbnail()
            .ok()
            .and_then(|thumb_ref| thumb_ref.OpenReadAsync().ok())
            .and_then(|stream_op| stream_op.join().ok())
            .and_then(|stream| {
                let size = stream.Size().ok()? as u32;
                if size == 0 || size > 1_048_576 {
                    return None;
                }
                let mime = stream
                    .ContentType()
                    .map(|c| c.to_string())
                    .unwrap_or_else(|_| "image/png".to_string());
                let reader = DataReader::CreateDataReader(&stream).ok()?;
                reader.LoadAsync(size).ok()?.join().ok()?;
                let mut bytes = vec![0u8; size as usize];
                reader.ReadBytes(&mut bytes).ok()?;
                let b64 = base64::engine::general_purpose::STANDARD.encode(bytes);
                let safe_mime = if mime.starts_with("image/") {
                    mime
                } else {
                    "image/png".to_string()
                };
                Some(format!("data:{safe_mime};base64,{b64}"))
            });

        MediaSessionInfo {
            available: !title.is_empty() || !artist.is_empty(),
            is_playing,
            title,
            artist,
            album_title,
            source_app,
            cover_data_url,
        }
    }

    pub fn perform_action(action: MediaAction) -> Result<bool, String> {
        let manager = GlobalSystemMediaTransportControlsSessionManager::RequestAsync()
            .map_err(|e| format!("SMTC unavailable: {e}"))?
            .join()
            .map_err(|e| format!("SMTC session error: {e}"))?;
        let session = manager
            .GetCurrentSession()
            .map_err(|_| "No active media session".to_string())?;

        let op = match action {
            MediaAction::PlayPause => session.TryTogglePlayPauseAsync(),
            MediaAction::Next => session.TrySkipNextAsync(),
            MediaAction::Previous => session.TrySkipPreviousAsync(),
        }
        .map_err(|e| format!("Media action failed: {e}"))?;

        op.join().map_err(|e| format!("Media join error: {e}"))
    }
}

#[cfg(not(target_os = "windows"))]
mod imp {
    use super::{MediaAction, MediaSessionInfo};

    pub fn read_current_session() -> MediaSessionInfo {
        MediaSessionInfo::default()
    }

    pub fn perform_action(_action: MediaAction) -> Result<bool, String> {
        Ok(false)
    }
}

pub fn get_media_session() -> MediaSessionInfo {
    imp::read_current_session()
}

pub fn trigger_media_action(action: MediaAction) -> Result<bool, String> {
    imp::perform_action(action)
}
