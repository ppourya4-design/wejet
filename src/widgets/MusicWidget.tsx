import React, { useCallback, useEffect, useState } from 'react';
import { MediaSessionInfo, WidgetInstance, WidgetManifest } from '../types/models';
import { WejetIPC } from '../services/ipc';
import { useWejet } from '../context/WejetContext';
import { t } from '../i18n/translations';
import { Icon } from '../components/Icons';

export const musicManifest: WidgetManifest = {
  id: 'music',
  name: 'Windows Media Controller',
  nameFa: 'کنترل‌گر رسانه و موسیقی',
  description: 'Connects natively to Windows System Media Transport Controls (SMTC).',
  descriptionFa: 'اتصال مستقیم به نشست‌های صوتی ویندوز (SMTC) همراه با کاور آلبوم و کنترل پخش.',
  category: 'media',
  icon: 'music',
  defaultSize: { width: 320, height: 184 },
  minSize: { width: 256, height: 152 },
  settingsSchema: [],
};

export const MusicWidget: React.FC<{ instance: WidgetInstance }> = ({ instance }) => {
  const { settings } = useWejet();
  const [session, setSession] = useState<MediaSessionInfo>({
    available: false,
    isPlaying: false,
    title: '',
    artist: '',
    albumTitle: '',
    sourceApp: '',
    coverDataUrl: null,
  });

  const refresh = useCallback(async () => {
    const info = await WejetIPC.getMediaInfo();
    setSession(info);
  }, []);

  useEffect(() => {
    if (!instance.visible || !settings.widgetsVisible) return;
    void refresh();
    const id = window.setInterval(() => void refresh(), 2500);
    return () => window.clearInterval(id);
  }, [instance.visible, refresh, settings.widgetsVisible]);

  const sendAction = async (act: 'previous' | 'play_pause' | 'next') => {
    await WejetIPC.mediaControl(act);
    await refresh();
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        padding: '14px 16px',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, minWidth: 0 }}>
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: 14,
            flexShrink: 0,
            overflow: 'hidden',
            background: session.coverDataUrl
              ? `url(${session.coverDataUrl}) center/cover no-repeat`
              : 'linear-gradient(135deg, var(--wejet-accent-soft), rgba(129, 140, 248, 0.28))',
            border: '1px solid var(--wejet-glass-border-strong)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--wejet-accent)',
          }}
        >
          {!session.coverDataUrl && <Icon name="music" size={24} />}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          {session.available ? (
            <>
              <div
                style={{
                  fontWeight: 650,
                  fontSize: 'var(--wejet-font-md)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {session.title}
              </div>
              <div
                style={{
                  fontSize: 'var(--wejet-font-xs)',
                  color: 'var(--wejet-text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginTop: 2,
                }}
              >
                {session.artist}
              </div>
              {session.albumTitle && (
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--wejet-text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginTop: 1,
                  }}
                >
                  {session.albumTitle}
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ fontSize: 'var(--wejet-font-sm)', fontWeight: 600 }}>
                {t(settings.language, 'noMediaSession')}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--wejet-text-muted)', marginTop: 2 }}>
                {t(settings.language, 'mediaIdleHint')}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Transport Controls (always LTR directional order: Previous | Play/Pause | Next) */}
      <div
        className="ltr-inline"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          paddingTop: 6,
          borderTop: '1px solid var(--wejet-glass-border)',
        }}
      >
        <button
          type="button"
          className="wj-icon-btn"
          onClick={() => void sendAction('previous')}
          aria-label={settings.language === 'fa' ? 'قطعه قبلی' : 'Previous track'}
          title={settings.language === 'fa' ? 'قطعه قبلی' : 'Previous track'}
        >
          <Icon name="skip-prev" size={16} />
        </button>
        <button
          type="button"
          onClick={() => void sendAction('play_pause')}
          aria-label={
            session.isPlaying
              ? settings.language === 'fa'
                ? 'توقف موقت'
                : 'Pause'
              : settings.language === 'fa'
                ? 'پخش'
                : 'Play'
          }
          title={
            session.isPlaying
              ? settings.language === 'fa'
                ? 'توقف موقت'
                : 'Pause'
              : settings.language === 'fa'
                ? 'پخش'
                : 'Play'
          }
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            border: 'none',
            background: 'var(--wejet-accent)',
            color: 'var(--wejet-accent-contrast)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Icon name={session.isPlaying ? 'pause' : 'play'} size={16} />
        </button>
        <button
          type="button"
          className="wj-icon-btn"
          onClick={() => void sendAction('next')}
          aria-label={settings.language === 'fa' ? 'قطعه بعدی' : 'Next track'}
          title={settings.language === 'fa' ? 'قطعه بعدی' : 'Next track'}
        >
          <Icon name="skip-next" size={16} />
        </button>
      </div>
    </div>
  );
};
