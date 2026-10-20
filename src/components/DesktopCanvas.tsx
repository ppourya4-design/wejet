import React, { useRef, useState } from 'react';
import { WidgetInstance } from '../types/models';
import { WidgetRegistry } from '../widgets/registry';
import { useWejet } from '../context/WejetContext';
import { Icon } from './Icons';
import { fmtNum } from '../utils/format';
import { ContextMenuTarget, DesktopContextMenu } from './DesktopContextMenu';

interface DesktopCanvasProps {
  previewScale?: number;
  forceInteractive?: boolean;
}

const SNAP = 8;

function snapVal(v: number, enabled: boolean): number {
  return enabled ? Math.round(v / SNAP) * SNAP : Math.round(v);
}

function resolveCollision(
  moving: WidgetInstance,
  others: WidgetInstance[],
  canvasW: number,
  canvasH: number
): { x: number; y: number } {
  let { x, y } = moving;
  const pad = 12;
  for (let pass = 0; pass < 6; pass++) {
    const hit = others.find(
      (o) =>
        o.visible &&
        o.instanceId !== moving.instanceId &&
        x < o.x + o.width + pad &&
        x + moving.width + pad > o.x &&
        y < o.y + o.height + pad &&
        y + moving.height + pad > o.y
    );
    if (!hit) break;
    const tryDown = hit.y + hit.height + pad;
    if (tryDown + moving.height <= canvasH - 16) {
      y = tryDown;
    } else {
      x = Math.max(16, Math.min(canvasW - moving.width - 16, hit.x - moving.width - pad));
    }
  }
  return { x, y };
}

export const DesktopCanvas: React.FC<DesktopCanvasProps> = ({
  previewScale = 1,
  forceInteractive = false,
}) => {
  const {
    settings,
    layout,
    selectedWidgetId,
    setSelectedWidgetId,
    setEditingSettingsWidgetId,
    updateWidget,
    duplicateWidget,
    removeWidget,
  } = useWejet();

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [guideX, setGuideX] = useState<number | null>(null);
  const [guideY, setGuideY] = useState<number | null>(null);
  const [ctxMenu, setCtxMenu] = useState<ContextMenuTarget | null>(null);

  const isEditMode = !settings.layoutLocked || forceInteractive;
  const isFa = settings.language === 'fa';
  const pd = isFa && settings.usePersianDigits;

  const startDrag = (e: React.PointerEvent, w: WidgetInstance) => {
    if (!isEditMode || w.locked) return;
    if ((e.target as HTMLElement).closest('button, input, textarea, select')) return;
    e.preventDefault();
    e.stopPropagation();
    setSelectedWidgetId(w.instanceId);

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const origX = w.x;
    const origY = w.y;

    const rect = canvasRef.current?.getBoundingClientRect();
    const canvasW = rect ? rect.width / previewScale : 1440;
    const canvasH = rect ? rect.height / previewScale : 900;

    let latestX = origX;
    let latestY = origY;

    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startClientX) / previewScale;
      const dy = (ev.clientY - startClientY) / previewScale;
      let nx = snapVal(origX + dx, settings.snapToGrid);
      let ny = snapVal(origY + dy, settings.snapToGrid);

      nx = Math.max(8, Math.min(canvasW - w.width - 8, nx));
      ny = Math.max(8, Math.min(canvasH - w.height - 8, ny));

      // Magnetic alignment guide check with sibling widgets
      let gx: number | null = null;
      let gy: number | null = null;
      for (const other of layout.widgets) {
        if (other.instanceId === w.instanceId || !other.visible) continue;
        if (Math.abs(nx - other.x) <= 6) {
          nx = other.x;
          gx = other.x;
        }
        if (Math.abs(ny - other.y) <= 6) {
          ny = other.y;
          gy = other.y;
        }
      }
      setGuideX(gx);
      setGuideY(gy);

      latestX = nx;
      latestY = ny;
      void updateWidget(w.instanceId, {
        x: nx,
        y: ny,
        anchorXRatio: Number((nx / canvasW).toFixed(4)),
        anchorYRatio: Number((ny / canvasH).toFixed(4)),
      });
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setGuideX(null);
      setGuideY(null);
      if (settings.collisionAwareness) {
        const adjusted = resolveCollision(
          { ...w, x: latestX, y: latestY },
          layout.widgets,
          canvasW,
          canvasH
        );
        if (adjusted.x !== latestX || adjusted.y !== latestY) {
          void updateWidget(w.instanceId, {
            x: adjusted.x,
            y: adjusted.y,
            anchorXRatio: Number((adjusted.x / canvasW).toFixed(4)),
            anchorYRatio: Number((adjusted.y / canvasH).toFixed(4)),
          });
        }
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const startResize = (e: React.PointerEvent, w: WidgetInstance) => {
    if (!isEditMode || w.locked) return;
    e.preventDefault();
    e.stopPropagation();
    const def = WidgetRegistry.get(w.widgetType);
    const minW = def?.manifest.minSize.width ?? 220;
    const minH = def?.manifest.minSize.height ?? 140;

    const startX = e.clientX;
    const startY = e.clientY;
    const origW = w.width;
    const origH = w.height;

    const onMove = (ev: PointerEvent) => {
      // Resize handle sits on bottom-right physical corner regardless of text direction
      const dw = (ev.clientX - startX) / previewScale;
      const dh = (ev.clientY - startY) / previewScale;
      const nw = Math.max(minW, snapVal(origW + dw, settings.snapToGrid));
      const nh = Math.max(minH, snapVal(origH + dh, settings.snapToGrid));
      void updateWidget(w.instanceId, { width: nw, height: nh });
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  if (!settings.widgetsVisible) {
    return null;
  }

  return (
    <div
      ref={canvasRef}
      onClick={() => {
        setSelectedWidgetId(null);
        setCtxMenu(null);
      }}
      onContextMenu={(e) => {
        if (previewScale !== 1) return;
        e.preventDefault();
        setCtxMenu({ x: e.clientX, y: e.clientY });
      }}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundImage: isEditMode
          ? 'radial-gradient(rgba(255,255,255,0.13) 1px, transparent 1px)'
          : 'none',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Smart Alignment Guides */}
      {guideX !== null && (
        <div
          style={{
            position: 'absolute',
            left: guideX,
            top: 0,
            bottom: 0,
            width: 1,
            background: 'var(--wejet-accent)',
            pointerEvents: 'none',
            zIndex: 999,
          }}
        />
      )}
      {guideY !== null && (
        <div
          style={{
            position: 'absolute',
            top: guideY,
            left: 0,
            right: 0,
            height: 1,
            background: 'var(--wejet-accent)',
            pointerEvents: 'none',
            zIndex: 999,
          }}
        />
      )}

      {layout.widgets
        .filter((w) => w.visible)
        .map((w) => {
          const def = WidgetRegistry.get(w.widgetType);
          if (!def) return null;
          const Component = def.component;
          const isSelected = isEditMode && selectedWidgetId === w.instanceId;
          const surfacePct = `${Math.max(20, Math.min(100, w.opacity))}%`;

          return (
            <div
              key={w.instanceId}
              className="wejet-widget-glass wj-animate-in"
              onPointerDown={(e) => startDrag(e, w)}
              onContextMenu={(e) => {
                if (previewScale !== 1) return;
                e.preventDefault();
                e.stopPropagation();
                setCtxMenu({ x: e.clientX, y: e.clientY, widget: w });
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (isEditMode) setSelectedWidgetId(w.instanceId);
              }}
              style={
                {
                  position: 'absolute',
                  left: w.x,
                  top: w.y,
                  width: w.width,
                  height: w.height,
                  zIndex: isSelected ? 500 : w.zIndex,
                  cursor: isEditMode && !w.locked ? 'grab' : 'default',
                  outline: isSelected
                    ? '1.5px solid var(--wejet-accent)'
                    : isEditMode
                      ? '1px dashed rgba(148, 163, 184, 0.35)'
                      : 'none',
                  outlineOffset: 2,
                  '--widget-surface-pct': surfacePct,
                } as React.CSSProperties
              }
            >
              {/* Floating Contextual Glass Toolbar in Edit Mode (Section 14) */}
              {isSelected && (
                <div
                  className="wejet-elevated-glass ltr-inline"
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: -42,
                    left: 0,
                    height: 34,
                    padding: '0 8px',
                    borderRadius: 11,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    zIndex: 600,
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.68rem',
                      color: 'var(--wejet-text-muted)',
                      padding: '0 4px',
                    }}
                  >
                    {fmtNum(w.opacity, pd)}%
                  </span>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    value={w.opacity}
                    aria-label="Widget opacity"
                    onChange={(e) => void updateWidget(w.instanceId, { opacity: Number(e.target.value) })}
                    style={{ width: 58, accentColor: 'var(--wejet-accent)' }}
                  />
                  <button
                    type="button"
                    className="wj-icon-btn"
                    style={{ width: 26, height: 26 }}
                    onClick={() => setEditingSettingsWidgetId(w.instanceId)}
                    title={isFa ? 'تنظیمات ویجت' : 'Widget Settings'}
                  >
                    <Icon name="settings" size={13} />
                  </button>
                  <button
                    type="button"
                    className="wj-icon-btn"
                    style={{ width: 26, height: 26 }}
                    onClick={() => void duplicateWidget(w.instanceId)}
                    title={isFa ? 'تکثیر' : 'Duplicate'}
                  >
                    <Icon name="copy" size={13} />
                  </button>
                  <button
                    type="button"
                    className="wj-icon-btn"
                    style={{ width: 26, height: 26 }}
                    onClick={() => void updateWidget(w.instanceId, { locked: !w.locked })}
                    title={isFa ? 'قفل موقعیت' : 'Lock position'}
                  >
                    <Icon name={w.locked ? 'lock' : 'unlock'} size={13} />
                  </button>
                  <button
                    type="button"
                    className="wj-icon-btn"
                    style={{ width: 26, height: 26 }}
                    onClick={() => void updateWidget(w.instanceId, { visible: false })}
                    title={isFa ? 'مخفی کردن' : 'Hide widget'}
                  >
                    <Icon name="eye-off" size={13} />
                  </button>
                  <button
                    type="button"
                    className="wj-icon-btn"
                    style={{ width: 26, height: 26, color: 'var(--wejet-danger)' }}
                    onClick={() => void removeWidget(w.instanceId)}
                    title={isFa ? 'حذف ویجت' : 'Delete widget'}
                  >
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              )}

              <Component instance={w} />

              {/* Bottom-Right Resize Grip Handle in Edit Mode */}
              {isEditMode && !w.locked && (
                <div
                  onPointerDown={(e) => startResize(e, w)}
                  title={isFa ? 'تغییر اندازه' : 'Resize'}
                  style={{
                    position: 'absolute',
                    right: 4,
                    bottom: 4,
                    width: 16,
                    height: 16,
                    cursor: 'nwse-resize',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--wejet-accent)',
                    opacity: 0.85,
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M9 1L1 9M9 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}

      {previewScale === 1 && (
        <DesktopContextMenu
          target={ctxMenu}
          onClose={() => setCtxMenu(null)}
          onOpenWidgetSettings={(id) => setEditingSettingsWidgetId(id)}
        />
      )}
    </div>
  );
};
