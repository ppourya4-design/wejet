import React, { useEffect } from 'react';
import { WidgetInstance } from '../types/models';
import { useWejet } from '../context/WejetContext';
import { WidgetRegistry } from '../widgets/registry';
import { Icon } from './Icons';
import { WALLPAPER_PRESETS, getSelectedWallpaperPreset, setSelectedWallpaperPreset } from '../themes/wallpapers';
import { WejetIPC } from '../services/ipc';
import { fmtNum } from '../utils/format';

export interface ContextMenuTarget {
  x: number;
  y: number;
  widget?: WidgetInstance;
}

interface DesktopContextMenuProps {
  target: ContextMenuTarget | null;
  onClose: () => void;
  onOpenWidgetSettings: (instanceId: string) => void;
}

export const DesktopContextMenu: React.FC<DesktopContextMenuProps> = ({
  target,
  onClose,
  onOpenWidgetSettings,
}) => {
  const {
    settings,
    updateSettings,
    updateWidget,
    duplicateWidget,
    removeWidget,
    addWidgetFromManifest,
    setCommandCenterOpen,
    setQuickNoteOpen,
  } = useWejet();

  useEffect(() => {
    if (!target) return;
    const close = () => onClose();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('click', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [target, onClose]);

  if (!target) return null;

  const isFa = settings.language === 'fa';
  const pd = settings.usePersianDigits && isFa;
  const menuW = 248;
  const menuH = target.widget ? 360 : 280;
  const clampedX = Math.max(12, Math.min(window.innerWidth - menuW - 12, target.x));
  const clampedY = Math.max(12, Math.min(window.innerHeight - menuH - 12, target.y));

  const w = target.widget;

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%',
    padding: '7px 10px',
    borderRadius: 9,
    border: 'none',
    background: 'transparent',
    color: 'var(--wejet-text)',
    fontSize: 'var(--wejet-font-xs)',
    cursor: 'pointer',
    textAlign: 'start',
  };

  const cycleWallpaper = () => {
    const cur = getSelectedWallpaperPreset();
    const idx = WALLPAPER_PRESETS.findIndex((p) => p.id === cur.id);
    const next = WALLPAPER_PRESETS[(idx + 1) % WALLPAPER_PRESETS.length];
    setSelectedWallpaperPreset(next.id);
    onClose();
  };

  return (
    <div
      className="wejet-elevated-glass wj-animate-in"
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: 'fixed',
        left: clampedX,
        top: clampedY,
        width: menuW,
        padding: 6,
        borderRadius: 14,
        zIndex: 1600,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {w && (
        <>
          <button
            type="button"
            style={rowStyle}
            onClick={() => {
              onOpenWidgetSettings(w.instanceId);
              onClose();
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="settings" size={14} />
              <span>{isFa ? 'تنظیمات ویجت' : 'Widget Settings'}</span>
            </span>
          </button>

          {/* Instant glass opacity presets */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '5px 10px',
              gap: 4,
            }}
          >
            <span style={{ fontSize: '0.68rem', color: 'var(--wejet-text-muted)' }}>
              {isFa ? 'شفافیت شیشه' : 'Glass Opacity'}
            </span>
            <div style={{ display: 'flex', gap: 3 }}>
              {[35, 60, 85, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  className={`wj-btn ${Math.abs(w.opacity - pct) <= 6 ? 'wj-btn-primary' : ''}`}
                  style={{ padding: '2px 5px', fontSize: '0.65rem', borderRadius: 6 }}
                  onClick={() => void updateWidget(w.instanceId, { opacity: pct })}
                >
                  {fmtNum(pct, pd)}%
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            style={rowStyle}
            onClick={() => {
              void duplicateWidget(w.instanceId);
              onClose();
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="copy" size={14} />
              <span>{isFa ? 'تکثیر ویجت' : 'Duplicate Widget'}</span>
            </span>
          </button>

          <button
            type="button"
            style={rowStyle}
            onClick={() => {
              void updateWidget(w.instanceId, { locked: !w.locked });
              onClose();
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name={w.locked ? 'unlock' : 'lock'} size={14} />
              <span>
                {w.locked
                  ? isFa
                    ? 'باز کردن قفل ویجت'
                    : 'Unlock Widget'
                  : isFa
                    ? 'قفل کردن موقعیت ویجت'
                    : 'Lock Widget Position'}
              </span>
            </span>
          </button>

          <button
            type="button"
            style={{ ...rowStyle, color: 'var(--wejet-danger)' }}
            onClick={() => {
              void removeWidget(w.instanceId);
              onClose();
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="trash" size={14} />
              <span>{isFa ? 'حذف ویجت از میزکار' : 'Remove Widget'}</span>
            </span>
          </button>

          <div style={{ height: 1, background: 'var(--wejet-glass-border)', margin: '3px 6px' }} />
        </>
      )}

      <button
        type="button"
        style={rowStyle}
        onClick={() => {
          void updateSettings({ layoutLocked: !settings.layoutLocked });
          onClose();
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name={settings.layoutLocked ? 'unlock' : 'lock'} size={14} />
          <span>
            {settings.layoutLocked
              ? isFa
                ? 'ورود به حالت ویرایش چیدمان'
                : 'Unlock & Edit Layout'
              : isFa
                ? 'قفل و تثبیت چیدمان'
                : 'Lock Desktop Layout'}
          </span>
        </span>
        <span className="ltr-inline" style={{ fontSize: '0.65rem', color: 'var(--wejet-text-muted)' }}>
          Ctrl+Alt+L
        </span>
      </button>

      {!w && (
        <button
          type="button"
          style={rowStyle}
        onClick={() => {
          const first = WidgetRegistry.list()[0];
          if (first) void addWidgetFromManifest(first.manifest);
          onClose();
        }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="plus" size={14} />
            <span>{isFa ? 'افزودن ویجت ساعت جدید' : 'Add New Clock Widget'}</span>
          </span>
        </button>
      )}

      <button
        type="button"
        style={rowStyle}
        onClick={() => {
          setCommandCenterOpen(true);
          onClose();
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="search" size={14} />
          <span>{isFa ? 'مرکز فرمان سریع' : 'Command Center'}</span>
        </span>
        <span className="ltr-inline" style={{ fontSize: '0.65rem', color: 'var(--wejet-text-muted)' }}>
          Ctrl+Space
        </span>
      </button>

      <button
        type="button"
        style={rowStyle}
        onClick={() => {
          setQuickNoteOpen(true);
          onClose();
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="notes" size={14} />
          <span>{isFa ? 'یادداشت فوری' : 'Quick Note'}</span>
        </span>
        <span className="ltr-inline" style={{ fontSize: '0.65rem', color: 'var(--wejet-text-muted)' }}>
          Ctrl+Alt+N
        </span>
      </button>

      <button type="button" style={rowStyle} onClick={cycleWallpaper}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="sparkles" size={14} />
          <span>{isFa ? 'تغییر پس‌زمینه پیش‌نمایش' : 'Cycle Preview Wallpaper'}</span>
        </span>
      </button>

      <button
        type="button"
        style={rowStyle}
        onClick={() => {
          void WejetIPC.openManager();
          onClose();
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="grid" size={14} />
          <span>{isFa ? 'مرکز مدیریت Wejet' : 'Open Wejet Control Center'}</span>
        </span>
      </button>
    </div>
  );
};
