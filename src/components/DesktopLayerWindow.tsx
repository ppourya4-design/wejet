import React, { useEffect, useState } from 'react';
import { DesktopCanvas } from './DesktopCanvas';
import { useWejet } from '../context/WejetContext';
import { isTauriRuntime, WejetIPC } from '../services/ipc';
import { t } from '../i18n/translations';
import { Icon } from './Icons';
import { getSelectedWallpaperPreset, WallpaperPreset } from '../themes/wallpapers';

export const DesktopLayerWindow: React.FC = () => {
  const {
    settings,
    updateSettings,
    setCommandCenterOpen,
    setQuickNoteOpen,
  } = useWejet();

  const nativeTauri = isTauriRuntime();
  const isFa = settings.language === 'fa';
  const [wallpaper, setWallpaper] = useState<WallpaperPreset>(() =>
    getSelectedWallpaperPreset()
  );

  useEffect(() => {
    const sync = () => setWallpaper(getSelectedWallpaperPreset());
    window.addEventListener('wejet:wallpaper-change', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('wejet:wallpaper-change', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        // Pure RGBA transparent on Windows Desktop Layer so real Windows wallpaper shines through;
        // curated reactive wallpaper shader ONLY when previewed standalone in a browser!
        background: nativeTauri ? 'transparent' : wallpaper.cssBackground,
      }}
    >
      <DesktopCanvas />

      {/* Subtle floating glass control pill visible during Edit Mode (or in browser preview) */}
      {(!settings.layoutLocked || !nativeTauri) && (
        <div
          className="wejet-elevated-glass wj-animate-in"
          style={{
            position: 'fixed',
            bottom: 18,
            left: 0,
            right: 0,
            marginInline: 'auto',
            width: 'fit-content',
            zIndex: 900,
            padding: '7px 12px',
            borderRadius: 'var(--wejet-radius-pill)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <button
            type="button"
            className={`wj-btn ${!settings.layoutLocked ? 'wj-btn-primary' : ''}`}
            style={{ borderRadius: 'var(--wejet-radius-pill)', padding: '5px 12px' }}
            onClick={() => void updateSettings({ layoutLocked: !settings.layoutLocked })}
          >
            <Icon name={settings.layoutLocked ? 'unlock' : 'lock'} size={14} />
            <span>
              {settings.layoutLocked
                ? t(settings.language, 'unlockEdit')
                : t(settings.language, 'lockLayout')}
            </span>
          </button>

          <button
            type="button"
            className="wj-btn"
            style={{ borderRadius: 'var(--wejet-radius-pill)', padding: '5px 12px' }}
            onClick={() => setCommandCenterOpen(true)}
          >
            <Icon name="search" size={14} />
            <span>{t(settings.language, 'commandCenter')}</span>
          </button>

          <button
            type="button"
            className="wj-btn"
            style={{ borderRadius: 'var(--wejet-radius-pill)', padding: '5px 12px' }}
            onClick={() => setQuickNoteOpen(true)}
          >
            <Icon name="notes" size={14} />
            <span>{t(settings.language, 'quickNote')}</span>
          </button>

          <button
            type="button"
            className="wj-btn"
            style={{ borderRadius: 'var(--wejet-radius-pill)', padding: '5px 12px' }}
            onClick={() => void WejetIPC.openManager()}
          >
            <Icon name="settings" size={14} />
            <span>{isFa ? 'مدیریت Wejet' : 'Manager'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
